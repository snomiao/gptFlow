#!/usr/bin/env bun
// @bun

// cli.ts
import {createWriteStream} from "fs";
import {readFile} from "fs/promises";

// node_modules/globflow/dist/index.js
function DIE(reason, ...slots) {
  throw throwsError(reason, ...slots);
}
function throwsError(reason, ...slots) {
  if (typeof reason === "string") {
    return new Error(reason.trim());
  }
  if (Array.isArray(reason)) {
    return new Error(reason.map((e, i) => e + (slots[i] ?? "")).join(""));
  }
  if (reason instanceof Error) {
    return reason;
  }
  DIE(new Error("unknown error type", { cause: { reason } }));
}
function type(input) {
  if (input === null) {
    return "Null";
  } else if (input === undefined) {
    return "Undefined";
  } else if (Number.isNaN(input)) {
    return "NaN";
  }
  const typeResult = Object.prototype.toString.call(input).slice(8, -1);
  return typeResult === "AsyncFunction" ? "Promise" : typeResult;
}
function _indexOf(valueToFind, list) {
  if (!isArray(list))
    throw new Error(`Cannot read property 'indexOf' of ${list}`);
  const typeOfValue = type(valueToFind);
  if (!["Array", "NaN", "Object", "RegExp"].includes(typeOfValue))
    return list.indexOf(valueToFind);
  let index = -1;
  let foundIndex = -1;
  const { length } = list;
  while (++index < length && foundIndex === -1)
    if (equals(list[index], valueToFind))
      foundIndex = index;
  return foundIndex;
}
function _arrayFromIterator(iter) {
  const list = [];
  let next;
  while (!(next = iter.next()).done)
    list.push(next.value);
  return list;
}
function _compareSets(a, b2) {
  if (a.size !== b2.size)
    return false;
  const aList = _arrayFromIterator(a.values());
  const bList = _arrayFromIterator(b2.values());
  const filtered = aList.filter((aInstance) => _indexOf(aInstance, bList) === -1);
  return filtered.length === 0;
}
function compareErrors(a, b2) {
  if (a.message !== b2.message)
    return false;
  if (a.toString !== b2.toString)
    return false;
  return a.toString() === b2.toString();
}
function parseDate(maybeDate) {
  if (!maybeDate.toDateString)
    return [false];
  return [true, maybeDate.getTime()];
}
function parseRegex(maybeRegex) {
  if (maybeRegex.constructor !== RegExp)
    return [false];
  return [true, maybeRegex.toString()];
}
function equals(a, b2) {
  if (arguments.length === 1)
    return (_b) => equals(a, _b);
  if (Object.is(a, b2))
    return true;
  const aType = type(a);
  if (aType !== type(b2))
    return false;
  if (aType === "Function")
    return a.name === undefined ? false : a.name === b2.name;
  if (["NaN", "Null", "Undefined"].includes(aType))
    return true;
  if (["BigInt", "Number"].includes(aType)) {
    if (Object.is(-0, a) !== Object.is(-0, b2))
      return false;
    return a.toString() === b2.toString();
  }
  if (["Boolean", "String"].includes(aType))
    return a.toString() === b2.toString();
  if (aType === "Array") {
    const aClone = Array.from(a);
    const bClone = Array.from(b2);
    if (aClone.toString() !== bClone.toString())
      return false;
    let loopArrayFlag = true;
    aClone.forEach((aCloneInstance, aCloneIndex) => {
      if (loopArrayFlag) {
        if (aCloneInstance !== bClone[aCloneIndex] && !equals(aCloneInstance, bClone[aCloneIndex]))
          loopArrayFlag = false;
      }
    });
    return loopArrayFlag;
  }
  const aRegex = parseRegex(a);
  const bRegex = parseRegex(b2);
  if (aRegex[0])
    return bRegex[0] ? aRegex[1] === bRegex[1] : false;
  else if (bRegex[0])
    return false;
  const aDate = parseDate(a);
  const bDate = parseDate(b2);
  if (aDate[0])
    return bDate[0] ? aDate[1] === bDate[1] : false;
  else if (bDate[0])
    return false;
  if (a instanceof Error) {
    if (!(b2 instanceof Error))
      return false;
    return compareErrors(a, b2);
  }
  if (aType === "Set")
    return _compareSets(a, b2);
  if (aType === "Object") {
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b2).length)
      return false;
    let loopObjectFlag = true;
    aKeys.forEach((aKeyInstance) => {
      if (loopObjectFlag) {
        const aValue = a[aKeyInstance];
        const bValue = b2[aKeyInstance];
        if (aValue !== bValue && !equals(aValue, bValue))
          loopObjectFlag = false;
      }
    });
    return loopObjectFlag;
  }
  return false;
}
function cacheSkips(store, _options) {
  const { key = new Error().stack ?? main_default("missing cache key") } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks = [];
  const tailChunks = [];
  const cachePromise = store.get(key);
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const cache = await cachePromise;
      if (cache && equals(chunk, cache)) {
        tailChunks.push(cache);
        ctrl.terminate();
        await store.set(key, chunks[0]);
        return await never();
      }
      chunks.push(chunk);
      ctrl.enqueue(chunk);
    },
    flush: async () => await store.set(key, chunks[0])
  });
}
function cacheTails(store, _options) {
  const {
    key = new Error().stack ?? main_default("missing cache key"),
    emitCached = true
  } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks = [];
  const tailChunks = [];
  const cachePromise = store.get(key);
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const cache = await cachePromise;
      if (cache && equals(chunk, cache[0])) {
        tailChunks.push(...cache);
        if (emitCached)
          cache.map((c) => ctrl.enqueue(c));
        ctrl.terminate();
        await store.set(key, [...chunks, ...tailChunks]);
        return await never();
      }
      chunks.push(chunk);
      ctrl.enqueue(chunk);
    },
    flush: async () => await store.set(key, [...chunks, ...tailChunks])
  });
}
function cacheLists(store, _options) {
  const {
    key = new Error().stack ?? main_default("missing cache key"),
    emitCached = true
  } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks = [];
  const cacheHitPromise = store.has?.(key) || store.get(key);
  return new TransformStream({
    start: async (ctrl) => {
      if (!await cacheHitPromise)
        return;
      const cached = await store.get(key);
      if (!cached)
        return;
      if (emitCached)
        cached.map((c) => ctrl.enqueue(c));
      ctrl.terminate();
      return never();
    },
    transform: async (chunk, ctrl) => {
      if (await cacheHitPromise) {
        ctrl.terminate();
        return never();
      }
      chunks.push(chunk);
      ctrl.enqueue(chunk);
    },
    flush: async () => await store.set(key, chunks)
  });
}
function chunkBys(compareFn) {
  let chunks = [];
  let lastOrder;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const order = await compareFn(chunk);
      if (lastOrder && lastOrder !== order)
        ctrl.enqueue(chunks.splice(0, Infinity));
      chunks.push(chunk);
      lastOrder = order;
    },
    flush: async (ctrl) => void (chunks.length && ctrl.enqueue(chunks))
  });
}
function chunkIfs(predicate, { inclusive = false } = {}) {
  let chunks = [];
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const cond = await predicate(chunk, i++, chunks);
      if (!inclusive && !cond)
        chunks.length && ctrl.enqueue(chunks.splice(0, Infinity));
      chunks.push(chunk);
      if (!cond)
        ctrl.enqueue(chunks.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks.length && ctrl.enqueue(chunks))
  });
}
function chunkIntervals(interval = 0) {
  let chunks = [];
  let id = null;
  return new TransformStream({
    start: (ctrl) => {
      id = setInterval(() => ctrl.enqueue(chunks), interval);
    },
    transform: async (chunk, ctrl) => {
      chunks.push(chunk);
    },
    flush: async (ctrl) => {
      if (chunks.length)
        ctrl.enqueue(chunks);
      id !== null && clearInterval(id);
    }
  });
}
function chunks(n = Infinity) {
  let chunks2 = [];
  if (n <= 0)
    throw new Error("Buffer size must be greater than 0");
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      chunks2.push(chunk);
      if (chunks2.length >= n)
        ctrl.enqueue(chunks2.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks2.length && ctrl.enqueue(chunks2))
  });
}
function map(select) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          let mapped = await select(next.value);
          if (mapped !== undefined)
            controller.enqueue(mapped);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
}
function isReadableLike(obj) {
  return obj["readable"] != null;
}
function from(src) {
  let it;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && it != null) {
        let next = await it.next();
        if (next.done) {
          it = null;
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  if (isReadableLike(src)) {
    return src.readable;
  }
  return new ReadableStream({
    async start(controller) {
      let iterable;
      if (typeof src == "function") {
        src = src();
      }
      if (Symbol.asyncIterator && src[Symbol.asyncIterator])
        iterable = src[Symbol.asyncIterator].bind(src);
      else if (src[Symbol.iterator])
        iterable = src[Symbol.iterator].bind(src);
      else {
        let value = await Promise.resolve(src);
        controller.enqueue(value);
        controller.close();
        return;
      }
      it = iterable();
      return flush(controller);
    },
    async pull(controller) {
      return flush(controller);
    },
    async cancel(reason) {
      if (reason && it && it.throw) {
        it.throw(reason);
      } else if (it && it.return) {
        await it.return();
      }
      it = null;
    }
  });
}
function through(dst) {
  return function(src) {
    return src.pipeThrough(dst);
  };
}
function pipe(src, ...ops) {
  if (isReadableLike(src)) {
    src = src.readable;
  }
  return ops.map((x) => isTransform(x) ? through(x) : x).reduce((p, c) => {
    return c(p, { highWaterMark: 1 });
  }, src);
}
function isTransform(x) {
  return x["readable"] != null && x["writable"] != null;
}
function schedule(scheduler) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          await scheduler.nextTick();
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
}
function on(callbacks) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
          if (callbacks.complete)
            callbacks.complete();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
      if (callbacks.error)
        callbacks.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        if (callbacks.start)
          callbacks.start();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
          if (callbacks.complete)
            callbacks.complete(reason);
        }
      }
    }, opts);
  };
}
async function toPromise(src) {
  let res = undefined;
  if (isReadableLike(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  let done = false;
  while (done == false) {
    let next = await reader.read();
    done = next.done;
    if (!done)
      res = next.value;
  }
  return res;
}
function merge(concurrent = Infinity) {
  if (concurrent == 0)
    throw Error("zero is an invalid concurrency limit");
  return function(src) {
    let outerGate = new Gate(concurrent);
    let innerQueue = new BlockingQueue;
    let subscription;
    let errored = null;
    return new ReadableStream({
      start(outerController) {
        let reading = [];
        let readingDone = false;
        toPromise(pipe(src, schedule({
          nextTick: async () => {
            await outerGate.wait();
          }
        }), map((innerStream) => {
          if (!(innerStream instanceof ReadableStream)) {
            innerStream = from(innerStream);
          }
          reading.push(innerStream);
          pipe(innerStream, map(async (value) => {
            await innerQueue.push({ done: false, value });
          }), on({
            error(err) {
              outerController.error(err);
            },
            complete() {
              outerGate.increment();
              reading.splice(reading.indexOf(innerStream), 1);
              if (reading.length == 0 && readingDone) {
                innerQueue.push({ done: true });
              }
            }
          }));
        }), on({
          error(err) {
            outerController.error(err);
            errored = err;
          },
          complete() {
            readingDone = true;
          }
        }))).catch((err) => {
          outerController.error(err);
        });
      },
      async pull(controller) {
        while (controller.desiredSize > 0) {
          let next = await innerQueue.pull();
          if (errored) {
            controller.error(errored);
          }
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(next.value);
          }
        }
      },
      cancel(reason) {
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
      }
    });
  };
}
function concat(...streams) {
  if (streams.length == 0)
    throw Error("must pass at least 1 stream to concat");
  let reader = null;
  async function flush(controller) {
    try {
      if (reader == null) {
        if (streams.length == 0) {
          controller.close();
        }
        reader = streams.shift().getReader();
      }
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          reader = null;
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return new ReadableStream({
    async start(controller) {
      return flush(controller);
    },
    async pull(controller) {
      return flush(controller);
    },
    cancel(reason) {
      if (reader) {
        reader.cancel(reason);
        reader.releaseLock();
        reader = null;
      }
    }
  });
}
async function toArray(src) {
  let res = [];
  if (isReadableLike(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  try {
    let done = false;
    while (done == false) {
      let next = await reader.read();
      done = next.done;
      if (!done)
        res.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return res;
}
function convolves(n) {
  const buffer2 = [];
  return new TransformStream({
    transform(chunk, controller) {
      buffer2.push(chunk);
      if (buffer2.length > n)
        buffer2.shift();
      if (buffer2.length === n)
        controller.enqueue([...buffer2]);
    },
    flush(controller) {
      while (buffer2.length > 1) {
        buffer2.shift();
        if (buffer2.length === n)
          controller.enqueue([...buffer2]);
      }
    }
  });
}
function debounces(t) {
  let id = null;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (id)
        clearTimeout(id);
      id = setTimeout(() => {
        ctrl.enqueue(chunk);
        id = null;
      }, t);
    },
    flush: async () => {
      while (id)
        await new Promise((r) => setTimeout(r, t / 2));
    }
  });
}
function flatMaps(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      val.map((e) => ctrl.enqueue(e));
    }
  });
}
function flats() {
  return new TransformStream({
    transform: (chunk, ctrl) => {
      chunk.map((e) => ctrl.enqueue(e));
    }
  });
}
function forEachs(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      ret instanceof Promise && await ret;
      ctrl.enqueue(chunk);
    }
  });
}
function heads(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      return n-- > 0 ? ctrl.enqueue(chunk) : await never();
    }
  });
}
function limits(n, { terminate = true } = {}) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      ctrl.enqueue(chunk);
      if (--n === 0) {
        terminate && ctrl.terminate();
        return never();
      }
    },
    flush: () => {
    }
  }, { highWaterMark: 1 }, { highWaterMark: 0 });
}
function maps(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      ctrl.enqueue(val);
    }
  });
}
function peeks(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      ctrl.enqueue(chunk);
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
    }
  });
}
function logs(mapFn = (s, i) => s) {
  return bys(peeks(async (e, i) => {
    const ret = mapFn(e, i);
    const val = ret instanceof Promise ? await ret : ret;
    console.log(typeof val === "string" ? val.replace(/\n$/, "") : val);
  }));
}
function mapAddFields(key, fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => ctrl.enqueue({ ...chunk, [key]: await fn(chunk, i++) })
  });
}
async function* streamAsyncIterator() {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function nils() {
  return new WritableStream;
}
function nil() {
  return null;
}
function riffles(sep) {
  let last2;
  return new TransformStream({
    transform: (chunk, ctrl) => {
      if (last2 !== undefined) {
        ctrl.enqueue(last2);
        ctrl.enqueue(sep);
      }
      last2 = chunk;
    },
    flush: (ctrl) => ctrl.enqueue(last2)
  });
}
function skips(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (n <= 0)
        ctrl.enqueue(chunk);
      else
        n--;
    }
  });
}
function slices(start = 0, end = Infinity) {
  const count = end - start;
  const { readable, writable } = new TransformStream;
  return {
    writable,
    readable: readable.pipeThrough(skips(start)).pipeThrough(limits(count))
  };
}
function replaceAsync(string, searchValue, replacer) {
  try {
    if (typeof replacer === "function") {
      var values = [];
      String.prototype.replace.call(string, searchValue, function() {
        values.push(replacer.apply(undefined, arguments));
        return "";
      });
      return Promise.all(values).then(function(resolvedValues) {
        return String.prototype.replace.call(string, searchValue, function() {
          return resolvedValues.shift();
        });
      });
    } else {
      return Promise.resolve(String.prototype.replace.call(string, searchValue, replacer));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
function tails(n = 1) {
  let chunks2 = [];
  return new TransformStream({
    transform: (chunk) => {
      chunks2.push(chunk);
      if (chunks2.length > n)
        chunks2.shift();
    },
    flush: (ctrl) => {
      chunks2.map((e) => ctrl.enqueue(e));
    }
  });
}
function terminates(signal2) {
  return throughs((r) => r.pipeThrough(new TransformStream, { signal: signal2 }));
}
function throttles(interval, { drop = false, keepLast = true } = {}) {
  let timerId = null;
  let cdPromise = Promise.withResolvers();
  let lasts = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (timerId) {
        if (keepLast)
          lasts = [chunk];
        if (drop)
          return;
        await cdPromise.promise;
      }
      lasts = [];
      ctrl.enqueue(chunk);
      [cdPromise, timerId] = [
        Promise.withResolvers(),
        setTimeout(() => {
          timerId = null;
          cdPromise.resolve();
        }, interval)
      ];
    },
    flush: async (ctrl) => {
      while (timerId)
        await new Promise((r) => setTimeout(r, interval / 2));
      lasts.map((e) => ctrl.enqueue(e));
    }
  });
}
function unwinds(key) {
  return flatMaps((e) => import_unwind_array.unwind(e, { path: key }));
}
function dispatch() {
  for (var i = 0, n = arguments.length, _2 = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _2 || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _2[t] = [];
  }
  return new Dispatch(_2);
}
function Dispatch(_2) {
  this._ = _2;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
function get(type3, name) {
  for (var i = 0, n = type3.length, c;i < n; ++i) {
    if ((c = type3[i]).name === name) {
      return c.value;
    }
  }
}
function set(type3, name, callback) {
  for (var i = 0, n = type3.length;i < n; ++i) {
    if (type3[i].name === name) {
      type3[i] = noop, type3 = type3.slice(0, i).concat(type3.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type3.push({ name, value: callback });
  return type3;
}
function namespace_default(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns")
    name = name.slice(i + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
function none() {
}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}
function select_default(select) {
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0;i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}
function empty() {
  return [];
}
function selectorAll_default(selector2) {
  return selector2 == null ? empty : function() {
    return this.querySelectorAll(selector2);
  };
}
function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function")
    select = arrayAll(select);
  else
    select = selectorAll_default(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}
function childMatcher(selector2) {
  return function(node) {
    return node.matches(selector2);
  };
}
function matcher_default(selector2) {
  return function() {
    return this.matches(selector2);
  };
}
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter2.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}
function filter_default(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0;i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
function sparse_default(update) {
  return new Array(update.length);
}
function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function constant_default(x) {
  return function() {
    return x;
  };
}
function bindIndex(parent, group, enter2, update, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (;i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter2[i] = new EnterNode(parent, data[i]);
    }
  }
  for (;i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group, enter2, update, exit, data, key) {
  var i, node, nodeByKeyValue = new Map, groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0;i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0;i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter2[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0;i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function data_default(value, key) {
  if (!arguments.length)
    return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function")
    value = constant_default(value);
  for (var m2 = groups.length, update = new Array(m2), enter2 = new Array(m2), exit = new Array(m2), j = 0;j < m2; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter2[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next;i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter2;
  update._exit = exit;
  return update;
}
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}
function join_default(onenter, onupdate, onexit) {
  var enter2 = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter2 = onenter(enter2);
    if (enter2)
      enter2 = enter2.selection();
  } else {
    enter2 = enter2.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update)
      update = update.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter2 && update ? enter2.merge(update).order() : update;
}
function merge_default(context) {
  var selection = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges2 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge3 = merges2[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge3[i] = node;
      }
    }
  }
  for (;j < m0; ++j) {
    merges2[j] = groups0[j];
  }
  return new Selection(merges2, this._parents);
}
function order_default() {
  for (var groups = this._groups, j = -1, m2 = groups.length;++j < m2; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node;--i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
function ascending(a, b2) {
  return a < b2 ? -1 : a > b2 ? 1 : a >= b2 ? 0 : NaN;
}
function sort_default(compare) {
  if (!compare)
    compare = ascending;
  function compareNode(a, b2) {
    return a && b2 ? compare(a.__data__, b2.__data__) : !a - !b2;
  }
  for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function nodes_default() {
  return Array.from(this);
}
function node_default() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length;i < n; ++i) {
      var node = group[i];
      if (node)
        return node;
    }
  }
  return null;
}
function size_default() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}
function empty_default() {
  return !this.node();
}
function each_default(callback) {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v);
  };
}
function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v, priority);
  };
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}
function style_default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      delete this[name];
    else
      this[name] = v;
  };
}
function property_default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n)
      if (!list.contains(names[i]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}
function raise() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}
function lower() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}
function append_default(name) {
  var create = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
function remove() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove(typename) {
  return function() {
    var on4 = this.__on;
    if (!on4)
      return;
    for (var j = 0, i = -1, m2 = on4.length, o;j < m2; ++j) {
      if (o = on4[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on4[++i] = o;
      }
    }
    if (++i)
      on4.length = i;
    else
      delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on4 = this.__on, o, listener = contextListener(value);
    if (on4)
      for (var j = 0, m2 = on4.length;j < m2; ++j) {
        if ((o = on4[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on4)
      this.__on = [o];
    else
      on4.push(o);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames2(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on4 = this.node().__on;
    if (on4)
      for (var j = 0, m2 = on4.length, o;j < m2; ++j) {
        for (i = 0, o = on4[j];i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on4 = value ? onAdd : onRemove;
  for (i = 0;i < n; ++i)
    this.each(on4(typenames[i], value, options));
  return this;
}
function dispatchEvent(node, type3, params) {
  var window4 = window_default(node), event = window4.CustomEvent;
  if (typeof event === "function") {
    event = new event(type3, params);
  } else {
    event = window4.document.createEvent("Event");
    if (params)
      event.initEvent(type3, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type3, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type3, params) {
  return function() {
    return dispatchEvent(this, type3, params);
  };
}
function dispatchFunction(type3, params) {
  return function() {
    return dispatchEvent(this, type3, params.apply(this, arguments));
  };
}
function dispatch_default2(type3, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type3, params));
}
function* iterator_default() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        yield node;
    }
  }
}
function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function Color() {
}
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b2, a) {
  if (a <= 0)
    r = g = b2 = NaN;
  return new Rgb(r, g, b2, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b2, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b2, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b2, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b2;
  this.opacity = +opacity;
}
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h2, s, l, a) {
  if (a <= 0)
    h2 = s = l = NaN;
  else if (l <= 0 || l >= 1)
    h2 = s = NaN;
  else if (s <= 0)
    h2 = NaN;
  return new Hsl(h2, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl)
    return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Hsl;
  if (o instanceof Hsl)
    return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b2 = o.b / 255, min = Math.min(r, g, b2), max = Math.max(r, g, b2), h2 = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max)
      h2 = (g - b2) / s + (g < b2) * 6;
    else if (g === max)
      h2 = (b2 - r) / s + 2;
    else
      h2 = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h2 *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h2;
  }
  return new Hsl(h2, s, l, o.opacity);
}
function hsl(h2, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h2) : new Hsl(h2, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h2, s, l, opacity) {
  this.h = +h2;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h2, m1, m2) {
  return (h2 < 60 ? m1 + (m2 - m1) * h2 / 60 : h2 < 180 ? m2 : h2 < 240 ? m1 + (m2 - m1) * (240 - h2) / 60 : m1) * 255;
}
function color(format) {
  var m2, l;
  format = (format + "").trim().toLowerCase();
  return (m2 = reHex.exec(format)) ? (l = m2[1].length, m2 = parseInt(m2[1], 16), l === 6 ? rgbn(m2) : l === 3 ? new Rgb(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l === 8 ? rgba(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l === 4 ? rgba(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger.exec(format)) ? new Rgb(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent.exec(format)) ? new Rgb(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger.exec(format)) ? rgba(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent.exec(format)) ? rgba(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent.exec(format)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent.exec(format)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential(a, b2, y2) {
  return a = Math.pow(a, y2), b2 = Math.pow(b2, y2) - a, y2 = 1 / y2, function(t) {
    return Math.pow(a + t * b2, y2);
  };
}
function gamma(y2) {
  return (y2 = +y2) === 1 ? nogamma : function(a, b2) {
    return b2 - a ? exponential(a, b2, y2) : constant_default2(isNaN(a) ? b2 : a);
  };
}
function nogamma(a, b2) {
  var d = b2 - a;
  return d ? linear(a, d) : constant_default2(isNaN(a) ? b2 : a);
}
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b2 = new Array(n), i, color3;
    for (i = 0;i < n; ++i) {
      color3 = rgb(colors[i]);
      r[i] = color3.r || 0;
      g[i] = color3.g || 0;
      b2[i] = color3.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b2 = spline(b2);
    color3.opacity = 1;
    return function(t) {
      color3.r = r(t);
      color3.g = g(t);
      color3.b = b2(t);
      return color3 + "";
    };
  };
}
function number_default(a, b2) {
  return a = +a, b2 = +b2, function(t) {
    return a * (1 - t) + b2 * t;
  };
}
function zero(b2) {
  return function() {
    return b2;
  };
}
function one(b2) {
  return function(t) {
    return b2(t) + "";
  };
}
function string_default(a, b2) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q2 = [];
  a = a + "", b2 = b2 + "";
  while ((am = reA.exec(a)) && (bm = reB.exec(b2))) {
    if ((bs = bm.index) > bi) {
      bs = b2.slice(bi, bs);
      if (s[i])
        s[i] += bs;
      else
        s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i])
        s[i] += bm;
      else
        s[++i] = bm;
    } else {
      s[++i] = null;
      q2.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b2.length) {
    bs = b2.slice(bi);
    if (s[i])
      s[i] += bs;
    else
      s[++i] = bs;
  }
  return s.length < 2 ? q2[0] ? one(q2[0].x) : zero(b2) : (b2 = q2.length, function(t) {
    for (var i2 = 0, o;i2 < b2; ++i2)
      s[(o = q2[i2]).i] = o.x(t);
    return s.join("");
  });
}
function decompose_default(a, b2, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b2 * b2))
    a /= scaleX, b2 /= scaleX;
  if (skewX = a * c + b2 * d)
    c -= a * skewX, d -= b2 * skewX;
  if (scaleY = Math.sqrt(c * c + d * d))
    c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b2 * c)
    a = -a, b2 = -b2, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b2, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}
function parseCss(value) {
  const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m2.isIdentity ? identity : decompose_default(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
}
function parseSvg(value) {
  if (value == null)
    return identity;
  if (!svgNode)
    svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate()))
    return identity;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}
function interpolateTransform(parse2, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b2, s, q2) {
    if (a !== b2) {
      if (a - b2 > 180)
        b2 += 360;
      else if (b2 - a > 180)
        a += 360;
      q2.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "rotate(" + b2 + degParen);
    }
  }
  function skewX(a, b2, s, q2) {
    if (a !== b2) {
      q2.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "skewX(" + b2 + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q2.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a, b2) {
    var s = [], q2 = [];
    a = parse2(a), b2 = parse2(b2);
    translate(a.translateX, a.translateY, b2.translateX, b2.translateY, s, q2);
    rotate(a.rotate, b2.rotate, s, q2);
    skewX(a.skewX, b2.skewX, s, q2);
    scale(a.scaleX, a.scaleY, b2.scaleX, b2.scaleY, s, q2);
    a = b2 = null;
    return function(t) {
      var i = -1, n = q2.length, o;
      while (++i < n)
        s[(o = q2[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout2 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame)
    return;
  if (timeout2)
    timeout2 = clearTimeout(timeout2);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity)
      timeout2 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
function timeout_default(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
function init(node2, id) {
  var schedule5 = get2(node2, id);
  if (schedule5.state > CREATED)
    throw new Error("too late; already scheduled");
  return schedule5;
}
function set2(node2, id) {
  var schedule5 = get2(node2, id);
  if (schedule5.state > STARTED)
    throw new Error("too late; already running");
  return schedule5;
}
function get2(node2, id) {
  var schedule5 = node2.__transition;
  if (!schedule5 || !(schedule5 = schedule5[id]))
    throw new Error("transition not found");
  return schedule5;
}
function create(node2, id, self) {
  var schedules = node2.__transition, tween;
  schedules[id] = self;
  self.timer = timer(schedule5, 0, self.time);
  function schedule5(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);
    if (self.delay <= elapsed)
      start(elapsed - self.delay);
  }
  function start(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED)
      return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name)
        continue;
      if (o.state === STARTED)
        return timeout_default(start);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node2, node2.__data__, self.index, self.group);
    if (self.state !== STARTING)
      return;
    self.state = STARTED;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1;i < n; ++i) {
      if (o = self.tween[i].value.call(node2, node2.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node2, t);
    }
    if (self.state === ENDING) {
      self.on.call("end", node2, node2.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules)
      return;
    delete node2.__transition;
  }
}
function schedule_default(node2, name, id, index, group, timing) {
  var schedules = node2.__transition;
  if (!schedules)
    node2.__transition = {};
  else if (id in schedules)
    return;
  create(node2, id, {
    name,
    index,
    group,
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function interrupt_default(node2, name) {
  var schedules = node2.__transition, schedule6, active, empty3 = true, i;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule6 = schedules[i]).name !== name) {
      empty3 = false;
      continue;
    }
    active = schedule6.state > STARTING && schedule6.state < ENDING;
    schedule6.state = ENDED;
    schedule6.timer.stop();
    schedule6.on.call(active ? "interrupt" : "cancel", node2, node2.__data__, schedule6.index, schedule6.group);
    delete schedules[i];
  }
  if (empty3)
    delete node2.__transition;
}
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}
function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule7 = set2(this, id), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule7.tween = tween1;
  };
}
function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error;
  return function() {
    var schedule7 = set2(this, id), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n)
        tween1.push(t);
    }
    schedule7.tween = tween1;
  };
}
function tweenValue(transition, name, value) {
  var id = transition._id;
  transition.each(function() {
    var schedule7 = set2(this, id);
    (schedule7.value || (schedule7.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node2) {
    return get2(node2, id).value[name];
  };
}
function tween_default(name, value) {
  var id = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id).tween;
    for (var i = 0, n = tween.length, t;i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}
function interpolate_default(a, b2) {
  var c;
  return (typeof b2 === "number" ? number_default : b2 instanceof color ? rgb_default : (c = color(b2)) ? (b2 = c, rgb_default) : string_default)(a, b2);
}
function attrRemove2(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrConstantNS2(fullname, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrFunction2(name, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attrFunctionNS2(fullname, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value));
}
function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween(name, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}
function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}
function delay_default(value) {
  var id = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value)) : get2(this.node(), id).delay;
}
function durationFunction(id, value) {
  return function() {
    set2(this, id).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id, value) {
  return value = +value, function() {
    set2(this, id).duration = value;
  };
}
function duration_default(value) {
  var id = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value)) : get2(this.node(), id).duration;
}
function easeConstant(id, value) {
  if (typeof value !== "function")
    throw new Error;
  return function() {
    set2(this, id).ease = value;
  };
}
function ease_default(value) {
  var id = this._id;
  return arguments.length ? this.each(easeConstant(id, value)) : get2(this.node(), id).ease;
}
function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function")
      throw new Error;
    set2(this, id).ease = v;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function")
    throw new Error;
  return this.each(easeVarying(this._id, value));
}
function filter_default2(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node2, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && match.call(node2, node2.__data__, i, group)) {
        subgroup.push(node2);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}
function merge_default2(transition) {
  if (transition._id !== this._id)
    throw new Error;
  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges2 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge4 = merges2[j] = new Array(n), node2, i = 0;i < n; ++i) {
      if (node2 = group0[i] || group1[i]) {
        merge4[i] = node2;
      }
    }
  }
  for (;j < m0; ++j) {
    merges2[j] = groups0[j];
  }
  return new Transition(merges2, this._parents, this._name, this._id);
}
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0)
      t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule12 = sit(this, id), on5 = schedule12.on;
    if (on5 !== on0)
      (on1 = (on0 = on5).copy()).on(name, listener);
    schedule12.on = on1;
  };
}
function on_default2(name, listener) {
  var id = this._id;
  return arguments.length < 2 ? get2(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener));
}
function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition)
      if (+i !== id)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}
function select_default2(select2) {
  var name = this._name, id = this._id;
  if (typeof select2 !== "function")
    select2 = selector_default(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node2, subnode, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && (subnode = select2.call(node2, node2.__data__, i, group))) {
        if ("__data__" in node2)
          subnode.__data__ = node2.__data__;
        subgroup[i] = subnode;
        schedule_default(subgroup[i], name, id, i, subgroup, get2(node2, id));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id);
}
function selectAll_default2(select2) {
  var name = this._name, id = this._id;
  if (typeof select2 !== "function")
    select2 = selectorAll_default(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        for (var children2 = select2.call(node2, node2.__data__, i, group), child, inherit = get2(node2, id), k = 0, l = children2.length;k < l; ++k) {
          if (child = children2[k]) {
            schedule_default(child, name, id, k, children2, inherit);
          }
        }
        subgroups.push(children2);
        parents.push(node2);
      }
    }
  }
  return new Transition(subgroups, parents, name, id);
}
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}
function styleNull(name, interpolate3) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, string10 = string1);
  };
}
function styleRemove2(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate3, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, value1);
  };
}
function styleFunction2(name, interpolate3, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate3(string00 = string0, value1));
  };
}
function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove3;
  return function() {
    var schedule15 = set2(this, id), on5 = schedule15.on, listener = schedule15.value[key] == null ? remove3 || (remove3 = styleRemove2(name)) : undefined;
    if (on5 !== on0 || listener0 !== listener)
      (on1 = (on0 = on5).copy()).on(event, listener0 = listener);
    schedule15.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
}
function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween(name, value, priority) {
  var t, i0;
  function tween3() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween3._value = value;
  return tween3;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}
function textConstant2(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
}
function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t0, i0;
  function tween4() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween4._value = value;
  return tween4;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, textTween(value));
}
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        var inherit = get2(node2, id0);
        schedule_default(node2, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }
  return new Transition(groups, this._parents, name, id1);
}
function end_default() {
  var on0, on1, that = this, id = that._id, size2 = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size2 === 0)
        resolve();
    } };
    that.each(function() {
      var schedule17 = set2(this, id), on5 = schedule17.on;
      if (on5 !== on0) {
        on1 = (on0 = on5).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule17.on = on1;
    });
    if (size2 === 0)
      resolve();
  });
}
function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}
function newId() {
  return ++id;
}
function transition2(name) {
  return selection_default().transition(name);
}
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
function inherit(node2, id2) {
  var timing;
  while (!(timing = node2.__transition) || !(timing = timing[id2])) {
    if (!(node2 = node2.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        schedule_default(node2, name, id2, i, group, timing || inherit(node2, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name, id2);
}
function number1(e) {
  return [+e[0], +e[1]];
}
function number22(e) {
  return [number1(e[0]), number1(e[1])];
}
function type3(t) {
  return { type: t };
}
function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
  }).join(",") + "}");
}
function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}
function inferColumns(rows) {
  var columnSet = Object.create(null), columns = [];
  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });
  return columns;
}
function pad(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}
function formatYear(year) {
  return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4);
}
function formatDate(date) {
  var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), milliseconds = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date" : formatYear(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z" : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z" : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z" : "");
}
function dsv_default(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
  function parse2(text3, f) {
    var convert, columns, rows = parseRows(text3, function(row, i) {
      if (convert)
        return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns || [];
    return rows;
  }
  function parseRows(text3, f) {
    var rows = [], N = text3.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
    if (text3.charCodeAt(N - 1) === NEWLINE)
      --N;
    if (text3.charCodeAt(N - 1) === RETURN)
      --N;
    function token() {
      if (eof)
        return EOF;
      if (eol)
        return eol = false, EOL;
      var i, j = I, c;
      if (text3.charCodeAt(j) === QUOTE) {
        while (I++ < N && text3.charCodeAt(I) !== QUOTE || text3.charCodeAt(++I) === QUOTE)
          ;
        if ((i = I) >= N)
          eof = true;
        else if ((c = text3.charCodeAt(I++)) === NEWLINE)
          eol = true;
        else if (c === RETURN) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE)
            ++I;
        }
        return text3.slice(j + 1, i - 1).replace(/""/g, "\"");
      }
      while (I < N) {
        if ((c = text3.charCodeAt(i = I++)) === NEWLINE)
          eol = true;
        else if (c === RETURN) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE)
            ++I;
        } else if (c !== DELIMITER)
          continue;
        return text3.slice(j, i);
      }
      return eof = true, text3.slice(j, N);
    }
    while ((t = token()) !== EOF) {
      var row = [];
      while (t !== EOL && t !== EOF)
        row.push(t), t = token();
      if (f && (row = f(row, n++)) == null)
        continue;
      rows.push(row);
    }
    return rows;
  }
  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }
  function format(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }
  function formatBody(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return preformatBody(rows, columns).join("\n");
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }
  function formatValue(value) {
    return value == null ? "" : value instanceof Date ? formatDate(value) : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\"" : value;
  }
  return {
    parse: parse2,
    parseRows,
    format,
    formatBody,
    formatRows,
    formatRow,
    formatValue
  };
}
function Transform(k, x, y2) {
  this.k = k;
  this.x = x;
  this.y = y2;
}
function transform(node2) {
  while (!node2.__zoom)
    if (!(node2 = node2.parentNode))
      return identity2;
  return node2.__zoom;
}
function csvFormats(header) {
  const _header = typeof header === "string" ? header.split(",") : header;
  return new TransformStream({
    start: (ctrl) => ctrl.enqueue(_header.join(",") + "\n"),
    transform: (chunk, ctrl) => ctrl.enqueue(csvFormatBody([chunk], _header) + "\n")
  });
}
function csvParses(header) {
  const _header = typeof header === "string" ? header.split(",") : header;
  let i = 0;
  return throughs((r) => r.pipeThrough(lines({ EOL: "LF" })).pipeThrough(skips(1)).pipeThrough(maps((line) => csvParse(_header + "\n" + line)[0])));
}
function tsvFormats(header) {
  const sep = "\t";
  const _header = typeof header === "string" ? header.split(sep) : header;
  return new TransformStream({
    start: (ctrl) => ctrl.enqueue(_header.join(sep) + "\n"),
    transform: (chunk, ctrl) => ctrl.enqueue(tsvFormatBody([chunk], _header) + "\n")
  });
}
function tsvParses(header) {
  const _header = typeof header === "string" ? header.split("\t") : header;
  let i = 0;
  return throughs((r) => r.pipeThrough(lines({ EOL: "LF" })).pipeThrough(skips(1)).pipeThrough(maps((line) => tsvParse(_header + "\n" + line)[0])));
}
function _byLazy(r, t) {
  const reader = r.getReader();
  const tw = t.writable.getWriter();
  const tr = t.readable.getReader();
  return sflow(new ReadableStream({
    start: async (ctrl) => {
      (async function() {
        while (true) {
          const { done, value } = await tr.read();
          if (done)
            return ctrl.close();
          ctrl.enqueue(value);
        }
      })();
    },
    pull: async (ctrl) => {
      const { done, value } = await reader.read();
      if (done)
        return tw.close();
      await tw.write(value);
    },
    cancel: async (r2) => {
      reader.cancel(r2);
      tr.cancel(r2);
    }
  }, { highWaterMark: 0 }));
}
async function getIgnoreFilter() {
  const defaultIgnore = [".git"];
  return await sflow(new Bun.Glob("./.gitignore").scan({ dot: true })).pMap(async (f) => [f, await Bun.file(f).text().catch(nil)]).reduce((map2, [k, v]) => v ? map2.set(k, v) : (map2.delete(k), map2), new Map).tail(1).map((ignoresMap) => {
    const filters2 = [...ignoresMap.entries()].map(([f, text]) => {
      const dir = q.dirname(f);
      const ignores = text.split("\n").concat(defaultIgnore);
      const filter = import_ignore.default().add(ignores).createFilter();
      return { dir, filter };
    });
    return function filter(f) {
      return filters2.every(({ dir, filter }) => {
        const rel = q.relative(dir, f);
        if (rel.startsWith(".."))
          return true;
        return filter(rel);
      });
    };
  }).toAtLeastOne();
}
function globFlow(globs) {
  return sflow(getIgnoreFilter()).map((ignoreFilter) => sflow(globs).map((glob) => sflow(new Bun.Glob(glob).scan({ dot: true })).filter((f) => ignoreFilter(f))).confluence()).confluence();
}
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_ignore = __commonJS((exports, module) => {
  function makeArray(subject) {
    return Array.isArray(subject) ? subject : [subject];
  }
  var EMPTY = "";
  var SPACE = " ";
  var ESCAPE = "\\";
  var REGEX_TEST_BLANK_LINE = /^\s+$/;
  var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
  var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
  var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
  var REGEX_SPLITALL_CRLF = /\r?\n/g;
  var REGEX_TEST_INVALID_PATH = /^\.*\/|^\.+$/;
  var SLASH = "/";
  var TMP_KEY_IGNORE = "node-ignore";
  if (typeof Symbol !== "undefined") {
    TMP_KEY_IGNORE = Symbol.for("node-ignore");
  }
  var KEY_IGNORE = TMP_KEY_IGNORE;
  var define = (object, key, value) => Object.defineProperty(object, key, { value });
  var REGEX_REGEXP_RANGE = /([0-z])-([0-z])/g;
  var RETURN_FALSE = () => false;
  var sanitizeRange = (range) => range.replace(REGEX_REGEXP_RANGE, (match, from2, to) => from2.charCodeAt(0) <= to.charCodeAt(0) ? match : EMPTY);
  var cleanRangeBackSlash = (slashes) => {
    const { length } = slashes;
    return slashes.slice(0, length - length % 2);
  };
  var REPLACERS = [
    [
      /^\uFEFF/,
      () => EMPTY
    ],
    [
      /\\?\s+$/,
      (match) => match.indexOf("\\") === 0 ? SPACE : EMPTY
    ],
    [
      /\\\s/g,
      () => SPACE
    ],
    [
      /[\\$.|*+(){^]/g,
      (match) => `\\${match}`
    ],
    [
      /(?!\\)\?/g,
      () => "[^/]"
    ],
    [
      /^\//,
      () => "^"
    ],
    [
      /\//g,
      () => "\\/"
    ],
    [
      /^\^*\\\*\\\*\\\//,
      () => "^(?:.*\\/)?"
    ],
    [
      /^(?=[^^])/,
      function startingReplacer() {
        return !/\/(?!$)/.test(this) ? "(?:^|\\/)" : "^";
      }
    ],
    [
      /\\\/\\\*\\\*(?=\\\/|$)/g,
      (_, index, str) => index + 6 < str.length ? "(?:\\/[^\\/]+)*" : "\\/.+"
    ],
    [
      /(^|[^\\]+)(\\\*)+(?=.+)/g,
      (_, p1, p2) => {
        const unescaped = p2.replace(/\\\*/g, "[^\\/]*");
        return p1 + unescaped;
      }
    ],
    [
      /\\\\\\(?=[$.|*+(){^])/g,
      () => ESCAPE
    ],
    [
      /\\\\/g,
      () => ESCAPE
    ],
    [
      /(\\)?\[([^\]/]*?)(\\*)($|\])/g,
      (match, leadEscape, range, endEscape, close) => leadEscape === ESCAPE ? `\\[${range}${cleanRangeBackSlash(endEscape)}${close}` : close === "]" ? endEscape.length % 2 === 0 ? `[${sanitizeRange(range)}${endEscape}]` : "[]" : "[]"
    ],
    [
      /(?:[^*])$/,
      (match) => /\/$/.test(match) ? `${match}$` : `${match}(?=$|\\/$)`
    ],
    [
      /(\^|\\\/)?\\\*$/,
      (_, p1) => {
        const prefix = p1 ? `${p1}[^/]+` : "[^/]*";
        return `${prefix}(?=$|\\/$)`;
      }
    ]
  ];
  var regexCache = Object.create(null);
  var makeRegex = (pattern, ignoreCase) => {
    let source = regexCache[pattern];
    if (!source) {
      source = REPLACERS.reduce((prev, current) => prev.replace(current[0], current[1].bind(pattern)), pattern);
      regexCache[pattern] = source;
    }
    return ignoreCase ? new RegExp(source, "i") : new RegExp(source);
  };
  var isString = (subject) => typeof subject === "string";
  var checkPattern = (pattern) => pattern && isString(pattern) && !REGEX_TEST_BLANK_LINE.test(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern) && pattern.indexOf("#") !== 0;
  var splitPattern = (pattern) => pattern.split(REGEX_SPLITALL_CRLF);

  class IgnoreRule {
    constructor(origin, pattern, negative, regex) {
      this.origin = origin;
      this.pattern = pattern;
      this.negative = negative;
      this.regex = regex;
    }
  }
  var createRule = (pattern, ignoreCase) => {
    const origin = pattern;
    let negative = false;
    if (pattern.indexOf("!") === 0) {
      negative = true;
      pattern = pattern.substr(1);
    }
    pattern = pattern.replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, "!").replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, "#");
    const regex = makeRegex(pattern, ignoreCase);
    return new IgnoreRule(origin, pattern, negative, regex);
  };
  var throwError = (message, Ctor) => {
    throw new Ctor(message);
  };
  var checkPath = (path, originalPath, doThrow) => {
    if (!isString(path)) {
      return doThrow(`path must be a string, but got \`${originalPath}\``, TypeError);
    }
    if (!path) {
      return doThrow(`path must not be empty`, TypeError);
    }
    if (checkPath.isNotRelative(path)) {
      const r = "`path.relative()`d";
      return doThrow(`path should be a ${r} string, but got "${originalPath}"`, RangeError);
    }
    return true;
  };
  var isNotRelative = (path) => REGEX_TEST_INVALID_PATH.test(path);
  checkPath.isNotRelative = isNotRelative;
  checkPath.convert = (p) => p;

  class Ignore {
    constructor({
      ignorecase = true,
      ignoreCase = ignorecase,
      allowRelativePaths = false
    } = {}) {
      define(this, KEY_IGNORE, true);
      this._rules = [];
      this._ignoreCase = ignoreCase;
      this._allowRelativePaths = allowRelativePaths;
      this._initCache();
    }
    _initCache() {
      this._ignoreCache = Object.create(null);
      this._testCache = Object.create(null);
    }
    _addPattern(pattern) {
      if (pattern && pattern[KEY_IGNORE]) {
        this._rules = this._rules.concat(pattern._rules);
        this._added = true;
        return;
      }
      if (checkPattern(pattern)) {
        const rule = createRule(pattern, this._ignoreCase);
        this._added = true;
        this._rules.push(rule);
      }
    }
    add(pattern) {
      this._added = false;
      makeArray(isString(pattern) ? splitPattern(pattern) : pattern).forEach(this._addPattern, this);
      if (this._added) {
        this._initCache();
      }
      return this;
    }
    addPattern(pattern) {
      return this.add(pattern);
    }
    _testOne(path, checkUnignored) {
      let ignored = false;
      let unignored = false;
      this._rules.forEach((rule) => {
        const { negative } = rule;
        if (unignored === negative && ignored !== unignored || negative && !ignored && !unignored && !checkUnignored) {
          return;
        }
        const matched = rule.regex.test(path);
        if (matched) {
          ignored = !negative;
          unignored = negative;
        }
      });
      return {
        ignored,
        unignored
      };
    }
    _test(originalPath, cache, checkUnignored, slices2) {
      const path = originalPath && checkPath.convert(originalPath);
      checkPath(path, originalPath, this._allowRelativePaths ? RETURN_FALSE : throwError);
      return this._t(path, cache, checkUnignored, slices2);
    }
    _t(path, cache, checkUnignored, slices2) {
      if (path in cache) {
        return cache[path];
      }
      if (!slices2) {
        slices2 = path.split(SLASH);
      }
      slices2.pop();
      if (!slices2.length) {
        return cache[path] = this._testOne(path, checkUnignored);
      }
      const parent = this._t(slices2.join(SLASH) + SLASH, cache, checkUnignored, slices2);
      return cache[path] = parent.ignored ? parent : this._testOne(path, checkUnignored);
    }
    ignores(path) {
      return this._test(path, this._ignoreCache, false).ignored;
    }
    createFilter() {
      return (path) => !this.ignores(path);
    }
    filter(paths) {
      return makeArray(paths).filter(this.createFilter());
    }
    test(path) {
      return this._test(path, this._testCache, true);
    }
  }
  var factory = (options) => new Ignore(options);
  var isPathValid = (path) => checkPath(path && checkPath.convert(path), path, RETURN_FALSE);
  factory.isPathValid = isPathValid;
  factory.default = factory;
  module.exports = factory;
  if (typeof process !== "undefined" && (process.env && process.env.IGNORE_TEST_WIN32 || process.platform === "win32")) {
    const makePosix = (str) => /^\\\\\?\\/.test(str) || /["<>|\u0000-\u001F]+/u.test(str) ? str : str.replace(/\\/g, "/");
    checkPath.convert = makePosix;
    const REGIX_IS_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
    checkPath.isNotRelative = (path) => REGIX_IS_WINDOWS_PATH_ABSOLUTE.test(path) || isNotRelative(path);
  }
});
var import_ignore = __toESM(require_ignore(), 1);
var L = Object.create;
var b = Object.defineProperty;
var z = Object.getOwnPropertyDescriptor;
var D = Object.getOwnPropertyNames;
var T = Object.getPrototypeOf;
var R = Object.prototype.hasOwnProperty;
var _ = (f, e) => () => (e || f((e = { exports: {} }).exports, e), e.exports);
var E = (f, e) => {
  for (var r in e)
    b(f, r, { get: e[r], enumerable: true });
};
var C = (f, e, r, l) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let i of D(e))
      !R.call(f, i) && i !== r && b(f, i, { get: () => e[i], enumerable: !(l = z(e, i)) || l.enumerable });
  return f;
};
var A = (f, e, r) => (C(f, e, "default"), r && C(r, e, "default"));
var y = (f, e, r) => (r = f != null ? L(T(f)) : {}, C(e || !f || !f.__esModule ? b(r, "default", { value: f, enumerable: true }) : r, f));
var h = _((F, S) => {
  function c(f) {
    if (typeof f != "string")
      throw new TypeError("Path must be a string. Received " + JSON.stringify(f));
  }
  function w(f, e) {
    for (var r = "", l = 0, i = -1, s = 0, n, t = 0;t <= f.length; ++t) {
      if (t < f.length)
        n = f.charCodeAt(t);
      else {
        if (n === 47)
          break;
        n = 47;
      }
      if (n === 47) {
        if (!(i === t - 1 || s === 1))
          if (i !== t - 1 && s === 2) {
            if (r.length < 2 || l !== 2 || r.charCodeAt(r.length - 1) !== 46 || r.charCodeAt(r.length - 2) !== 46) {
              if (r.length > 2) {
                var a = r.lastIndexOf("/");
                if (a !== r.length - 1) {
                  a === -1 ? (r = "", l = 0) : (r = r.slice(0, a), l = r.length - 1 - r.lastIndexOf("/")), i = t, s = 0;
                  continue;
                }
              } else if (r.length === 2 || r.length === 1) {
                r = "", l = 0, i = t, s = 0;
                continue;
              }
            }
            e && (r.length > 0 ? r += "/.." : r = "..", l = 2);
          } else
            r.length > 0 ? r += "/" + f.slice(i + 1, t) : r = f.slice(i + 1, t), l = t - i - 1;
        i = t, s = 0;
      } else
        n === 46 && s !== -1 ? ++s : s = -1;
    }
    return r;
  }
  function J(f, e) {
    var r = e.dir || e.root, l = e.base || (e.name || "") + (e.ext || "");
    return r ? r === e.root ? r + l : r + f + l : l;
  }
  var g = { resolve: function() {
    for (var e = "", r = false, l, i = arguments.length - 1;i >= -1 && !r; i--) {
      var s;
      i >= 0 ? s = arguments[i] : (l === undefined && (l = process.cwd()), s = l), c(s), s.length !== 0 && (e = s + "/" + e, r = s.charCodeAt(0) === 47);
    }
    return e = w(e, !r), r ? e.length > 0 ? "/" + e : "/" : e.length > 0 ? e : ".";
  }, normalize: function(e) {
    if (c(e), e.length === 0)
      return ".";
    var r = e.charCodeAt(0) === 47, l = e.charCodeAt(e.length - 1) === 47;
    return e = w(e, !r), e.length === 0 && !r && (e = "."), e.length > 0 && l && (e += "/"), r ? "/" + e : e;
  }, isAbsolute: function(e) {
    return c(e), e.length > 0 && e.charCodeAt(0) === 47;
  }, join: function() {
    if (arguments.length === 0)
      return ".";
    for (var e, r = 0;r < arguments.length; ++r) {
      var l = arguments[r];
      c(l), l.length > 0 && (e === undefined ? e = l : e += "/" + l);
    }
    return e === undefined ? "." : g.normalize(e);
  }, relative: function(e, r) {
    if (c(e), c(r), e === r || (e = g.resolve(e), r = g.resolve(r), e === r))
      return "";
    for (var l = 1;l < e.length && e.charCodeAt(l) === 47; ++l)
      ;
    for (var i = e.length, s = i - l, n = 1;n < r.length && r.charCodeAt(n) === 47; ++n)
      ;
    for (var t = r.length, a = t - n, v = s < a ? s : a, u = -1, o = 0;o <= v; ++o) {
      if (o === v) {
        if (a > v) {
          if (r.charCodeAt(n + o) === 47)
            return r.slice(n + o + 1);
          if (o === 0)
            return r.slice(n + o);
        } else
          s > v && (e.charCodeAt(l + o) === 47 ? u = o : o === 0 && (u = 0));
        break;
      }
      var k = e.charCodeAt(l + o), P = r.charCodeAt(n + o);
      if (k !== P)
        break;
      k === 47 && (u = o);
    }
    var d = "";
    for (o = l + u + 1;o <= i; ++o)
      (o === i || e.charCodeAt(o) === 47) && (d.length === 0 ? d += ".." : d += "/..");
    return d.length > 0 ? d + r.slice(n + u) : (n += u, r.charCodeAt(n) === 47 && ++n, r.slice(n));
  }, _makeLong: function(e) {
    return e;
  }, dirname: function(e) {
    if (c(e), e.length === 0)
      return ".";
    for (var r = e.charCodeAt(0), l = r === 47, i = -1, s = true, n = e.length - 1;n >= 1; --n)
      if (r = e.charCodeAt(n), r === 47) {
        if (!s) {
          i = n;
          break;
        }
      } else
        s = false;
    return i === -1 ? l ? "/" : "." : l && i === 1 ? "//" : e.slice(0, i);
  }, basename: function(e, r) {
    if (r !== undefined && typeof r != "string")
      throw new TypeError('"ext" argument must be a string');
    c(e);
    var l = 0, i = -1, s = true, n;
    if (r !== undefined && r.length > 0 && r.length <= e.length) {
      if (r.length === e.length && r === e)
        return "";
      var t = r.length - 1, a = -1;
      for (n = e.length - 1;n >= 0; --n) {
        var v = e.charCodeAt(n);
        if (v === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          a === -1 && (s = false, a = n + 1), t >= 0 && (v === r.charCodeAt(t) ? --t === -1 && (i = n) : (t = -1, i = a));
      }
      return l === i ? i = a : i === -1 && (i = e.length), e.slice(l, i);
    } else {
      for (n = e.length - 1;n >= 0; --n)
        if (e.charCodeAt(n) === 47) {
          if (!s) {
            l = n + 1;
            break;
          }
        } else
          i === -1 && (s = false, i = n + 1);
      return i === -1 ? "" : e.slice(l, i);
    }
  }, extname: function(e) {
    c(e);
    for (var r = -1, l = 0, i = -1, s = true, n = 0, t = e.length - 1;t >= 0; --t) {
      var a = e.charCodeAt(t);
      if (a === 47) {
        if (!s) {
          l = t + 1;
          break;
        }
        continue;
      }
      i === -1 && (s = false, i = t + 1), a === 46 ? r === -1 ? r = t : n !== 1 && (n = 1) : r !== -1 && (n = -1);
    }
    return r === -1 || i === -1 || n === 0 || n === 1 && r === i - 1 && r === l + 1 ? "" : e.slice(r, i);
  }, format: function(e) {
    if (e === null || typeof e != "object")
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof e);
    return J("/", e);
  }, parse: function(e) {
    c(e);
    var r = { root: "", dir: "", base: "", ext: "", name: "" };
    if (e.length === 0)
      return r;
    var l = e.charCodeAt(0), i = l === 47, s;
    i ? (r.root = "/", s = 1) : s = 0;
    for (var n = -1, t = 0, a = -1, v = true, u = e.length - 1, o = 0;u >= s; --u) {
      if (l = e.charCodeAt(u), l === 47) {
        if (!v) {
          t = u + 1;
          break;
        }
        continue;
      }
      a === -1 && (v = false, a = u + 1), l === 46 ? n === -1 ? n = u : o !== 1 && (o = 1) : n !== -1 && (o = -1);
    }
    return n === -1 || a === -1 || o === 0 || o === 1 && n === a - 1 && n === t + 1 ? a !== -1 && (t === 0 && i ? r.base = r.name = e.slice(1, a) : r.base = r.name = e.slice(t, a)) : (t === 0 && i ? (r.name = e.slice(1, n), r.base = e.slice(1, a)) : (r.name = e.slice(t, n), r.base = e.slice(t, a)), r.ext = e.slice(n, a)), t > 0 ? r.dir = e.slice(0, t - 1) : i && (r.dir = "/"), r;
  }, sep: "/", delimiter: ":", win32: null, posix: null };
  g.posix = g;
  S.exports = g;
});
var m = {};
E(m, { default: () => q });
A(m, y(h()));
var q = y(h());
var __create2 = Object.create;
var __getProtoOf2 = Object.getPrototypeOf;
var __defProp2 = Object.defineProperty;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __toESM2 = (mod, isNodeMode, target) => {
  target = mod != null ? __create2(__getProtoOf2(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames2(mod))
    if (!__hasOwnProp2.call(to, key))
      __defProp2(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS2 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_src = __commonJS2((exports, module) => {
  var unwind = (dataObject, options) => {
    const unwindRecursive = (dataObject2, path, currPath) => {
      const pathArr = path.split(".");
      if (!currPath) {
        currPath = pathArr[0];
      }
      const result = [];
      let added = false;
      const addObject = (objectTempUnwind, objectKey) => {
        Object.keys(objectTempUnwind).forEach((objectTempUnwindKey) => {
          const newObjectCopy = {};
          Object.keys(dataObject2).forEach((dataObjectKey) => {
            newObjectCopy[dataObjectKey] = dataObject2[dataObjectKey];
          });
          newObjectCopy[objectKey] = objectTempUnwind[objectTempUnwindKey];
          added = true;
          result.push(newObjectCopy);
        });
      };
      Object.keys(dataObject2).forEach((objectKey) => {
        if (currPath === objectKey) {
          if (dataObject2[objectKey] instanceof Array) {
            if (dataObject2[objectKey].length === 0 && options.preserveEmptyArray !== true) {
              delete dataObject2[objectKey];
            } else {
              Object.keys(dataObject2[objectKey]).forEach((objectElementKey) => {
                addObject(unwindRecursive(dataObject2[objectKey][objectElementKey], path.replace(`${currPath}.`, "")), objectKey);
              });
            }
          } else {
            addObject(unwindRecursive(dataObject2[objectKey], path.replace(`${currPath}.`, "")), objectKey);
          }
        }
      });
      if (!added) {
        result.push(dataObject2);
      }
      return result;
    };
    return unwindRecursive(dataObject, options.path);
  };
  module.exports = { unwind };
});
var main_default = DIE;
var { isArray } = Array;
var never = () => new Promise(() => null);

class Gate {
  _count;
  _queue = [];
  constructor(_count) {
    this._count = _count;
  }
  async wait() {
    if (this._count > 0) {
      --this._count;
      return Promise.resolve();
    }
    return new Promise((r) => {
      let cb = () => {
        this._queue.splice(this._queue.indexOf(cb), 1);
        --this._count;
        r();
      };
      this._queue.push(cb);
    });
  }
  increment() {
    ++this._count;
    this.clearQueue();
  }
  setCount(count) {
    this._count = count;
    this.clearQueue();
  }
  clearQueue() {
    while (this._count > 0 && this._queue.length > 0) {
      this._queue.shift()();
    }
  }
}

class BlockingQueue {
  _pushers = [];
  _pullers = [];
  constructor() {
  }
  async push(value) {
    return new Promise((r) => {
      this._pushers.unshift(() => {
        r();
        return value;
      });
      this.dequeue();
    });
  }
  async pull() {
    return new Promise((r) => {
      this._pullers.unshift((value) => {
        r(value);
      });
      this.dequeue();
    });
  }
  dequeue() {
    while (this._pullers.length > 0 && this._pushers.length > 0) {
      let puller = this._pullers.pop();
      let pusher = this._pushers.pop();
      puller(pusher());
    }
  }
}

class Subscribable {
  closed = false;
  subscribers = [];
  subscribe(cb) {
    let self = this;
    self.subscribers.push(cb);
    let _closed = false;
    return {
      get closed() {
        return _closed || self.closed;
      },
      unsubscribe() {
        let index = self.subscribers.findIndex((x) => x === cb);
        if (index >= 0) {
          self.subscribers.splice(index, 1);
        }
        _closed = true;
      }
    };
  }
  next(value) {
    return Math.min(...this.subscribers.map((x) => x.next(value)));
  }
  complete() {
    for (let sub of this.subscribers) {
      sub.complete();
    }
    this.subscribers = [];
    this.closed = true;
  }
  error(err) {
    for (let sub of this.subscribers) {
      sub.error(err);
    }
    this.subscribers = [];
    this.closed = true;
  }
}

class Subject {
  _subscribable = new Subscribable;
  _closingResolve;
  _closing = new Promise((r) => this._closingResolve = r);
  get closed() {
    return this._subscribable.closed;
  }
  get readable() {
    let self = this;
    let subscription;
    let cancelled = false;
    return new ReadableStream({
      async start(controller) {
        subscription = self.subscribe({
          next: (value) => {
            if (cancelled)
              return;
            controller.enqueue(value);
            return controller.desiredSize;
          },
          complete: () => {
            controller.close();
          },
          error: (err) => {
            controller.error(err);
          }
        });
      },
      cancel() {
        cancelled = true;
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });
  }
  get writable() {
    const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
    const self = this;
    let stream = new WritableStream({
      write(chunk, controller) {
        if (self.closed && controller.signal.aborted == false) {
          controller.error();
          return;
        }
        if (controller.signal.aborted) {
          self._error(controller.signal.reason);
          return;
        }
        self._next(chunk);
      },
      close() {
        self._complete();
      },
      abort(reason) {
        self._error(reason);
      }
    }, queuingStrategy);
    this._closing.then((_2) => {
      if (stream.locked == false) {
        stream.close();
      }
    });
    return stream;
  }
  subscribe(cb) {
    let subscription = this._subscribable.subscribe(cb);
    return subscription;
  }
  _next(value) {
    return this._subscribable.next(value);
  }
  _complete() {
    this._subscribable.complete();
  }
  _error(err) {
    this._subscribable.error(err);
  }
  async next(value) {
    return this._next(value);
  }
  async complete() {
    this._closingResolve(undefined);
    return this._complete();
  }
  async error(err) {
    this._closingResolve(undefined);
    return this._error(err);
  }
}
var toStream = (src) => src instanceof ReadableStream ? src : from(src);
var concats = (...srcs) => {
  if (!srcs.length)
    return new TransformStream;
  const upstream = new TransformStream;
  return {
    writable: upstream.writable,
    readable: concat(upstream.readable, ...srcs.map(toStream))
  };
};
var confluences = ({
  order = "breadth"
} = {}) => {
  if (order !== "breadth")
    main_default("not implemented");
  const { writable, readable: sources } = new TransformStream;
  const srcsQueue = [];
  const readable = new ReadableStream({
    async pull(ctrl) {
      while (true) {
        const src = await async function() {
          const r2 = sources.getReader();
          const { done: done2, value: src2 } = await r2.read();
          r2.releaseLock();
          if (done2)
            return srcsQueue.shift();
          return src2;
        }();
        if (!src)
          return ctrl.close();
        const r = src.getReader();
        const { done, value } = await r.read();
        r.releaseLock();
        if (done)
          continue;
        srcsQueue.push(src);
        ctrl.enqueue(value);
        return;
      }
    }
  });
  return { writable, readable };
};
var filters = (fn) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (fn) {
        const shouldEnqueue = await fn(chunk, i++);
        if (shouldEnqueue)
          ctrl.enqueue(chunk);
      } else {
        const isNull = chunk === undefined || chunk === null;
        if (!isNull)
          ctrl.enqueue(chunk);
      }
    }
  });
};
var bys = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return bys((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: fn(readable) };
};
var throughs = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: fn(readable) };
};
var lines = ({ EOL = "KEEP" } = {}) => {
  const CRLFMap = {
    KEEP: "$1",
    LF: "\n",
    CRLF: "\r\n",
    NONE: ""
  };
  return throughs((r) => r.pipeThrough(flatMaps((s) => s.split(/(?<=\n)/g))).pipeThrough(chunkIfs((ch) => ch.indexOf("\n") === -1, { inclusive: true })).pipeThrough(maps((chunks2) => chunks2.join("").replace(/(\r?\n?)$/, CRLFMap[EOL]))));
};
var wseMerges = merge;
var parallels = (...srcs) => wseMerges()(from(srcs));
var merges = (...srcs) => {
  if (!srcs.length)
    return new TransformStream;
  const upstream = new TransformStream;
  return {
    writable: upstream.writable,
    readable: parallels(upstream.readable, ...srcs.map(toStream))
  };
};
var mergeStream = (...srcs) => {
  if (!srcs.length)
    return new ReadableStream({ start: (c) => c.close() });
  if (srcs.length === 1)
    return toStream(srcs[0]);
  const t = new TransformStream;
  const w = t.writable.getWriter();
  const streams = srcs.map(toStream);
  Promise.all(streams.map(async (s) => {
    for await (const chunk of Object.assign(s, {
      [Symbol.asyncIterator]: streamAsyncIterator
    }))
      await w.write(chunk);
  })).then(async () => w.close()).catch((error) => {
    console.error(error);
    return Promise.all([
      t.writable.abort(error),
      ...streams.map((e) => e.cancel(error))
    ]);
  });
  return t.readable;
};
var pMaps = (fn, options = {}) => {
  let i = 0;
  let promises = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      promises.push(fn(chunk, i++));
      if (promises.length >= (options.concurrency ?? Infinity))
        ctrl.enqueue(await promises.shift());
    },
    flush: async (ctrl) => {
      while (promises.length)
        ctrl.enqueue(await promises.shift());
    }
  });
};
var asyncMaps = (fn, options = {}) => {
  let i = 0;
  let tasks = new Map;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const id = i++;
      tasks.set(id, async function() {
        return fn(chunk, id);
      }().then((data) => ({ id, data })));
      if (tasks.size >= (options.concurrency ?? Infinity)) {
        const { id: id2, data } = await Promise.race(tasks.values());
        tasks.delete(id2);
        ctrl.enqueue(data);
      }
    },
    flush: async (ctrl) => {
      while (tasks.size) {
        const { id, data } = await Promise.race(tasks.values());
        tasks.delete(id);
        ctrl.enqueue(data);
      }
    }
  });
};
var reduceEmits = (fn, _state) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const { next, emit } = await fn(_state, chunk, i++);
      _state = next;
      ctrl.enqueue(emit);
    }
  });
};
var reduces = (fn, state) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(state, chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      state = await val;
      ctrl.enqueue(state);
    }
  });
};
var matchs = (matcher) => {
  return new TransformStream({
    transform: (chunk, ctrl) => ctrl.enqueue(chunk.match(matcher))
  });
};
var matchAlls = (matcher) => {
  return new TransformStream({
    transform: (chunk, ctrl) => ctrl.enqueue(chunk.matchAll(matcher))
  });
};
var replaces = (searchValue, replacement) => {
  return maps((s) => typeof replacement === "string" ? s.replace(searchValue, replacement) : replaceAsync(s, searchValue, replacement));
};
var replaceAlls = (searchValue, replacement) => {
  return maps((s) => typeof replacement === "string" ? s.replaceAll(searchValue, replacement) : replaceAsync(s, searchValue, replacement));
};
var tees = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(a);
  return { writable, readable: b2 };
};
var uniqs = () => {
  const set3 = new Set;
  return throughs((s) => s.pipeThrough(filters((x) => {
    if (set3.has(x))
      return false;
    set3.add(x);
    return true;
  })));
};
var uniqBys = (keyFn) => {
  const set3 = new Set;
  return throughs((s) => s.pipeThrough(filters(async (x) => {
    const key = await keyFn(x);
    if (set3.has(key))
      return false;
    set3.add(key);
    return true;
  })));
};
var import_unwind_array = __toESM2(require_src(), 1);
var noop = { value: () => {
} };
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _2 = this._, T2 = parseTypenames(typename + "", _2), t, i = -1, n = T2.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T2[i]).type) && (t = get(_2[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T2[i]).type)
        _2[t] = set(_2[t], typename.name, callback);
      else if (callback == null)
        for (t in _2)
          _2[t] = set(_2[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _2 = this._;
    for (var t in _2)
      copy[t] = _2[t].slice();
    return new Dispatch(copy);
  },
  call: function(type32, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type32))
      throw new Error("unknown type: " + type32);
    for (t = this._[type32], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type32, that, args) {
    if (!this._.hasOwnProperty(type32))
      throw new Error("unknown type: " + type32);
    for (var t = this._[type32], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
var dispatch_default = dispatch;
var xhtml = "http://www.w3.org/1999/xhtml";
var namespaces_default = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
var find = Array.prototype.find;
var filter2 = Array.prototype.filter;
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector2) {
    return this._parent.querySelector(selector2);
  },
  querySelectorAll: function(selector2) {
    return this._parent.querySelectorAll(selector2);
  }
};
ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
var root = [null];
Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: select_default,
  selectAll: selectAll_default,
  selectChild: selectChild_default,
  selectChildren: selectChildren_default,
  filter: filter_default,
  data: data_default,
  enter: enter_default,
  exit: exit_default,
  join: join_default,
  merge: merge_default,
  selection: selection_selection,
  order: order_default,
  sort: sort_default,
  call: call_default,
  nodes: nodes_default,
  node: node_default,
  size: size_default,
  empty: empty_default,
  each: each_default,
  attr: attr_default,
  style: style_default,
  property: property_default,
  classed: classed_default,
  text: text_default,
  html: html_default,
  raise: raise_default,
  lower: lower_default,
  append: append_default,
  insert: insert_default,
  remove: remove_default,
  clone: clone_default,
  datum: datum_default,
  on: on_default,
  dispatch: dispatch_default2,
  [Symbol.iterator]: iterator_default
};
var selection_default = selection;
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)\$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)\$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)\$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)\$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)\$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)\$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
define_default(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
define_default(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m2), hsl2rgb(h2, m1, m2), hsl2rgb(h2 < 120 ? h2 + 240 : h2 - 120, m1, m2), this.opacity);
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
var constant_default2 = (x) => () => x;
var rgb_default = function rgbGamma(y2) {
  var color3 = gamma(y2);
  function rgb2(start2, end) {
    var r = color3((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color3(start2.g, end.g), b2 = color3(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.r = r(t);
      start2.g = g(t);
      start2.b = b2(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
}(1);
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
var degrees = 180 / Math.PI;
var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
var svgNode;
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
var frame = 0;
var timeout2 = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail)
        taskTail._next = this;
      else
        taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
var Selection2 = selection_default.prototype.constructor;
var id = 0;
var selection_prototype = selection_default.prototype;
Transition.prototype = transition2.prototype = {
  constructor: Transition,
  select: select_default2,
  selectAll: selectAll_default2,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: filter_default2,
  merge: merge_default2,
  selection: selection_default2,
  transition: transition_default,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: on_default2,
  attr: attr_default2,
  attrTween: attrTween_default,
  style: style_default2,
  styleTween: styleTween_default,
  text: text_default2,
  textTween: textTween_default,
  remove: remove_default2,
  tween: tween_default,
  delay: delay_default,
  duration: duration_default,
  ease: ease_default,
  easeVarying: easeVarying_default,
  end: end_default,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};
var defaultTiming = {
  time: null,
  delay: 0,
  duration: 250,
  ease: cubicInOut
};
selection_default.prototype.interrupt = interrupt_default2;
selection_default.prototype.transition = transition_default2;
var X = {
  name: "x",
  handles: ["w", "e"].map(type3),
  input: function(x, e) {
    return x == null ? null : [[+x[0], e[0][1]], [+x[1], e[1][1]]];
  },
  output: function(xy) {
    return xy && [xy[0][0], xy[1][0]];
  }
};
var Y = {
  name: "y",
  handles: ["n", "s"].map(type3),
  input: function(y2, e) {
    return y2 == null ? null : [[e[0][0], +y2[0]], [e[1][0], +y2[1]]];
  },
  output: function(xy) {
    return xy && [xy[0][1], xy[1][1]];
  }
};
var XY = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type3),
  input: function(xy) {
    return xy == null ? null : number22(xy);
  },
  output: function(xy) {
    return xy;
  }
};
var EOL = {};
var EOF = {};
var QUOTE = 34;
var NEWLINE = 10;
var RETURN = 13;
var csv = dsv_default(",");
var csvParse = csv.parse;
var csvParseRows = csv.parseRows;
var csvFormat = csv.format;
var csvFormatBody = csv.formatBody;
var csvFormatRows = csv.formatRows;
var csvFormatRow = csv.formatRow;
var csvFormatValue = csv.formatValue;
var tsv = dsv_default("\t");
var tsvParse = tsv.parse;
var tsvParseRows = tsv.parseRows;
var tsvFormat = tsv.format;
var tsvFormatBody = tsv.formatBody;
var tsvFormatRows = tsv.formatRows;
var tsvFormatRow = tsv.formatRow;
var tsvFormatValue = tsv.formatValue;
Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y2) {
    return x === 0 & y2 === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y2);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y2) {
    return y2 * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity2 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
var sflow = (...srcs) => {
  const r = srcs.length === 1 ? toStream(srcs[0]) : mergeStream(...srcs);
  return Object.assign(r, {
    _type: null,
    get readable() {
      return r;
    },
    through: (...args) => sflow(r.pipeThrough(_throughs(...args))),
    by: (...args) => sflow(r.pipeThrough(_throughs(...args))),
    byLazy: (t) => _byLazy(r, t),
    mapAddField: (...args) => sflow(r.pipeThrough(mapAddFields(...args))),
    cacheSkip: (...args) => sflow(r).byLazy(cacheSkips(...args)),
    cacheList: (...args) => sflow(r).byLazy(cacheLists(...args)),
    cacheTail: (...args) => sflow(r).byLazy(cacheTails(...args)),
    chunkBy: (...args) => sflow(r.pipeThrough(chunkBys(...args))),
    chunkIf: (...args) => sflow(r.pipeThrough(chunkIfs(...args))),
    buffer: (...args) => sflow(r.pipeThrough(chunks(...args))),
    chunk: (...args) => sflow(r.pipeThrough(chunks(...args))),
    convolve: (...args) => sflow(r.pipeThrough(convolves(...args))),
    abort: (...args) => sflow(r.pipeThrough(terminates(...args))),
    chunkInterval: (...args) => sflow(r.pipeThrough(chunkIntervals(...args))),
    interval: (...args) => sflow(r.pipeThrough(chunkIntervals(...args))),
    debounce: (...args) => sflow(r.pipeThrough(debounces(...args))),
    filter: (...args) => sflow(r.pipeThrough(filters(...args))),
    flatMap: (...args) => sflow(r.pipeThrough(flatMaps(...args))),
    flat: (...args) => sflow(r).byLazy(flats(...args)),
    join: (...args) => sflow(r.pipeThrough(riffles(...args))),
    match: (...args) => sflow(r.pipeThrough(matchs(...args))),
    matchAll: (...args) => sflow(r.pipeThrough(matchAlls(...args))),
    replace: (...args) => sflow(r.pipeThrough(replaces(...args))),
    replaceAll: (...args) => sflow(r.pipeThrough(replaceAlls(...args))),
    merge: (...args) => sflow(r.pipeThrough(merges(...args))),
    concat: (...args) => sflow(r.pipeThrough(concats(...args))),
    confluence: (...args) => sflow(r.pipeThrough(confluences(...args))),
    limit: (...args) => sflow(r).byLazy(limits(...args)),
    head: (...args) => sflow(r.pipeThrough(heads(...args))),
    map: (...args) => sflow(r.pipeThrough(maps(...args))),
    log: (...args) => sflow(r.pipeThrough(logs(...args))),
    uniq: (...args) => sflow(r.pipeThrough(uniqs(...args))),
    uniqBy: (...args) => sflow(r.pipeThrough(uniqBys(...args))),
    unwind: (...args) => sflow(r.pipeThrough(unwinds(...args))),
    asyncMap: (...args) => sflow(r.pipeThrough(asyncMaps(...args))),
    pMap: (...args) => sflow(r.pipeThrough(pMaps(...args))),
    peek: (...args) => sflow(r.pipeThrough(peeks(...args))),
    riffle: (...args) => sflow(r.pipeThrough(riffles(...args))),
    forEach: (...args) => sflow(r.pipeThrough(forEachs(...args))),
    reduce: (...args) => sflow(r.pipeThrough(reduces(...args))),
    reduceEmit: (...args) => sflow(r.pipeThrough(reduceEmits(...args))),
    skip: (...args) => sflow(r.pipeThrough(skips(...args))),
    slice: (...args) => sflow(r.pipeThrough(slices(...args))),
    tail: (...args) => sflow(r.pipeThrough(tails(...args))),
    tees: (...args) => sflow(r.pipeThrough(_tees(...args))),
    throttle: (...args) => sflow(r.pipeThrough(throttles(...args))),
    csvFormat: (...args) => sflow(r.pipeThrough(csvFormats(...args))),
    tsvFormat: (...args) => sflow(r.pipeThrough(tsvFormats(...args))),
    csvParse: (...args) => sflow(r.pipeThrough(csvParses(...args))),
    tsvParse: (...args) => sflow(r.pipeThrough(tsvParses(...args))),
    preventAbort: () => sflow(r.pipeThrough(throughs(), { preventAbort: true })),
    preventClose: () => sflow(r.pipeThrough(throughs(), { preventClose: true })),
    preventCancel: () => sflow(r.pipeThrough(throughs(), { preventCancel: true })),
    done: () => r.pipeTo(nils()),
    end: (dst = nils()) => r.pipeTo(dst),
    to: (dst = nils()) => r.pipeTo(dst),
    run: () => r.pipeTo(nils()),
    toEnd: () => r.pipeTo(nils()),
    toNil: () => r.pipeTo(nils()),
    toArray: () => toArray(r),
    toCount: async () => {
      let i = 0;
      const d = r.getReader();
      while (!(await d.read()).done)
        i++;
      return i;
    },
    toFirst: () => toPromise(sflow(r).limit(1, { terminate: true })),
    toLast: () => toPromise(sflow(r).tail(1)),
    toOne: async () => {
      const a = await toArray(r);
      if (a.length > 1)
        main_default(`Expect only 1 Item, but got ${a.length}`);
      return a[0];
    },
    toAtLeastOne: async () => {
      const a = await toArray(r);
      if (a.length > 1)
        main_default(`Expect only 1 Item, but got ${a.length}`);
      if (a.length < 1)
        main_default(`Expect at least 1 Item, but got ${a.length}`);
      return a[0];
    },
    toLog: (...args) => sflow(r.pipeThrough(logs(...args))).done(),
    lines: (...args) => sflow(r.pipeThrough(lines(...args))),
    toResponse: (init2) => new Response(r, init2),
    text: (init2) => new Response(r, init2).text(),
    json: (init2) => new Response(r, init2).json(),
    blob: (init2) => new Response(r, init2).blob(),
    arrayBuffer: (init2) => new Response(r, init2).arrayBuffer(),
    [Symbol.asyncIterator]: streamAsyncIterator
  });
};
var _tees = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(sflow(a));
  return { writable, readable: b2 };
};
var _throughs = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: sflow(fn(sflow(readable))) };
};

class PolyfillTextDecoderStream extends TransformStream {
  encoding;
  fatal;
  ignoreBOM;
  constructor(encoding = "utf-8", {
    fatal = false,
    ignoreBOM = false
  } = {}) {
    const decoder = new TextDecoder(encoding, { fatal, ignoreBOM });
    super({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          controller.enqueue(chunk);
          return;
        }
        const decoded = decoder.decode(chunk);
        if (decoded.length > 0) {
          controller.enqueue(decoded);
        }
      },
      flush(controller) {
        const output = decoder.decode();
        if (output.length > 0) {
          controller.enqueue(output);
        }
      }
    });
    this.encoding = encoding;
    this.fatal = fatal;
    this.ignoreBOM = ignoreBOM;
  }
}

class PolyfillTextEncoderStream {
  _encoder = new TextEncoder;
  _reader = null;
  ready = Promise.resolve();
  closed = false;
  readable = new ReadableStream({
    start: (controller) => {
      this._reader = controller;
    }
  });
  writable = new WritableStream({
    write: async (chunk) => {
      if (typeof chunk !== "string") {
        this._reader.enqueue(chunk);
        return;
      }
      if (chunk != null && this._reader) {
        const encoded = this._encoder.encode(chunk);
        this._reader.enqueue(encoded);
      }
    },
    close: () => {
      this._reader?.close();
      this.closed = true;
    },
    abort: (reason) => {
      this._reader?.error(reason);
      this.closed = true;
    }
  });
}

// cli.ts
import {stdin, stdout} from "process";

// node_modules/sflow/dist/index.js
function DIE2(reason, ...slots) {
  throw throwsError2(reason, ...slots);
}
function throwsError2(reason, ...slots) {
  if (typeof reason === "string") {
    return new Error(reason.trim());
  }
  if (Array.isArray(reason)) {
    return new Error(reason.map((e, i) => e + (slots[i] ?? "")).join(""));
  }
  if (reason instanceof Error) {
    return reason;
  }
  DIE2(new Error("unknown error type", { cause: { reason } }));
}
function cacheLists2(store, _options) {
  const { key = new Error().stack ?? main_default2("missing cache key") } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks2 = [];
  const cacheHitPromise = store.has?.(key) || store.get(key);
  let hitflag = false;
  return new TransformStream({
    start: async (ctrl) => {
      if (!await cacheHitPromise)
        return;
      const cached = await store.get(key);
      if (!cached)
        return;
      cached.map((c) => ctrl.enqueue(c));
      hitflag = true;
    },
    transform: async (chunk, ctrl) => {
      if (await cacheHitPromise || hitflag) {
        ctrl.terminate();
        return never2();
      }
      chunks2.push(chunk);
      ctrl.enqueue(chunk);
    },
    flush: async () => await store.set(key, chunks2)
  });
}
function cacheSkips2(store, _options) {
  const {
    key = new Error().stack ?? main_default2("missing cache key"),
    windowSize = 1
  } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks2 = [];
  const cachePromise = store.get(key);
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const cache = await cachePromise;
      if (cache?.length) {
        await store.set(key, chunks2.concat(...cache).slice(0, windowSize));
        ctrl.terminate();
        return await never2();
      }
      chunks2.push(chunk);
      ctrl.enqueue(chunk);
    },
    flush: async () => await store.set(key, chunks2.slice(0, windowSize))
  });
}
function type2(input) {
  if (input === null) {
    return "Null";
  } else if (input === undefined) {
    return "Undefined";
  } else if (Number.isNaN(input)) {
    return "NaN";
  }
  const typeResult = Object.prototype.toString.call(input).slice(8, -1);
  return typeResult === "AsyncFunction" ? "Promise" : typeResult;
}
function _indexOf2(valueToFind, list) {
  if (!isArray2(list))
    throw new Error(`Cannot read property 'indexOf' of ${list}`);
  const typeOfValue = type2(valueToFind);
  if (!["Array", "NaN", "Object", "RegExp"].includes(typeOfValue))
    return list.indexOf(valueToFind);
  let index = -1;
  let foundIndex = -1;
  const { length } = list;
  while (++index < length && foundIndex === -1)
    if (equals2(list[index], valueToFind))
      foundIndex = index;
  return foundIndex;
}
function _arrayFromIterator2(iter) {
  const list = [];
  let next;
  while (!(next = iter.next()).done)
    list.push(next.value);
  return list;
}
function _compareSets2(a, b2) {
  if (a.size !== b2.size)
    return false;
  const aList = _arrayFromIterator2(a.values());
  const bList = _arrayFromIterator2(b2.values());
  const filtered = aList.filter((aInstance) => _indexOf2(aInstance, bList) === -1);
  return filtered.length === 0;
}
function compareErrors2(a, b2) {
  if (a.message !== b2.message)
    return false;
  if (a.toString !== b2.toString)
    return false;
  return a.toString() === b2.toString();
}
function parseDate2(maybeDate) {
  if (!maybeDate.toDateString)
    return [false];
  return [true, maybeDate.getTime()];
}
function parseRegex2(maybeRegex) {
  if (maybeRegex.constructor !== RegExp)
    return [false];
  return [true, maybeRegex.toString()];
}
function equals2(a, b2) {
  if (arguments.length === 1)
    return (_b) => equals2(a, _b);
  if (Object.is(a, b2))
    return true;
  const aType = type2(a);
  if (aType !== type2(b2))
    return false;
  if (aType === "Function")
    return a.name === undefined ? false : a.name === b2.name;
  if (["NaN", "Null", "Undefined"].includes(aType))
    return true;
  if (["BigInt", "Number"].includes(aType)) {
    if (Object.is(-0, a) !== Object.is(-0, b2))
      return false;
    return a.toString() === b2.toString();
  }
  if (["Boolean", "String"].includes(aType))
    return a.toString() === b2.toString();
  if (aType === "Array") {
    const aClone = Array.from(a);
    const bClone = Array.from(b2);
    if (aClone.toString() !== bClone.toString())
      return false;
    let loopArrayFlag = true;
    aClone.forEach((aCloneInstance, aCloneIndex) => {
      if (loopArrayFlag) {
        if (aCloneInstance !== bClone[aCloneIndex] && !equals2(aCloneInstance, bClone[aCloneIndex]))
          loopArrayFlag = false;
      }
    });
    return loopArrayFlag;
  }
  const aRegex = parseRegex2(a);
  const bRegex = parseRegex2(b2);
  if (aRegex[0])
    return bRegex[0] ? aRegex[1] === bRegex[1] : false;
  else if (bRegex[0])
    return false;
  const aDate = parseDate2(a);
  const bDate = parseDate2(b2);
  if (aDate[0])
    return bDate[0] ? aDate[1] === bDate[1] : false;
  else if (bDate[0])
    return false;
  if (a instanceof Error) {
    if (!(b2 instanceof Error))
      return false;
    return compareErrors2(a, b2);
  }
  if (aType === "Set")
    return _compareSets2(a, b2);
  if (aType === "Object") {
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b2).length)
      return false;
    let loopObjectFlag = true;
    aKeys.forEach((aKeyInstance) => {
      if (loopObjectFlag) {
        const aValue = a[aKeyInstance];
        const bValue = b2[aKeyInstance];
        if (aValue !== bValue && !equals2(aValue, bValue))
          loopObjectFlag = false;
      }
    });
    return loopObjectFlag;
  }
  return false;
}
function sortBy(sortFn, list) {
  if (arguments.length === 1)
    return (_list) => sortBy(sortFn, _list);
  const clone = cloneList(list);
  return clone.sort((a, b2) => {
    const aSortResult = sortFn(a);
    const bSortResult = sortFn(b2);
    if (aSortResult === bSortResult)
      return 0;
    return aSortResult < bSortResult ? -1 : 1;
  });
}
function cacheTails2(store, _options) {
  const { key = new Error().stack ?? main_default2("missing cache key") } = typeof _options === "string" ? { key: _options } : _options ?? {};
  const chunks2 = [];
  const cachePromise = Promise.withResolvers();
  const t = new TransformStream;
  const w = t.writable.getWriter();
  const writable = new WritableStream({
    start: async () => cachePromise.resolve(await store.get(key)),
    write: async (chunk, ctrl) => {
      const cache = await cachePromise.promise;
      if (cache && equals2(chunk, cache[0])) {
        console.log("asdf");
        await store.set(key, [...chunks2, ...cache]);
        for await (const item of cache)
          await w.write(item);
        await w.close();
        ctrl.error(new Error("cached"));
        return await never2();
      }
      chunks2.push(chunk);
      await w.write(chunk);
    },
    close: async () => {
      await store.set(key, [...chunks2]);
      await w.close();
    },
    abort: () => w.abort()
  });
  return { writable, readable: t.readable };
}
function chunkBys2(compareFn) {
  let chunks2 = [];
  let lastOrder;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const order = await compareFn(chunk);
      if (lastOrder && lastOrder !== order)
        ctrl.enqueue(chunks2.splice(0, Infinity));
      chunks2.push(chunk);
      lastOrder = order;
    },
    flush: async (ctrl) => void (chunks2.length && ctrl.enqueue(chunks2))
  });
}
function chunkIfs2(predicate, { inclusive = false } = {}) {
  let chunks2 = [];
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const cond = await predicate(chunk, i++, chunks2);
      if (!inclusive && !cond)
        chunks2.length && ctrl.enqueue(chunks2.splice(0, Infinity));
      chunks2.push(chunk);
      if (!cond)
        ctrl.enqueue(chunks2.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks2.length && ctrl.enqueue(chunks2))
  });
}
function chunkIntervals2(interval2 = 0) {
  let chunks2 = [];
  let id2 = null;
  return new TransformStream({
    start: (ctrl) => {
      id2 = setInterval(() => ctrl.enqueue(chunks2.splice(0, Infinity)), interval2);
    },
    transform: async (chunk) => {
      chunks2.push(chunk);
    },
    flush: async (ctrl) => {
      if (chunks2.length)
        ctrl.enqueue(chunks2.splice(0, Infinity));
      id2 !== null && clearInterval(id2);
    }
  });
}
function chunks2(n = Infinity) {
  let chunks22 = [];
  if (n <= 0)
    throw new Error("Buffer size must be greater than 0");
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      chunks22.push(chunk);
      if (chunks22.length >= n)
        ctrl.enqueue(chunks22.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks22.length && ctrl.enqueue(chunks22))
  });
}
function map2(select) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          let mapped = await select(next.value);
          if (mapped !== undefined)
            controller.enqueue(mapped);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
}
function isReadableLike2(obj) {
  return obj["readable"] != null;
}
function from2(src) {
  let it;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && it != null) {
        let next = await it.next();
        if (next.done) {
          it = null;
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  if (isReadableLike2(src)) {
    return src.readable;
  }
  return new ReadableStream({
    async start(controller) {
      let iterable;
      if (typeof src == "function") {
        src = src();
      }
      if (Symbol.asyncIterator && src[Symbol.asyncIterator])
        iterable = src[Symbol.asyncIterator].bind(src);
      else if (src[Symbol.iterator])
        iterable = src[Symbol.iterator].bind(src);
      else {
        let value = await Promise.resolve(src);
        controller.enqueue(value);
        controller.close();
        return;
      }
      it = iterable();
      return flush(controller);
    },
    async pull(controller) {
      return flush(controller);
    },
    async cancel(reason) {
      if (reason && it && it.throw) {
        it.throw(reason);
      } else if (it && it.return) {
        await it.return();
      }
      it = null;
    }
  });
}
function through2(dst) {
  return function(src) {
    return src.pipeThrough(dst);
  };
}
function pipe2(src, ...ops) {
  if (isReadableLike2(src)) {
    src = src.readable;
  }
  return ops.map((x) => isTransform2(x) ? through2(x) : x).reduce((p, c) => {
    return c(p, { highWaterMark: 1 });
  }, src);
}
function isTransform2(x) {
  return x["readable"] != null && x["writable"] != null;
}
function schedule2(scheduler) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          await scheduler.nextTick();
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
}
function on2(callbacks) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
          if (callbacks.complete)
            callbacks.complete();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
      if (callbacks.error)
        callbacks.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        if (callbacks.start)
          callbacks.start();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
          if (callbacks.complete)
            callbacks.complete(reason);
        }
      }
    }, opts);
  };
}
async function toPromise2(src) {
  let res = undefined;
  if (isReadableLike2(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  let done = false;
  while (done == false) {
    let next = await reader.read();
    done = next.done;
    if (!done)
      res = next.value;
  }
  return res;
}
function merge2(concurrent = Infinity) {
  if (concurrent == 0)
    throw Error("zero is an invalid concurrency limit");
  return function(src) {
    let outerGate = new Gate2(concurrent);
    let innerQueue = new BlockingQueue2;
    let subscription;
    let errored = null;
    return new ReadableStream({
      start(outerController) {
        let reading = [];
        let readingDone = false;
        toPromise2(pipe2(src, schedule2({
          nextTick: async () => {
            await outerGate.wait();
          }
        }), map2((innerStream) => {
          if (!(innerStream instanceof ReadableStream)) {
            innerStream = from2(innerStream);
          }
          reading.push(innerStream);
          pipe2(innerStream, map2(async (value) => {
            await innerQueue.push({ done: false, value });
          }), on2({
            error(err) {
              outerController.error(err);
            },
            complete() {
              outerGate.increment();
              reading.splice(reading.indexOf(innerStream), 1);
              if (reading.length == 0 && readingDone) {
                innerQueue.push({ done: true });
              }
            }
          }));
        }), on2({
          error(err) {
            outerController.error(err);
            errored = err;
          },
          complete() {
            readingDone = true;
          }
        }))).catch((err) => {
          outerController.error(err);
        });
      },
      async pull(controller) {
        while (controller.desiredSize > 0) {
          let next = await innerQueue.pull();
          if (errored) {
            controller.error(errored);
          }
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(next.value);
          }
        }
      },
      cancel(reason) {
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
      }
    });
  };
}
async function toArray2(src) {
  let res = [];
  if (isReadableLike2(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  try {
    let done = false;
    while (done == false) {
      let next = await reader.read();
      done = next.done;
      if (!done)
        res.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return res;
}
function maps2(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      ctrl.enqueue(val);
    }
  });
}
function nils2() {
  return new WritableStream;
}
function convolves2(n) {
  const buffer2 = [];
  return new TransformStream({
    transform(chunk, controller) {
      buffer2.push(chunk);
      if (buffer2.length > n)
        buffer2.shift();
      if (buffer2.length === n)
        controller.enqueue([...buffer2]);
    },
    flush(controller) {
      while (buffer2.length > 1) {
        buffer2.shift();
        if (buffer2.length === n)
          controller.enqueue([...buffer2]);
      }
    }
  });
}
function debounces2(t) {
  let id2 = null;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (id2)
        clearTimeout(id2);
      id2 = setTimeout(() => {
        ctrl.enqueue(chunk);
        id2 = null;
      }, t);
    },
    flush: async () => {
      while (id2)
        await new Promise((r) => setTimeout(r, t / 2));
    }
  });
}
function flatMaps2(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      val.map((e) => ctrl.enqueue(e));
    }
  });
}
function flats2() {
  const emptyError = new Error("Flatten for empty array [] in stream is not supported yet, To fix this error, you can add a .filter(array=>array.length) stage before flat");
  return new TransformStream({
    transform: async (a, ctrl) => {
      a.length || main_default2(emptyError);
      a.map((e) => ctrl.enqueue(e));
    }
  });
}
function forEachs2(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(chunk, i++);
      ret instanceof Promise && await ret;
      ctrl.enqueue(chunk);
    }
  });
}
function heads2(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      return n-- > 0 ? ctrl.enqueue(chunk) : await never2();
    }
  });
}
function limits2(n, { terminate = true } = {}) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      ctrl.enqueue(chunk);
      if (--n === 0) {
        terminate && ctrl.terminate();
        return never2();
      }
    },
    flush: () => {
    }
  }, { highWaterMark: 1 }, { highWaterMark: 0 });
}
function peeks2(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      ctrl.enqueue(chunk);
      const ret = fn(chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
    }
  });
}
function logs2(mapFn = (s, i) => s) {
  return bys2(peeks2(async (e, i) => {
    const ret = mapFn(e, i);
    const val = ret instanceof Promise ? await ret : ret;
    console.log(typeof val === "string" ? val.replace(/\n$/, "") : val);
  }));
}
function mapAddFields2(key, fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => ctrl.enqueue({ ...chunk, [key]: await fn(chunk, i++) })
  });
}
async function* streamAsyncIterator2() {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function mergeStreamsBy(transform2, sources) {
  if (!sources)
    return (srcs) => mergeStreamsBy(transform2, srcs);
  if (!sources.length)
    return emptyStream();
  const streams = sources.map((s) => toStream2(s));
  const readers = streams.map((stream) => stream.getReader());
  let slots = streams.map(() => null);
  return new ReadableStream({
    pull: async (ctrl) => {
      const results = await Promise.all(readers.map(async (reader, i) => slots[i] ??= await reader.read()));
      slots = await transform2([...slots], ctrl);
      if (slots.length !== streams.length)
        main_default2("slot length mismatch");
    }
  });
}
function mergeStreamsByAscend(ordFn, sources) {
  if (!sources)
    return (sources2) => mergeStreamsByAscend(ordFn, sources2);
  let lastEmit = null;
  return mergeStreamsBy(async (slots, ctrl) => {
    const cands = slots.filter((e) => e?.done === false).map((e) => e.value);
    if (!cands.length) {
      ctrl.close();
      return [];
    }
    const peak = sortBy(ordFn, cands)[0];
    const index = slots.findIndex((e) => e?.done === false && e?.value === peak);
    if (lastEmit && lastEmit.value !== sortBy(ordFn, [lastEmit.value, peak])[0] && ordFn(lastEmit.value) !== ordFn(peak))
      main_default2(new Error("MergeStreamError: one of sources is not ordered by ascending", {
        cause: {
          prevOrd: ordFn(lastEmit.value),
          currOrd: ordFn(peak),
          prev: lastEmit.value,
          curr: peak
        }
      }));
    lastEmit = { value: peak };
    ctrl.enqueue(peak);
    return slots.toSpliced(index, 1, null);
  }, sources);
}
function mergeStreamsByDescend(ordFn, sources) {
  if (!sources)
    return (srcs) => mergeStreamsByDescend(ordFn, srcs);
  let lastEmit = null;
  return mergeStreamsBy(async (slots, ctrl) => {
    const cands = slots.filter((e) => e?.done === false).map((e) => e.value);
    if (!cands.length) {
      ctrl.close();
      return [];
    }
    const peak = sortBy(ordFn, cands).toReversed()[0];
    const index = slots.findIndex((e) => e?.done === false && e?.value === peak);
    if (lastEmit && lastEmit.value !== sortBy(ordFn, [lastEmit.value, peak]).toReversed()[0] && ordFn(lastEmit.value) !== ordFn(peak))
      main_default2(new Error("MergeStreamError: one of sources is not ordered by descending", {
        cause: {
          prevOrd: ordFn(lastEmit.value),
          currOrd: ordFn(peak),
          prev: lastEmit.value,
          curr: peak
        }
      }));
    lastEmit = { value: peak };
    ctrl.enqueue(peak);
    return slots.toSpliced(index, 1, null);
  }, sources);
}
function riffles2(sep) {
  let last2;
  return new TransformStream({
    transform: (chunk, ctrl) => {
      if (last2 !== undefined) {
        ctrl.enqueue(last2);
        ctrl.enqueue(sep);
      }
      last2 = chunk;
    },
    flush: (ctrl) => ctrl.enqueue(last2)
  });
}
function skips2(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (n <= 0)
        ctrl.enqueue(chunk);
      else
        n--;
    }
  });
}
function slices2(start2 = 0, end = Infinity) {
  const count = end - start2;
  const { readable, writable } = new TransformStream;
  return {
    writable,
    readable: readable.pipeThrough(skips2(start2)).pipeThrough(limits2(count))
  };
}
function replaceAsync2(string, searchValue, replacer) {
  try {
    if (typeof replacer === "function") {
      var values = [];
      String.prototype.replace.call(string, searchValue, function() {
        values.push(replacer.apply(undefined, arguments));
        return "";
      });
      return Promise.all(values).then(function(resolvedValues) {
        return String.prototype.replace.call(string, searchValue, function() {
          return resolvedValues.shift();
        });
      });
    } else {
      return Promise.resolve(String.prototype.replace.call(string, searchValue, replacer));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
function tails2(n = 1) {
  let chunks22 = [];
  return new TransformStream({
    transform: (chunk) => {
      chunks22.push(chunk);
      if (chunks22.length > n)
        chunks22.shift();
    },
    flush: (ctrl) => {
      chunks22.map((e) => ctrl.enqueue(e));
    }
  });
}
function terminates2(signal2) {
  return throughs2((r) => r.pipeThrough(new TransformStream, { signal: signal2 }));
}
function throttles2(interval2, { drop = false, keepLast = true } = {}) {
  let timerId = null;
  let cdPromise = Promise.withResolvers();
  let lasts = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (timerId) {
        if (keepLast)
          lasts = [chunk];
        if (drop)
          return;
        await cdPromise.promise;
      }
      lasts = [];
      ctrl.enqueue(chunk);
      [cdPromise, timerId] = [
        Promise.withResolvers(),
        setTimeout(() => {
          timerId = null;
          cdPromise.resolve();
        }, interval2)
      ];
    },
    flush: async (ctrl) => {
      while (timerId)
        await new Promise((r) => setTimeout(r, interval2 / 2));
      lasts.map((e) => ctrl.enqueue(e));
    }
  });
}
function unwinds2(key) {
  return flatMaps2((e) => import_unwind_array2.unwind(e, { path: key }));
}
function dispatch2() {
  for (var i = 0, n = arguments.length, _2 = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _2 || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _2[t] = [];
  }
  return new Dispatch2(_2);
}
function Dispatch2(_2) {
  this._ = _2;
}
function parseTypenames3(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
function get3(type32, name) {
  for (var i = 0, n = type32.length, c;i < n; ++i) {
    if ((c = type32[i]).name === name) {
      return c.value;
    }
  }
}
function set3(type32, name, callback) {
  for (var i = 0, n = type32.length;i < n; ++i) {
    if (type32[i].name === name) {
      type32[i] = noop2, type32 = type32.slice(0, i).concat(type32.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type32.push({ name, value: callback });
  return type32;
}
function namespace_default2(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns")
    name = name.slice(i + 1);
  return namespaces_default2.hasOwnProperty(prefix) ? { space: namespaces_default2[prefix], local: name } : name;
}
function creatorInherit2(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml2 && document2.documentElement.namespaceURI === xhtml2 ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed2(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default2(name) {
  var fullname = namespace_default2(name);
  return (fullname.local ? creatorFixed2 : creatorInherit2)(fullname);
}
function none2() {
}
function selector_default2(selector) {
  return selector == null ? none2 : function() {
    return this.querySelector(selector);
  };
}
function select_default3(select) {
  if (typeof select !== "function")
    select = selector_default2(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0;i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection3(subgroups, this._parents);
}
function array2(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}
function empty2() {
  return [];
}
function selectorAll_default2(selector2) {
  return selector2 == null ? empty2 : function() {
    return this.querySelectorAll(selector2);
  };
}
function arrayAll2(select) {
  return function() {
    return array2(select.apply(this, arguments));
  };
}
function selectAll_default3(select) {
  if (typeof select === "function")
    select = arrayAll2(select);
  else
    select = selectorAll_default2(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection3(subgroups, parents);
}
function childMatcher2(selector2) {
  return function(node) {
    return node.matches(selector2);
  };
}
function matcher_default2(selector2) {
  return function() {
    return this.matches(selector2);
  };
}
function childFind2(match) {
  return function() {
    return find2.call(this.children, match);
  };
}
function childFirst2() {
  return this.firstElementChild;
}
function selectChild_default2(match) {
  return this.select(match == null ? childFirst2 : childFind2(typeof match === "function" ? match : childMatcher2(match)));
}
function children2() {
  return Array.from(this.children);
}
function childrenFilter2(match) {
  return function() {
    return filter22.call(this.children, match);
  };
}
function selectChildren_default2(match) {
  return this.selectAll(match == null ? children2 : childrenFilter2(typeof match === "function" ? match : childMatcher2(match)));
}
function filter_default3(match) {
  if (typeof match !== "function")
    match = matcher_default2(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0;i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection3(subgroups, this._parents);
}
function sparse_default2(update) {
  return new Array(update.length);
}
function EnterNode2(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
function enter_default2() {
  return new Selection3(this._enter || this._groups.map(sparse_default2), this._parents);
}
function constant_default3(x) {
  return function() {
    return x;
  };
}
function bindIndex2(parent, group, enter2, update, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (;i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter2[i] = new EnterNode2(parent, data[i]);
    }
  }
  for (;i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey2(parent, group, enter2, update, exit, data, key) {
  var i, node, nodeByKeyValue = new Map, groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0;i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0;i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter2[i] = new EnterNode2(parent, data[i]);
    }
  }
  for (i = 0;i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum2(node) {
  return node.__data__;
}
function arraylike2(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function data_default2(value, key) {
  if (!arguments.length)
    return Array.from(this, datum2);
  var bind = key ? bindKey2 : bindIndex2, parents = this._parents, groups = this._groups;
  if (typeof value !== "function")
    value = constant_default3(value);
  for (var m2 = groups.length, update = new Array(m2), enter2 = new Array(m2), exit = new Array(m2), j = 0;j < m2; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike2(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter2[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next;i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection3(update, parents);
  update._enter = enter2;
  update._exit = exit;
  return update;
}
function exit_default2() {
  return new Selection3(this._exit || this._groups.map(sparse_default2), this._parents);
}
function join_default2(onenter, onupdate, onexit) {
  var enter2 = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter2 = onenter(enter2);
    if (enter2)
      enter2 = enter2.selection();
  } else {
    enter2 = enter2.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update)
      update = update.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter2 && update ? enter2.merge(update).order() : update;
}
function merge_default3(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges2 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge3 = merges2[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge3[i] = node;
      }
    }
  }
  for (;j < m0; ++j) {
    merges2[j] = groups0[j];
  }
  return new Selection3(merges2, this._parents);
}
function order_default2() {
  for (var groups = this._groups, j = -1, m2 = groups.length;++j < m2; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node;--i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
function ascending2(a, b2) {
  return a < b2 ? -1 : a > b2 ? 1 : a >= b2 ? 0 : NaN;
}
function sort_default2(compare) {
  if (!compare)
    compare = ascending2;
  function compareNode(a, b2) {
    return a && b2 ? compare(a.__data__, b2.__data__) : !a - !b2;
  }
  for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection3(sortgroups, this._parents).order();
}
function call_default2() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function nodes_default2() {
  return Array.from(this);
}
function node_default2() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length;i < n; ++i) {
      var node = group[i];
      if (node)
        return node;
    }
  }
  return null;
}
function size_default2() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}
function empty_default2() {
  return !this.node();
}
function each_default2(callback) {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}
function attrRemove3(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS3(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant3(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS3(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction3(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v);
  };
}
function attrFunctionNS3(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default3(name, value) {
  var fullname = namespace_default2(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS3 : attrRemove3 : typeof value === "function" ? fullname.local ? attrFunctionNS3 : attrFunction3 : fullname.local ? attrConstantNS3 : attrConstant3)(fullname, value));
}
function window_default2(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
function styleRemove3(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant3(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction3(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v, priority);
  };
}
function styleValue2(node, name) {
  return node.style.getPropertyValue(name) || window_default2(node).getComputedStyle(node, null).getPropertyValue(name);
}
function style_default3(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove3 : typeof value === "function" ? styleFunction3 : styleConstant3)(name, value, priority == null ? "" : priority)) : styleValue2(this.node(), name);
}
function propertyRemove2(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant2(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction2(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      delete this[name];
    else
      this[name] = v;
  };
}
function property_default2(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove2 : typeof value === "function" ? propertyFunction2 : propertyConstant2)(name, value)) : this.node()[name];
}
function classArray2(string) {
  return string.trim().split(/^|\s+/);
}
function classList2(node) {
  return node.classList || new ClassList2(node);
}
function ClassList2(node) {
  this._node = node;
  this._names = classArray2(node.getAttribute("class") || "");
}
function classedAdd2(node, names) {
  var list = classList2(node), i = -1, n = names.length;
  while (++i < n)
    list.add(names[i]);
}
function classedRemove2(node, names) {
  var list = classList2(node), i = -1, n = names.length;
  while (++i < n)
    list.remove(names[i]);
}
function classedTrue2(names) {
  return function() {
    classedAdd2(this, names);
  };
}
function classedFalse2(names) {
  return function() {
    classedRemove2(this, names);
  };
}
function classedFunction2(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd2 : classedRemove2)(this, names);
  };
}
function classed_default2(name, value) {
  var names = classArray2(name + "");
  if (arguments.length < 2) {
    var list = classList2(this.node()), i = -1, n = names.length;
    while (++i < n)
      if (!list.contains(names[i]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction2 : value ? classedTrue2 : classedFalse2)(names, value));
}
function textRemove2() {
  this.textContent = "";
}
function textConstant3(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction3(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default3(value) {
  return arguments.length ? this.each(value == null ? textRemove2 : (typeof value === "function" ? textFunction3 : textConstant3)(value)) : this.node().textContent;
}
function htmlRemove2() {
  this.innerHTML = "";
}
function htmlConstant2(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction2(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default2(value) {
  return arguments.length ? this.each(value == null ? htmlRemove2 : (typeof value === "function" ? htmlFunction2 : htmlConstant2)(value)) : this.node().innerHTML;
}
function raise2() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default2() {
  return this.each(raise2);
}
function lower2() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default2() {
  return this.each(lower2);
}
function append_default2(name) {
  var create2 = typeof name === "function" ? name : creator_default2(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
function constantNull2() {
  return null;
}
function insert_default2(name, before) {
  var create2 = typeof name === "function" ? name : creator_default2(name), select = before == null ? constantNull2 : typeof before === "function" ? before : selector_default2(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
function remove2() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default3() {
  return this.each(remove2);
}
function selection_cloneShallow2() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep2() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default2(deep) {
  return this.select(deep ? selection_cloneDeep2 : selection_cloneShallow2);
}
function datum_default2(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
function contextListener2(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames22(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove2(typename) {
  return function() {
    var on4 = this.__on;
    if (!on4)
      return;
    for (var j = 0, i = -1, m2 = on4.length, o;j < m2; ++j) {
      if (o = on4[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on4[++i] = o;
      }
    }
    if (++i)
      on4.length = i;
    else
      delete this.__on;
  };
}
function onAdd2(typename, value, options) {
  return function() {
    var on4 = this.__on, o, listener = contextListener2(value);
    if (on4)
      for (var j = 0, m2 = on4.length;j < m2; ++j) {
        if ((o = on4[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on4)
      this.__on = [o];
    else
      on4.push(o);
  };
}
function on_default3(typename, value, options) {
  var typenames = parseTypenames22(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on4 = this.node().__on;
    if (on4)
      for (var j = 0, m2 = on4.length, o;j < m2; ++j) {
        for (i = 0, o = on4[j];i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on4 = value ? onAdd2 : onRemove2;
  for (i = 0;i < n; ++i)
    this.each(on4(typenames[i], value, options));
  return this;
}
function dispatchEvent2(node, type32, params) {
  var window4 = window_default2(node), event = window4.CustomEvent;
  if (typeof event === "function") {
    event = new event(type32, params);
  } else {
    event = window4.document.createEvent("Event");
    if (params)
      event.initEvent(type32, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type32, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant2(type32, params) {
  return function() {
    return dispatchEvent2(this, type32, params);
  };
}
function dispatchFunction2(type32, params) {
  return function() {
    return dispatchEvent2(this, type32, params.apply(this, arguments));
  };
}
function dispatch_default22(type32, params) {
  return this.each((typeof params === "function" ? dispatchFunction2 : dispatchConstant2)(type32, params));
}
function* iterator_default2() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        yield node;
    }
  }
}
function Selection3(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection2() {
  return new Selection3([[document.documentElement]], root2);
}
function selection_selection2() {
  return this;
}
function extend2(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}
function define_default2(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function Color2() {
}
function color_formatHex2() {
  return this.rgb().formatHex();
}
function color_formatHex82() {
  return this.rgb().formatHex8();
}
function color_formatHsl2() {
  return hslConvert2(this).formatHsl();
}
function color_formatRgb2() {
  return this.rgb().formatRgb();
}
function rgbn2(n) {
  return new Rgb2(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba2(r, g, b2, a) {
  if (a <= 0)
    r = g = b2 = NaN;
  return new Rgb2(r, g, b2, a);
}
function rgbConvert2(o) {
  if (!(o instanceof Color2))
    o = color2(o);
  if (!o)
    return new Rgb2;
  o = o.rgb();
  return new Rgb2(o.r, o.g, o.b, o.opacity);
}
function rgb2(r, g, b2, opacity) {
  return arguments.length === 1 ? rgbConvert2(r) : new Rgb2(r, g, b2, opacity == null ? 1 : opacity);
}
function Rgb2(r, g, b2, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b2;
  this.opacity = +opacity;
}
function rgb_formatHex2() {
  return `#${hex2(this.r)}${hex2(this.g)}${hex2(this.b)}`;
}
function rgb_formatHex82() {
  return `#${hex2(this.r)}${hex2(this.g)}${hex2(this.b)}${hex2((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb2() {
  const a = clampa2(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi2(this.r)}, ${clampi2(this.g)}, ${clampi2(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa2(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi2(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex2(value) {
  value = clampi2(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla2(h2, s, l, a) {
  if (a <= 0)
    h2 = s = l = NaN;
  else if (l <= 0 || l >= 1)
    h2 = s = NaN;
  else if (s <= 0)
    h2 = NaN;
  return new Hsl2(h2, s, l, a);
}
function hslConvert2(o) {
  if (o instanceof Hsl2)
    return new Hsl2(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color2))
    o = color2(o);
  if (!o)
    return new Hsl2;
  if (o instanceof Hsl2)
    return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b2 = o.b / 255, min = Math.min(r, g, b2), max = Math.max(r, g, b2), h2 = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max)
      h2 = (g - b2) / s + (g < b2) * 6;
    else if (g === max)
      h2 = (b2 - r) / s + 2;
    else
      h2 = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h2 *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h2;
  }
  return new Hsl2(h2, s, l, o.opacity);
}
function hsl2(h2, s, l, opacity) {
  return arguments.length === 1 ? hslConvert2(h2) : new Hsl2(h2, s, l, opacity == null ? 1 : opacity);
}
function Hsl2(h2, s, l, opacity) {
  this.h = +h2;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
function clamph2(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt2(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb2(h2, m1, m2) {
  return (h2 < 60 ? m1 + (m2 - m1) * h2 / 60 : h2 < 180 ? m2 : h2 < 240 ? m1 + (m2 - m1) * (240 - h2) / 60 : m1) * 255;
}
function color2(format) {
  var m2, l;
  format = (format + "").trim().toLowerCase();
  return (m2 = reHex2.exec(format)) ? (l = m2[1].length, m2 = parseInt(m2[1], 16), l === 6 ? rgbn2(m2) : l === 3 ? new Rgb2(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l === 8 ? rgba2(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l === 4 ? rgba2(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger2.exec(format)) ? new Rgb2(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent2.exec(format)) ? new Rgb2(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger2.exec(format)) ? rgba2(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent2.exec(format)) ? rgba2(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent2.exec(format)) ? hsla2(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent2.exec(format)) ? hsla2(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named2.hasOwnProperty(format) ? rgbn2(named2[format]) : format === "transparent" ? new Rgb2(NaN, NaN, NaN, 0) : null;
}
function basis2(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default2(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis2((t - i / n) * n, v0, v1, v2, v3);
  };
}
function basisClosed_default2(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis2((t - i / n) * n, v0, v1, v2, v3);
  };
}
function linear2(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential2(a, b2, y2) {
  return a = Math.pow(a, y2), b2 = Math.pow(b2, y2) - a, y2 = 1 / y2, function(t) {
    return Math.pow(a + t * b2, y2);
  };
}
function gamma2(y2) {
  return (y2 = +y2) === 1 ? nogamma2 : function(a, b2) {
    return b2 - a ? exponential2(a, b2, y2) : constant_default22(isNaN(a) ? b2 : a);
  };
}
function nogamma2(a, b2) {
  var d = b2 - a;
  return d ? linear2(a, d) : constant_default22(isNaN(a) ? b2 : a);
}
function rgbSpline2(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b2 = new Array(n), i, color3;
    for (i = 0;i < n; ++i) {
      color3 = rgb2(colors[i]);
      r[i] = color3.r || 0;
      g[i] = color3.g || 0;
      b2[i] = color3.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b2 = spline(b2);
    color3.opacity = 1;
    return function(t) {
      color3.r = r(t);
      color3.g = g(t);
      color3.b = b2(t);
      return color3 + "";
    };
  };
}
function number_default2(a, b2) {
  return a = +a, b2 = +b2, function(t) {
    return a * (1 - t) + b2 * t;
  };
}
function zero2(b2) {
  return function() {
    return b2;
  };
}
function one2(b2) {
  return function(t) {
    return b2(t) + "";
  };
}
function string_default2(a, b2) {
  var bi = reA2.lastIndex = reB2.lastIndex = 0, am, bm, bs, i = -1, s = [], q2 = [];
  a = a + "", b2 = b2 + "";
  while ((am = reA2.exec(a)) && (bm = reB2.exec(b2))) {
    if ((bs = bm.index) > bi) {
      bs = b2.slice(bi, bs);
      if (s[i])
        s[i] += bs;
      else
        s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i])
        s[i] += bm;
      else
        s[++i] = bm;
    } else {
      s[++i] = null;
      q2.push({ i, x: number_default2(am, bm) });
    }
    bi = reB2.lastIndex;
  }
  if (bi < b2.length) {
    bs = b2.slice(bi);
    if (s[i])
      s[i] += bs;
    else
      s[++i] = bs;
  }
  return s.length < 2 ? q2[0] ? one2(q2[0].x) : zero2(b2) : (b2 = q2.length, function(t) {
    for (var i2 = 0, o;i2 < b2; ++i2)
      s[(o = q2[i2]).i] = o.x(t);
    return s.join("");
  });
}
function decompose_default2(a, b2, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b2 * b2))
    a /= scaleX, b2 /= scaleX;
  if (skewX = a * c + b2 * d)
    c -= a * skewX, d -= b2 * skewX;
  if (scaleY = Math.sqrt(c * c + d * d))
    c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b2 * c)
    a = -a, b2 = -b2, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b2, a) * degrees2,
    skewX: Math.atan(skewX) * degrees2,
    scaleX,
    scaleY
  };
}
function parseCss2(value) {
  const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m2.isIdentity ? identity3 : decompose_default2(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
}
function parseSvg2(value) {
  if (value == null)
    return identity3;
  if (!svgNode2)
    svgNode2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode2.setAttribute("transform", value);
  if (!(value = svgNode2.transform.baseVal.consolidate()))
    return identity3;
  value = value.matrix;
  return decompose_default2(value.a, value.b, value.c, value.d, value.e, value.f);
}
function interpolateTransform2(parse2, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i - 4, x: number_default2(xa, xb) }, { i: i - 2, x: number_default2(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b2, s, q2) {
    if (a !== b2) {
      if (a - b2 > 180)
        b2 += 360;
      else if (b2 - a > 180)
        a += 360;
      q2.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default2(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "rotate(" + b2 + degParen);
    }
  }
  function skewX(a, b2, s, q2) {
    if (a !== b2) {
      q2.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default2(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "skewX(" + b2 + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q2.push({ i: i - 4, x: number_default2(xa, xb) }, { i: i - 2, x: number_default2(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a, b2) {
    var s = [], q2 = [];
    a = parse2(a), b2 = parse2(b2);
    translate(a.translateX, a.translateY, b2.translateX, b2.translateY, s, q2);
    rotate(a.rotate, b2.rotate, s, q2);
    skewX(a.skewX, b2.skewX, s, q2);
    scale(a.scaleX, a.scaleY, b2.scaleX, b2.scaleY, s, q2);
    a = b2 = null;
    return function(t) {
      var i = -1, n = q2.length, o;
      while (++i < n)
        s[(o = q2[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
function now2() {
  return clockNow2 || (setFrame2(clearNow2), clockNow2 = clock2.now() + clockSkew2);
}
function clearNow2() {
  clockNow2 = 0;
}
function Timer2() {
  this._call = this._time = this._next = null;
}
function timer2(callback, delay, time) {
  var t = new Timer2;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush2() {
  now2();
  ++frame2;
  var t = taskHead2, e;
  while (t) {
    if ((e = clockNow2 - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame2;
}
function wake2() {
  clockNow2 = (clockLast2 = clock2.now()) + clockSkew2;
  frame2 = timeout22 = 0;
  try {
    timerFlush2();
  } finally {
    frame2 = 0;
    nap2();
    clockNow2 = 0;
  }
}
function poke2() {
  var now22 = clock2.now(), delay = now22 - clockLast2;
  if (delay > pokeDelay2)
    clockSkew2 -= delay, clockLast2 = now22;
}
function nap2() {
  var t0, t1 = taskHead2, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead2 = t2;
    }
  }
  taskTail2 = t0;
  sleep2(time);
}
function sleep2(time) {
  if (frame2)
    return;
  if (timeout22)
    timeout22 = clearTimeout(timeout22);
  var delay = time - clockNow2;
  if (delay > 24) {
    if (time < Infinity)
      timeout22 = setTimeout(wake2, time - clock2.now() - clockSkew2);
    if (interval2)
      interval2 = clearInterval(interval2);
  } else {
    if (!interval2)
      clockLast2 = clock2.now(), interval2 = setInterval(poke2, pokeDelay2);
    frame2 = 1, setFrame2(wake2);
  }
}
function timeout_default2(callback, delay, time) {
  var t = new Timer2;
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
function init2(node2, id2) {
  var schedule5 = get22(node2, id2);
  if (schedule5.state > CREATED2)
    throw new Error("too late; already scheduled");
  return schedule5;
}
function set22(node2, id2) {
  var schedule5 = get22(node2, id2);
  if (schedule5.state > STARTED2)
    throw new Error("too late; already running");
  return schedule5;
}
function get22(node2, id2) {
  var schedule5 = node2.__transition;
  if (!schedule5 || !(schedule5 = schedule5[id2]))
    throw new Error("transition not found");
  return schedule5;
}
function create2(node2, id2, self) {
  var schedules = node2.__transition, tween;
  schedules[id2] = self;
  self.timer = timer2(schedule5, 0, self.time);
  function schedule5(elapsed) {
    self.state = SCHEDULED2;
    self.timer.restart(start2, self.delay, self.time);
    if (self.delay <= elapsed)
      start2(elapsed - self.delay);
  }
  function start2(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED2)
      return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name)
        continue;
      if (o.state === STARTED2)
        return timeout_default2(start2);
      if (o.state === RUNNING2) {
        o.state = ENDED2;
        o.timer.stop();
        o.on.call("interrupt", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id2) {
        o.state = ENDED2;
        o.timer.stop();
        o.on.call("cancel", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default2(function() {
      if (self.state === STARTED2) {
        self.state = RUNNING2;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING2;
    self.on.call("start", node2, node2.__data__, self.index, self.group);
    if (self.state !== STARTING2)
      return;
    self.state = STARTED2;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1;i < n; ++i) {
      if (o = self.tween[i].value.call(node2, node2.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING2, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node2, t);
    }
    if (self.state === ENDING2) {
      self.on.call("end", node2, node2.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED2;
    self.timer.stop();
    delete schedules[id2];
    for (var i in schedules)
      return;
    delete node2.__transition;
  }
}
function schedule_default2(node2, name, id2, index, group, timing) {
  var schedules = node2.__transition;
  if (!schedules)
    node2.__transition = {};
  else if (id2 in schedules)
    return;
  create2(node2, id2, {
    name,
    index,
    group,
    on: emptyOn2,
    tween: emptyTween2,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED2
  });
}
function interrupt_default3(node2, name) {
  var schedules = node2.__transition, schedule6, active, empty3 = true, i;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule6 = schedules[i]).name !== name) {
      empty3 = false;
      continue;
    }
    active = schedule6.state > STARTING2 && schedule6.state < ENDING2;
    schedule6.state = ENDED2;
    schedule6.timer.stop();
    schedule6.on.call(active ? "interrupt" : "cancel", node2, node2.__data__, schedule6.index, schedule6.group);
    delete schedules[i];
  }
  if (empty3)
    delete node2.__transition;
}
function interrupt_default22(name) {
  return this.each(function() {
    interrupt_default3(this, name);
  });
}
function tweenRemove2(id2, name) {
  var tween0, tween1;
  return function() {
    var schedule7 = set22(this, id2), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule7.tween = tween1;
  };
}
function tweenFunction2(id2, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error;
  return function() {
    var schedule7 = set22(this, id2), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n)
        tween1.push(t);
    }
    schedule7.tween = tween1;
  };
}
function tweenValue2(transition, name, value) {
  var id2 = transition._id;
  transition.each(function() {
    var schedule7 = set22(this, id2);
    (schedule7.value || (schedule7.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node2) {
    return get22(node2, id2).value[name];
  };
}
function tween_default2(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get22(this.node(), id2).tween;
    for (var i = 0, n = tween.length, t;i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove2 : tweenFunction2)(id2, name, value));
}
function interpolate_default2(a, b2) {
  var c;
  return (typeof b2 === "number" ? number_default2 : b2 instanceof color2 ? rgb_default2 : (c = color2(b2)) ? (b2 = c, rgb_default2) : string_default2)(a, b2);
}
function attrRemove22(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS22(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant22(name, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrConstantNS22(fullname, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrFunction22(name, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attrFunctionNS22(fullname, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attr_default22(name, value) {
  var fullname = namespace_default2(name), i = fullname === "transform" ? interpolateTransformSvg2 : interpolate_default2;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS22 : attrFunction22)(fullname, i, tweenValue2(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS22 : attrRemove22)(fullname) : (fullname.local ? attrConstantNS22 : attrConstant22)(fullname, i, value));
}
function attrInterpolate2(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS2(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS2(fullname, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolateNS2(fullname, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween2(name, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolate2(name, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween_default2(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  var fullname = namespace_default2(name);
  return this.tween(key, (fullname.local ? attrTweenNS2 : attrTween2)(fullname, value));
}
function delayFunction2(id2, value) {
  return function() {
    init2(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant2(id2, value) {
  return value = +value, function() {
    init2(this, id2).delay = value;
  };
}
function delay_default2(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction2 : delayConstant2)(id2, value)) : get22(this.node(), id2).delay;
}
function durationFunction2(id2, value) {
  return function() {
    set22(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant2(id2, value) {
  return value = +value, function() {
    set22(this, id2).duration = value;
  };
}
function duration_default2(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction2 : durationConstant2)(id2, value)) : get22(this.node(), id2).duration;
}
function easeConstant2(id2, value) {
  if (typeof value !== "function")
    throw new Error;
  return function() {
    set22(this, id2).ease = value;
  };
}
function ease_default2(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant2(id2, value)) : get22(this.node(), id2).ease;
}
function easeVarying2(id2, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function")
      throw new Error;
    set22(this, id2).ease = v;
  };
}
function easeVarying_default2(value) {
  if (typeof value !== "function")
    throw new Error;
  return this.each(easeVarying2(this._id, value));
}
function filter_default22(match) {
  if (typeof match !== "function")
    match = matcher_default2(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node2, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && match.call(node2, node2.__data__, i, group)) {
        subgroup.push(node2);
      }
    }
  }
  return new Transition2(subgroups, this._parents, this._name, this._id);
}
function merge_default22(transition) {
  if (transition._id !== this._id)
    throw new Error;
  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges2 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge4 = merges2[j] = new Array(n), node2, i = 0;i < n; ++i) {
      if (node2 = group0[i] || group1[i]) {
        merge4[i] = node2;
      }
    }
  }
  for (;j < m0; ++j) {
    merges2[j] = groups0[j];
  }
  return new Transition2(merges2, this._parents, this._name, this._id);
}
function start2(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0)
      t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction2(id2, name, listener) {
  var on0, on1, sit = start2(name) ? init2 : set22;
  return function() {
    var schedule12 = sit(this, id2), on5 = schedule12.on;
    if (on5 !== on0)
      (on1 = (on0 = on5).copy()).on(name, listener);
    schedule12.on = on1;
  };
}
function on_default22(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get22(this.node(), id2).on.on(name) : this.each(onFunction2(id2, name, listener));
}
function removeFunction2(id2) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition)
      if (+i !== id2)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default22() {
  return this.on("end.remove", removeFunction2(this._id));
}
function select_default22(select2) {
  var name = this._name, id2 = this._id;
  if (typeof select2 !== "function")
    select2 = selector_default2(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node2, subnode, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && (subnode = select2.call(node2, node2.__data__, i, group))) {
        if ("__data__" in node2)
          subnode.__data__ = node2.__data__;
        subgroup[i] = subnode;
        schedule_default2(subgroup[i], name, id2, i, subgroup, get22(node2, id2));
      }
    }
  }
  return new Transition2(subgroups, this._parents, name, id2);
}
function selectAll_default22(select2) {
  var name = this._name, id2 = this._id;
  if (typeof select2 !== "function")
    select2 = selectorAll_default2(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        for (var children22 = select2.call(node2, node2.__data__, i, group), child, inherit2 = get22(node2, id2), k = 0, l = children22.length;k < l; ++k) {
          if (child = children22[k]) {
            schedule_default2(child, name, id2, k, children22, inherit2);
          }
        }
        subgroups.push(children22);
        parents.push(node2);
      }
    }
  }
  return new Transition2(subgroups, parents, name, id2);
}
function selection_default22() {
  return new Selection22(this._groups, this._parents);
}
function styleNull2(name, interpolate3) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue2(this, name), string1 = (this.style.removeProperty(name), styleValue2(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, string10 = string1);
  };
}
function styleRemove22(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant22(name, interpolate3, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue2(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, value1);
  };
}
function styleFunction22(name, interpolate3, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue2(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue2(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate3(string00 = string0, value1));
  };
}
function styleMaybeRemove2(id2, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove3;
  return function() {
    var schedule15 = set22(this, id2), on5 = schedule15.on, listener = schedule15.value[key] == null ? remove3 || (remove3 = styleRemove22(name)) : undefined;
    if (on5 !== on0 || listener0 !== listener)
      (on1 = (on0 = on5).copy()).on(event, listener0 = listener);
    schedule15.on = on1;
  };
}
function style_default22(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss2 : interpolate_default2;
  return value == null ? this.styleTween(name, styleNull2(name, i)).on("end.style." + name, styleRemove22(name)) : typeof value === "function" ? this.styleTween(name, styleFunction22(name, i, tweenValue2(this, "style." + name, value))).each(styleMaybeRemove2(this._id, name)) : this.styleTween(name, styleConstant22(name, i, value), priority).on("end.style." + name, null);
}
function styleInterpolate2(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween2(name, value, priority) {
  var t, i0;
  function tween3() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t = (i0 = i) && styleInterpolate2(name, i, priority);
    return t;
  }
  tween3._value = value;
  return tween3;
}
function styleTween_default2(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, styleTween2(name, value, priority == null ? "" : priority));
}
function textConstant22(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction22(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default22(value) {
  return this.tween("text", typeof value === "function" ? textFunction22(tweenValue2(this, "text", value)) : textConstant22(value == null ? "" : value + ""));
}
function textInterpolate2(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween2(value) {
  var t0, i0;
  function tween4() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && textInterpolate2(i);
    return t0;
  }
  tween4._value = value;
  return tween4;
}
function textTween_default2(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, textTween2(value));
}
function transition_default3() {
  var name = this._name, id0 = this._id, id1 = newId2();
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        var inherit2 = get22(node2, id0);
        schedule_default2(node2, name, id1, i, group, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease
        });
      }
    }
  }
  return new Transition2(groups, this._parents, name, id1);
}
function end_default2() {
  var on0, on1, that = this, id2 = that._id, size2 = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size2 === 0)
        resolve();
    } };
    that.each(function() {
      var schedule17 = set22(this, id2), on5 = schedule17.on;
      if (on5 !== on0) {
        on1 = (on0 = on5).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule17.on = on1;
    });
    if (size2 === 0)
      resolve();
  });
}
function Transition2(groups, parents, name, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function newId2() {
  return ++id2;
}
function transition22(name) {
  return selection_default3().transition(name);
}
function cubicInOut2(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
function inherit2(node2, id2) {
  var timing;
  while (!(timing = node2.__transition) || !(timing = timing[id2])) {
    if (!(node2 = node2.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default22(name) {
  var id2, timing;
  if (name instanceof Transition2) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId2(), (timing = defaultTiming2).time = now2(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        schedule_default2(node2, name, id2, i, group, timing || inherit2(node2, id2));
      }
    }
  }
  return new Transition2(groups, this._parents, name, id2);
}
function number12(e) {
  return [+e[0], +e[1]];
}
function number222(e) {
  return [number12(e[0]), number12(e[1])];
}
function type32(t) {
  return { type: t };
}
function objectConverter2(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
  }).join(",") + "}");
}
function customConverter2(columns, f) {
  var object = objectConverter2(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}
function inferColumns2(rows) {
  var columnSet = Object.create(null), columns = [];
  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });
  return columns;
}
function pad2(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}
function formatYear2(year) {
  return year < 0 ? "-" + pad2(-year, 6) : year > 9999 ? "+" + pad2(year, 6) : pad2(year, 4);
}
function formatDate2(date) {
  var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), milliseconds = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date" : formatYear2(date.getUTCFullYear(), 4) + "-" + pad2(date.getUTCMonth() + 1, 2) + "-" + pad2(date.getUTCDate(), 2) + (milliseconds ? "T" + pad2(hours, 2) + ":" + pad2(minutes, 2) + ":" + pad2(seconds, 2) + "." + pad2(milliseconds, 3) + "Z" : seconds ? "T" + pad2(hours, 2) + ":" + pad2(minutes, 2) + ":" + pad2(seconds, 2) + "Z" : minutes || hours ? "T" + pad2(hours, 2) + ":" + pad2(minutes, 2) + "Z" : "");
}
function dsv_default2(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
  function parse2(text3, f) {
    var convert, columns, rows = parseRows(text3, function(row, i) {
      if (convert)
        return convert(row, i - 1);
      columns = row, convert = f ? customConverter2(row, f) : objectConverter2(row);
    });
    rows.columns = columns || [];
    return rows;
  }
  function parseRows(text3, f) {
    var rows = [], N = text3.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
    if (text3.charCodeAt(N - 1) === NEWLINE2)
      --N;
    if (text3.charCodeAt(N - 1) === RETURN2)
      --N;
    function token() {
      if (eof)
        return EOF2;
      if (eol)
        return eol = false, EOL2;
      var i, j = I, c;
      if (text3.charCodeAt(j) === QUOTE2) {
        while (I++ < N && text3.charCodeAt(I) !== QUOTE2 || text3.charCodeAt(++I) === QUOTE2)
          ;
        if ((i = I) >= N)
          eof = true;
        else if ((c = text3.charCodeAt(I++)) === NEWLINE2)
          eol = true;
        else if (c === RETURN2) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE2)
            ++I;
        }
        return text3.slice(j + 1, i - 1).replace(/""/g, "\"");
      }
      while (I < N) {
        if ((c = text3.charCodeAt(i = I++)) === NEWLINE2)
          eol = true;
        else if (c === RETURN2) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE2)
            ++I;
        } else if (c !== DELIMITER)
          continue;
        return text3.slice(j, i);
      }
      return eof = true, text3.slice(j, N);
    }
    while ((t = token()) !== EOF2) {
      var row = [];
      while (t !== EOL2 && t !== EOF2)
        row.push(t), t = token();
      if (f && (row = f(row, n++)) == null)
        continue;
      rows.push(row);
    }
    return rows;
  }
  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }
  function format(rows, columns) {
    if (columns == null)
      columns = inferColumns2(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }
  function formatBody(rows, columns) {
    if (columns == null)
      columns = inferColumns2(rows);
    return preformatBody(rows, columns).join("\n");
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }
  function formatValue(value) {
    return value == null ? "" : value instanceof Date ? formatDate2(value) : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\"" : value;
  }
  return {
    parse: parse2,
    parseRows,
    format,
    formatBody,
    formatRows,
    formatRow,
    formatValue
  };
}
function Transform2(k, x, y2) {
  this.k = k;
  this.x = x;
  this.y = y2;
}
function transform2(node2) {
  while (!node2.__zoom)
    if (!(node2 = node2.parentNode))
      return identity22;
  return node2.__zoom;
}
function csvFormats2(header) {
  const _header = typeof header === "string" ? header.split(",") : header;
  return new TransformStream({
    start: (ctrl) => ctrl.enqueue(_header.join(",") + "\n"),
    transform: (chunk, ctrl) => ctrl.enqueue(csvFormatBody2([chunk], _header) + "\n")
  });
}
function csvParses2(header) {
  const _header = typeof header === "string" ? header.split(",") : header;
  let i = 0;
  return throughs2((r) => r.pipeThrough(lines2({ EOL: "LF" })).pipeThrough(skips2(1)).pipeThrough(maps2((line) => csvParse2(_header + "\n" + line)[0])));
}
function tsvFormats2(header) {
  const sep = "\t";
  const _header = typeof header === "string" ? header.split(sep) : header;
  return new TransformStream({
    start: (ctrl) => ctrl.enqueue(_header.join(sep) + "\n"),
    transform: (chunk, ctrl) => ctrl.enqueue(tsvFormatBody2([chunk], _header) + "\n")
  });
}
function tsvParses2(header) {
  const _header = typeof header === "string" ? header.split("\t") : header;
  let i = 0;
  return throughs2((r) => r.pipeThrough(lines2({ EOL: "LF" })).pipeThrough(skips2(1)).pipeThrough(maps2((line) => tsvParse2(_header + "\n" + line)[0])));
}
function _byLazy2(r, t) {
  const reader = r.getReader();
  const tw = t.writable.getWriter();
  const tr = t.readable.getReader();
  return sflow2(new ReadableStream({
    start: async (ctrl) => {
      (async function() {
        while (true) {
          const { done, value } = await tr.read();
          if (done)
            return ctrl.close();
          ctrl.enqueue(value);
        }
      })();
    },
    pull: async (ctrl) => {
      const { done, value } = await reader.read();
      if (done)
        return tw.close();
      await tw.write(value);
    },
    cancel: async (r2) => {
      reader.cancel(r2);
      tr.cancel(r2);
    }
  }, { highWaterMark: 0 }));
}
function sfTemplate(tsa, ...args) {
  return sflow2(...tsa.map((str) => [sflow2([str]), args.shift() || []]).flat());
}
var __create3 = Object.create;
var __getProtoOf3 = Object.getPrototypeOf;
var __defProp3 = Object.defineProperty;
var __getOwnPropNames3 = Object.getOwnPropertyNames;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __toESM3 = (mod, isNodeMode, target) => {
  target = mod != null ? __create3(__getProtoOf3(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp3(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames3(mod))
    if (!__hasOwnProp3.call(to, key))
      __defProp3(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS3 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_src2 = __commonJS3((exports, module) => {
  var unwind = (dataObject, options) => {
    const unwindRecursive = (dataObject2, path, currPath) => {
      const pathArr = path.split(".");
      if (!currPath) {
        currPath = pathArr[0];
      }
      const result = [];
      let added = false;
      const addObject = (objectTempUnwind, objectKey) => {
        Object.keys(objectTempUnwind).forEach((objectTempUnwindKey) => {
          const newObjectCopy = {};
          Object.keys(dataObject2).forEach((dataObjectKey) => {
            newObjectCopy[dataObjectKey] = dataObject2[dataObjectKey];
          });
          newObjectCopy[objectKey] = objectTempUnwind[objectTempUnwindKey];
          added = true;
          result.push(newObjectCopy);
        });
      };
      Object.keys(dataObject2).forEach((objectKey) => {
        if (currPath === objectKey) {
          if (dataObject2[objectKey] instanceof Array) {
            if (dataObject2[objectKey].length === 0 && options.preserveEmptyArray !== true) {
              delete dataObject2[objectKey];
            } else {
              Object.keys(dataObject2[objectKey]).forEach((objectElementKey) => {
                addObject(unwindRecursive(dataObject2[objectKey][objectElementKey], path.replace(`${currPath}.`, "")), objectKey);
              });
            }
          } else {
            addObject(unwindRecursive(dataObject2[objectKey], path.replace(`${currPath}.`, "")), objectKey);
          }
        }
      });
      if (!added) {
        result.push(dataObject2);
      }
      return result;
    };
    return unwindRecursive(dataObject, options.path);
  };
  module.exports = { unwind };
});
var main_default2 = DIE2;
var asyncMaps2 = (fn, options = {}) => {
  let i = 0;
  let tasks = new Map;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const id2 = i++;
      tasks.set(id2, async function() {
        return fn(chunk, id2);
      }().then((data) => ({ id: id2, data })));
      if (tasks.size >= (options.concurrency ?? Infinity)) {
        const { id: id22, data } = await Promise.race(tasks.values());
        tasks.delete(id22);
        ctrl.enqueue(data);
      }
    },
    flush: async (ctrl) => {
      while (tasks.size) {
        const { id: id2, data } = await Promise.race(tasks.values());
        tasks.delete(id2);
        ctrl.enqueue(data);
      }
    }
  });
};
var never2 = () => new Promise(() => null);
var cloneList = (list) => Array.prototype.slice.call(list);
var { isArray: isArray2 } = Array;

class Gate2 {
  _count;
  _queue = [];
  constructor(_count) {
    this._count = _count;
  }
  async wait() {
    if (this._count > 0) {
      --this._count;
      return Promise.resolve();
    }
    return new Promise((r) => {
      let cb = () => {
        this._queue.splice(this._queue.indexOf(cb), 1);
        --this._count;
        r();
      };
      this._queue.push(cb);
    });
  }
  increment() {
    ++this._count;
    this.clearQueue();
  }
  setCount(count) {
    this._count = count;
    this.clearQueue();
  }
  clearQueue() {
    while (this._count > 0 && this._queue.length > 0) {
      this._queue.shift()();
    }
  }
}

class BlockingQueue2 {
  _pushers = [];
  _pullers = [];
  constructor() {
  }
  async push(value) {
    return new Promise((r) => {
      this._pushers.unshift(() => {
        r();
        return value;
      });
      this.dequeue();
    });
  }
  async pull() {
    return new Promise((r) => {
      this._pullers.unshift((value) => {
        r(value);
      });
      this.dequeue();
    });
  }
  dequeue() {
    while (this._pullers.length > 0 && this._pushers.length > 0) {
      let puller = this._pullers.pop();
      let pusher = this._pushers.pop();
      puller(pusher());
    }
  }
}

class Subscribable2 {
  closed = false;
  subscribers = [];
  subscribe(cb) {
    let self = this;
    self.subscribers.push(cb);
    let _closed = false;
    return {
      get closed() {
        return _closed || self.closed;
      },
      unsubscribe() {
        let index = self.subscribers.findIndex((x) => x === cb);
        if (index >= 0) {
          self.subscribers.splice(index, 1);
        }
        _closed = true;
      }
    };
  }
  next(value) {
    return Math.min(...this.subscribers.map((x) => x.next(value)));
  }
  complete() {
    for (let sub of this.subscribers) {
      sub.complete();
    }
    this.subscribers = [];
    this.closed = true;
  }
  error(err) {
    for (let sub of this.subscribers) {
      sub.error(err);
    }
    this.subscribers = [];
    this.closed = true;
  }
}

class Subject2 {
  _subscribable = new Subscribable2;
  _closingResolve;
  _closing = new Promise((r) => this._closingResolve = r);
  get closed() {
    return this._subscribable.closed;
  }
  get readable() {
    let self = this;
    let subscription;
    let cancelled = false;
    return new ReadableStream({
      async start(controller) {
        subscription = self.subscribe({
          next: (value) => {
            if (cancelled)
              return;
            controller.enqueue(value);
            return controller.desiredSize;
          },
          complete: () => {
            controller.close();
          },
          error: (err) => {
            controller.error(err);
          }
        });
      },
      cancel() {
        cancelled = true;
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });
  }
  get writable() {
    const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
    const self = this;
    let stream = new WritableStream({
      write(chunk, controller) {
        if (self.closed && controller.signal.aborted == false) {
          controller.error();
          return;
        }
        if (controller.signal.aborted) {
          self._error(controller.signal.reason);
          return;
        }
        self._next(chunk);
      },
      close() {
        self._complete();
      },
      abort(reason) {
        self._error(reason);
      }
    }, queuingStrategy);
    this._closing.then((_2) => {
      if (stream.locked == false) {
        stream.close();
      }
    });
    return stream;
  }
  subscribe(cb) {
    let subscription = this._subscribable.subscribe(cb);
    return subscription;
  }
  _next(value) {
    return this._subscribable.next(value);
  }
  _complete() {
    this._subscribable.complete();
  }
  _error(err) {
    this._subscribable.error(err);
  }
  async next(value) {
    return this._next(value);
  }
  async complete() {
    this._closingResolve(undefined);
    return this._complete();
  }
  async error(err) {
    this._closingResolve(undefined);
    return this._error(err);
  }
}
var toStream2 = (src) => src instanceof ReadableStream ? src : from2(src);
var concats2 = (srcs) => {
  if (!srcs)
    return new TransformStream;
  const upstream = new TransformStream;
  return {
    writable: upstream.writable,
    readable: concatStream([upstream.readable, concatStream(srcs)])
  };
};
var concatStream = (srcs) => {
  if (!srcs)
    return new ReadableStream({ start: (c) => c.close() });
  const t = new TransformStream;
  const w = t.writable.getWriter();
  toStream2(srcs).pipeThrough(maps2(toStream2)).pipeThrough(maps2(async (s) => {
    const r = s.getReader();
    while (true) {
      const { value, done } = await r.read();
      if (done)
        break;
      await w.write(value);
    }
  })).pipeTo(nils2()).then(() => w.close()).catch((reason) => w.abort(reason));
  return t.readable;
};
var confluences2 = ({
  order = "breadth"
} = {}) => {
  const baseError = new Error;
  if (order !== "breadth")
    main_default2("not implemented");
  const { writable, readable: sources } = new TransformStream;
  const srcsQueue = [];
  const readable = new ReadableStream({
    async pull(ctrl) {
      while (true) {
        const src = await async function() {
          const r2 = sources.getReader();
          const { done: done2, value: src2 } = await r2.read();
          r2.releaseLock();
          if (done2)
            return srcsQueue.shift();
          return src2;
        }();
        if (!src)
          return ctrl.close();
        const r = src.getReader();
        const { done, value } = await r.read();
        r.releaseLock();
        if (done)
          continue;
        srcsQueue.push(src);
        ctrl.enqueue(value);
        return;
      }
    }
  });
  return { writable, readable };
};
var filters2 = (fn) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (fn) {
        const shouldEnqueue = await fn(chunk, i++);
        if (shouldEnqueue)
          ctrl.enqueue(chunk);
      } else {
        const isNull = chunk === undefined || chunk === null;
        if (!isNull)
          ctrl.enqueue(chunk);
      }
    }
  });
};
var throughs2 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs2((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: fn(readable) };
};
var lines2 = ({ EOL: EOL2 = "KEEP" } = {}) => {
  const CRLFMap = {
    KEEP: "$1",
    LF: "\n",
    CRLF: "\r\n",
    NONE: ""
  };
  return throughs2((r) => r.pipeThrough(flatMaps2((s) => s.split(/(?<=\n)/g))).pipeThrough(chunkIfs2((ch) => ch.indexOf("\n") === -1, { inclusive: true })).pipeThrough(maps2((chunks22) => chunks22.join("").replace(/(\r?\n?)$/, CRLFMap[EOL2]))));
};
var bys2 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return bys2((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: fn(readable) };
};
var wseMerges2 = merge2;
var parallels2 = (...srcs) => wseMerges2()(from2(srcs));
var merges2 = (...srcs) => {
  if (!srcs.length)
    return new TransformStream;
  const upstream = new TransformStream;
  return {
    writable: upstream.writable,
    readable: parallels2(upstream.readable, ...srcs.map(toStream2))
  };
};
var mergeStream2 = (...srcs) => {
  if (!srcs.length)
    return new ReadableStream({ start: (c) => c.close() });
  if (srcs.length === 1)
    return toStream2(srcs[0]);
  const t = new TransformStream;
  const w = t.writable.getWriter();
  const streams = srcs.map(toStream2);
  Promise.all(streams.map(async (s) => {
    for await (const chunk of Object.assign(s, {
      [Symbol.asyncIterator]: streamAsyncIterator2
    }))
      await w.write(chunk);
  })).then(async () => w.close()).catch((error) => {
    console.error(error);
    return Promise.all([
      t.writable.abort(error),
      ...streams.map((e) => e.cancel(error))
    ]);
  });
  return t.readable;
};
var emptyStream = () => new ReadableStream({ start: (c) => c.close() });
var pMaps2 = (fn, options = {}) => {
  let i = 0;
  let promises = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      promises.push(fn(chunk, i++));
      if (promises.length >= (options.concurrency ?? Infinity))
        ctrl.enqueue(await promises.shift());
    },
    flush: async (ctrl) => {
      while (promises.length)
        ctrl.enqueue(await promises.shift());
    }
  });
};
var reduceEmits2 = (fn, _state) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const { next, emit } = await fn(_state, chunk, i++);
      _state = next;
      ctrl.enqueue(emit);
    }
  });
};
var reduces2 = (fn, state) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const ret = fn(state, chunk, i++);
      const val = ret instanceof Promise ? await ret : ret;
      state = await val;
      ctrl.enqueue(state);
    }
  });
};
var matchs2 = (matcher) => {
  return new TransformStream({
    transform: (chunk, ctrl) => ctrl.enqueue(chunk.match(matcher))
  });
};
var matchAlls2 = (matcher) => {
  return new TransformStream({
    transform: (chunk, ctrl) => ctrl.enqueue(chunk.matchAll(matcher))
  });
};
var replaces2 = (searchValue, replacement) => {
  return maps2((s) => typeof replacement === "string" ? s.replace(searchValue, replacement) : replaceAsync2(s, searchValue, replacement));
};
var replaceAlls2 = (searchValue, replacement) => {
  return maps2((s) => typeof replacement === "string" ? s.replaceAll(searchValue, replacement) : replaceAsync2(s, searchValue, replacement));
};
var tees2 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees2((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(a);
  return { writable, readable: b2 };
};
var uniqs2 = () => {
  const set4 = new Set;
  return throughs2((s) => s.pipeThrough(filters2((x) => {
    if (set4.has(x))
      return false;
    set4.add(x);
    return true;
  })));
};
var uniqBys2 = (keyFn) => {
  const set4 = new Set;
  return throughs2((s) => s.pipeThrough(filters2(async (x) => {
    const key = await keyFn(x);
    if (set4.has(key))
      return false;
    set4.add(key);
    return true;
  })));
};
var import_unwind_array2 = __toESM3(require_src2(), 1);
var noop2 = { value: () => {
} };
Dispatch2.prototype = dispatch2.prototype = {
  constructor: Dispatch2,
  on: function(typename, callback) {
    var _2 = this._, T2 = parseTypenames3(typename + "", _2), t, i = -1, n = T2.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T2[i]).type) && (t = get3(_2[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T2[i]).type)
        _2[t] = set3(_2[t], typename.name, callback);
      else if (callback == null)
        for (t in _2)
          _2[t] = set3(_2[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _2 = this._;
    for (var t in _2)
      copy[t] = _2[t].slice();
    return new Dispatch2(copy);
  },
  call: function(type33, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type33))
      throw new Error("unknown type: " + type33);
    for (t = this._[type33], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type33, that, args) {
    if (!this._.hasOwnProperty(type33))
      throw new Error("unknown type: " + type33);
    for (var t = this._[type33], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
var dispatch_default3 = dispatch2;
var xhtml2 = "http://www.w3.org/1999/xhtml";
var namespaces_default2 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml2,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
var find2 = Array.prototype.find;
var filter22 = Array.prototype.filter;
EnterNode2.prototype = {
  constructor: EnterNode2,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector2) {
    return this._parent.querySelector(selector2);
  },
  querySelectorAll: function(selector2) {
    return this._parent.querySelectorAll(selector2);
  }
};
ClassList2.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
var root2 = [null];
Selection3.prototype = selection2.prototype = {
  constructor: Selection3,
  select: select_default3,
  selectAll: selectAll_default3,
  selectChild: selectChild_default2,
  selectChildren: selectChildren_default2,
  filter: filter_default3,
  data: data_default2,
  enter: enter_default2,
  exit: exit_default2,
  join: join_default2,
  merge: merge_default3,
  selection: selection_selection2,
  order: order_default2,
  sort: sort_default2,
  call: call_default2,
  nodes: nodes_default2,
  node: node_default2,
  size: size_default2,
  empty: empty_default2,
  each: each_default2,
  attr: attr_default3,
  style: style_default3,
  property: property_default2,
  classed: classed_default2,
  text: text_default3,
  html: html_default2,
  raise: raise_default2,
  lower: lower_default2,
  append: append_default2,
  insert: insert_default2,
  remove: remove_default3,
  clone: clone_default2,
  datum: datum_default2,
  on: on_default3,
  dispatch: dispatch_default22,
  [Symbol.iterator]: iterator_default2
};
var selection_default3 = selection2;
var darker2 = 0.7;
var brighter2 = 1 / darker2;
var reI2 = "\\s*([+-]?\\d+)\\s*";
var reN2 = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP2 = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex2 = /^#([0-9a-f]{3,8})$/;
var reRgbInteger2 = new RegExp(`^rgb\\(${reI2},${reI2},${reI2}\\)$`);
var reRgbPercent2 = new RegExp(`^rgb\\(${reP2},${reP2},${reP2}\\)$`);
var reRgbaInteger2 = new RegExp(`^rgba\\(${reI2},${reI2},${reI2},${reN2}\\)$`);
var reRgbaPercent2 = new RegExp(`^rgba\\(${reP2},${reP2},${reP2},${reN2}\\)$`);
var reHslPercent2 = new RegExp(`^hsl\\(${reN2},${reP2},${reP2}\\)$`);
var reHslaPercent2 = new RegExp(`^hsla\\(${reN2},${reP2},${reP2},${reN2}\\)$`);
var named2 = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default2(Color2, color2, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex2,
  formatHex: color_formatHex2,
  formatHex8: color_formatHex82,
  formatHsl: color_formatHsl2,
  formatRgb: color_formatRgb2,
  toString: color_formatRgb2
});
define_default2(Rgb2, rgb2, extend2(Color2, {
  brighter(k) {
    k = k == null ? brighter2 : Math.pow(brighter2, k);
    return new Rgb2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker2 : Math.pow(darker2, k);
    return new Rgb2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb2(clampi2(this.r), clampi2(this.g), clampi2(this.b), clampa2(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex2,
  formatHex: rgb_formatHex2,
  formatHex8: rgb_formatHex82,
  formatRgb: rgb_formatRgb2,
  toString: rgb_formatRgb2
}));
define_default2(Hsl2, hsl2, extend2(Color2, {
  brighter(k) {
    k = k == null ? brighter2 : Math.pow(brighter2, k);
    return new Hsl2(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker2 : Math.pow(darker2, k);
    return new Hsl2(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb2(hsl2rgb2(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m2), hsl2rgb2(h2, m1, m2), hsl2rgb2(h2 < 120 ? h2 + 240 : h2 - 120, m1, m2), this.opacity);
  },
  clamp() {
    return new Hsl2(clamph2(this.h), clampt2(this.s), clampt2(this.l), clampa2(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa2(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph2(this.h)}, ${clampt2(this.s) * 100}%, ${clampt2(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
var constant_default22 = (x) => () => x;
var rgb_default2 = function rgbGamma2(y2) {
  var color3 = gamma2(y2);
  function rgb22(start3, end) {
    var r = color3((start3 = rgb2(start3)).r, (end = rgb2(end)).r), g = color3(start3.g, end.g), b2 = color3(start3.b, end.b), opacity = nogamma2(start3.opacity, end.opacity);
    return function(t) {
      start3.r = r(t);
      start3.g = g(t);
      start3.b = b2(t);
      start3.opacity = opacity(t);
      return start3 + "";
    };
  }
  rgb22.gamma = rgbGamma2;
  return rgb22;
}(1);
var rgbBasis2 = rgbSpline2(basis_default2);
var rgbBasisClosed2 = rgbSpline2(basisClosed_default2);
var reA2 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB2 = new RegExp(reA2.source, "g");
var degrees2 = 180 / Math.PI;
var identity3 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
var svgNode2;
var interpolateTransformCss2 = interpolateTransform2(parseCss2, "px, ", "px)", "deg)");
var interpolateTransformSvg2 = interpolateTransform2(parseSvg2, ", ", ")", ")");
var frame2 = 0;
var timeout22 = 0;
var interval2 = 0;
var pokeDelay2 = 1000;
var taskHead2;
var taskTail2;
var clockLast2 = 0;
var clockNow2 = 0;
var clockSkew2 = 0;
var clock2 = typeof performance === "object" && performance.now ? performance : Date;
var setFrame2 = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
Timer2.prototype = timer2.prototype = {
  constructor: Timer2,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now2() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail2 !== this) {
      if (taskTail2)
        taskTail2._next = this;
      else
        taskHead2 = this;
      taskTail2 = this;
    }
    this._call = callback;
    this._time = time;
    sleep2();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep2();
    }
  }
};
var emptyOn2 = dispatch_default3("start", "end", "cancel", "interrupt");
var emptyTween2 = [];
var CREATED2 = 0;
var SCHEDULED2 = 1;
var STARTING2 = 2;
var STARTED2 = 3;
var RUNNING2 = 4;
var ENDING2 = 5;
var ENDED2 = 6;
var Selection22 = selection_default3.prototype.constructor;
var id2 = 0;
var selection_prototype2 = selection_default3.prototype;
Transition2.prototype = transition22.prototype = {
  constructor: Transition2,
  select: select_default22,
  selectAll: selectAll_default22,
  selectChild: selection_prototype2.selectChild,
  selectChildren: selection_prototype2.selectChildren,
  filter: filter_default22,
  merge: merge_default22,
  selection: selection_default22,
  transition: transition_default3,
  call: selection_prototype2.call,
  nodes: selection_prototype2.nodes,
  node: selection_prototype2.node,
  size: selection_prototype2.size,
  empty: selection_prototype2.empty,
  each: selection_prototype2.each,
  on: on_default22,
  attr: attr_default22,
  attrTween: attrTween_default2,
  style: style_default22,
  styleTween: styleTween_default2,
  text: text_default22,
  textTween: textTween_default2,
  remove: remove_default22,
  tween: tween_default2,
  delay: delay_default2,
  duration: duration_default2,
  ease: ease_default2,
  easeVarying: easeVarying_default2,
  end: end_default2,
  [Symbol.iterator]: selection_prototype2[Symbol.iterator]
};
var defaultTiming2 = {
  time: null,
  delay: 0,
  duration: 250,
  ease: cubicInOut2
};
selection_default3.prototype.interrupt = interrupt_default22;
selection_default3.prototype.transition = transition_default22;
var X2 = {
  name: "x",
  handles: ["w", "e"].map(type32),
  input: function(x, e) {
    return x == null ? null : [[+x[0], e[0][1]], [+x[1], e[1][1]]];
  },
  output: function(xy) {
    return xy && [xy[0][0], xy[1][0]];
  }
};
var Y2 = {
  name: "y",
  handles: ["n", "s"].map(type32),
  input: function(y2, e) {
    return y2 == null ? null : [[e[0][0], +y2[0]], [e[1][0], +y2[1]]];
  },
  output: function(xy) {
    return xy && [xy[0][1], xy[1][1]];
  }
};
var XY2 = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type32),
  input: function(xy) {
    return xy == null ? null : number222(xy);
  },
  output: function(xy) {
    return xy;
  }
};
var EOL2 = {};
var EOF2 = {};
var QUOTE2 = 34;
var NEWLINE2 = 10;
var RETURN2 = 13;
var csv2 = dsv_default2(",");
var csvParse2 = csv2.parse;
var csvParseRows2 = csv2.parseRows;
var csvFormat2 = csv2.format;
var csvFormatBody2 = csv2.formatBody;
var csvFormatRows2 = csv2.formatRows;
var csvFormatRow2 = csv2.formatRow;
var csvFormatValue2 = csv2.formatValue;
var tsv2 = dsv_default2("\t");
var tsvParse2 = tsv2.parse;
var tsvParseRows2 = tsv2.parseRows;
var tsvFormat2 = tsv2.format;
var tsvFormatBody2 = tsv2.formatBody;
var tsvFormatRows2 = tsv2.formatRows;
var tsvFormatRow2 = tsv2.formatRow;
var tsvFormatValue2 = tsv2.formatValue;
Transform2.prototype = {
  constructor: Transform2,
  scale: function(k) {
    return k === 1 ? this : new Transform2(this.k * k, this.x, this.y);
  },
  translate: function(x, y2) {
    return x === 0 & y2 === 0 ? this : new Transform2(this.k, this.x + this.k * x, this.y + this.k * y2);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y2) {
    return y2 * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity22 = new Transform2(1, 0, 0);
transform2.prototype = Transform2.prototype;
var sflow2 = (...srcs) => {
  const r = srcs.length === 1 ? toStream2(srcs[0]) : concatStream(srcs);
  return Object.assign(r, {
    _type: null,
    get readable() {
      return r;
    },
    through: (...args) => sflow2(r.pipeThrough(_throughs2(...args))),
    by: (...args) => sflow2(r.pipeThrough(_throughs2(...args))),
    byLazy: (t) => _byLazy2(r, t),
    mapAddField: (...args) => sflow2(r.pipeThrough(mapAddFields2(...args))),
    cacheSkip: (...args) => sflow2(r).byLazy(cacheSkips2(...args)),
    cacheList: (...args) => sflow2(r).byLazy(cacheLists2(...args)),
    cacheTail: (...args) => sflow2(r).byLazy(cacheTails2(...args)),
    chunkBy: (...args) => sflow2(r.pipeThrough(chunkBys2(...args))),
    chunkIf: (...args) => sflow2(r.pipeThrough(chunkIfs2(...args))),
    buffer: (...args) => sflow2(r.pipeThrough(chunks2(...args))),
    chunk: (...args) => sflow2(r.pipeThrough(chunks2(...args))),
    convolve: (...args) => sflow2(r.pipeThrough(convolves2(...args))),
    abort: (...args) => sflow2(r.pipeThrough(terminates2(...args))),
    chunkInterval: (...args) => sflow2(r.pipeThrough(chunkIntervals2(...args))),
    interval: (...args) => sflow2(r.pipeThrough(chunkIntervals2(...args))),
    debounce: (...args) => sflow2(r.pipeThrough(debounces2(...args))),
    filter: (...args) => sflow2(r.pipeThrough(filters2(...args))),
    flatMap: (...args) => sflow2(r.pipeThrough(flatMaps2(...args))),
    flat: (...args) => sflow2(r).byLazy(flats2(...args)),
    join: (...args) => sflow2(r.pipeThrough(riffles2(...args))),
    match: (...args) => sflow2(r.pipeThrough(matchs2(...args))),
    matchAll: (...args) => sflow2(r.pipeThrough(matchAlls2(...args))),
    replace: (...args) => sflow2(r.pipeThrough(replaces2(...args))),
    replaceAll: (...args) => sflow2(r.pipeThrough(replaceAlls2(...args))),
    merge: (...args) => sflow2(r.pipeThrough(merges2(...args))),
    concat: (srcs2) => sflow2(r.pipeThrough(concats2(srcs2))),
    confluence: (...args) => sflow2(r.pipeThrough(confluences2(...args))),
    confluenceByZip: () => sflow2(r).by(confluences2()),
    confluenceByConcat: () => sflow2(r).by((srcs2) => concatStream(srcs2)),
    confluenceByParallel: () => sflow2(r).by((srcs2) => sflow2(srcs2).toArray().then((srcs3) => mergeStream2(...srcs3))).confluence(),
    confluenceByAscend: (ordFn) => sflow2(r).chunk().map((srcs2) => mergeStreamsByAscend(ordFn, srcs2)).confluence(),
    confluenceByDescend: (ordFn) => sflow2(r).chunk().map((srcs2) => mergeStreamsByDescend(ordFn, srcs2)).confluence(),
    limit: (...args) => sflow2(r).byLazy(limits2(...args)),
    head: (...args) => sflow2(r.pipeThrough(heads2(...args))),
    map: (...args) => sflow2(r.pipeThrough(maps2(...args))),
    log: (...args) => sflow2(r.pipeThrough(logs2(...args))),
    uniq: (...args) => sflow2(r.pipeThrough(uniqs2(...args))),
    uniqBy: (...args) => sflow2(r.pipeThrough(uniqBys2(...args))),
    unwind: (...args) => sflow2(r.pipeThrough(unwinds2(...args))),
    asyncMap: (...args) => sflow2(r.pipeThrough(asyncMaps2(...args))),
    pMap: (...args) => sflow2(r.pipeThrough(pMaps2(...args))),
    peek: (...args) => sflow2(r.pipeThrough(peeks2(...args))),
    riffle: (...args) => sflow2(r.pipeThrough(riffles2(...args))),
    forEach: (...args) => sflow2(r.pipeThrough(forEachs2(...args))),
    reduce: (...args) => sflow2(r.pipeThrough(reduces2(...args))),
    reduceEmit: (...args) => sflow2(r.pipeThrough(reduceEmits2(...args))),
    skip: (...args) => sflow2(r.pipeThrough(skips2(...args))),
    slice: (...args) => sflow2(r.pipeThrough(slices2(...args))),
    tail: (...args) => sflow2(r.pipeThrough(tails2(...args))),
    tees: (...args) => sflow2(r.pipeThrough(_tees2(...args))),
    throttle: (...args) => sflow2(r.pipeThrough(throttles2(...args))),
    csvFormat: (...args) => sflow2(r.pipeThrough(csvFormats2(...args))),
    tsvFormat: (...args) => sflow2(r.pipeThrough(tsvFormats2(...args))),
    csvParse: (...args) => sflow2(r.pipeThrough(csvParses2(...args))),
    tsvParse: (...args) => sflow2(r.pipeThrough(tsvParses2(...args))),
    preventAbort: () => sflow2(r.pipeThrough(throughs2(), { preventAbort: true })),
    preventClose: () => sflow2(r.pipeThrough(throughs2(), { preventClose: true })),
    preventCancel: () => sflow2(r.pipeThrough(throughs2(), { preventCancel: true })),
    onStart: (start22) => sflow2(r).by(new TransformStream({ start: start22 })),
    onTransform: (transform3) => sflow2(r).by(new TransformStream({ transform: transform3 })),
    onFlush: (flush) => sflow2(r).by(new TransformStream({ flush })),
    done: () => r.pipeTo(nils2()),
    end: (dst = nils2()) => r.pipeTo(dst),
    to: (dst = nils2()) => r.pipeTo(dst),
    run: () => r.pipeTo(nils2()),
    toEnd: () => r.pipeTo(nils2()),
    toNil: () => r.pipeTo(nils2()),
    toArray: () => toArray2(r),
    toCount: async () => {
      let i = 0;
      const d = r.getReader();
      while (!(await d.read()).done)
        i++;
      return i;
    },
    toFirst: () => toPromise2(sflow2(r).limit(1, { terminate: true })),
    toLast: () => toPromise2(sflow2(r).tail(1)),
    toExactlyOne: async () => {
      const a = await toArray2(r);
      if (a.length > 1)
        main_default2(`Expect only 1 Item, but got ${a.length}`);
      return a[0];
    },
    toOne: async () => {
      const a = await toArray2(r);
      if (a.length > 1)
        main_default2(`Expect only 1 Item, but got ${a.length}`);
      return a[0];
    },
    toAtLeastOne: async () => {
      const a = await toArray2(r);
      if (a.length > 1)
        main_default2(`Expect only 1 Item, but got ${a.length}`);
      if (a.length < 1)
        main_default2(`Expect at least 1 Item, but got ${a.length}`);
      return a[0];
    },
    toLog: (...args) => sflow2(r.pipeThrough(logs2(...args))).done(),
    lines: (...args) => sflow2(r.pipeThrough(lines2(...args))),
    toResponse: (init22) => new Response(r, init22),
    text: (init22) => new Response(r, init22).text(),
    json: (init22) => new Response(r, init22).json(),
    blob: (init22) => new Response(r, init22).blob(),
    arrayBuffer: (init22) => new Response(r, init22).arrayBuffer(),
    [Symbol.asyncIterator]: streamAsyncIterator2
  });
};
var _tees2 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees2((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(sflow2(a));
  return { writable, readable: b2 };
};
var _throughs2 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs2((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: sflow2(fn(sflow2(readable))) };
};

class PolyfillTextDecoderStream2 extends TransformStream {
  encoding;
  fatal;
  ignoreBOM;
  constructor(encoding = "utf-8", {
    fatal = false,
    ignoreBOM = false
  } = {}) {
    const decoder = new TextDecoder(encoding, { fatal, ignoreBOM });
    super({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          controller.enqueue(chunk);
          return;
        }
        const decoded = decoder.decode(chunk);
        if (decoded.length > 0) {
          controller.enqueue(decoded);
        }
      },
      flush(controller) {
        const output = decoder.decode();
        if (output.length > 0) {
          controller.enqueue(output);
        }
      }
    });
    this.encoding = encoding;
    this.fatal = fatal;
    this.ignoreBOM = ignoreBOM;
  }
}

class PolyfillTextEncoderStream2 {
  _encoder = new TextEncoder;
  _reader = null;
  ready = Promise.resolve();
  closed = false;
  readable = new ReadableStream({
    start: (controller) => {
      this._reader = controller;
    }
  });
  writable = new WritableStream({
    write: async (chunk) => {
      if (typeof chunk !== "string") {
        this._reader.enqueue(chunk);
        return;
      }
      if (chunk != null && this._reader) {
        const encoded = this._encoder.encode(chunk);
        this._reader.enqueue(encoded);
      }
    },
    close: () => {
      this._reader?.close();
      this.closed = true;
    },
    abort: (reason) => {
      this._reader?.error(reason);
      this.closed = true;
    }
  });
}
var sfT = sfTemplate;
var main_default22 = sflow2;

// node_modules/sflow/dist/fromNodeStream.js
function curry(fn, args = []) {
  return (..._args) => ((rest) => rest.length >= fn.length ? fn(...rest) : curry(fn, rest))([...args, ..._args]);
}
function adjustFn(index, replaceFn, list) {
  const actualIndex = index < 0 ? list.length + index : index;
  if (index >= list.length || actualIndex < 0)
    return list;
  const clone = cloneList2(list);
  clone[actualIndex] = replaceFn(clone[actualIndex]);
  return clone;
}
function always(x) {
  return (_2) => x;
}
function assocFn(prop, newValue, obj) {
  return Object.assign({}, obj, {
    [prop]: newValue
  });
}
function _isInteger(n) {
  return n << 0 === n;
}
function createPath(path, delimiter = ".") {
  return typeof path === "string" ? path.split(delimiter).map((x) => isInteger(x) ? Number(x) : x) : path;
}
function assocPathFn(path, newValue, input) {
  const pathArrValue = createPath(path);
  if (pathArrValue.length === 0)
    return newValue;
  const index = pathArrValue[0];
  if (pathArrValue.length > 1) {
    const condition = typeof input !== "object" || input === null || !input.hasOwnProperty(index);
    const nextInput = condition ? isIndexInteger(pathArrValue[1]) ? [] : {} : input[index];
    newValue = assocPathFn(Array.prototype.slice.call(pathArrValue, 1), newValue, nextInput);
  }
  if (isIndexInteger(index) && isArray3(input)) {
    const arr = cloneList2(input);
    arr[index] = newValue;
    return arr;
  }
  return assocFn(index, newValue, input);
}
function clampFn(min, max, input) {
  if (min > max) {
    throw new Error("min must not be greater than max in clamp(min, max, value)");
  }
  if (input >= min && input <= max)
    return input;
  if (input > max)
    return max;
  if (input < min)
    return min;
}
function clone(input) {
  const out = isArray3(input) ? Array(input.length) : {};
  if (input && input.getTime)
    return new Date(input.getTime());
  for (const key in input) {
    const v = input[key];
    out[key] = typeof v === "object" && v !== null ? v.getTime ? new Date(v.getTime()) : clone(v) : v;
  }
  return out;
}
function reduceFn(reducer, acc, list) {
  if (list == null) {
    return acc;
  }
  if (!isArray3(list)) {
    throw new TypeError("reduce: list must be array or iterable");
  }
  let index = 0;
  const len = list.length;
  while (index < len) {
    acc = reducer(acc, list[index], index, list);
    if (acc instanceof ReduceStopper) {
      return acc.value;
    }
    index++;
  }
  return acc;
}
function isFalsy(input) {
  return input === undefined || input === null || Number.isNaN(input) === true;
}
function defaultTo(defaultArgument, input) {
  if (arguments.length === 1) {
    return (_input) => defaultTo(defaultArgument, _input);
  }
  return isFalsy(input) ? defaultArgument : input;
}
function type4(input) {
  if (input === null) {
    return "Null";
  } else if (input === undefined) {
    return "Undefined";
  } else if (Number.isNaN(input)) {
    return "NaN";
  }
  const typeResult = Object.prototype.toString.call(input).slice(8, -1);
  return typeResult === "AsyncFunction" ? "Promise" : typeResult;
}
function _indexOf3(valueToFind, list) {
  if (!isArray3(list))
    throw new Error(`Cannot read property 'indexOf' of ${list}`);
  const typeOfValue = type4(valueToFind);
  if (!["Array", "NaN", "Object", "RegExp"].includes(typeOfValue))
    return list.indexOf(valueToFind);
  let index = -1;
  let foundIndex = -1;
  const {
    length
  } = list;
  while (++index < length && foundIndex === -1)
    if (equals3(list[index], valueToFind))
      foundIndex = index;
  return foundIndex;
}
function _arrayFromIterator3(iter) {
  const list = [];
  let next;
  while (!(next = iter.next()).done)
    list.push(next.value);
  return list;
}
function _compareSets3(a, b2) {
  if (a.size !== b2.size)
    return false;
  const aList = _arrayFromIterator3(a.values());
  const bList = _arrayFromIterator3(b2.values());
  const filtered = aList.filter((aInstance) => _indexOf3(aInstance, bList) === -1);
  return filtered.length === 0;
}
function compareErrors3(a, b2) {
  if (a.message !== b2.message)
    return false;
  if (a.toString !== b2.toString)
    return false;
  return a.toString() === b2.toString();
}
function parseDate3(maybeDate) {
  if (!maybeDate.toDateString)
    return [false];
  return [true, maybeDate.getTime()];
}
function parseRegex3(maybeRegex) {
  if (maybeRegex.constructor !== RegExp)
    return [false];
  return [true, maybeRegex.toString()];
}
function equals3(a, b2) {
  if (arguments.length === 1)
    return (_b) => equals3(a, _b);
  if (Object.is(a, b2))
    return true;
  const aType = type4(a);
  if (aType !== type4(b2))
    return false;
  if (aType === "Function")
    return a.name === undefined ? false : a.name === b2.name;
  if (["NaN", "Null", "Undefined"].includes(aType))
    return true;
  if (["BigInt", "Number"].includes(aType)) {
    if (Object.is(-0, a) !== Object.is(-0, b2))
      return false;
    return a.toString() === b2.toString();
  }
  if (["Boolean", "String"].includes(aType))
    return a.toString() === b2.toString();
  if (aType === "Array") {
    const aClone = Array.from(a);
    const bClone = Array.from(b2);
    if (aClone.toString() !== bClone.toString())
      return false;
    let loopArrayFlag = true;
    aClone.forEach((aCloneInstance, aCloneIndex) => {
      if (loopArrayFlag) {
        if (aCloneInstance !== bClone[aCloneIndex] && !equals3(aCloneInstance, bClone[aCloneIndex]))
          loopArrayFlag = false;
      }
    });
    return loopArrayFlag;
  }
  const aRegex = parseRegex3(a);
  const bRegex = parseRegex3(b2);
  if (aRegex[0])
    return bRegex[0] ? aRegex[1] === bRegex[1] : false;
  else if (bRegex[0])
    return false;
  const aDate = parseDate3(a);
  const bDate = parseDate3(b2);
  if (aDate[0])
    return bDate[0] ? aDate[1] === bDate[1] : false;
  else if (bDate[0])
    return false;
  if (a instanceof Error) {
    if (!(b2 instanceof Error))
      return false;
    return compareErrors3(a, b2);
  }
  if (aType === "Set")
    return _compareSets3(a, b2);
  if (aType === "Object") {
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b2).length)
      return false;
    let loopObjectFlag = true;
    aKeys.forEach((aKeyInstance) => {
      if (loopObjectFlag) {
        const aValue = a[aKeyInstance];
        const bValue = b2[aKeyInstance];
        if (aValue !== bValue && !equals3(aValue, bValue))
          loopObjectFlag = false;
      }
    });
    return loopObjectFlag;
  }
  return false;
}
function differenceWithFn(fn, a, b2) {
  const willReturn = [];
  const [first, second] = a.length > b2.length ? [a, b2] : [b2, a];
  first.forEach((item) => {
    const hasItem = second.some((secondItem) => fn(item, secondItem));
    if (!hasItem && _indexOf3(item, willReturn) === -1) {
      willReturn.push(item);
    }
  });
  return willReturn;
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1;r < arguments.length; r++) {
    var t = arguments[r] != null ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _toPrimitive(t, r) {
  if (typeof t != "object" || !t)
    return t;
  var e = t[Symbol.toPrimitive];
  if (e !== undefined) {
    var i = e.call(t, r || "default");
    if (typeof i != "object")
      return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (r === "string" ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return typeof i == "symbol" ? i : i + "";
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function pathFn(pathInput, obj) {
  let willReturn = obj;
  let counter = 0;
  const pathArrValue = createPath(pathInput);
  while (counter < pathArrValue.length) {
    if (willReturn === null || willReturn === undefined) {
      return;
    }
    if (willReturn[pathArrValue[counter]] === null)
      return;
    willReturn = willReturn[pathArrValue[counter]];
    counter++;
  }
  return willReturn;
}
function path(pathInput, obj) {
  if (arguments.length === 1)
    return (_obj) => path(pathInput, _obj);
  if (obj === null || obj === undefined) {
    return;
  }
  return pathFn(pathInput, obj);
}
function updateFn(index, newValue, list) {
  const clone2 = cloneList2(list);
  if (index === -1)
    return clone2.fill(newValue, index);
  return clone2.fill(newValue, index, index + 1);
}
function eqByFn(fn, a, b2) {
  return equals3(fn(a), fn(b2));
}
function propFn(searchProperty, obj) {
  if (!obj)
    return;
  return obj[searchProperty];
}
function prop(searchProperty, obj) {
  if (arguments.length === 1)
    return (_obj) => prop(searchProperty, _obj);
  return propFn(searchProperty, obj);
}
function eqPropsFn(property, objA, objB) {
  return equals3(prop(property, objA), prop(property, objB));
}
function has(prop2, obj) {
  if (arguments.length === 1)
    return (_obj) => has(prop2, _obj);
  if (!obj)
    return false;
  return obj.hasOwnProperty(prop2);
}
function ifElseFn(condition, onTrue, onFalse) {
  return (...input) => {
    const conditionResult = typeof condition === "boolean" ? condition : condition(...input);
    if (conditionResult === true) {
      return onTrue(...input);
    }
    return onFalse(...input);
  };
}
function baseSlice(array3, start3, end) {
  let index = -1;
  let {
    length
  } = array3;
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start3 > end ? 0 : end - start3 >>> 0;
  start3 >>>= 0;
  const result = Array(length);
  while (++index < length) {
    result[index] = array3[index + start3];
  }
  return result;
}
function _includesWith(pred, x, list) {
  let idx = 0;
  const len = list.length;
  while (idx < len) {
    if (pred(x, list[idx]))
      return true;
    idx += 1;
  }
  return false;
}
function _filter(fn, list) {
  let idx = 0;
  const len = list.length;
  const result = [];
  while (idx < len) {
    if (fn(list[idx]))
      result[result.length] = list[idx];
    idx += 1;
  }
  return result;
}
function innerJoinFn(pred, xs, ys) {
  return _filter((x) => _includesWith(pred, x, ys), xs);
}
function insertFn(indexToInsert, valueToInsert, array3) {
  return [...array3.slice(0, indexToInsert), valueToInsert, ...array3.slice(indexToInsert)];
}
function insertAllFn(index, listToInsert, list) {
  return [...list.slice(0, index), ...listToInsert, ...list.slice(index)];
}
function is(targetPrototype, x) {
  if (arguments.length === 1)
    return (_x) => is(targetPrototype, _x);
  return x != null && x.constructor === targetPrototype || x instanceof targetPrototype;
}
function maxByFn(compareFn, x, y2) {
  return compareFn(y2) > compareFn(x) ? y2 : x;
}
function mergeWithFn(mergeFn, aInput, bInput) {
  const a = aInput !== null && aInput !== undefined ? aInput : {};
  const b2 = bInput !== null && bInput !== undefined ? bInput : {};
  const willReturn = {};
  Object.keys(a).forEach((key) => {
    if (b2[key] === undefined)
      willReturn[key] = a[key];
    else
      willReturn[key] = mergeFn(a[key], b2[key]);
  });
  Object.keys(b2).forEach((key) => {
    if (willReturn[key] !== undefined)
      return;
    if (a[key] === undefined)
      willReturn[key] = b2[key];
    else
      willReturn[key] = mergeFn(a[key], b2[key]);
  });
  return willReturn;
}
function minByFn(compareFn, x, y2) {
  return compareFn(y2) < compareFn(x) ? y2 : x;
}
function isIterable(input) {
  return Array.isArray(input) || type4(input) === "Object";
}
function modifyFn(property, fn, iterable) {
  if (!isIterable(iterable))
    return iterable;
  if (iterable[property] === undefined)
    return iterable;
  if (isArray3(iterable)) {
    return updateFn(property, fn(iterable[property]), iterable);
  }
  return _objectSpread2(_objectSpread2({}, iterable), {}, {
    [property]: fn(iterable[property])
  });
}
function modifyPathFn(pathInput, fn, object) {
  const path$1 = createPath(pathInput);
  if (path$1.length === 1) {
    return _objectSpread2(_objectSpread2({}, object), {}, {
      [path$1[0]]: fn(object[path$1[0]])
    });
  }
  if (path(path$1, object) === undefined)
    return object;
  const val = modifyPath(Array.prototype.slice.call(path$1, 1), fn, object[path$1[0]]);
  if (val === object[path$1[0]]) {
    return object;
  }
  return assoc(path$1[0], val, object);
}
function moveFn(fromIndex, toIndex, list) {
  if (fromIndex < 0 || toIndex < 0) {
    throw new Error("Rambda.move does not support negative indexes");
  }
  if (fromIndex > list.length - 1 || toIndex > list.length - 1)
    return list;
  const clone2 = cloneList2(list);
  clone2[fromIndex] = list[toIndex];
  clone2[toIndex] = list[fromIndex];
  return clone2;
}
function multiply(x, y2) {
  if (arguments.length === 1)
    return (_y) => multiply(x, _y);
  return x * y2;
}
function overFn(lens, fn, object) {
  return lens((x) => Identity(fn(x)))(object).x;
}
function pathEqFn(pathToSearch, target, input) {
  return equals3(path(pathToSearch, input), target);
}
function pathOrFn(defaultValue, pathInput, obj) {
  return defaultTo(defaultValue, path(pathInput, obj));
}
function pathSatisfiesFn(fn, pathInput, obj) {
  if (pathInput.length === 0)
    throw new Error("R.pathSatisfies received an empty path");
  return Boolean(fn(path(pathInput, obj)));
}
function propEqFn(valueToMatch, propToFind, obj) {
  if (!obj)
    return false;
  return equals3(valueToMatch, prop(propToFind, obj));
}
function propIsFn(targetPrototype, property, obj) {
  return is(targetPrototype, obj[property]);
}
function propOrFn(defaultValue, property, obj) {
  if (!obj)
    return defaultValue;
  return defaultTo(defaultValue, obj[property]);
}
function propSatisfiesFn(predicate, property, obj) {
  return predicate(prop(property, obj));
}
function reduceByFunction(valueFn, valueAcc, keyFn, acc, elt) {
  const key = keyFn(elt);
  const value = valueFn(has(key, acc) ? acc[key] : clone(valueAcc), elt);
  acc[key] = value;
  return acc;
}
function reduceByFn(valueFn, valueAcc, keyFn, list) {
  return reduce((acc, elt) => reduceByFunction(valueFn, valueAcc, keyFn, acc, elt), {}, list);
}
function replaceFn(pattern, replacer, str) {
  return str.replace(pattern, replacer);
}
function setFn(lens, replacer, x) {
  return over(lens, always(replacer), x);
}
function sliceFn(from3, to, list) {
  return list.slice(from3, to);
}
function take(howMany, listOrString) {
  if (arguments.length === 1)
    return (_listOrString) => take(howMany, _listOrString);
  if (howMany < 0)
    return listOrString.slice();
  if (typeof listOrString === "string")
    return listOrString.slice(0, howMany);
  return baseSlice(listOrString, 0, howMany);
}
function swapArrayOrString(indexA, indexB, iterable) {
  const actualIndexA = indexA < 0 ? iterable.length + indexA : indexA;
  const actualIndexB = indexB < 0 ? iterable.length + indexB : indexB;
  if (actualIndexA === actualIndexB || Math.min(actualIndexA, actualIndexB) < 0 || Math.max(actualIndexA, actualIndexB) >= iterable.length)
    return iterable;
  if (typeof iterable === "string") {
    return iterable.slice(0, actualIndexA) + iterable[actualIndexB] + iterable.slice(actualIndexA + 1, actualIndexB) + iterable[actualIndexA] + iterable.slice(actualIndexB + 1);
  }
  const clone2 = iterable.slice();
  const temp = clone2[actualIndexA];
  clone2[actualIndexA] = clone2[actualIndexB];
  clone2[actualIndexB] = temp;
  return clone2;
}
function swapFn(indexA, indexB, iterable) {
  if (isArray3(iterable) || typeof iterable === "string")
    return swapArrayOrString(indexA, indexB, iterable);
  const aVal = iterable[indexA];
  const bVal = iterable[indexB];
  if (aVal === undefined || bVal === undefined)
    return iterable;
  return _objectSpread2(_objectSpread2({}, iterable), {}, {
    [indexA]: iterable[indexB],
    [indexB]: iterable[indexA]
  });
}
function unlessFn(predicate, whenFalseFn, input) {
  if (predicate(input))
    return input;
  return whenFalseFn(input);
}
function whenFn(predicate, whenTrueFn, input) {
  if (!predicate(input))
    return input;
  return whenTrueFn(input);
}
function zipWithFn(fn, x, y2) {
  return take(x.length > y2.length ? y2.length : x.length, x).map((xInstance, i) => fn(xInstance, y2[i]));
}
function dispatch3() {
  for (var i = 0, n = arguments.length, _2 = {}, t;i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _2 || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _2[t] = [];
  }
  return new Dispatch3(_2);
}
function Dispatch3(_2) {
  this._ = _2;
}
function parseTypenames5(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
function get5(type22, name) {
  for (var i = 0, n = type22.length, c;i < n; ++i) {
    if ((c = type22[i]).name === name) {
      return c.value;
    }
  }
}
function set23(type22, name, callback) {
  for (var i = 0, n = type22.length;i < n; ++i) {
    if (type22[i].name === name) {
      type22[i] = noop3, type22 = type22.slice(0, i).concat(type22.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type22.push({ name, value: callback });
  return type22;
}
function namespace_default3(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns")
    name = name.slice(i + 1);
  return namespaces_default3.hasOwnProperty(prefix) ? { space: namespaces_default3[prefix], local: name } : name;
}
function creatorInherit3(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml3 && document2.documentElement.namespaceURI === xhtml3 ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed3(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default3(name) {
  var fullname = namespace_default3(name);
  return (fullname.local ? creatorFixed3 : creatorInherit3)(fullname);
}
function none3() {
}
function selector_default3(selector) {
  return selector == null ? none3 : function() {
    return this.querySelector(selector);
  };
}
function select_default5(select) {
  if (typeof select !== "function")
    select = selector_default3(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0;i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection5(subgroups, this._parents);
}
function array3(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}
function empty3() {
  return [];
}
function selectorAll_default3(selector2) {
  return selector2 == null ? empty3 : function() {
    return this.querySelectorAll(selector2);
  };
}
function arrayAll3(select) {
  return function() {
    return array3(select.apply(this, arguments));
  };
}
function selectAll_default5(select) {
  if (typeof select === "function")
    select = arrayAll3(select);
  else
    select = selectorAll_default3(select);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }
  return new Selection5(subgroups, parents);
}
function childMatcher3(selector2) {
  return function(node) {
    return node.matches(selector2);
  };
}
function matcher_default3(selector2) {
  return function() {
    return this.matches(selector2);
  };
}
function childFind3(match) {
  return function() {
    return find3.call(this.children, match);
  };
}
function childFirst3() {
  return this.firstElementChild;
}
function selectChild_default3(match) {
  return this.select(match == null ? childFirst3 : childFind3(typeof match === "function" ? match : childMatcher3(match)));
}
function children3() {
  return Array.from(this.children);
}
function childrenFilter3(match) {
  return function() {
    return filter23.call(this.children, match);
  };
}
function selectChildren_default3(match) {
  return this.selectAll(match == null ? children3 : childrenFilter3(typeof match === "function" ? match : childMatcher3(match)));
}
function filter_default5(match) {
  if (typeof match !== "function")
    match = matcher_default3(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0;i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection5(subgroups, this._parents);
}
function sparse_default3(update2) {
  return new Array(update2.length);
}
function EnterNode3(parent, datum3) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum3;
}
function enter_default3() {
  return new Selection5(this._enter || this._groups.map(sparse_default3), this._parents);
}
function constant_default5(x) {
  return function() {
    return x;
  };
}
function bindIndex3(parent, group, enter2, update2, exit, data) {
  var i = 0, node, groupLength = group.length, dataLength = data.length;
  for (;i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update2[i] = node;
    } else {
      enter2[i] = new EnterNode3(parent, data[i]);
    }
  }
  for (;i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}
function bindKey3(parent, group, enter2, update2, exit, data, key) {
  var i, node, nodeByKeyValue = new Map, groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0;i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0;i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update2[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter2[i] = new EnterNode3(parent, data[i]);
    }
  }
  for (i = 0;i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum3(node) {
  return node.__data__;
}
function arraylike3(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function data_default3(value, key) {
  if (!arguments.length)
    return Array.from(this, datum3);
  var bind = key ? bindKey3 : bindIndex3, parents = this._parents, groups = this._groups;
  if (typeof value !== "function")
    value = constant_default5(value);
  for (var m2 = groups.length, update2 = new Array(m2), enter2 = new Array(m2), exit = new Array(m2), j = 0;j < m2; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike3(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter2[j] = new Array(dataLength), updateGroup = update2[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next;i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update2 = new Selection5(update2, parents);
  update2._enter = enter2;
  update2._exit = exit;
  return update2;
}
function exit_default3() {
  return new Selection5(this._exit || this._groups.map(sparse_default3), this._parents);
}
function join_default3(onenter, onupdate, onexit) {
  var enter2 = this.enter(), update2 = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter2 = onenter(enter2);
    if (enter2)
      enter2 = enter2.selection();
  } else {
    enter2 = enter2.append(onenter + "");
  }
  if (onupdate != null) {
    update2 = onupdate(update2);
    if (update2)
      update2 = update2.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter2 && update2 ? enter2.merge(update2).order() : update2;
}
function merge_default5(context) {
  var selection3 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection3._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges22 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge3 = merges22[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge3[i] = node;
      }
    }
  }
  for (;j < m0; ++j) {
    merges22[j] = groups0[j];
  }
  return new Selection5(merges22, this._parents);
}
function order_default3() {
  for (var groups = this._groups, j = -1, m2 = groups.length;++j < m2; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node;--i >= 0; ) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
function ascending3(a, b2) {
  return a < b2 ? -1 : a > b2 ? 1 : a >= b2 ? 0 : NaN;
}
function sort_default3(compare) {
  if (!compare)
    compare = ascending3;
  function compareNode(a, b2) {
    return a && b2 ? compare(a.__data__, b2.__data__) : !a - !b2;
  }
  for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0;i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection5(sortgroups, this._parents).order();
}
function call_default3() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function nodes_default3() {
  return Array.from(this);
}
function node_default3() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length;i < n; ++i) {
      var node = group[i];
      if (node)
        return node;
    }
  }
  return null;
}
function size_default3() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}
function empty_default3() {
  return !this.node();
}
function each_default3(callback) {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        callback.call(node, node.__data__, i, group);
    }
  }
  return this;
}
function attrRemove5(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS5(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant5(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS5(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction5(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v);
  };
}
function attrFunctionNS5(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function attr_default5(name, value) {
  var fullname = namespace_default3(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS5 : attrRemove5 : typeof value === "function" ? fullname.local ? attrFunctionNS5 : attrFunction5 : fullname.local ? attrConstantNS5 : attrConstant5)(fullname, value));
}
function window_default3(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
function styleRemove5(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant5(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction5(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v, priority);
  };
}
function styleValue3(node, name) {
  return node.style.getPropertyValue(name) || window_default3(node).getComputedStyle(node, null).getPropertyValue(name);
}
function style_default5(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove5 : typeof value === "function" ? styleFunction5 : styleConstant5)(name, value, priority == null ? "" : priority)) : styleValue3(this.node(), name);
}
function propertyRemove3(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant3(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction3(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null)
      delete this[name];
    else
      this[name] = v;
  };
}
function property_default3(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove3 : typeof value === "function" ? propertyFunction3 : propertyConstant3)(name, value)) : this.node()[name];
}
function classArray3(string) {
  return string.trim().split(/^|\s+/);
}
function classList3(node) {
  return node.classList || new ClassList3(node);
}
function ClassList3(node) {
  this._node = node;
  this._names = classArray3(node.getAttribute("class") || "");
}
function classedAdd3(node, names) {
  var list = classList3(node), i = -1, n = names.length;
  while (++i < n)
    list.add(names[i]);
}
function classedRemove3(node, names) {
  var list = classList3(node), i = -1, n = names.length;
  while (++i < n)
    list.remove(names[i]);
}
function classedTrue3(names) {
  return function() {
    classedAdd3(this, names);
  };
}
function classedFalse3(names) {
  return function() {
    classedRemove3(this, names);
  };
}
function classedFunction3(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd3 : classedRemove3)(this, names);
  };
}
function classed_default3(name, value) {
  var names = classArray3(name + "");
  if (arguments.length < 2) {
    var list = classList3(this.node()), i = -1, n = names.length;
    while (++i < n)
      if (!list.contains(names[i]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction3 : value ? classedTrue3 : classedFalse3)(names, value));
}
function textRemove3() {
  this.textContent = "";
}
function textConstant5(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction5(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function text_default5(value) {
  return arguments.length ? this.each(value == null ? textRemove3 : (typeof value === "function" ? textFunction5 : textConstant5)(value)) : this.node().textContent;
}
function htmlRemove3() {
  this.innerHTML = "";
}
function htmlConstant3(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction3(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function html_default3(value) {
  return arguments.length ? this.each(value == null ? htmlRemove3 : (typeof value === "function" ? htmlFunction3 : htmlConstant3)(value)) : this.node().innerHTML;
}
function raise3() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default3() {
  return this.each(raise3);
}
function lower3() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default3() {
  return this.each(lower3);
}
function append_default3(name) {
  var create3 = typeof name === "function" ? name : creator_default3(name);
  return this.select(function() {
    return this.appendChild(create3.apply(this, arguments));
  });
}
function constantNull3() {
  return null;
}
function insert_default3(name, before) {
  var create3 = typeof name === "function" ? name : creator_default3(name), select = before == null ? constantNull3 : typeof before === "function" ? before : selector_default3(before);
  return this.select(function() {
    return this.insertBefore(create3.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
function remove3() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default5() {
  return this.each(remove3);
}
function selection_cloneShallow3() {
  var clone2 = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function selection_cloneDeep3() {
  var clone2 = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone2, this.nextSibling) : clone2;
}
function clone_default3(deep) {
  return this.select(deep ? selection_cloneDeep3 : selection_cloneShallow3);
}
function datum_default3(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
function contextListener3(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames23(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove3(typename) {
  return function() {
    var on4 = this.__on;
    if (!on4)
      return;
    for (var j = 0, i = -1, m2 = on4.length, o;j < m2; ++j) {
      if (o = on4[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on4[++i] = o;
      }
    }
    if (++i)
      on4.length = i;
    else
      delete this.__on;
  };
}
function onAdd3(typename, value, options) {
  return function() {
    var on4 = this.__on, o, listener = contextListener3(value);
    if (on4)
      for (var j = 0, m2 = on4.length;j < m2; ++j) {
        if ((o = on4[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on4)
      this.__on = [o];
    else
      on4.push(o);
  };
}
function on_default5(typename, value, options) {
  var typenames = parseTypenames23(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on4 = this.node().__on;
    if (on4)
      for (var j = 0, m2 = on4.length, o;j < m2; ++j) {
        for (i = 0, o = on4[j];i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on4 = value ? onAdd3 : onRemove3;
  for (i = 0;i < n; ++i)
    this.each(on4(typenames[i], value, options));
  return this;
}
function dispatchEvent3(node, type22, params) {
  var window4 = window_default3(node), event = window4.CustomEvent;
  if (typeof event === "function") {
    event = new event(type22, params);
  } else {
    event = window4.document.createEvent("Event");
    if (params)
      event.initEvent(type22, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type22, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant3(type22, params) {
  return function() {
    return dispatchEvent3(this, type22, params);
  };
}
function dispatchFunction3(type22, params) {
  return function() {
    return dispatchEvent3(this, type22, params.apply(this, arguments));
  };
}
function dispatch_default23(type22, params) {
  return this.each((typeof params === "function" ? dispatchFunction3 : dispatchConstant3)(type22, params));
}
function* iterator_default3() {
  for (var groups = this._groups, j = 0, m2 = groups.length;j < m2; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node;i < n; ++i) {
      if (node = group[i])
        yield node;
    }
  }
}
function Selection5(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection3() {
  return new Selection5([[document.documentElement]], root3);
}
function selection_selection3() {
  return this;
}
function extend3(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}
function define_default3(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function Color3() {
}
function color_formatHex3() {
  return this.rgb().formatHex();
}
function color_formatHex83() {
  return this.rgb().formatHex8();
}
function color_formatHsl3() {
  return hslConvert3(this).formatHsl();
}
function color_formatRgb3() {
  return this.rgb().formatRgb();
}
function rgbn3(n) {
  return new Rgb3(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba3(r, g, b2, a) {
  if (a <= 0)
    r = g = b2 = NaN;
  return new Rgb3(r, g, b2, a);
}
function rgbConvert3(o) {
  if (!(o instanceof Color3))
    o = color3(o);
  if (!o)
    return new Rgb3;
  o = o.rgb();
  return new Rgb3(o.r, o.g, o.b, o.opacity);
}
function rgb3(r, g, b2, opacity) {
  return arguments.length === 1 ? rgbConvert3(r) : new Rgb3(r, g, b2, opacity == null ? 1 : opacity);
}
function Rgb3(r, g, b2, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b2;
  this.opacity = +opacity;
}
function rgb_formatHex3() {
  return `#${hex3(this.r)}${hex3(this.g)}${hex3(this.b)}`;
}
function rgb_formatHex83() {
  return `#${hex3(this.r)}${hex3(this.g)}${hex3(this.b)}${hex3((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb3() {
  const a = clampa3(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi3(this.r)}, ${clampi3(this.g)}, ${clampi3(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa3(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi3(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex3(value) {
  value = clampi3(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla3(h2, s, l, a) {
  if (a <= 0)
    h2 = s = l = NaN;
  else if (l <= 0 || l >= 1)
    h2 = s = NaN;
  else if (s <= 0)
    h2 = NaN;
  return new Hsl3(h2, s, l, a);
}
function hslConvert3(o) {
  if (o instanceof Hsl3)
    return new Hsl3(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color3))
    o = color3(o);
  if (!o)
    return new Hsl3;
  if (o instanceof Hsl3)
    return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b2 = o.b / 255, min = Math.min(r, g, b2), max = Math.max(r, g, b2), h2 = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max)
      h2 = (g - b2) / s + (g < b2) * 6;
    else if (g === max)
      h2 = (b2 - r) / s + 2;
    else
      h2 = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h2 *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h2;
  }
  return new Hsl3(h2, s, l, o.opacity);
}
function hsl3(h2, s, l, opacity) {
  return arguments.length === 1 ? hslConvert3(h2) : new Hsl3(h2, s, l, opacity == null ? 1 : opacity);
}
function Hsl3(h2, s, l, opacity) {
  this.h = +h2;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
function clamph3(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt3(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb3(h2, m1, m2) {
  return (h2 < 60 ? m1 + (m2 - m1) * h2 / 60 : h2 < 180 ? m2 : h2 < 240 ? m1 + (m2 - m1) * (240 - h2) / 60 : m1) * 255;
}
function color3(format) {
  var m2, l;
  format = (format + "").trim().toLowerCase();
  return (m2 = reHex3.exec(format)) ? (l = m2[1].length, m2 = parseInt(m2[1], 16), l === 6 ? rgbn3(m2) : l === 3 ? new Rgb3(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l === 8 ? rgba3(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l === 4 ? rgba3(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger3.exec(format)) ? new Rgb3(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent3.exec(format)) ? new Rgb3(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger3.exec(format)) ? rgba3(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent3.exec(format)) ? rgba3(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent3.exec(format)) ? hsla3(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent3.exec(format)) ? hsla3(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named3.hasOwnProperty(format) ? rgbn3(named3[format]) : format === "transparent" ? new Rgb3(NaN, NaN, NaN, 0) : null;
}
function basis3(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default3(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis3((t - i / n) * n, v0, v1, v2, v3);
  };
}
function basisClosed_default3(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis3((t - i / n) * n, v0, v1, v2, v3);
  };
}
function linear3(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential3(a, b2, y2) {
  return a = Math.pow(a, y2), b2 = Math.pow(b2, y2) - a, y2 = 1 / y2, function(t) {
    return Math.pow(a + t * b2, y2);
  };
}
function gamma3(y2) {
  return (y2 = +y2) === 1 ? nogamma3 : function(a, b2) {
    return b2 - a ? exponential3(a, b2, y2) : constant_default23(isNaN(a) ? b2 : a);
  };
}
function nogamma3(a, b2) {
  var d = b2 - a;
  return d ? linear3(a, d) : constant_default23(isNaN(a) ? b2 : a);
}
function rgbSpline3(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b2 = new Array(n), i, color32;
    for (i = 0;i < n; ++i) {
      color32 = rgb3(colors[i]);
      r[i] = color32.r || 0;
      g[i] = color32.g || 0;
      b2[i] = color32.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b2 = spline(b2);
    color32.opacity = 1;
    return function(t) {
      color32.r = r(t);
      color32.g = g(t);
      color32.b = b2(t);
      return color32 + "";
    };
  };
}
function number_default3(a, b2) {
  return a = +a, b2 = +b2, function(t) {
    return a * (1 - t) + b2 * t;
  };
}
function zero3(b2) {
  return function() {
    return b2;
  };
}
function one3(b2) {
  return function(t) {
    return b2(t) + "";
  };
}
function string_default3(a, b2) {
  var bi = reA3.lastIndex = reB3.lastIndex = 0, am, bm, bs, i = -1, s = [], q2 = [];
  a = a + "", b2 = b2 + "";
  while ((am = reA3.exec(a)) && (bm = reB3.exec(b2))) {
    if ((bs = bm.index) > bi) {
      bs = b2.slice(bi, bs);
      if (s[i])
        s[i] += bs;
      else
        s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i])
        s[i] += bm;
      else
        s[++i] = bm;
    } else {
      s[++i] = null;
      q2.push({ i, x: number_default3(am, bm) });
    }
    bi = reB3.lastIndex;
  }
  if (bi < b2.length) {
    bs = b2.slice(bi);
    if (s[i])
      s[i] += bs;
    else
      s[++i] = bs;
  }
  return s.length < 2 ? q2[0] ? one3(q2[0].x) : zero3(b2) : (b2 = q2.length, function(t) {
    for (var i2 = 0, o;i2 < b2; ++i2)
      s[(o = q2[i2]).i] = o.x(t);
    return s.join("");
  });
}
function decompose_default3(a, b2, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b2 * b2))
    a /= scaleX, b2 /= scaleX;
  if (skewX = a * c + b2 * d)
    c -= a * skewX, d -= b2 * skewX;
  if (scaleY = Math.sqrt(c * c + d * d))
    c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b2 * c)
    a = -a, b2 = -b2, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b2, a) * degrees3,
    skewX: Math.atan(skewX) * degrees3,
    scaleX,
    scaleY
  };
}
function parseCss3(value) {
  const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m2.isIdentity ? identity5 : decompose_default3(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
}
function parseSvg3(value) {
  if (value == null)
    return identity5;
  if (!svgNode3)
    svgNode3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode3.setAttribute("transform", value);
  if (!(value = svgNode3.transform.baseVal.consolidate()))
    return identity5;
  value = value.matrix;
  return decompose_default3(value.a, value.b, value.c, value.d, value.e, value.f);
}
function interpolateTransform3(parse2, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q2.push({ i: i - 4, x: number_default3(xa, xb) }, { i: i - 2, x: number_default3(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b2, s, q2) {
    if (a !== b2) {
      if (a - b2 > 180)
        b2 += 360;
      else if (b2 - a > 180)
        a += 360;
      q2.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default3(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "rotate(" + b2 + degParen);
    }
  }
  function skewX(a, b2, s, q2) {
    if (a !== b2) {
      q2.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default3(a, b2) });
    } else if (b2) {
      s.push(pop(s) + "skewX(" + b2 + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q2) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q2.push({ i: i - 4, x: number_default3(xa, xb) }, { i: i - 2, x: number_default3(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a, b2) {
    var s = [], q2 = [];
    a = parse2(a), b2 = parse2(b2);
    translate(a.translateX, a.translateY, b2.translateX, b2.translateY, s, q2);
    rotate(a.rotate, b2.rotate, s, q2);
    skewX(a.skewX, b2.skewX, s, q2);
    scale(a.scaleX, a.scaleY, b2.scaleX, b2.scaleY, s, q2);
    a = b2 = null;
    return function(t) {
      var i = -1, n = q2.length, o;
      while (++i < n)
        s[(o = q2[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
function now3() {
  return clockNow3 || (setFrame3(clearNow3), clockNow3 = clock3.now() + clockSkew3);
}
function clearNow3() {
  clockNow3 = 0;
}
function Timer3() {
  this._call = this._time = this._next = null;
}
function timer3(callback, delay, time) {
  var t = new Timer3;
  t.restart(callback, delay, time);
  return t;
}
function timerFlush3() {
  now3();
  ++frame3;
  var t = taskHead3, e;
  while (t) {
    if ((e = clockNow3 - t._time) >= 0)
      t._call.call(undefined, e);
    t = t._next;
  }
  --frame3;
}
function wake3() {
  clockNow3 = (clockLast3 = clock3.now()) + clockSkew3;
  frame3 = timeout23 = 0;
  try {
    timerFlush3();
  } finally {
    frame3 = 0;
    nap3();
    clockNow3 = 0;
  }
}
function poke3() {
  var now22 = clock3.now(), delay = now22 - clockLast3;
  if (delay > pokeDelay3)
    clockSkew3 -= delay, clockLast3 = now22;
}
function nap3() {
  var t0, t1 = taskHead3, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time)
        time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead3 = t2;
    }
  }
  taskTail3 = t0;
  sleep3(time);
}
function sleep3(time) {
  if (frame3)
    return;
  if (timeout23)
    timeout23 = clearTimeout(timeout23);
  var delay = time - clockNow3;
  if (delay > 24) {
    if (time < Infinity)
      timeout23 = setTimeout(wake3, time - clock3.now() - clockSkew3);
    if (interval3)
      interval3 = clearInterval(interval3);
  } else {
    if (!interval3)
      clockLast3 = clock3.now(), interval3 = setInterval(poke3, pokeDelay3);
    frame3 = 1, setFrame3(wake3);
  }
}
function timeout_default3(callback, delay, time) {
  var t = new Timer3;
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
function init3(node2, id3) {
  var schedule5 = get23(node2, id3);
  if (schedule5.state > CREATED3)
    throw new Error("too late; already scheduled");
  return schedule5;
}
function set32(node2, id3) {
  var schedule5 = get23(node2, id3);
  if (schedule5.state > STARTED3)
    throw new Error("too late; already running");
  return schedule5;
}
function get23(node2, id3) {
  var schedule5 = node2.__transition;
  if (!schedule5 || !(schedule5 = schedule5[id3]))
    throw new Error("transition not found");
  return schedule5;
}
function create3(node2, id3, self) {
  var schedules = node2.__transition, tween;
  schedules[id3] = self;
  self.timer = timer3(schedule5, 0, self.time);
  function schedule5(elapsed) {
    self.state = SCHEDULED3;
    self.timer.restart(start3, self.delay, self.time);
    if (self.delay <= elapsed)
      start3(elapsed - self.delay);
  }
  function start3(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED3)
      return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name)
        continue;
      if (o.state === STARTED3)
        return timeout_default3(start3);
      if (o.state === RUNNING3) {
        o.state = ENDED3;
        o.timer.stop();
        o.on.call("interrupt", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id3) {
        o.state = ENDED3;
        o.timer.stop();
        o.on.call("cancel", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default3(function() {
      if (self.state === STARTED3) {
        self.state = RUNNING3;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING3;
    self.on.call("start", node2, node2.__data__, self.index, self.group);
    if (self.state !== STARTING3)
      return;
    self.state = STARTED3;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1;i < n; ++i) {
      if (o = self.tween[i].value.call(node2, node2.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING3, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node2, t);
    }
    if (self.state === ENDING3) {
      self.on.call("end", node2, node2.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED3;
    self.timer.stop();
    delete schedules[id3];
    for (var i in schedules)
      return;
    delete node2.__transition;
  }
}
function schedule_default3(node2, name, id3, index, group, timing) {
  var schedules = node2.__transition;
  if (!schedules)
    node2.__transition = {};
  else if (id3 in schedules)
    return;
  create3(node2, id3, {
    name,
    index,
    group,
    on: emptyOn3,
    tween: emptyTween3,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED3
  });
}
function interrupt_default5(node2, name) {
  var schedules = node2.__transition, schedule6, active, empty32 = true, i;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule6 = schedules[i]).name !== name) {
      empty32 = false;
      continue;
    }
    active = schedule6.state > STARTING3 && schedule6.state < ENDING3;
    schedule6.state = ENDED3;
    schedule6.timer.stop();
    schedule6.on.call(active ? "interrupt" : "cancel", node2, node2.__data__, schedule6.index, schedule6.group);
    delete schedules[i];
  }
  if (empty32)
    delete node2.__transition;
}
function interrupt_default23(name) {
  return this.each(function() {
    interrupt_default5(this, name);
  });
}
function tweenRemove3(id3, name) {
  var tween0, tween1;
  return function() {
    var schedule7 = set32(this, id3), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule7.tween = tween1;
  };
}
function tweenFunction3(id3, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error;
  return function() {
    var schedule7 = set32(this, id3), tween = schedule7.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length;i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n)
        tween1.push(t);
    }
    schedule7.tween = tween1;
  };
}
function tweenValue3(transition, name, value) {
  var id3 = transition._id;
  transition.each(function() {
    var schedule7 = set32(this, id3);
    (schedule7.value || (schedule7.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node2) {
    return get23(node2, id3).value[name];
  };
}
function tween_default3(name, value) {
  var id3 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get23(this.node(), id3).tween;
    for (var i = 0, n = tween.length, t;i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove3 : tweenFunction3)(id3, name, value));
}
function interpolate_default3(a, b2) {
  var c;
  return (typeof b2 === "number" ? number_default3 : b2 instanceof color3 ? rgb_default3 : (c = color3(b2)) ? (b2 = c, rgb_default3) : string_default3)(a, b2);
}
function attrRemove23(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS23(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant23(name, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrConstantNS23(fullname, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrFunction23(name, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attrFunctionNS23(fullname, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attr_default23(name, value) {
  var fullname = namespace_default3(name), i = fullname === "transform" ? interpolateTransformSvg3 : interpolate_default3;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS23 : attrFunction23)(fullname, i, tweenValue3(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS23 : attrRemove23)(fullname) : (fullname.local ? attrConstantNS23 : attrConstant23)(fullname, i, value));
}
function attrInterpolate3(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS3(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS3(fullname, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolateNS3(fullname, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween3(name, value) {
  var t0, i0;
  function tween2() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && attrInterpolate3(name, i);
    return t0;
  }
  tween2._value = value;
  return tween2;
}
function attrTween_default3(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  var fullname = namespace_default3(name);
  return this.tween(key, (fullname.local ? attrTweenNS3 : attrTween3)(fullname, value));
}
function delayFunction3(id3, value) {
  return function() {
    init3(this, id3).delay = +value.apply(this, arguments);
  };
}
function delayConstant3(id3, value) {
  return value = +value, function() {
    init3(this, id3).delay = value;
  };
}
function delay_default3(value) {
  var id3 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction3 : delayConstant3)(id3, value)) : get23(this.node(), id3).delay;
}
function durationFunction3(id3, value) {
  return function() {
    set32(this, id3).duration = +value.apply(this, arguments);
  };
}
function durationConstant3(id3, value) {
  return value = +value, function() {
    set32(this, id3).duration = value;
  };
}
function duration_default3(value) {
  var id3 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction3 : durationConstant3)(id3, value)) : get23(this.node(), id3).duration;
}
function easeConstant3(id3, value) {
  if (typeof value !== "function")
    throw new Error;
  return function() {
    set32(this, id3).ease = value;
  };
}
function ease_default3(value) {
  var id3 = this._id;
  return arguments.length ? this.each(easeConstant3(id3, value)) : get23(this.node(), id3).ease;
}
function easeVarying3(id3, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function")
      throw new Error;
    set32(this, id3).ease = v;
  };
}
function easeVarying_default3(value) {
  if (typeof value !== "function")
    throw new Error;
  return this.each(easeVarying3(this._id, value));
}
function filter_default23(match) {
  if (typeof match !== "function")
    match = matcher_default3(match);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node2, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && match.call(node2, node2.__data__, i, group)) {
        subgroup.push(node2);
      }
    }
  }
  return new Transition3(subgroups, this._parents, this._name, this._id);
}
function merge_default23(transition) {
  if (transition._id !== this._id)
    throw new Error;
  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges22 = new Array(m0), j = 0;j < m2; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge4 = merges22[j] = new Array(n), node2, i = 0;i < n; ++i) {
      if (node2 = group0[i] || group1[i]) {
        merge4[i] = node2;
      }
    }
  }
  for (;j < m0; ++j) {
    merges22[j] = groups0[j];
  }
  return new Transition3(merges22, this._parents, this._name, this._id);
}
function start3(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0)
      t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction3(id3, name, listener) {
  var on0, on1, sit = start3(name) ? init3 : set32;
  return function() {
    var schedule12 = sit(this, id3), on5 = schedule12.on;
    if (on5 !== on0)
      (on1 = (on0 = on5).copy()).on(name, listener);
    schedule12.on = on1;
  };
}
function on_default23(name, listener) {
  var id3 = this._id;
  return arguments.length < 2 ? get23(this.node(), id3).on.on(name) : this.each(onFunction3(id3, name, listener));
}
function removeFunction3(id3) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition)
      if (+i !== id3)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default23() {
  return this.on("end.remove", removeFunction3(this._id));
}
function select_default23(select2) {
  var name = this._name, id3 = this._id;
  if (typeof select2 !== "function")
    select2 = selector_default3(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node2, subnode, i = 0;i < n; ++i) {
      if ((node2 = group[i]) && (subnode = select2.call(node2, node2.__data__, i, group))) {
        if ("__data__" in node2)
          subnode.__data__ = node2.__data__;
        subgroup[i] = subnode;
        schedule_default3(subgroup[i], name, id3, i, subgroup, get23(node2, id3));
      }
    }
  }
  return new Transition3(subgroups, this._parents, name, id3);
}
function selectAll_default23(select2) {
  var name = this._name, id3 = this._id;
  if (typeof select2 !== "function")
    select2 = selectorAll_default3(select2);
  for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        for (var children22 = select2.call(node2, node2.__data__, i, group), child, inherit3 = get23(node2, id3), k = 0, l = children22.length;k < l; ++k) {
          if (child = children22[k]) {
            schedule_default3(child, name, id3, k, children22, inherit3);
          }
        }
        subgroups.push(children22);
        parents.push(node2);
      }
    }
  }
  return new Transition3(subgroups, parents, name, id3);
}
function selection_default23() {
  return new Selection23(this._groups, this._parents);
}
function styleNull3(name, interpolate3) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue3(this, name), string1 = (this.style.removeProperty(name), styleValue3(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, string10 = string1);
  };
}
function styleRemove23(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant23(name, interpolate3, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue3(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate3(string00 = string0, value1);
  };
}
function styleFunction23(name, interpolate3, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue3(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue3(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate3(string00 = string0, value1));
  };
}
function styleMaybeRemove3(id3, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove32;
  return function() {
    var schedule15 = set32(this, id3), on5 = schedule15.on, listener = schedule15.value[key] == null ? remove32 || (remove32 = styleRemove23(name)) : undefined;
    if (on5 !== on0 || listener0 !== listener)
      (on1 = (on0 = on5).copy()).on(event, listener0 = listener);
    schedule15.on = on1;
  };
}
function style_default23(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss3 : interpolate_default3;
  return value == null ? this.styleTween(name, styleNull3(name, i)).on("end.style." + name, styleRemove23(name)) : typeof value === "function" ? this.styleTween(name, styleFunction23(name, i, tweenValue3(this, "style." + name, value))).each(styleMaybeRemove3(this._id, name)) : this.styleTween(name, styleConstant23(name, i, value), priority).on("end.style." + name, null);
}
function styleInterpolate3(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween3(name, value, priority) {
  var t, i0;
  function tween3() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t = (i0 = i) && styleInterpolate3(name, i, priority);
    return t;
  }
  tween3._value = value;
  return tween3;
}
function styleTween_default3(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, styleTween3(name, value, priority == null ? "" : priority));
}
function textConstant23(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction23(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default23(value) {
  return this.tween("text", typeof value === "function" ? textFunction23(tweenValue3(this, "text", value)) : textConstant23(value == null ? "" : value + ""));
}
function textInterpolate3(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween3(value) {
  var t0, i0;
  function tween4() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t0 = (i0 = i) && textInterpolate3(i);
    return t0;
  }
  tween4._value = value;
  return tween4;
}
function textTween_default3(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error;
  return this.tween(key, textTween3(value));
}
function transition_default5() {
  var name = this._name, id0 = this._id, id1 = newId3();
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        var inherit3 = get23(node2, id0);
        schedule_default3(node2, name, id1, i, group, {
          time: inherit3.time + inherit3.delay + inherit3.duration,
          delay: 0,
          duration: inherit3.duration,
          ease: inherit3.ease
        });
      }
    }
  }
  return new Transition3(groups, this._parents, name, id1);
}
function end_default3() {
  var on0, on1, that = this, id3 = that._id, size2 = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size2 === 0)
        resolve();
    } };
    that.each(function() {
      var schedule17 = set32(this, id3), on5 = schedule17.on;
      if (on5 !== on0) {
        on1 = (on0 = on5).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule17.on = on1;
    });
    if (size2 === 0)
      resolve();
  });
}
function Transition3(groups, parents, name, id3) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id3;
}
function newId3() {
  return ++id3;
}
function transition23(name) {
  return selection_default5().transition(name);
}
function cubicInOut3(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
function inherit3(node2, id22) {
  var timing;
  while (!(timing = node2.__transition) || !(timing = timing[id22])) {
    if (!(node2 = node2.parentNode)) {
      throw new Error(`transition ${id22} not found`);
    }
  }
  return timing;
}
function transition_default23(name) {
  var id22, timing;
  if (name instanceof Transition3) {
    id22 = name._id, name = name._name;
  } else {
    id22 = newId3(), (timing = defaultTiming3).time = now3(), name = name == null ? null : name + "";
  }
  for (var groups = this._groups, m2 = groups.length, j = 0;j < m2; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0;i < n; ++i) {
      if (node2 = group[i]) {
        schedule_default3(node2, name, id22, i, group, timing || inherit3(node2, id22));
      }
    }
  }
  return new Transition3(groups, this._parents, name, id22);
}
function number13(e) {
  return [+e[0], +e[1]];
}
function number223(e) {
  return [number13(e[0]), number13(e[1])];
}
function type22(t) {
  return { type: t };
}
function objectConverter3(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
  }).join(",") + "}");
}
function customConverter3(columns, f) {
  var object = objectConverter3(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}
function inferColumns3(rows) {
  var columnSet = Object.create(null), columns = [];
  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });
  return columns;
}
function pad3(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}
function formatYear3(year) {
  return year < 0 ? "-" + pad3(-year, 6) : year > 9999 ? "+" + pad3(year, 6) : pad3(year, 4);
}
function formatDate3(date) {
  var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds = date.getUTCSeconds(), milliseconds = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date" : formatYear3(date.getUTCFullYear(), 4) + "-" + pad3(date.getUTCMonth() + 1, 2) + "-" + pad3(date.getUTCDate(), 2) + (milliseconds ? "T" + pad3(hours, 2) + ":" + pad3(minutes, 2) + ":" + pad3(seconds, 2) + "." + pad3(milliseconds, 3) + "Z" : seconds ? "T" + pad3(hours, 2) + ":" + pad3(minutes, 2) + ":" + pad3(seconds, 2) + "Z" : minutes || hours ? "T" + pad3(hours, 2) + ":" + pad3(minutes, 2) + "Z" : "");
}
function dsv_default3(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
  function parse2(text3, f) {
    var convert, columns, rows = parseRows(text3, function(row, i) {
      if (convert)
        return convert(row, i - 1);
      columns = row, convert = f ? customConverter3(row, f) : objectConverter3(row);
    });
    rows.columns = columns || [];
    return rows;
  }
  function parseRows(text3, f) {
    var rows = [], N = text3.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
    if (text3.charCodeAt(N - 1) === NEWLINE3)
      --N;
    if (text3.charCodeAt(N - 1) === RETURN3)
      --N;
    function token() {
      if (eof)
        return EOF3;
      if (eol)
        return eol = false, EOL3;
      var i, j = I, c;
      if (text3.charCodeAt(j) === QUOTE3) {
        while (I++ < N && text3.charCodeAt(I) !== QUOTE3 || text3.charCodeAt(++I) === QUOTE3)
          ;
        if ((i = I) >= N)
          eof = true;
        else if ((c = text3.charCodeAt(I++)) === NEWLINE3)
          eol = true;
        else if (c === RETURN3) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE3)
            ++I;
        }
        return text3.slice(j + 1, i - 1).replace(/""/g, "\"");
      }
      while (I < N) {
        if ((c = text3.charCodeAt(i = I++)) === NEWLINE3)
          eol = true;
        else if (c === RETURN3) {
          eol = true;
          if (text3.charCodeAt(I) === NEWLINE3)
            ++I;
        } else if (c !== DELIMITER)
          continue;
        return text3.slice(j, i);
      }
      return eof = true, text3.slice(j, N);
    }
    while ((t = token()) !== EOF3) {
      var row = [];
      while (t !== EOL3 && t !== EOF3)
        row.push(t), t = token();
      if (f && (row = f(row, n++)) == null)
        continue;
      rows.push(row);
    }
    return rows;
  }
  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }
  function format(rows, columns) {
    if (columns == null)
      columns = inferColumns3(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }
  function formatBody(rows, columns) {
    if (columns == null)
      columns = inferColumns3(rows);
    return preformatBody(rows, columns).join("\n");
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }
  function formatValue(value) {
    return value == null ? "" : value instanceof Date ? formatDate3(value) : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\"" : value;
  }
  return {
    parse: parse2,
    parseRows,
    format,
    formatBody,
    formatRows,
    formatRow,
    formatValue
  };
}
function Transform3(k, x, y2) {
  this.k = k;
  this.x = x;
  this.y = y2;
}
function transform3(node2) {
  while (!node2.__zoom)
    if (!(node2 = node2.parentNode))
      return identity23;
  return node2.__zoom;
}
function fromReadable(i) {
  return new ReadableStream({
    start: (c) => {
      i.on("data", (data2) => c.enqueue(data2));
      i.on("close", () => c.close());
      i.on("error", (err) => c.error(err));
    },
    cancel: (reason) => (i.destroy?.(reason), undefined)
  });
}
function fromWritable(i) {
  return new WritableStream({
    start: (c) => (i.on("error", (err) => c.error(err)), undefined),
    abort: (reason) => (i.destroy?.(reason), undefined),
    write: (data2, c) => (i.write(data2), undefined),
    close: () => (i.end(), undefined)
  });
}
var __create5 = Object.create;
var __getProtoOf5 = Object.getPrototypeOf;
var __defProp5 = Object.defineProperty;
var __getOwnPropNames5 = Object.getOwnPropertyNames;
var __hasOwnProp5 = Object.prototype.hasOwnProperty;
var __toESM5 = (mod, isNodeMode, target) => {
  target = mod != null ? __create5(__getProtoOf5(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp5(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames5(mod))
    if (!__hasOwnProp5.call(to, key))
      __defProp5(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS5 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_src3 = __commonJS5((exports, module) => {
  var unwind = (dataObject, options) => {
    const unwindRecursive = (dataObject2, path2, currPath) => {
      const pathArr = path2.split(".");
      if (!currPath) {
        currPath = pathArr[0];
      }
      const result = [];
      let added = false;
      const addObject = (objectTempUnwind, objectKey) => {
        Object.keys(objectTempUnwind).forEach((objectTempUnwindKey) => {
          const newObjectCopy = {};
          Object.keys(dataObject2).forEach((dataObjectKey) => {
            newObjectCopy[dataObjectKey] = dataObject2[dataObjectKey];
          });
          newObjectCopy[objectKey] = objectTempUnwind[objectTempUnwindKey];
          added = true;
          result.push(newObjectCopy);
        });
      };
      Object.keys(dataObject2).forEach((objectKey) => {
        if (currPath === objectKey) {
          if (dataObject2[objectKey] instanceof Array) {
            if (dataObject2[objectKey].length === 0 && options.preserveEmptyArray !== true) {
              delete dataObject2[objectKey];
            } else {
              Object.keys(dataObject2[objectKey]).forEach((objectElementKey) => {
                addObject(unwindRecursive(dataObject2[objectKey][objectElementKey], path2.replace(`${currPath}.`, "")), objectKey);
              });
            }
          } else {
            addObject(unwindRecursive(dataObject2[objectKey], path2.replace(`${currPath}.`, "")), objectKey);
          }
        }
      });
      if (!added) {
        result.push(dataObject2);
      }
      return result;
    };
    return unwindRecursive(dataObject, options.path);
  };
  module.exports = { unwind };
});
var differenceWith = curry(differenceWithFn);
var cloneList2 = (list) => Array.prototype.slice.call(list);
var adjust = curry(adjustFn);
var {
  isArray: isArray3
} = Array;
var assoc = curry(assocFn);
var isInteger = Number.isInteger || _isInteger;
var isIndexInteger = (index) => Number.isInteger(Number(index));
var assocPath = curry(assocPathFn);
var clamp = curry(clampFn);

class ReduceStopper {
  constructor(value) {
    this.value = value;
  }
}
var reduce = curry(reduceFn);
var update = curry(updateFn);
var eqBy = curry(eqByFn);
var eqProps = curry(eqPropsFn);
var ifElse = curry(ifElseFn);
var innerJoin = curry(innerJoinFn);
var insert = curry(insertFn);
var insertAll = curry(insertAllFn);
var maxBy = curry(maxByFn);
var mergeWith = curry(mergeWithFn);
var minBy = curry(minByFn);
var modify = curry(modifyFn);
var modifyPath = curry(modifyPathFn);
var move = curry(moveFn);
var Identity = (x) => ({
  x,
  map: (fn) => Identity(fn(x))
});
var over = curry(overFn);
var pathEq = curry(pathEqFn);
var pathOr = curry(pathOrFn);
var pathSatisfies = curry(pathSatisfiesFn);
var product = reduce(multiply, 1);
var propEq = curry(propEqFn);
var propIs = curry(propIsFn);
var propOr = curry(propOrFn);
var propSatisfies = curry(propSatisfiesFn);
var reduceBy = curry(reduceByFn);
var replace = curry(replaceFn);
var set5 = curry(setFn);
var slice = curry(sliceFn);
var swap = curry(swapFn);
var unless = curry(unlessFn);
var when = curry(whenFn);
var zipWith = curry(zipWithFn);
class Subscribable3 {
  closed = false;
  subscribers = [];
  subscribe(cb) {
    let self = this;
    self.subscribers.push(cb);
    let _closed = false;
    return {
      get closed() {
        return _closed || self.closed;
      },
      unsubscribe() {
        let index = self.subscribers.findIndex((x) => x === cb);
        if (index >= 0) {
          self.subscribers.splice(index, 1);
        }
        _closed = true;
      }
    };
  }
  next(value) {
    return Math.min(...this.subscribers.map((x) => x.next(value)));
  }
  complete() {
    for (let sub of this.subscribers) {
      sub.complete();
    }
    this.subscribers = [];
    this.closed = true;
  }
  error(err) {
    for (let sub of this.subscribers) {
      sub.error(err);
    }
    this.subscribers = [];
    this.closed = true;
  }
}

class Subject3 {
  _subscribable = new Subscribable3;
  _closingResolve;
  _closing = new Promise((r) => this._closingResolve = r);
  get closed() {
    return this._subscribable.closed;
  }
  get readable() {
    let self = this;
    let subscription;
    let cancelled = false;
    return new ReadableStream({
      async start(controller) {
        subscription = self.subscribe({
          next: (value) => {
            if (cancelled)
              return;
            controller.enqueue(value);
            return controller.desiredSize;
          },
          complete: () => {
            controller.close();
          },
          error: (err) => {
            controller.error(err);
          }
        });
      },
      cancel() {
        cancelled = true;
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });
  }
  get writable() {
    const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
    const self = this;
    let stream = new WritableStream({
      write(chunk, controller) {
        if (self.closed && controller.signal.aborted == false) {
          controller.error();
          return;
        }
        if (controller.signal.aborted) {
          self._error(controller.signal.reason);
          return;
        }
        self._next(chunk);
      },
      close() {
        self._complete();
      },
      abort(reason) {
        self._error(reason);
      }
    }, queuingStrategy);
    this._closing.then((_2) => {
      if (stream.locked == false) {
        stream.close();
      }
    });
    return stream;
  }
  subscribe(cb) {
    let subscription = this._subscribable.subscribe(cb);
    return subscription;
  }
  _next(value) {
    return this._subscribable.next(value);
  }
  _complete() {
    this._subscribable.complete();
  }
  _error(err) {
    this._subscribable.error(err);
  }
  async next(value) {
    return this._next(value);
  }
  async complete() {
    this._closingResolve(undefined);
    return this._complete();
  }
  async error(err) {
    this._closingResolve(undefined);
    return this._error(err);
  }
}
var import_unwind_array3 = __toESM5(require_src3(), 1);
var noop3 = { value: () => {
} };
Dispatch3.prototype = dispatch3.prototype = {
  constructor: Dispatch3,
  on: function(typename, callback) {
    var _2 = this._, T2 = parseTypenames5(typename + "", _2), t, i = -1, n = T2.length;
    if (arguments.length < 2) {
      while (++i < n)
        if ((t = (typename = T2[i]).type) && (t = get5(_2[t], typename.name)))
          return t;
      return;
    }
    if (callback != null && typeof callback !== "function")
      throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T2[i]).type)
        _2[t] = set23(_2[t], typename.name, callback);
      else if (callback == null)
        for (t in _2)
          _2[t] = set23(_2[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _2 = this._;
    for (var t in _2)
      copy[t] = _2[t].slice();
    return new Dispatch3(copy);
  },
  call: function(type23, that) {
    if ((n = arguments.length - 2) > 0)
      for (var args = new Array(n), i = 0, n, t;i < n; ++i)
        args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type23))
      throw new Error("unknown type: " + type23);
    for (t = this._[type23], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  },
  apply: function(type23, that, args) {
    if (!this._.hasOwnProperty(type23))
      throw new Error("unknown type: " + type23);
    for (var t = this._[type23], i = 0, n = t.length;i < n; ++i)
      t[i].value.apply(that, args);
  }
};
var dispatch_default5 = dispatch3;
var xhtml3 = "http://www.w3.org/1999/xhtml";
var namespaces_default3 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml3,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
var find3 = Array.prototype.find;
var filter23 = Array.prototype.filter;
EnterNode3.prototype = {
  constructor: EnterNode3,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector2) {
    return this._parent.querySelector(selector2);
  },
  querySelectorAll: function(selector2) {
    return this._parent.querySelectorAll(selector2);
  }
};
ClassList3.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};
var root3 = [null];
Selection5.prototype = selection3.prototype = {
  constructor: Selection5,
  select: select_default5,
  selectAll: selectAll_default5,
  selectChild: selectChild_default3,
  selectChildren: selectChildren_default3,
  filter: filter_default5,
  data: data_default3,
  enter: enter_default3,
  exit: exit_default3,
  join: join_default3,
  merge: merge_default5,
  selection: selection_selection3,
  order: order_default3,
  sort: sort_default3,
  call: call_default3,
  nodes: nodes_default3,
  node: node_default3,
  size: size_default3,
  empty: empty_default3,
  each: each_default3,
  attr: attr_default5,
  style: style_default5,
  property: property_default3,
  classed: classed_default3,
  text: text_default5,
  html: html_default3,
  raise: raise_default3,
  lower: lower_default3,
  append: append_default3,
  insert: insert_default3,
  remove: remove_default5,
  clone: clone_default3,
  datum: datum_default3,
  on: on_default5,
  dispatch: dispatch_default23,
  [Symbol.iterator]: iterator_default3
};
var selection_default5 = selection3;
var darker3 = 0.7;
var brighter3 = 1 / darker3;
var reI3 = "\\s*([+-]?\\d+)\\s*";
var reN3 = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP3 = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3,8})$/;
var reRgbInteger3 = new RegExp(`^rgb\\(${reI3},${reI3},${reI3}\\)$`);
var reRgbPercent3 = new RegExp(`^rgb\\(${reP3},${reP3},${reP3}\\)$`);
var reRgbaInteger3 = new RegExp(`^rgba\\(${reI3},${reI3},${reI3},${reN3}\\)$`);
var reRgbaPercent3 = new RegExp(`^rgba\\(${reP3},${reP3},${reP3},${reN3}\\)$`);
var reHslPercent3 = new RegExp(`^hsl\\(${reN3},${reP3},${reP3}\\)$`);
var reHslaPercent3 = new RegExp(`^hsla\\(${reN3},${reP3},${reP3},${reN3}\\)$`);
var named3 = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default3(Color3, color3, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex3,
  formatHex: color_formatHex3,
  formatHex8: color_formatHex83,
  formatHsl: color_formatHsl3,
  formatRgb: color_formatRgb3,
  toString: color_formatRgb3
});
define_default3(Rgb3, rgb3, extend3(Color3, {
  brighter(k) {
    k = k == null ? brighter3 : Math.pow(brighter3, k);
    return new Rgb3(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker3 : Math.pow(darker3, k);
    return new Rgb3(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb3(clampi3(this.r), clampi3(this.g), clampi3(this.b), clampa3(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex3,
  formatHex: rgb_formatHex3,
  formatHex8: rgb_formatHex83,
  formatRgb: rgb_formatRgb3,
  toString: rgb_formatRgb3
}));
define_default3(Hsl3, hsl3, extend3(Color3, {
  brighter(k) {
    k = k == null ? brighter3 : Math.pow(brighter3, k);
    return new Hsl3(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker3 : Math.pow(darker3, k);
    return new Hsl3(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb3(hsl2rgb3(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m2), hsl2rgb3(h2, m1, m2), hsl2rgb3(h2 < 120 ? h2 + 240 : h2 - 120, m1, m2), this.opacity);
  },
  clamp() {
    return new Hsl3(clamph3(this.h), clampt3(this.s), clampt3(this.l), clampa3(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa3(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph3(this.h)}, ${clampt3(this.s) * 100}%, ${clampt3(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
var constant_default23 = (x) => () => x;
var rgb_default3 = function rgbGamma3(y2) {
  var color32 = gamma3(y2);
  function rgb22(start4, end) {
    var r = color32((start4 = rgb3(start4)).r, (end = rgb3(end)).r), g = color32(start4.g, end.g), b2 = color32(start4.b, end.b), opacity = nogamma3(start4.opacity, end.opacity);
    return function(t) {
      start4.r = r(t);
      start4.g = g(t);
      start4.b = b2(t);
      start4.opacity = opacity(t);
      return start4 + "";
    };
  }
  rgb22.gamma = rgbGamma3;
  return rgb22;
}(1);
var rgbBasis3 = rgbSpline3(basis_default3);
var rgbBasisClosed3 = rgbSpline3(basisClosed_default3);
var reA3 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB3 = new RegExp(reA3.source, "g");
var degrees3 = 180 / Math.PI;
var identity5 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
var svgNode3;
var interpolateTransformCss3 = interpolateTransform3(parseCss3, "px, ", "px)", "deg)");
var interpolateTransformSvg3 = interpolateTransform3(parseSvg3, ", ", ")", ")");
var frame3 = 0;
var timeout23 = 0;
var interval3 = 0;
var pokeDelay3 = 1000;
var taskHead3;
var taskTail3;
var clockLast3 = 0;
var clockNow3 = 0;
var clockSkew3 = 0;
var clock3 = typeof performance === "object" && performance.now ? performance : Date;
var setFrame3 = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
Timer3.prototype = timer3.prototype = {
  constructor: Timer3,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function")
      throw new TypeError("callback is not a function");
    time = (time == null ? now3() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail3 !== this) {
      if (taskTail3)
        taskTail3._next = this;
      else
        taskHead3 = this;
      taskTail3 = this;
    }
    this._call = callback;
    this._time = time;
    sleep3();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep3();
    }
  }
};
var emptyOn3 = dispatch_default5("start", "end", "cancel", "interrupt");
var emptyTween3 = [];
var CREATED3 = 0;
var SCHEDULED3 = 1;
var STARTING3 = 2;
var STARTED3 = 3;
var RUNNING3 = 4;
var ENDING3 = 5;
var ENDED3 = 6;
var Selection23 = selection_default5.prototype.constructor;
var id3 = 0;
var selection_prototype3 = selection_default5.prototype;
Transition3.prototype = transition23.prototype = {
  constructor: Transition3,
  select: select_default23,
  selectAll: selectAll_default23,
  selectChild: selection_prototype3.selectChild,
  selectChildren: selection_prototype3.selectChildren,
  filter: filter_default23,
  merge: merge_default23,
  selection: selection_default23,
  transition: transition_default5,
  call: selection_prototype3.call,
  nodes: selection_prototype3.nodes,
  node: selection_prototype3.node,
  size: selection_prototype3.size,
  empty: selection_prototype3.empty,
  each: selection_prototype3.each,
  on: on_default23,
  attr: attr_default23,
  attrTween: attrTween_default3,
  style: style_default23,
  styleTween: styleTween_default3,
  text: text_default23,
  textTween: textTween_default3,
  remove: remove_default23,
  tween: tween_default3,
  delay: delay_default3,
  duration: duration_default3,
  ease: ease_default3,
  easeVarying: easeVarying_default3,
  end: end_default3,
  [Symbol.iterator]: selection_prototype3[Symbol.iterator]
};
var defaultTiming3 = {
  time: null,
  delay: 0,
  duration: 250,
  ease: cubicInOut3
};
selection_default5.prototype.interrupt = interrupt_default23;
selection_default5.prototype.transition = transition_default23;
var X3 = {
  name: "x",
  handles: ["w", "e"].map(type22),
  input: function(x, e) {
    return x == null ? null : [[+x[0], e[0][1]], [+x[1], e[1][1]]];
  },
  output: function(xy) {
    return xy && [xy[0][0], xy[1][0]];
  }
};
var Y3 = {
  name: "y",
  handles: ["n", "s"].map(type22),
  input: function(y2, e) {
    return y2 == null ? null : [[e[0][0], +y2[0]], [e[1][0], +y2[1]]];
  },
  output: function(xy) {
    return xy && [xy[0][1], xy[1][1]];
  }
};
var XY3 = {
  name: "xy",
  handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type22),
  input: function(xy) {
    return xy == null ? null : number223(xy);
  },
  output: function(xy) {
    return xy;
  }
};
var EOL3 = {};
var EOF3 = {};
var QUOTE3 = 34;
var NEWLINE3 = 10;
var RETURN3 = 13;
var csv3 = dsv_default3(",");
var csvParse3 = csv3.parse;
var csvParseRows3 = csv3.parseRows;
var csvFormat3 = csv3.format;
var csvFormatBody3 = csv3.formatBody;
var csvFormatRows3 = csv3.formatRows;
var csvFormatRow3 = csv3.formatRow;
var csvFormatValue3 = csv3.formatValue;
var tsv3 = dsv_default3("\t");
var tsvParse3 = tsv3.parse;
var tsvParseRows3 = tsv3.parseRows;
var tsvFormat3 = tsv3.format;
var tsvFormatBody3 = tsv3.formatBody;
var tsvFormatRows3 = tsv3.formatRows;
var tsvFormatRow3 = tsv3.formatRow;
var tsvFormatValue3 = tsv3.formatValue;
Transform3.prototype = {
  constructor: Transform3,
  scale: function(k) {
    return k === 1 ? this : new Transform3(this.k * k, this.x, this.y);
  },
  translate: function(x, y2) {
    return x === 0 & y2 === 0 ? this : new Transform3(this.k, this.x + this.k * x, this.y + this.k * y2);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y2) {
    return y2 * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y2) {
    return (y2 - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y2) {
    return y2.copy().domain(y2.range().map(this.invertY, this).map(y2.invert, y2));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity23 = new Transform3(1, 0, 0);
transform3.prototype = Transform3.prototype;
class PolyfillTextDecoderStream3 extends TransformStream {
  encoding;
  fatal;
  ignoreBOM;
  constructor(encoding = "utf-8", {
    fatal = false,
    ignoreBOM = false
  } = {}) {
    const decoder = new TextDecoder(encoding, { fatal, ignoreBOM });
    super({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          controller.enqueue(chunk);
          return;
        }
        const decoded = decoder.decode(chunk);
        if (decoded.length > 0) {
          controller.enqueue(decoded);
        }
      },
      flush(controller) {
        const output = decoder.decode();
        if (output.length > 0) {
          controller.enqueue(output);
        }
      }
    });
    this.encoding = encoding;
    this.fatal = fatal;
    this.ignoreBOM = ignoreBOM;
  }
}

class PolyfillTextEncoderStream3 {
  _encoder = new TextEncoder;
  _reader = null;
  ready = Promise.resolve();
  closed = false;
  readable = new ReadableStream({
    start: (controller) => {
      this._reader = controller;
    }
  });
  writable = new WritableStream({
    write: async (chunk) => {
      if (typeof chunk !== "string") {
        this._reader.enqueue(chunk);
        return;
      }
      if (chunk != null && this._reader) {
        const encoded = this._encoder.encode(chunk);
        this._reader.enqueue(encoded);
      }
    },
    close: () => {
      this._reader?.close();
      this.closed = true;
    },
    abort: (reason) => {
      this._reader?.error(reason);
      this.closed = true;
    }
  });
}

// node_modules/yargs/lib/platform-shims/esm.mjs
import {notStrictEqual, strictEqual} from "assert";

// node_modules/cliui/build/lib/index.js
function addBorder(col, ts, style) {
  if (col.border) {
    if (/[.']-+[.']/.test(ts)) {
      return "";
    }
    if (ts.trim().length !== 0) {
      return style;
    }
    return "  ";
  }
  return "";
}
function _minWidth(col) {
  const padding = col.padding || [];
  const minWidth = 1 + (padding[left] || 0) + (padding[right] || 0);
  if (col.border) {
    return minWidth + 4;
  }
  return minWidth;
}
function getWindowWidth() {
  if (typeof process === "object" && process.stdout && process.stdout.columns) {
    return process.stdout.columns;
  }
  return 80;
}
function alignRight(str, width) {
  str = str.trim();
  const strWidth = mixin.stringWidth(str);
  if (strWidth < width) {
    return " ".repeat(width - strWidth) + str;
  }
  return str;
}
function alignCenter(str, width) {
  str = str.trim();
  const strWidth = mixin.stringWidth(str);
  if (strWidth >= width) {
    return str;
  }
  return " ".repeat(width - strWidth >> 1) + str;
}
function cliui(opts, _mixin) {
  mixin = _mixin;
  return new UI({
    width: (opts === null || opts === undefined ? undefined : opts.width) || getWindowWidth(),
    wrap: opts === null || opts === undefined ? undefined : opts.wrap
  });
}
var align = {
  right: alignRight,
  center: alignCenter
};
var top = 0;
var right = 1;
var bottom = 2;
var left = 3;

class UI {
  constructor(opts) {
    var _a;
    this.width = opts.width;
    this.wrap = (_a = opts.wrap) !== null && _a !== undefined ? _a : true;
    this.rows = [];
  }
  span(...args) {
    const cols = this.div(...args);
    cols.span = true;
  }
  resetOutput() {
    this.rows = [];
  }
  div(...args) {
    if (args.length === 0) {
      this.div("");
    }
    if (this.wrap && this.shouldApplyLayoutDSL(...args) && typeof args[0] === "string") {
      return this.applyLayoutDSL(args[0]);
    }
    const cols = args.map((arg) => {
      if (typeof arg === "string") {
        return this.colFromString(arg);
      }
      return arg;
    });
    this.rows.push(cols);
    return cols;
  }
  shouldApplyLayoutDSL(...args) {
    return args.length === 1 && typeof args[0] === "string" && /[\t\n]/.test(args[0]);
  }
  applyLayoutDSL(str) {
    const rows = str.split("\n").map((row) => row.split("\t"));
    let leftColumnWidth = 0;
    rows.forEach((columns) => {
      if (columns.length > 1 && mixin.stringWidth(columns[0]) > leftColumnWidth) {
        leftColumnWidth = Math.min(Math.floor(this.width * 0.5), mixin.stringWidth(columns[0]));
      }
    });
    rows.forEach((columns) => {
      this.div(...columns.map((r, i) => {
        return {
          text: r.trim(),
          padding: this.measurePadding(r),
          width: i === 0 && columns.length > 1 ? leftColumnWidth : undefined
        };
      }));
    });
    return this.rows[this.rows.length - 1];
  }
  colFromString(text) {
    return {
      text,
      padding: this.measurePadding(text)
    };
  }
  measurePadding(str) {
    const noAnsi = mixin.stripAnsi(str);
    return [0, noAnsi.match(/\s*$/)[0].length, 0, noAnsi.match(/^\s*/)[0].length];
  }
  toString() {
    const lines3 = [];
    this.rows.forEach((row) => {
      this.rowToString(row, lines3);
    });
    return lines3.filter((line) => !line.hidden).map((line) => line.text).join("\n");
  }
  rowToString(row, lines3) {
    this.rasterize(row).forEach((rrow, r) => {
      let str = "";
      rrow.forEach((col, c) => {
        const { width } = row[c];
        const wrapWidth = this.negatePadding(row[c]);
        let ts = col;
        if (wrapWidth > mixin.stringWidth(col)) {
          ts += " ".repeat(wrapWidth - mixin.stringWidth(col));
        }
        if (row[c].align && row[c].align !== "left" && this.wrap) {
          const fn = align[row[c].align];
          ts = fn(ts, wrapWidth);
          if (mixin.stringWidth(ts) < wrapWidth) {
            ts += " ".repeat((width || 0) - mixin.stringWidth(ts) - 1);
          }
        }
        const padding = row[c].padding || [0, 0, 0, 0];
        if (padding[left]) {
          str += " ".repeat(padding[left]);
        }
        str += addBorder(row[c], ts, "| ");
        str += ts;
        str += addBorder(row[c], ts, " |");
        if (padding[right]) {
          str += " ".repeat(padding[right]);
        }
        if (r === 0 && lines3.length > 0) {
          str = this.renderInline(str, lines3[lines3.length - 1]);
        }
      });
      lines3.push({
        text: str.replace(/ +$/, ""),
        span: row.span
      });
    });
    return lines3;
  }
  renderInline(source, previousLine) {
    const match = source.match(/^ */);
    const leadingWhitespace = match ? match[0].length : 0;
    const target = previousLine.text;
    const targetTextWidth = mixin.stringWidth(target.trimRight());
    if (!previousLine.span) {
      return source;
    }
    if (!this.wrap) {
      previousLine.hidden = true;
      return target + source;
    }
    if (leadingWhitespace < targetTextWidth) {
      return source;
    }
    previousLine.hidden = true;
    return target.trimRight() + " ".repeat(leadingWhitespace - targetTextWidth) + source.trimLeft();
  }
  rasterize(row) {
    const rrows = [];
    const widths = this.columnWidths(row);
    let wrapped;
    row.forEach((col, c) => {
      col.width = widths[c];
      if (this.wrap) {
        wrapped = mixin.wrap(col.text, this.negatePadding(col), { hard: true }).split("\n");
      } else {
        wrapped = col.text.split("\n");
      }
      if (col.border) {
        wrapped.unshift("." + "-".repeat(this.negatePadding(col) + 2) + ".");
        wrapped.push("'" + "-".repeat(this.negatePadding(col) + 2) + "'");
      }
      if (col.padding) {
        wrapped.unshift(...new Array(col.padding[top] || 0).fill(""));
        wrapped.push(...new Array(col.padding[bottom] || 0).fill(""));
      }
      wrapped.forEach((str, r) => {
        if (!rrows[r]) {
          rrows.push([]);
        }
        const rrow = rrows[r];
        for (let i = 0;i < c; i++) {
          if (rrow[i] === undefined) {
            rrow.push("");
          }
        }
        rrow.push(str);
      });
    });
    return rrows;
  }
  negatePadding(col) {
    let wrapWidth = col.width || 0;
    if (col.padding) {
      wrapWidth -= (col.padding[left] || 0) + (col.padding[right] || 0);
    }
    if (col.border) {
      wrapWidth -= 4;
    }
    return wrapWidth;
  }
  columnWidths(row) {
    if (!this.wrap) {
      return row.map((col) => {
        return col.width || mixin.stringWidth(col.text);
      });
    }
    let unset = row.length;
    let remainingWidth = this.width;
    const widths = row.map((col) => {
      if (col.width) {
        unset--;
        remainingWidth -= col.width;
        return col.width;
      }
      return;
    });
    const unsetWidth = unset ? Math.floor(remainingWidth / unset) : 0;
    return widths.map((w, i) => {
      if (w === undefined) {
        return Math.max(unsetWidth, _minWidth(row[i]));
      }
      return w;
    });
  }
}
var mixin;

// node_modules/cliui/build/lib/string-utils.js
function stripAnsi(str) {
  return str.replace(ansi, "");
}
function wrap(str, width) {
  const [start4, end] = str.match(ansi) || ["", ""];
  str = stripAnsi(str);
  let wrapped = "";
  for (let i = 0;i < str.length; i++) {
    if (i !== 0 && i % width === 0) {
      wrapped += "\n";
    }
    wrapped += str.charAt(i);
  }
  if (start4 && end) {
    wrapped = `${start4}${wrapped}${end}`;
  }
  return wrapped;
}
var ansi = new RegExp("\x1B(?:\\[(?:\\d+[ABCDEFGJKSTm]|\\d+;\\d+[Hfm]|" + "\\d+;\\d+;\\d+m|6n|s|u|\\?25[lh])|\\w)", "g");

// node_modules/cliui/index.mjs
function ui(opts) {
  return cliui(opts, {
    stringWidth: (str) => {
      return [...str].length;
    },
    stripAnsi,
    wrap
  });
}

// node_modules/escalade/sync/index.mjs
import {dirname, resolve} from "path";
import {readdirSync, statSync} from "fs";
function sync_default(start4, callback) {
  let dir = resolve(".", start4);
  let tmp, stats = statSync(dir);
  if (!stats.isDirectory()) {
    dir = dirname(dir);
  }
  while (true) {
    tmp = callback(dir, readdirSync(dir));
    if (tmp)
      return resolve(dir, tmp);
    dir = dirname(tmp = dir);
    if (tmp === dir)
      break;
  }
}

// node_modules/yargs/lib/platform-shims/esm.mjs
import {inspect} from "util";
import {readFileSync as readFileSync2} from "fs";
import {fileURLToPath} from "url";

// node_modules/yargs-parser/build/lib/index.js
import {format} from "util";
import {normalize, resolve as resolve2} from "path";

// node_modules/yargs-parser/build/lib/string-utils.js
function camelCase(str) {
  const isCamelCase = str !== str.toLowerCase() && str !== str.toUpperCase();
  if (!isCamelCase) {
    str = str.toLowerCase();
  }
  if (str.indexOf("-") === -1 && str.indexOf("_") === -1) {
    return str;
  } else {
    let camelcase = "";
    let nextChrUpper = false;
    const leadingHyphens = str.match(/^-+/);
    for (let i = leadingHyphens ? leadingHyphens[0].length : 0;i < str.length; i++) {
      let chr = str.charAt(i);
      if (nextChrUpper) {
        nextChrUpper = false;
        chr = chr.toUpperCase();
      }
      if (i !== 0 && (chr === "-" || chr === "_")) {
        nextChrUpper = true;
      } else if (chr !== "-" && chr !== "_") {
        camelcase += chr;
      }
    }
    return camelcase;
  }
}
function decamelize(str, joinString) {
  const lowercase = str.toLowerCase();
  joinString = joinString || "-";
  let notCamelcase = "";
  for (let i = 0;i < str.length; i++) {
    const chrLower = lowercase.charAt(i);
    const chrString = str.charAt(i);
    if (chrLower !== chrString && i > 0) {
      notCamelcase += `${joinString}${lowercase.charAt(i)}`;
    } else {
      notCamelcase += chrString;
    }
  }
  return notCamelcase;
}
function looksLikeNumber(x) {
  if (x === null || x === undefined)
    return false;
  if (typeof x === "number")
    return true;
  if (/^0x[0-9a-f]+$/i.test(x))
    return true;
  if (/^0[^.]/.test(x))
    return false;
  return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

// node_modules/yargs-parser/build/lib/tokenize-arg-string.js
function tokenizeArgString(argString) {
  if (Array.isArray(argString)) {
    return argString.map((e) => typeof e !== "string" ? e + "" : e);
  }
  argString = argString.trim();
  let i = 0;
  let prevC = null;
  let c = null;
  let opening = null;
  const args = [];
  for (let ii = 0;ii < argString.length; ii++) {
    prevC = c;
    c = argString.charAt(ii);
    if (c === " " && !opening) {
      if (!(prevC === " ")) {
        i++;
      }
      continue;
    }
    if (c === opening) {
      opening = null;
    } else if ((c === "'" || c === '"') && !opening) {
      opening = c;
    }
    if (!args[i])
      args[i] = "";
    args[i] += c;
  }
  return args;
}

// node_modules/yargs-parser/build/lib/yargs-parser-types.js
var DefaultValuesForTypeKey;
(function(DefaultValuesForTypeKey2) {
  DefaultValuesForTypeKey2["BOOLEAN"] = "boolean";
  DefaultValuesForTypeKey2["STRING"] = "string";
  DefaultValuesForTypeKey2["NUMBER"] = "number";
  DefaultValuesForTypeKey2["ARRAY"] = "array";
})(DefaultValuesForTypeKey || (DefaultValuesForTypeKey = {}));

// node_modules/yargs-parser/build/lib/yargs-parser.js
function combineAliases(aliases) {
  const aliasArrays = [];
  const combined = Object.create(null);
  let change = true;
  Object.keys(aliases).forEach(function(key) {
    aliasArrays.push([].concat(aliases[key], key));
  });
  while (change) {
    change = false;
    for (let i = 0;i < aliasArrays.length; i++) {
      for (let ii = i + 1;ii < aliasArrays.length; ii++) {
        const intersect = aliasArrays[i].filter(function(v) {
          return aliasArrays[ii].indexOf(v) !== -1;
        });
        if (intersect.length) {
          aliasArrays[i] = aliasArrays[i].concat(aliasArrays[ii]);
          aliasArrays.splice(ii, 1);
          change = true;
          break;
        }
      }
    }
  }
  aliasArrays.forEach(function(aliasArray) {
    aliasArray = aliasArray.filter(function(v, i, self) {
      return self.indexOf(v) === i;
    });
    const lastAlias = aliasArray.pop();
    if (lastAlias !== undefined && typeof lastAlias === "string") {
      combined[lastAlias] = aliasArray;
    }
  });
  return combined;
}
function increment(orig) {
  return orig !== undefined ? orig + 1 : 1;
}
function sanitizeKey(key) {
  if (key === "__proto__")
    return "___proto___";
  return key;
}
function stripQuotes(val) {
  return typeof val === "string" && (val[0] === "'" || val[0] === '"') && val[val.length - 1] === val[0] ? val.substring(1, val.length - 1) : val;
}
var mixin2;

class YargsParser {
  constructor(_mixin) {
    mixin2 = _mixin;
  }
  parse(argsInput, options) {
    const opts = Object.assign({
      alias: undefined,
      array: undefined,
      boolean: undefined,
      config: undefined,
      configObjects: undefined,
      configuration: undefined,
      coerce: undefined,
      count: undefined,
      default: undefined,
      envPrefix: undefined,
      narg: undefined,
      normalize: undefined,
      string: undefined,
      number: undefined,
      __: undefined,
      key: undefined
    }, options);
    const args = tokenizeArgString(argsInput);
    const inputIsString = typeof argsInput === "string";
    const aliases = combineAliases(Object.assign(Object.create(null), opts.alias));
    const configuration = Object.assign({
      "boolean-negation": true,
      "camel-case-expansion": true,
      "combine-arrays": false,
      "dot-notation": true,
      "duplicate-arguments-array": true,
      "flatten-duplicate-arrays": true,
      "greedy-arrays": true,
      "halt-at-non-option": false,
      "nargs-eats-options": false,
      "negation-prefix": "no-",
      "parse-numbers": true,
      "parse-positional-numbers": true,
      "populate--": false,
      "set-placeholder-key": false,
      "short-option-groups": true,
      "strip-aliased": false,
      "strip-dashed": false,
      "unknown-options-as-args": false
    }, opts.configuration);
    const defaults = Object.assign(Object.create(null), opts.default);
    const configObjects = opts.configObjects || [];
    const envPrefix = opts.envPrefix;
    const notFlagsOption = configuration["populate--"];
    const notFlagsArgv = notFlagsOption ? "--" : "_";
    const newAliases = Object.create(null);
    const defaulted = Object.create(null);
    const __ = opts.__ || mixin2.format;
    const flags = {
      aliases: Object.create(null),
      arrays: Object.create(null),
      bools: Object.create(null),
      strings: Object.create(null),
      numbers: Object.create(null),
      counts: Object.create(null),
      normalize: Object.create(null),
      configs: Object.create(null),
      nargs: Object.create(null),
      coercions: Object.create(null),
      keys: []
    };
    const negative = /^-([0-9]+(\.[0-9]+)?|\.[0-9]+)$/;
    const negatedBoolean = new RegExp("^--" + configuration["negation-prefix"] + "(.+)");
    [].concat(opts.array || []).filter(Boolean).forEach(function(opt) {
      const key = typeof opt === "object" ? opt.key : opt;
      const assignment = Object.keys(opt).map(function(key2) {
        const arrayFlagKeys = {
          boolean: "bools",
          string: "strings",
          number: "numbers"
        };
        return arrayFlagKeys[key2];
      }).filter(Boolean).pop();
      if (assignment) {
        flags[assignment][key] = true;
      }
      flags.arrays[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.boolean || []).filter(Boolean).forEach(function(key) {
      flags.bools[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.string || []).filter(Boolean).forEach(function(key) {
      flags.strings[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.number || []).filter(Boolean).forEach(function(key) {
      flags.numbers[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.count || []).filter(Boolean).forEach(function(key) {
      flags.counts[key] = true;
      flags.keys.push(key);
    });
    [].concat(opts.normalize || []).filter(Boolean).forEach(function(key) {
      flags.normalize[key] = true;
      flags.keys.push(key);
    });
    if (typeof opts.narg === "object") {
      Object.entries(opts.narg).forEach(([key, value]) => {
        if (typeof value === "number") {
          flags.nargs[key] = value;
          flags.keys.push(key);
        }
      });
    }
    if (typeof opts.coerce === "object") {
      Object.entries(opts.coerce).forEach(([key, value]) => {
        if (typeof value === "function") {
          flags.coercions[key] = value;
          flags.keys.push(key);
        }
      });
    }
    if (typeof opts.config !== "undefined") {
      if (Array.isArray(opts.config) || typeof opts.config === "string") {
        [].concat(opts.config).filter(Boolean).forEach(function(key) {
          flags.configs[key] = true;
        });
      } else if (typeof opts.config === "object") {
        Object.entries(opts.config).forEach(([key, value]) => {
          if (typeof value === "boolean" || typeof value === "function") {
            flags.configs[key] = value;
          }
        });
      }
    }
    extendAliases(opts.key, aliases, opts.default, flags.arrays);
    Object.keys(defaults).forEach(function(key) {
      (flags.aliases[key] || []).forEach(function(alias) {
        defaults[alias] = defaults[key];
      });
    });
    let error = null;
    checkConfiguration();
    let notFlags = [];
    const argv = Object.assign(Object.create(null), { _: [] });
    const argvReturn = {};
    for (let i = 0;i < args.length; i++) {
      const arg = args[i];
      const truncatedArg = arg.replace(/^-{3,}/, "---");
      let broken;
      let key;
      let letters;
      let m2;
      let next;
      let value;
      if (arg !== "--" && /^-/.test(arg) && isUnknownOptionAsArg(arg)) {
        pushPositional(arg);
      } else if (truncatedArg.match(/^---+(=|$)/)) {
        pushPositional(arg);
        continue;
      } else if (arg.match(/^--.+=/) || !configuration["short-option-groups"] && arg.match(/^-.+=/)) {
        m2 = arg.match(/^--?([^=]+)=([\s\S]*)$/);
        if (m2 !== null && Array.isArray(m2) && m2.length >= 3) {
          if (checkAllAliases(m2[1], flags.arrays)) {
            i = eatArray(i, m2[1], args, m2[2]);
          } else if (checkAllAliases(m2[1], flags.nargs) !== false) {
            i = eatNargs(i, m2[1], args, m2[2]);
          } else {
            setArg(m2[1], m2[2], true);
          }
        }
      } else if (arg.match(negatedBoolean) && configuration["boolean-negation"]) {
        m2 = arg.match(negatedBoolean);
        if (m2 !== null && Array.isArray(m2) && m2.length >= 2) {
          key = m2[1];
          setArg(key, checkAllAliases(key, flags.arrays) ? [false] : false);
        }
      } else if (arg.match(/^--.+/) || !configuration["short-option-groups"] && arg.match(/^-[^-]+/)) {
        m2 = arg.match(/^--?(.+)/);
        if (m2 !== null && Array.isArray(m2) && m2.length >= 2) {
          key = m2[1];
          if (checkAllAliases(key, flags.arrays)) {
            i = eatArray(i, key, args);
          } else if (checkAllAliases(key, flags.nargs) !== false) {
            i = eatNargs(i, key, args);
          } else {
            next = args[i + 1];
            if (next !== undefined && (!next.match(/^-/) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
              setArg(key, next);
              i++;
            } else if (/^(true|false)$/.test(next)) {
              setArg(key, next);
              i++;
            } else {
              setArg(key, defaultValue(key));
            }
          }
        }
      } else if (arg.match(/^-.\..+=/)) {
        m2 = arg.match(/^-([^=]+)=([\s\S]*)$/);
        if (m2 !== null && Array.isArray(m2) && m2.length >= 3) {
          setArg(m2[1], m2[2]);
        }
      } else if (arg.match(/^-.\..+/) && !arg.match(negative)) {
        next = args[i + 1];
        m2 = arg.match(/^-(.\..+)/);
        if (m2 !== null && Array.isArray(m2) && m2.length >= 2) {
          key = m2[1];
          if (next !== undefined && !next.match(/^-/) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
            setArg(key, next);
            i++;
          } else {
            setArg(key, defaultValue(key));
          }
        }
      } else if (arg.match(/^-[^-]+/) && !arg.match(negative)) {
        letters = arg.slice(1, -1).split("");
        broken = false;
        for (let j = 0;j < letters.length; j++) {
          next = arg.slice(j + 2);
          if (letters[j + 1] && letters[j + 1] === "=") {
            value = arg.slice(j + 3);
            key = letters[j];
            if (checkAllAliases(key, flags.arrays)) {
              i = eatArray(i, key, args, value);
            } else if (checkAllAliases(key, flags.nargs) !== false) {
              i = eatNargs(i, key, args, value);
            } else {
              setArg(key, value);
            }
            broken = true;
            break;
          }
          if (next === "-") {
            setArg(letters[j], next);
            continue;
          }
          if (/[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) && checkAllAliases(next, flags.bools) === false) {
            setArg(letters[j], next);
            broken = true;
            break;
          }
          if (letters[j + 1] && letters[j + 1].match(/\W/)) {
            setArg(letters[j], next);
            broken = true;
            break;
          } else {
            setArg(letters[j], defaultValue(letters[j]));
          }
        }
        key = arg.slice(-1)[0];
        if (!broken && key !== "-") {
          if (checkAllAliases(key, flags.arrays)) {
            i = eatArray(i, key, args);
          } else if (checkAllAliases(key, flags.nargs) !== false) {
            i = eatNargs(i, key, args);
          } else {
            next = args[i + 1];
            if (next !== undefined && (!/^(-|--)[^-]/.test(next) || next.match(negative)) && !checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts)) {
              setArg(key, next);
              i++;
            } else if (/^(true|false)$/.test(next)) {
              setArg(key, next);
              i++;
            } else {
              setArg(key, defaultValue(key));
            }
          }
        }
      } else if (arg.match(/^-[0-9]$/) && arg.match(negative) && checkAllAliases(arg.slice(1), flags.bools)) {
        key = arg.slice(1);
        setArg(key, defaultValue(key));
      } else if (arg === "--") {
        notFlags = args.slice(i + 1);
        break;
      } else if (configuration["halt-at-non-option"]) {
        notFlags = args.slice(i);
        break;
      } else {
        pushPositional(arg);
      }
    }
    applyEnvVars(argv, true);
    applyEnvVars(argv, false);
    setConfig(argv);
    setConfigObjects();
    applyDefaultsAndAliases(argv, flags.aliases, defaults, true);
    applyCoercions(argv);
    if (configuration["set-placeholder-key"])
      setPlaceholderKeys(argv);
    Object.keys(flags.counts).forEach(function(key) {
      if (!hasKey(argv, key.split(".")))
        setArg(key, 0);
    });
    if (notFlagsOption && notFlags.length)
      argv[notFlagsArgv] = [];
    notFlags.forEach(function(key) {
      argv[notFlagsArgv].push(key);
    });
    if (configuration["camel-case-expansion"] && configuration["strip-dashed"]) {
      Object.keys(argv).filter((key) => key !== "--" && key.includes("-")).forEach((key) => {
        delete argv[key];
      });
    }
    if (configuration["strip-aliased"]) {
      [].concat(...Object.keys(aliases).map((k) => aliases[k])).forEach((alias) => {
        if (configuration["camel-case-expansion"] && alias.includes("-")) {
          delete argv[alias.split(".").map((prop2) => camelCase(prop2)).join(".")];
        }
        delete argv[alias];
      });
    }
    function pushPositional(arg) {
      const maybeCoercedNumber = maybeCoerceNumber("_", arg);
      if (typeof maybeCoercedNumber === "string" || typeof maybeCoercedNumber === "number") {
        argv._.push(maybeCoercedNumber);
      }
    }
    function eatNargs(i, key, args2, argAfterEqualSign) {
      let ii;
      let toEat = checkAllAliases(key, flags.nargs);
      toEat = typeof toEat !== "number" || isNaN(toEat) ? 1 : toEat;
      if (toEat === 0) {
        if (!isUndefined(argAfterEqualSign)) {
          error = Error(__("Argument unexpected for: %s", key));
        }
        setArg(key, defaultValue(key));
        return i;
      }
      let available = isUndefined(argAfterEqualSign) ? 0 : 1;
      if (configuration["nargs-eats-options"]) {
        if (args2.length - (i + 1) + available < toEat) {
          error = Error(__("Not enough arguments following: %s", key));
        }
        available = toEat;
      } else {
        for (ii = i + 1;ii < args2.length; ii++) {
          if (!args2[ii].match(/^-[^0-9]/) || args2[ii].match(negative) || isUnknownOptionAsArg(args2[ii]))
            available++;
          else
            break;
        }
        if (available < toEat)
          error = Error(__("Not enough arguments following: %s", key));
      }
      let consumed = Math.min(available, toEat);
      if (!isUndefined(argAfterEqualSign) && consumed > 0) {
        setArg(key, argAfterEqualSign);
        consumed--;
      }
      for (ii = i + 1;ii < consumed + i + 1; ii++) {
        setArg(key, args2[ii]);
      }
      return i + consumed;
    }
    function eatArray(i, key, args2, argAfterEqualSign) {
      let argsToSet = [];
      let next = argAfterEqualSign || args2[i + 1];
      const nargsCount = checkAllAliases(key, flags.nargs);
      if (checkAllAliases(key, flags.bools) && !/^(true|false)$/.test(next)) {
        argsToSet.push(true);
      } else if (isUndefined(next) || isUndefined(argAfterEqualSign) && /^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next)) {
        if (defaults[key] !== undefined) {
          const defVal = defaults[key];
          argsToSet = Array.isArray(defVal) ? defVal : [defVal];
        }
      } else {
        if (!isUndefined(argAfterEqualSign)) {
          argsToSet.push(processValue(key, argAfterEqualSign, true));
        }
        for (let ii = i + 1;ii < args2.length; ii++) {
          if (!configuration["greedy-arrays"] && argsToSet.length > 0 || nargsCount && typeof nargsCount === "number" && argsToSet.length >= nargsCount)
            break;
          next = args2[ii];
          if (/^-/.test(next) && !negative.test(next) && !isUnknownOptionAsArg(next))
            break;
          i = ii;
          argsToSet.push(processValue(key, next, inputIsString));
        }
      }
      if (typeof nargsCount === "number" && (nargsCount && argsToSet.length < nargsCount || isNaN(nargsCount) && argsToSet.length === 0)) {
        error = Error(__("Not enough arguments following: %s", key));
      }
      setArg(key, argsToSet);
      return i;
    }
    function setArg(key, val, shouldStripQuotes = inputIsString) {
      if (/-/.test(key) && configuration["camel-case-expansion"]) {
        const alias = key.split(".").map(function(prop2) {
          return camelCase(prop2);
        }).join(".");
        addNewAlias(key, alias);
      }
      const value = processValue(key, val, shouldStripQuotes);
      const splitKey = key.split(".");
      setKey(argv, splitKey, value);
      if (flags.aliases[key]) {
        flags.aliases[key].forEach(function(x) {
          const keyProperties = x.split(".");
          setKey(argv, keyProperties, value);
        });
      }
      if (splitKey.length > 1 && configuration["dot-notation"]) {
        (flags.aliases[splitKey[0]] || []).forEach(function(x) {
          let keyProperties = x.split(".");
          const a = [].concat(splitKey);
          a.shift();
          keyProperties = keyProperties.concat(a);
          if (!(flags.aliases[key] || []).includes(keyProperties.join("."))) {
            setKey(argv, keyProperties, value);
          }
        });
      }
      if (checkAllAliases(key, flags.normalize) && !checkAllAliases(key, flags.arrays)) {
        const keys = [key].concat(flags.aliases[key] || []);
        keys.forEach(function(key2) {
          Object.defineProperty(argvReturn, key2, {
            enumerable: true,
            get() {
              return val;
            },
            set(value2) {
              val = typeof value2 === "string" ? mixin2.normalize(value2) : value2;
            }
          });
        });
      }
    }
    function addNewAlias(key, alias) {
      if (!(flags.aliases[key] && flags.aliases[key].length)) {
        flags.aliases[key] = [alias];
        newAliases[alias] = true;
      }
      if (!(flags.aliases[alias] && flags.aliases[alias].length)) {
        addNewAlias(alias, key);
      }
    }
    function processValue(key, val, shouldStripQuotes) {
      if (shouldStripQuotes) {
        val = stripQuotes(val);
      }
      if (checkAllAliases(key, flags.bools) || checkAllAliases(key, flags.counts)) {
        if (typeof val === "string")
          val = val === "true";
      }
      let value = Array.isArray(val) ? val.map(function(v) {
        return maybeCoerceNumber(key, v);
      }) : maybeCoerceNumber(key, val);
      if (checkAllAliases(key, flags.counts) && (isUndefined(value) || typeof value === "boolean")) {
        value = increment();
      }
      if (checkAllAliases(key, flags.normalize) && checkAllAliases(key, flags.arrays)) {
        if (Array.isArray(val))
          value = val.map((val2) => {
            return mixin2.normalize(val2);
          });
        else
          value = mixin2.normalize(val);
      }
      return value;
    }
    function maybeCoerceNumber(key, value) {
      if (!configuration["parse-positional-numbers"] && key === "_")
        return value;
      if (!checkAllAliases(key, flags.strings) && !checkAllAliases(key, flags.bools) && !Array.isArray(value)) {
        const shouldCoerceNumber = looksLikeNumber(value) && configuration["parse-numbers"] && Number.isSafeInteger(Math.floor(parseFloat(`${value}`)));
        if (shouldCoerceNumber || !isUndefined(value) && checkAllAliases(key, flags.numbers)) {
          value = Number(value);
        }
      }
      return value;
    }
    function setConfig(argv2) {
      const configLookup = Object.create(null);
      applyDefaultsAndAliases(configLookup, flags.aliases, defaults);
      Object.keys(flags.configs).forEach(function(configKey) {
        const configPath = argv2[configKey] || configLookup[configKey];
        if (configPath) {
          try {
            let config = null;
            const resolvedConfigPath = mixin2.resolve(mixin2.cwd(), configPath);
            const resolveConfig = flags.configs[configKey];
            if (typeof resolveConfig === "function") {
              try {
                config = resolveConfig(resolvedConfigPath);
              } catch (e) {
                config = e;
              }
              if (config instanceof Error) {
                error = config;
                return;
              }
            } else {
              config = mixin2.require(resolvedConfigPath);
            }
            setConfigObject(config);
          } catch (ex) {
            if (ex.name === "PermissionDenied")
              error = ex;
            else if (argv2[configKey])
              error = Error(__("Invalid JSON config file: %s", configPath));
          }
        }
      });
    }
    function setConfigObject(config, prev) {
      Object.keys(config).forEach(function(key) {
        const value = config[key];
        const fullKey = prev ? prev + "." + key : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value) && configuration["dot-notation"]) {
          setConfigObject(value, fullKey);
        } else {
          if (!hasKey(argv, fullKey.split(".")) || checkAllAliases(fullKey, flags.arrays) && configuration["combine-arrays"]) {
            setArg(fullKey, value);
          }
        }
      });
    }
    function setConfigObjects() {
      if (typeof configObjects !== "undefined") {
        configObjects.forEach(function(configObject) {
          setConfigObject(configObject);
        });
      }
    }
    function applyEnvVars(argv2, configOnly) {
      if (typeof envPrefix === "undefined")
        return;
      const prefix = typeof envPrefix === "string" ? envPrefix : "";
      const env = mixin2.env();
      Object.keys(env).forEach(function(envVar) {
        if (prefix === "" || envVar.lastIndexOf(prefix, 0) === 0) {
          const keys = envVar.split("__").map(function(key, i) {
            if (i === 0) {
              key = key.substring(prefix.length);
            }
            return camelCase(key);
          });
          if ((configOnly && flags.configs[keys.join(".")] || !configOnly) && !hasKey(argv2, keys)) {
            setArg(keys.join("."), env[envVar]);
          }
        }
      });
    }
    function applyCoercions(argv2) {
      let coerce;
      const applied = new Set;
      Object.keys(argv2).forEach(function(key) {
        if (!applied.has(key)) {
          coerce = checkAllAliases(key, flags.coercions);
          if (typeof coerce === "function") {
            try {
              const value = maybeCoerceNumber(key, coerce(argv2[key]));
              [].concat(flags.aliases[key] || [], key).forEach((ali) => {
                applied.add(ali);
                argv2[ali] = value;
              });
            } catch (err) {
              error = err;
            }
          }
        }
      });
    }
    function setPlaceholderKeys(argv2) {
      flags.keys.forEach((key) => {
        if (~key.indexOf("."))
          return;
        if (typeof argv2[key] === "undefined")
          argv2[key] = undefined;
      });
      return argv2;
    }
    function applyDefaultsAndAliases(obj, aliases2, defaults2, canLog = false) {
      Object.keys(defaults2).forEach(function(key) {
        if (!hasKey(obj, key.split("."))) {
          setKey(obj, key.split("."), defaults2[key]);
          if (canLog)
            defaulted[key] = true;
          (aliases2[key] || []).forEach(function(x) {
            if (hasKey(obj, x.split(".")))
              return;
            setKey(obj, x.split("."), defaults2[key]);
          });
        }
      });
    }
    function hasKey(obj, keys) {
      let o = obj;
      if (!configuration["dot-notation"])
        keys = [keys.join(".")];
      keys.slice(0, -1).forEach(function(key2) {
        o = o[key2] || {};
      });
      const key = keys[keys.length - 1];
      if (typeof o !== "object")
        return false;
      else
        return key in o;
    }
    function setKey(obj, keys, value) {
      let o = obj;
      if (!configuration["dot-notation"])
        keys = [keys.join(".")];
      keys.slice(0, -1).forEach(function(key2) {
        key2 = sanitizeKey(key2);
        if (typeof o === "object" && o[key2] === undefined) {
          o[key2] = {};
        }
        if (typeof o[key2] !== "object" || Array.isArray(o[key2])) {
          if (Array.isArray(o[key2])) {
            o[key2].push({});
          } else {
            o[key2] = [o[key2], {}];
          }
          o = o[key2][o[key2].length - 1];
        } else {
          o = o[key2];
        }
      });
      const key = sanitizeKey(keys[keys.length - 1]);
      const isTypeArray = checkAllAliases(keys.join("."), flags.arrays);
      const isValueArray = Array.isArray(value);
      let duplicate = configuration["duplicate-arguments-array"];
      if (!duplicate && checkAllAliases(key, flags.nargs)) {
        duplicate = true;
        if (!isUndefined(o[key]) && flags.nargs[key] === 1 || Array.isArray(o[key]) && o[key].length === flags.nargs[key]) {
          o[key] = undefined;
        }
      }
      if (value === increment()) {
        o[key] = increment(o[key]);
      } else if (Array.isArray(o[key])) {
        if (duplicate && isTypeArray && isValueArray) {
          o[key] = configuration["flatten-duplicate-arrays"] ? o[key].concat(value) : (Array.isArray(o[key][0]) ? o[key] : [o[key]]).concat([value]);
        } else if (!duplicate && Boolean(isTypeArray) === Boolean(isValueArray)) {
          o[key] = value;
        } else {
          o[key] = o[key].concat([value]);
        }
      } else if (o[key] === undefined && isTypeArray) {
        o[key] = isValueArray ? value : [value];
      } else if (duplicate && !(o[key] === undefined || checkAllAliases(key, flags.counts) || checkAllAliases(key, flags.bools))) {
        o[key] = [o[key], value];
      } else {
        o[key] = value;
      }
    }
    function extendAliases(...args2) {
      args2.forEach(function(obj) {
        Object.keys(obj || {}).forEach(function(key) {
          if (flags.aliases[key])
            return;
          flags.aliases[key] = [].concat(aliases[key] || []);
          flags.aliases[key].concat(key).forEach(function(x) {
            if (/-/.test(x) && configuration["camel-case-expansion"]) {
              const c = camelCase(x);
              if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                flags.aliases[key].push(c);
                newAliases[c] = true;
              }
            }
          });
          flags.aliases[key].concat(key).forEach(function(x) {
            if (x.length > 1 && /[A-Z]/.test(x) && configuration["camel-case-expansion"]) {
              const c = decamelize(x, "-");
              if (c !== key && flags.aliases[key].indexOf(c) === -1) {
                flags.aliases[key].push(c);
                newAliases[c] = true;
              }
            }
          });
          flags.aliases[key].forEach(function(x) {
            flags.aliases[x] = [key].concat(flags.aliases[key].filter(function(y2) {
              return x !== y2;
            }));
          });
        });
      });
    }
    function checkAllAliases(key, flag) {
      const toCheck = [].concat(flags.aliases[key] || [], key);
      const keys = Object.keys(flag);
      const setAlias = toCheck.find((key2) => keys.includes(key2));
      return setAlias ? flag[setAlias] : false;
    }
    function hasAnyFlag(key) {
      const flagsKeys = Object.keys(flags);
      const toCheck = [].concat(flagsKeys.map((k) => flags[k]));
      return toCheck.some(function(flag) {
        return Array.isArray(flag) ? flag.includes(key) : flag[key];
      });
    }
    function hasFlagsMatching(arg, ...patterns) {
      const toCheck = [].concat(...patterns);
      return toCheck.some(function(pattern) {
        const match = arg.match(pattern);
        return match && hasAnyFlag(match[1]);
      });
    }
    function hasAllShortFlags(arg) {
      if (arg.match(negative) || !arg.match(/^-[^-]+/)) {
        return false;
      }
      let hasAllFlags = true;
      let next;
      const letters = arg.slice(1).split("");
      for (let j = 0;j < letters.length; j++) {
        next = arg.slice(j + 2);
        if (!hasAnyFlag(letters[j])) {
          hasAllFlags = false;
          break;
        }
        if (letters[j + 1] && letters[j + 1] === "=" || next === "-" || /[A-Za-z]/.test(letters[j]) && /^-?\d+(\.\d*)?(e-?\d+)?$/.test(next) || letters[j + 1] && letters[j + 1].match(/\W/)) {
          break;
        }
      }
      return hasAllFlags;
    }
    function isUnknownOptionAsArg(arg) {
      return configuration["unknown-options-as-args"] && isUnknownOption(arg);
    }
    function isUnknownOption(arg) {
      arg = arg.replace(/^-{3,}/, "--");
      if (arg.match(negative)) {
        return false;
      }
      if (hasAllShortFlags(arg)) {
        return false;
      }
      const flagWithEquals = /^-+([^=]+?)=[\s\S]*$/;
      const normalFlag = /^-+([^=]+?)$/;
      const flagEndingInHyphen = /^-+([^=]+?)-$/;
      const flagEndingInDigits = /^-+([^=]+?\d+)$/;
      const flagEndingInNonWordCharacters = /^-+([^=]+?)\W+.*$/;
      return !hasFlagsMatching(arg, flagWithEquals, negatedBoolean, normalFlag, flagEndingInHyphen, flagEndingInDigits, flagEndingInNonWordCharacters);
    }
    function defaultValue(key) {
      if (!checkAllAliases(key, flags.bools) && !checkAllAliases(key, flags.counts) && `${key}` in defaults) {
        return defaults[key];
      } else {
        return defaultForType(guessType(key));
      }
    }
    function defaultForType(type5) {
      const def = {
        [DefaultValuesForTypeKey.BOOLEAN]: true,
        [DefaultValuesForTypeKey.STRING]: "",
        [DefaultValuesForTypeKey.NUMBER]: undefined,
        [DefaultValuesForTypeKey.ARRAY]: []
      };
      return def[type5];
    }
    function guessType(key) {
      let type5 = DefaultValuesForTypeKey.BOOLEAN;
      if (checkAllAliases(key, flags.strings))
        type5 = DefaultValuesForTypeKey.STRING;
      else if (checkAllAliases(key, flags.numbers))
        type5 = DefaultValuesForTypeKey.NUMBER;
      else if (checkAllAliases(key, flags.bools))
        type5 = DefaultValuesForTypeKey.BOOLEAN;
      else if (checkAllAliases(key, flags.arrays))
        type5 = DefaultValuesForTypeKey.ARRAY;
      return type5;
    }
    function isUndefined(num) {
      return num === undefined;
    }
    function checkConfiguration() {
      Object.keys(flags.counts).find((key) => {
        if (checkAllAliases(key, flags.arrays)) {
          error = Error(__("Invalid configuration: %s, opts.count excludes opts.array.", key));
          return true;
        } else if (checkAllAliases(key, flags.nargs)) {
          error = Error(__("Invalid configuration: %s, opts.count excludes opts.narg.", key));
          return true;
        }
        return false;
      });
    }
    return {
      aliases: Object.assign({}, flags.aliases),
      argv: Object.assign(argvReturn, argv),
      configuration,
      defaulted: Object.assign({}, defaulted),
      error,
      newAliases: Object.assign({}, newAliases)
    };
  }
}

// node_modules/yargs-parser/build/lib/index.js
var _a;
var _b;
var _c;
var minNodeVersion = process && process.env && process.env.YARGS_MIN_NODE_VERSION ? Number(process.env.YARGS_MIN_NODE_VERSION) : 12;
var nodeVersion = (_b = (_a = process === null || process === undefined ? undefined : process.versions) === null || _a === undefined ? undefined : _a.node) !== null && _b !== undefined ? _b : (_c = process === null || process === undefined ? undefined : process.version) === null || _c === undefined ? undefined : _c.slice(1);
if (nodeVersion) {
  const major = Number(nodeVersion.match(/^([^.]+)/)[1]);
  if (major < minNodeVersion) {
    throw Error(`yargs parser supports a minimum Node.js version of ${minNodeVersion}. Read our version support policy: https://github.com/yargs/yargs-parser#supported-nodejs-versions`);
  }
}
var env = process ? process.env : {};
var parser = new YargsParser({
  cwd: process.cwd,
  env: () => {
    return env;
  },
  format,
  normalize,
  resolve: resolve2,
  require: (path2) => {
    if (true) {
      return import.meta.require(path2);
    } else
      ;
  }
});
var yargsParser = function Parser(args, opts) {
  const result = parser.parse(args.slice(), opts);
  return result.argv;
};
yargsParser.detailed = function(args, opts) {
  return parser.parse(args.slice(), opts);
};
yargsParser.camelCase = camelCase;
yargsParser.decamelize = decamelize;
yargsParser.looksLikeNumber = looksLikeNumber;
var lib_default = yargsParser;

// node_modules/yargs/lib/platform-shims/esm.mjs
import {basename, dirname as dirname2, extname, relative, resolve as resolve4} from "path";

// node_modules/yargs/build/lib/utils/process-argv.js
function getProcessArgvBinIndex() {
  if (isBundledElectronApp())
    return 0;
  return 1;
}
function isBundledElectronApp() {
  return isElectronApp() && !process.defaultApp;
}
function isElectronApp() {
  return !!process.versions.electron;
}
function hideBin(argv) {
  return argv.slice(getProcessArgvBinIndex() + 1);
}
function getProcessArgvBin() {
  return process.argv[getProcessArgvBinIndex()];
}

// node_modules/yargs/build/lib/yerror.js
class YError extends Error {
  constructor(msg) {
    super(msg || "yargs error");
    this.name = "YError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, YError);
    }
  }
}

// node_modules/y18n/build/lib/platform-shims/node.js
import {readFileSync, statSync as statSync2, writeFile} from "fs";
import {format as format2} from "util";
import {resolve as resolve3} from "path";
var node_default4 = {
  fs: {
    readFileSync,
    writeFile
  },
  format: format2,
  resolve: resolve3,
  exists: (file) => {
    try {
      return statSync2(file).isFile();
    } catch (err) {
      return false;
    }
  }
};

// node_modules/y18n/build/lib/index.js
function y18n(opts, _shim) {
  shim = _shim;
  const y18n2 = new Y18N(opts);
  return {
    __: y18n2.__.bind(y18n2),
    __n: y18n2.__n.bind(y18n2),
    setLocale: y18n2.setLocale.bind(y18n2),
    getLocale: y18n2.getLocale.bind(y18n2),
    updateLocale: y18n2.updateLocale.bind(y18n2),
    locale: y18n2.locale
  };
}
var shim;

class Y18N {
  constructor(opts) {
    opts = opts || {};
    this.directory = opts.directory || "./locales";
    this.updateFiles = typeof opts.updateFiles === "boolean" ? opts.updateFiles : true;
    this.locale = opts.locale || "en";
    this.fallbackToLanguage = typeof opts.fallbackToLanguage === "boolean" ? opts.fallbackToLanguage : true;
    this.cache = Object.create(null);
    this.writeQueue = [];
  }
  __(...args) {
    if (typeof arguments[0] !== "string") {
      return this._taggedLiteral(arguments[0], ...arguments);
    }
    const str = args.shift();
    let cb = function() {
    };
    if (typeof args[args.length - 1] === "function")
      cb = args.pop();
    cb = cb || function() {
    };
    if (!this.cache[this.locale])
      this._readLocaleFile();
    if (!this.cache[this.locale][str] && this.updateFiles) {
      this.cache[this.locale][str] = str;
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb
      });
    } else {
      cb();
    }
    return shim.format.apply(shim.format, [this.cache[this.locale][str] || str].concat(args));
  }
  __n() {
    const args = Array.prototype.slice.call(arguments);
    const singular = args.shift();
    const plural = args.shift();
    const quantity = args.shift();
    let cb = function() {
    };
    if (typeof args[args.length - 1] === "function")
      cb = args.pop();
    if (!this.cache[this.locale])
      this._readLocaleFile();
    let str = quantity === 1 ? singular : plural;
    if (this.cache[this.locale][singular]) {
      const entry = this.cache[this.locale][singular];
      str = entry[quantity === 1 ? "one" : "other"];
    }
    if (!this.cache[this.locale][singular] && this.updateFiles) {
      this.cache[this.locale][singular] = {
        one: singular,
        other: plural
      };
      this._enqueueWrite({
        directory: this.directory,
        locale: this.locale,
        cb
      });
    } else {
      cb();
    }
    const values = [str];
    if (~str.indexOf("%d"))
      values.push(quantity);
    return shim.format.apply(shim.format, values.concat(args));
  }
  setLocale(locale) {
    this.locale = locale;
  }
  getLocale() {
    return this.locale;
  }
  updateLocale(obj) {
    if (!this.cache[this.locale])
      this._readLocaleFile();
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this.cache[this.locale][key] = obj[key];
      }
    }
  }
  _taggedLiteral(parts, ...args) {
    let str = "";
    parts.forEach(function(part, i) {
      const arg = args[i + 1];
      str += part;
      if (typeof arg !== "undefined") {
        str += "%s";
      }
    });
    return this.__.apply(this, [str].concat([].slice.call(args, 1)));
  }
  _enqueueWrite(work) {
    this.writeQueue.push(work);
    if (this.writeQueue.length === 1)
      this._processWriteQueue();
  }
  _processWriteQueue() {
    const _this = this;
    const work = this.writeQueue[0];
    const directory = work.directory;
    const locale = work.locale;
    const cb = work.cb;
    const languageFile = this._resolveLocaleFile(directory, locale);
    const serializedLocale = JSON.stringify(this.cache[locale], null, 2);
    shim.fs.writeFile(languageFile, serializedLocale, "utf-8", function(err) {
      _this.writeQueue.shift();
      if (_this.writeQueue.length > 0)
        _this._processWriteQueue();
      cb(err);
    });
  }
  _readLocaleFile() {
    let localeLookup = {};
    const languageFile = this._resolveLocaleFile(this.directory, this.locale);
    try {
      if (shim.fs.readFileSync) {
        localeLookup = JSON.parse(shim.fs.readFileSync(languageFile, "utf-8"));
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        err.message = "syntax error in " + languageFile;
      }
      if (err.code === "ENOENT")
        localeLookup = {};
      else
        throw err;
    }
    this.cache[this.locale] = localeLookup;
  }
  _resolveLocaleFile(directory, locale) {
    let file = shim.resolve(directory, "./", locale + ".json");
    if (this.fallbackToLanguage && !this._fileExistsSync(file) && ~locale.lastIndexOf("_")) {
      const languageFile = shim.resolve(directory, "./", locale.split("_")[0] + ".json");
      if (this._fileExistsSync(languageFile))
        file = languageFile;
    }
    return file;
  }
  _fileExistsSync(file) {
    return shim.exists(file);
  }
}

// node_modules/y18n/index.mjs
var y18n2 = (opts) => {
  return y18n(opts, node_default4);
};
var y18n_default = y18n2;

// node_modules/yargs/lib/platform-shims/esm.mjs
var REQUIRE_ERROR = "require is not supported by ESM";
var REQUIRE_DIRECTORY_ERROR = "loading a directory of commands is not supported yet for ESM";
var __dirname2;
try {
  __dirname2 = fileURLToPath(import.meta.url);
} catch (e) {
  __dirname2 = process.cwd();
}
var mainFilename = __dirname2.substring(0, __dirname2.lastIndexOf("node_modules"));
var esm_default = {
  assert: {
    notStrictEqual,
    strictEqual
  },
  cliui: ui,
  findUp: sync_default,
  getEnv: (key) => {
    return process.env[key];
  },
  inspect,
  getCallerFile: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR);
  },
  getProcessArgvBin,
  mainFilename: mainFilename || process.cwd(),
  Parser: lib_default,
  path: {
    basename,
    dirname: dirname2,
    extname,
    relative,
    resolve: resolve4
  },
  process: {
    argv: () => process.argv,
    cwd: process.cwd,
    emitWarning: (warning, type5) => process.emitWarning(warning, type5),
    execPath: () => process.execPath,
    exit: process.exit,
    nextTick: process.nextTick,
    stdColumns: typeof process.stdout.columns !== "undefined" ? process.stdout.columns : null
  },
  readFileSync: readFileSync2,
  require: () => {
    throw new YError(REQUIRE_ERROR);
  },
  requireDirectory: () => {
    throw new YError(REQUIRE_DIRECTORY_ERROR);
  },
  stringWidth: (str) => {
    return [...str].length;
  },
  y18n: y18n_default({
    directory: resolve4(__dirname2, "../../../locales"),
    updateFiles: false
  })
};

// node_modules/yargs/build/lib/typings/common-types.js
function assertNotStrictEqual(actual, expected, shim2, message) {
  shim2.assert.notStrictEqual(actual, expected, message);
}
function assertSingleKey(actual, shim2) {
  shim2.assert.strictEqual(typeof actual, "string");
}
function objectKeys(object) {
  return Object.keys(object);
}

// node_modules/yargs/build/lib/utils/is-promise.js
function isPromise(maybePromise) {
  return !!maybePromise && !!maybePromise.then && typeof maybePromise.then === "function";
}

// node_modules/yargs/build/lib/parse-command.js
function parseCommand(cmd) {
  const extraSpacesStrippedCommand = cmd.replace(/\s{2,}/g, " ");
  const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
  const bregex = /\.*[\][<>]/g;
  const firstCommand = splitCommand.shift();
  if (!firstCommand)
    throw new Error(`No command found in: ${cmd}`);
  const parsedCommand = {
    cmd: firstCommand.replace(bregex, ""),
    demanded: [],
    optional: []
  };
  splitCommand.forEach((cmd2, i) => {
    let variadic = false;
    cmd2 = cmd2.replace(/\s/g, "");
    if (/\.+[\]>]/.test(cmd2) && i === splitCommand.length - 1)
      variadic = true;
    if (/^\[/.test(cmd2)) {
      parsedCommand.optional.push({
        cmd: cmd2.replace(bregex, "").split("|"),
        variadic
      });
    } else {
      parsedCommand.demanded.push({
        cmd: cmd2.replace(bregex, "").split("|"),
        variadic
      });
    }
  });
  return parsedCommand;
}

// node_modules/yargs/build/lib/argsert.js
function argsert(arg1, arg2, arg3) {
  function parseArgs() {
    return typeof arg1 === "object" ? [{ demanded: [], optional: [] }, arg1, arg2] : [
      parseCommand(`cmd ${arg1}`),
      arg2,
      arg3
    ];
  }
  try {
    let position = 0;
    const [parsed, callerArguments, _length] = parseArgs();
    const args = [].slice.call(callerArguments);
    while (args.length && args[args.length - 1] === undefined)
      args.pop();
    const length = _length || args.length;
    if (length < parsed.demanded.length) {
      throw new YError(`Not enough arguments provided. Expected ${parsed.demanded.length} but received ${args.length}.`);
    }
    const totalCommands = parsed.demanded.length + parsed.optional.length;
    if (length > totalCommands) {
      throw new YError(`Too many arguments provided. Expected max ${totalCommands} but received ${length}.`);
    }
    parsed.demanded.forEach((demanded) => {
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = demanded.cmd.filter((type5) => type5 === observedType || type5 === "*");
      if (matchingTypes.length === 0)
        argumentTypeError(observedType, demanded.cmd, position);
      position += 1;
    });
    parsed.optional.forEach((optional) => {
      if (args.length === 0)
        return;
      const arg = args.shift();
      const observedType = guessType(arg);
      const matchingTypes = optional.cmd.filter((type5) => type5 === observedType || type5 === "*");
      if (matchingTypes.length === 0)
        argumentTypeError(observedType, optional.cmd, position);
      position += 1;
    });
  } catch (err) {
    console.warn(err.stack);
  }
}
function guessType(arg) {
  if (Array.isArray(arg)) {
    return "array";
  } else if (arg === null) {
    return "null";
  }
  return typeof arg;
}
function argumentTypeError(observedType, allowedTypes, position) {
  throw new YError(`Invalid ${positionName[position] || "manyith"} argument. Expected ${allowedTypes.join(" or ")} but received ${observedType}.`);
}
var positionName = ["first", "second", "third", "fourth", "fifth", "sixth"];

// node_modules/yargs/build/lib/middleware.js
function commandMiddlewareFactory(commandMiddleware) {
  if (!commandMiddleware)
    return [];
  return commandMiddleware.map((middleware) => {
    middleware.applyBeforeValidation = false;
    return middleware;
  });
}
function applyMiddleware(argv, yargs, middlewares, beforeValidation) {
  return middlewares.reduce((acc, middleware) => {
    if (middleware.applyBeforeValidation !== beforeValidation) {
      return acc;
    }
    if (middleware.mutates) {
      if (middleware.applied)
        return acc;
      middleware.applied = true;
    }
    if (isPromise(acc)) {
      return acc.then((initialObj) => Promise.all([initialObj, middleware(initialObj, yargs)])).then(([initialObj, middlewareObj]) => Object.assign(initialObj, middlewareObj));
    } else {
      const result = middleware(acc, yargs);
      return isPromise(result) ? result.then((middlewareObj) => Object.assign(acc, middlewareObj)) : Object.assign(acc, result);
    }
  }, argv);
}

class GlobalMiddleware {
  constructor(yargs) {
    this.globalMiddleware = [];
    this.frozens = [];
    this.yargs = yargs;
  }
  addMiddleware(callback, applyBeforeValidation, global = true, mutates = false) {
    argsert("<array|function> [boolean] [boolean] [boolean]", [callback, applyBeforeValidation, global], arguments.length);
    if (Array.isArray(callback)) {
      for (let i = 0;i < callback.length; i++) {
        if (typeof callback[i] !== "function") {
          throw Error("middleware must be a function");
        }
        const m2 = callback[i];
        m2.applyBeforeValidation = applyBeforeValidation;
        m2.global = global;
      }
      Array.prototype.push.apply(this.globalMiddleware, callback);
    } else if (typeof callback === "function") {
      const m2 = callback;
      m2.applyBeforeValidation = applyBeforeValidation;
      m2.global = global;
      m2.mutates = mutates;
      this.globalMiddleware.push(callback);
    }
    return this.yargs;
  }
  addCoerceMiddleware(callback, option) {
    const aliases = this.yargs.getAliases();
    this.globalMiddleware = this.globalMiddleware.filter((m2) => {
      const toCheck = [...aliases[option] || [], option];
      if (!m2.option)
        return true;
      else
        return !toCheck.includes(m2.option);
    });
    callback.option = option;
    return this.addMiddleware(callback, true, true, true);
  }
  getMiddleware() {
    return this.globalMiddleware;
  }
  freeze() {
    this.frozens.push([...this.globalMiddleware]);
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    if (frozen !== undefined)
      this.globalMiddleware = frozen;
  }
  reset() {
    this.globalMiddleware = this.globalMiddleware.filter((m2) => m2.global);
  }
}

// node_modules/yargs/build/lib/utils/maybe-async-result.js
function maybeAsyncResult(getResult, resultHandler, errorHandler = (err) => {
  throw err;
}) {
  try {
    const result = isFunction(getResult) ? getResult() : getResult;
    return isPromise(result) ? result.then((result2) => resultHandler(result2)) : resultHandler(result);
  } catch (err) {
    return errorHandler(err);
  }
}
function isFunction(arg) {
  return typeof arg === "function";
}

// node_modules/yargs/build/lib/utils/which-module.js
function whichModule(exported) {
  if (false)
    ;
  for (let i = 0, files = Object.keys(import.meta.require.cache), mod;i < files.length; i++) {
    mod = import.meta.require.cache[files[i]];
    if (mod.exports === exported)
      return mod;
  }
  return null;
}

// node_modules/yargs/build/lib/command.js
function command(usage, validation, globalMiddleware, shim2) {
  return new CommandInstance(usage, validation, globalMiddleware, shim2);
}
function isCommandBuilderDefinition(builder) {
  return typeof builder === "object" && !!builder.builder && typeof builder.handler === "function";
}
function isCommandAndAliases(cmd) {
  return cmd.every((c) => typeof c === "string");
}
function isCommandBuilderCallback(builder) {
  return typeof builder === "function";
}
function isCommandBuilderOptionDefinitions(builder) {
  return typeof builder === "object";
}
function isCommandHandlerDefinition(cmd) {
  return typeof cmd === "object" && !Array.isArray(cmd);
}
var DEFAULT_MARKER = /(^\*)|(^\$0)/;

class CommandInstance {
  constructor(usage, validation, globalMiddleware, shim2) {
    this.requireCache = new Set;
    this.handlers = {};
    this.aliasMap = {};
    this.frozens = [];
    this.shim = shim2;
    this.usage = usage;
    this.globalMiddleware = globalMiddleware;
    this.validation = validation;
  }
  addDirectory(dir, req, callerFile, opts) {
    opts = opts || {};
    if (typeof opts.recurse !== "boolean")
      opts.recurse = false;
    if (!Array.isArray(opts.extensions))
      opts.extensions = ["js"];
    const parentVisit = typeof opts.visit === "function" ? opts.visit : (o) => o;
    opts.visit = (obj, joined, filename) => {
      const visited = parentVisit(obj, joined, filename);
      if (visited) {
        if (this.requireCache.has(joined))
          return visited;
        else
          this.requireCache.add(joined);
        this.addHandler(visited);
      }
      return visited;
    };
    this.shim.requireDirectory({ require: req, filename: callerFile }, dir, opts);
  }
  addHandler(cmd, description, builder, handler, commandMiddleware, deprecated) {
    let aliases = [];
    const middlewares = commandMiddlewareFactory(commandMiddleware);
    handler = handler || (() => {
    });
    if (Array.isArray(cmd)) {
      if (isCommandAndAliases(cmd)) {
        [cmd, ...aliases] = cmd;
      } else {
        for (const command2 of cmd) {
          this.addHandler(command2);
        }
      }
    } else if (isCommandHandlerDefinition(cmd)) {
      let command2 = Array.isArray(cmd.command) || typeof cmd.command === "string" ? cmd.command : this.moduleName(cmd);
      if (cmd.aliases)
        command2 = [].concat(command2).concat(cmd.aliases);
      this.addHandler(command2, this.extractDesc(cmd), cmd.builder, cmd.handler, cmd.middlewares, cmd.deprecated);
      return;
    } else if (isCommandBuilderDefinition(builder)) {
      this.addHandler([cmd].concat(aliases), description, builder.builder, builder.handler, builder.middlewares, builder.deprecated);
      return;
    }
    if (typeof cmd === "string") {
      const parsedCommand = parseCommand(cmd);
      aliases = aliases.map((alias) => parseCommand(alias).cmd);
      let isDefault = false;
      const parsedAliases = [parsedCommand.cmd].concat(aliases).filter((c) => {
        if (DEFAULT_MARKER.test(c)) {
          isDefault = true;
          return false;
        }
        return true;
      });
      if (parsedAliases.length === 0 && isDefault)
        parsedAliases.push("$0");
      if (isDefault) {
        parsedCommand.cmd = parsedAliases[0];
        aliases = parsedAliases.slice(1);
        cmd = cmd.replace(DEFAULT_MARKER, parsedCommand.cmd);
      }
      aliases.forEach((alias) => {
        this.aliasMap[alias] = parsedCommand.cmd;
      });
      if (description !== false) {
        this.usage.command(cmd, description, isDefault, aliases, deprecated);
      }
      this.handlers[parsedCommand.cmd] = {
        original: cmd,
        description,
        handler,
        builder: builder || {},
        middlewares,
        deprecated,
        demanded: parsedCommand.demanded,
        optional: parsedCommand.optional
      };
      if (isDefault)
        this.defaultCommand = this.handlers[parsedCommand.cmd];
    }
  }
  getCommandHandlers() {
    return this.handlers;
  }
  getCommands() {
    return Object.keys(this.handlers).concat(Object.keys(this.aliasMap));
  }
  hasDefaultCommand() {
    return !!this.defaultCommand;
  }
  runCommand(command2, yargs, parsed, commandIndex, helpOnly, helpOrVersionSet) {
    const commandHandler = this.handlers[command2] || this.handlers[this.aliasMap[command2]] || this.defaultCommand;
    const currentContext = yargs.getInternalMethods().getContext();
    const parentCommands = currentContext.commands.slice();
    const isDefaultCommand = !command2;
    if (command2) {
      currentContext.commands.push(command2);
      currentContext.fullCommands.push(commandHandler.original);
    }
    const builderResult = this.applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, parsed.aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet);
    return isPromise(builderResult) ? builderResult.then((result) => this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, result.innerArgv, currentContext, helpOnly, result.aliases, yargs)) : this.applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, builderResult.innerArgv, currentContext, helpOnly, builderResult.aliases, yargs);
  }
  applyBuilderUpdateUsageAndParse(isDefaultCommand, commandHandler, yargs, aliases, parentCommands, commandIndex, helpOnly, helpOrVersionSet) {
    const builder = commandHandler.builder;
    let innerYargs = yargs;
    if (isCommandBuilderCallback(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      const builderOutput = builder(yargs.getInternalMethods().reset(aliases), helpOrVersionSet);
      if (isPromise(builderOutput)) {
        return builderOutput.then((output) => {
          innerYargs = isYargsInstance(output) ? output : yargs;
          return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
        });
      }
    } else if (isCommandBuilderOptionDefinitions(builder)) {
      yargs.getInternalMethods().getUsageInstance().freeze();
      innerYargs = yargs.getInternalMethods().reset(aliases);
      Object.keys(commandHandler.builder).forEach((key) => {
        innerYargs.option(key, builder[key]);
      });
    }
    return this.parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly);
  }
  parseAndUpdateUsage(isDefaultCommand, commandHandler, innerYargs, parentCommands, commandIndex, helpOnly) {
    if (isDefaultCommand)
      innerYargs.getInternalMethods().getUsageInstance().unfreeze(true);
    if (this.shouldUpdateUsage(innerYargs)) {
      innerYargs.getInternalMethods().getUsageInstance().usage(this.usageFromParentCommandsCommandHandler(parentCommands, commandHandler), commandHandler.description);
    }
    const innerArgv = innerYargs.getInternalMethods().runYargsParserAndExecuteCommands(null, undefined, true, commandIndex, helpOnly);
    return isPromise(innerArgv) ? innerArgv.then((argv) => ({
      aliases: innerYargs.parsed.aliases,
      innerArgv: argv
    })) : {
      aliases: innerYargs.parsed.aliases,
      innerArgv
    };
  }
  shouldUpdateUsage(yargs) {
    return !yargs.getInternalMethods().getUsageInstance().getUsageDisabled() && yargs.getInternalMethods().getUsageInstance().getUsage().length === 0;
  }
  usageFromParentCommandsCommandHandler(parentCommands, commandHandler) {
    const c = DEFAULT_MARKER.test(commandHandler.original) ? commandHandler.original.replace(DEFAULT_MARKER, "").trim() : commandHandler.original;
    const pc = parentCommands.filter((c2) => {
      return !DEFAULT_MARKER.test(c2);
    });
    pc.push(c);
    return `\$0 ${pc.join(" ")}`;
  }
  handleValidationAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, aliases, yargs, middlewares, positionalMap) {
    if (!yargs.getInternalMethods().getHasOutput()) {
      const validation = yargs.getInternalMethods().runValidation(aliases, positionalMap, yargs.parsed.error, isDefaultCommand);
      innerArgv = maybeAsyncResult(innerArgv, (result) => {
        validation(result);
        return result;
      });
    }
    if (commandHandler.handler && !yargs.getInternalMethods().getHasOutput()) {
      yargs.getInternalMethods().setHasOutput();
      const populateDoubleDash = !!yargs.getOptions().configuration["populate--"];
      yargs.getInternalMethods().postProcess(innerArgv, populateDoubleDash, false, false);
      innerArgv = applyMiddleware(innerArgv, yargs, middlewares, false);
      innerArgv = maybeAsyncResult(innerArgv, (result) => {
        const handlerResult = commandHandler.handler(result);
        return isPromise(handlerResult) ? handlerResult.then(() => result) : result;
      });
      if (!isDefaultCommand) {
        yargs.getInternalMethods().getUsageInstance().cacheHelpMessage();
      }
      if (isPromise(innerArgv) && !yargs.getInternalMethods().hasParseCallback()) {
        innerArgv.catch((error) => {
          try {
            yargs.getInternalMethods().getUsageInstance().fail(null, error);
          } catch (_err) {
          }
        });
      }
    }
    if (!isDefaultCommand) {
      currentContext.commands.pop();
      currentContext.fullCommands.pop();
    }
    return innerArgv;
  }
  applyMiddlewareAndGetResult(isDefaultCommand, commandHandler, innerArgv, currentContext, helpOnly, aliases, yargs) {
    let positionalMap = {};
    if (helpOnly)
      return innerArgv;
    if (!yargs.getInternalMethods().getHasOutput()) {
      positionalMap = this.populatePositionals(commandHandler, innerArgv, currentContext, yargs);
    }
    const middlewares = this.globalMiddleware.getMiddleware().slice(0).concat(commandHandler.middlewares);
    const maybePromiseArgv = applyMiddleware(innerArgv, yargs, middlewares, true);
    return isPromise(maybePromiseArgv) ? maybePromiseArgv.then((resolvedInnerArgv) => this.handleValidationAndGetResult(isDefaultCommand, commandHandler, resolvedInnerArgv, currentContext, aliases, yargs, middlewares, positionalMap)) : this.handleValidationAndGetResult(isDefaultCommand, commandHandler, maybePromiseArgv, currentContext, aliases, yargs, middlewares, positionalMap);
  }
  populatePositionals(commandHandler, argv, context, yargs) {
    argv._ = argv._.slice(context.commands.length);
    const demanded = commandHandler.demanded.slice(0);
    const optional = commandHandler.optional.slice(0);
    const positionalMap = {};
    this.validation.positionalCount(demanded.length, argv._.length);
    while (demanded.length) {
      const demand = demanded.shift();
      this.populatePositional(demand, argv, positionalMap);
    }
    while (optional.length) {
      const maybe = optional.shift();
      this.populatePositional(maybe, argv, positionalMap);
    }
    argv._ = context.commands.concat(argv._.map((a) => "" + a));
    this.postProcessPositionals(argv, positionalMap, this.cmdToParseOptions(commandHandler.original), yargs);
    return positionalMap;
  }
  populatePositional(positional, argv, positionalMap) {
    const cmd = positional.cmd[0];
    if (positional.variadic) {
      positionalMap[cmd] = argv._.splice(0).map(String);
    } else {
      if (argv._.length)
        positionalMap[cmd] = [String(argv._.shift())];
    }
  }
  cmdToParseOptions(cmdString) {
    const parseOptions = {
      array: [],
      default: {},
      alias: {},
      demand: {}
    };
    const parsed = parseCommand(cmdString);
    parsed.demanded.forEach((d) => {
      const [cmd, ...aliases] = d.cmd;
      if (d.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
      parseOptions.demand[cmd] = true;
    });
    parsed.optional.forEach((o) => {
      const [cmd, ...aliases] = o.cmd;
      if (o.variadic) {
        parseOptions.array.push(cmd);
        parseOptions.default[cmd] = [];
      }
      parseOptions.alias[cmd] = aliases;
    });
    return parseOptions;
  }
  postProcessPositionals(argv, positionalMap, parseOptions, yargs) {
    const options = Object.assign({}, yargs.getOptions());
    options.default = Object.assign(parseOptions.default, options.default);
    for (const key of Object.keys(parseOptions.alias)) {
      options.alias[key] = (options.alias[key] || []).concat(parseOptions.alias[key]);
    }
    options.array = options.array.concat(parseOptions.array);
    options.config = {};
    const unparsed = [];
    Object.keys(positionalMap).forEach((key) => {
      positionalMap[key].map((value) => {
        if (options.configuration["unknown-options-as-args"])
          options.key[key] = true;
        unparsed.push(`--${key}`);
        unparsed.push(value);
      });
    });
    if (!unparsed.length)
      return;
    const config = Object.assign({}, options.configuration, {
      "populate--": false
    });
    const parsed = this.shim.Parser.detailed(unparsed, Object.assign({}, options, {
      configuration: config
    }));
    if (parsed.error) {
      yargs.getInternalMethods().getUsageInstance().fail(parsed.error.message, parsed.error);
    } else {
      const positionalKeys = Object.keys(positionalMap);
      Object.keys(positionalMap).forEach((key) => {
        positionalKeys.push(...parsed.aliases[key]);
      });
      Object.keys(parsed.argv).forEach((key) => {
        if (positionalKeys.includes(key)) {
          if (!positionalMap[key])
            positionalMap[key] = parsed.argv[key];
          if (!this.isInConfigs(yargs, key) && !this.isDefaulted(yargs, key) && Object.prototype.hasOwnProperty.call(argv, key) && Object.prototype.hasOwnProperty.call(parsed.argv, key) && (Array.isArray(argv[key]) || Array.isArray(parsed.argv[key]))) {
            argv[key] = [].concat(argv[key], parsed.argv[key]);
          } else {
            argv[key] = parsed.argv[key];
          }
        }
      });
    }
  }
  isDefaulted(yargs, key) {
    const { default: defaults } = yargs.getOptions();
    return Object.prototype.hasOwnProperty.call(defaults, key) || Object.prototype.hasOwnProperty.call(defaults, this.shim.Parser.camelCase(key));
  }
  isInConfigs(yargs, key) {
    const { configObjects } = yargs.getOptions();
    return configObjects.some((c) => Object.prototype.hasOwnProperty.call(c, key)) || configObjects.some((c) => Object.prototype.hasOwnProperty.call(c, this.shim.Parser.camelCase(key)));
  }
  runDefaultBuilderOn(yargs) {
    if (!this.defaultCommand)
      return;
    if (this.shouldUpdateUsage(yargs)) {
      const commandString = DEFAULT_MARKER.test(this.defaultCommand.original) ? this.defaultCommand.original : this.defaultCommand.original.replace(/^[^[\]<>]*/, "$0 ");
      yargs.getInternalMethods().getUsageInstance().usage(commandString, this.defaultCommand.description);
    }
    const builder = this.defaultCommand.builder;
    if (isCommandBuilderCallback(builder)) {
      return builder(yargs, true);
    } else if (!isCommandBuilderDefinition(builder)) {
      Object.keys(builder).forEach((key) => {
        yargs.option(key, builder[key]);
      });
    }
    return;
  }
  moduleName(obj) {
    const mod = whichModule(obj);
    if (!mod)
      throw new Error(`No command name given for module: ${this.shim.inspect(obj)}`);
    return this.commandFromFilename(mod.filename);
  }
  commandFromFilename(filename) {
    return this.shim.path.basename(filename, this.shim.path.extname(filename));
  }
  extractDesc({ describe, description, desc }) {
    for (const test of [describe, description, desc]) {
      if (typeof test === "string" || test === false)
        return test;
      assertNotStrictEqual(test, true, this.shim);
    }
    return false;
  }
  freeze() {
    this.frozens.push({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    });
  }
  unfreeze() {
    const frozen = this.frozens.pop();
    assertNotStrictEqual(frozen, undefined, this.shim);
    ({
      handlers: this.handlers,
      aliasMap: this.aliasMap,
      defaultCommand: this.defaultCommand
    } = frozen);
  }
  reset() {
    this.handlers = {};
    this.aliasMap = {};
    this.defaultCommand = undefined;
    this.requireCache = new Set;
    return this;
  }
}

// node_modules/yargs/build/lib/utils/obj-filter.js
function objFilter(original = {}, filter = () => true) {
  const obj = {};
  objectKeys(original).forEach((key) => {
    if (filter(key, original[key])) {
      obj[key] = original[key];
    }
  });
  return obj;
}

// node_modules/yargs/build/lib/utils/set-blocking.js
function setBlocking(blocking) {
  if (typeof process === "undefined")
    return;
  [process.stdout, process.stderr].forEach((_stream) => {
    const stream = _stream;
    if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === "function") {
      stream._handle.setBlocking(blocking);
    }
  });
}

// node_modules/yargs/build/lib/usage.js
function isBoolean(fail) {
  return typeof fail === "boolean";
}
function usage(yargs, shim2) {
  const __ = shim2.y18n.__;
  const self = {};
  const fails = [];
  self.failFn = function failFn(f) {
    fails.push(f);
  };
  let failMessage = null;
  let globalFailMessage = null;
  let showHelpOnFail = true;
  self.showHelpOnFail = function showHelpOnFailFn(arg1 = true, arg2) {
    const [enabled, message] = typeof arg1 === "string" ? [true, arg1] : [arg1, arg2];
    if (yargs.getInternalMethods().isGlobalContext()) {
      globalFailMessage = message;
    }
    failMessage = message;
    showHelpOnFail = enabled;
    return self;
  };
  let failureOutput = false;
  self.fail = function fail(msg, err) {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (fails.length) {
      for (let i = fails.length - 1;i >= 0; --i) {
        const fail = fails[i];
        if (isBoolean(fail)) {
          if (err)
            throw err;
          else if (msg)
            throw Error(msg);
        } else {
          fail(msg, err, self);
        }
      }
    } else {
      if (yargs.getExitProcess())
        setBlocking(true);
      if (!failureOutput) {
        failureOutput = true;
        if (showHelpOnFail) {
          yargs.showHelp("error");
          logger.error();
        }
        if (msg || err)
          logger.error(msg || err);
        const globalOrCommandFailMessage = failMessage || globalFailMessage;
        if (globalOrCommandFailMessage) {
          if (msg || err)
            logger.error("");
          logger.error(globalOrCommandFailMessage);
        }
      }
      err = err || new YError(msg);
      if (yargs.getExitProcess()) {
        return yargs.exit(1);
      } else if (yargs.getInternalMethods().hasParseCallback()) {
        return yargs.exit(1, err);
      } else {
        throw err;
      }
    }
  };
  let usages = [];
  let usageDisabled = false;
  self.usage = (msg, description) => {
    if (msg === null) {
      usageDisabled = true;
      usages = [];
      return self;
    }
    usageDisabled = false;
    usages.push([msg, description || ""]);
    return self;
  };
  self.getUsage = () => {
    return usages;
  };
  self.getUsageDisabled = () => {
    return usageDisabled;
  };
  self.getPositionalGroupName = () => {
    return __("Positionals:");
  };
  let examples = [];
  self.example = (cmd, description) => {
    examples.push([cmd, description || ""]);
  };
  let commands = [];
  self.command = function command(cmd, description, isDefault, aliases, deprecated = false) {
    if (isDefault) {
      commands = commands.map((cmdArray) => {
        cmdArray[2] = false;
        return cmdArray;
      });
    }
    commands.push([cmd, description || "", isDefault, aliases, deprecated]);
  };
  self.getCommands = () => commands;
  let descriptions = {};
  self.describe = function describe(keyOrKeys, desc) {
    if (Array.isArray(keyOrKeys)) {
      keyOrKeys.forEach((k) => {
        self.describe(k, desc);
      });
    } else if (typeof keyOrKeys === "object") {
      Object.keys(keyOrKeys).forEach((k) => {
        self.describe(k, keyOrKeys[k]);
      });
    } else {
      descriptions[keyOrKeys] = desc;
    }
  };
  self.getDescriptions = () => descriptions;
  let epilogs = [];
  self.epilog = (msg) => {
    epilogs.push(msg);
  };
  let wrapSet = false;
  let wrap2;
  self.wrap = (cols) => {
    wrapSet = true;
    wrap2 = cols;
  };
  self.getWrap = () => {
    if (shim2.getEnv("YARGS_DISABLE_WRAP")) {
      return null;
    }
    if (!wrapSet) {
      wrap2 = windowWidth();
      wrapSet = true;
    }
    return wrap2;
  };
  const deferY18nLookupPrefix = "__yargsString__:";
  self.deferY18nLookup = (str) => deferY18nLookupPrefix + str;
  self.help = function help() {
    if (cachedHelpMessage)
      return cachedHelpMessage;
    normalizeAliases();
    const base$0 = yargs.customScriptName ? yargs.$0 : shim2.path.basename(yargs.$0);
    const demandedOptions = yargs.getDemandedOptions();
    const demandedCommands = yargs.getDemandedCommands();
    const deprecatedOptions = yargs.getDeprecatedOptions();
    const groups = yargs.getGroups();
    const options = yargs.getOptions();
    let keys = [];
    keys = keys.concat(Object.keys(descriptions));
    keys = keys.concat(Object.keys(demandedOptions));
    keys = keys.concat(Object.keys(demandedCommands));
    keys = keys.concat(Object.keys(options.default));
    keys = keys.filter(filterHiddenOptions);
    keys = Object.keys(keys.reduce((acc, key) => {
      if (key !== "_")
        acc[key] = true;
      return acc;
    }, {}));
    const theWrap = self.getWrap();
    const ui2 = shim2.cliui({
      width: theWrap,
      wrap: !!theWrap
    });
    if (!usageDisabled) {
      if (usages.length) {
        usages.forEach((usage2) => {
          ui2.div({ text: `${usage2[0].replace(/\$0/g, base$0)}` });
          if (usage2[1]) {
            ui2.div({ text: `${usage2[1]}`, padding: [1, 0, 0, 0] });
          }
        });
        ui2.div();
      } else if (commands.length) {
        let u = null;
        if (demandedCommands._) {
          u = `${base$0} <${__("command")}>\n`;
        } else {
          u = `${base$0} [${__("command")}]\n`;
        }
        ui2.div(`${u}`);
      }
    }
    if (commands.length > 1 || commands.length === 1 && !commands[0][2]) {
      ui2.div(__("Commands:"));
      const context = yargs.getInternalMethods().getContext();
      const parentCommands = context.commands.length ? `${context.commands.join(" ")} ` : "";
      if (yargs.getInternalMethods().getParserConfiguration()["sort-commands"] === true) {
        commands = commands.sort((a, b2) => a[0].localeCompare(b2[0]));
      }
      const prefix = base$0 ? `${base$0} ` : "";
      commands.forEach((command2) => {
        const commandString = `${prefix}${parentCommands}${command2[0].replace(/^\$0 ?/, "")}`;
        ui2.span({
          text: commandString,
          padding: [0, 2, 0, 2],
          width: maxWidth(commands, theWrap, `${base$0}${parentCommands}`) + 4
        }, { text: command2[1] });
        const hints = [];
        if (command2[2])
          hints.push(`[${__("default")}]`);
        if (command2[3] && command2[3].length) {
          hints.push(`[${__("aliases:")} ${command2[3].join(", ")}]`);
        }
        if (command2[4]) {
          if (typeof command2[4] === "string") {
            hints.push(`[${__("deprecated: %s", command2[4])}]`);
          } else {
            hints.push(`[${__("deprecated")}]`);
          }
        }
        if (hints.length) {
          ui2.div({
            text: hints.join(" "),
            padding: [0, 0, 0, 2],
            align: "right"
          });
        } else {
          ui2.div();
        }
      });
      ui2.div();
    }
    const aliasKeys = (Object.keys(options.alias) || []).concat(Object.keys(yargs.parsed.newAliases) || []);
    keys = keys.filter((key) => !yargs.parsed.newAliases[key] && aliasKeys.every((alias) => (options.alias[alias] || []).indexOf(key) === -1));
    const defaultGroup = __("Options:");
    if (!groups[defaultGroup])
      groups[defaultGroup] = [];
    addUngroupedKeys(keys, options.alias, groups, defaultGroup);
    const isLongSwitch = (sw) => /^--/.test(getText(sw));
    const displayedGroups = Object.keys(groups).filter((groupName) => groups[groupName].length > 0).map((groupName) => {
      const normalizedKeys = groups[groupName].filter(filterHiddenOptions).map((key) => {
        if (aliasKeys.includes(key))
          return key;
        for (let i = 0, aliasKey;(aliasKey = aliasKeys[i]) !== undefined; i++) {
          if ((options.alias[aliasKey] || []).includes(key))
            return aliasKey;
        }
        return key;
      });
      return { groupName, normalizedKeys };
    }).filter(({ normalizedKeys }) => normalizedKeys.length > 0).map(({ groupName, normalizedKeys }) => {
      const switches = normalizedKeys.reduce((acc, key) => {
        acc[key] = [key].concat(options.alias[key] || []).map((sw) => {
          if (groupName === self.getPositionalGroupName())
            return sw;
          else {
            return (/^[0-9]$/.test(sw) ? options.boolean.includes(key) ? "-" : "--" : sw.length > 1 ? "--" : "-") + sw;
          }
        }).sort((sw1, sw2) => isLongSwitch(sw1) === isLongSwitch(sw2) ? 0 : isLongSwitch(sw1) ? 1 : -1).join(", ");
        return acc;
      }, {});
      return { groupName, normalizedKeys, switches };
    });
    const shortSwitchesUsed = displayedGroups.filter(({ groupName }) => groupName !== self.getPositionalGroupName()).some(({ normalizedKeys, switches }) => !normalizedKeys.every((key) => isLongSwitch(switches[key])));
    if (shortSwitchesUsed) {
      displayedGroups.filter(({ groupName }) => groupName !== self.getPositionalGroupName()).forEach(({ normalizedKeys, switches }) => {
        normalizedKeys.forEach((key) => {
          if (isLongSwitch(switches[key])) {
            switches[key] = addIndentation(switches[key], "-x, ".length);
          }
        });
      });
    }
    displayedGroups.forEach(({ groupName, normalizedKeys, switches }) => {
      ui2.div(groupName);
      normalizedKeys.forEach((key) => {
        const kswitch = switches[key];
        let desc = descriptions[key] || "";
        let type5 = null;
        if (desc.includes(deferY18nLookupPrefix))
          desc = __(desc.substring(deferY18nLookupPrefix.length));
        if (options.boolean.includes(key))
          type5 = `[${__("boolean")}]`;
        if (options.count.includes(key))
          type5 = `[${__("count")}]`;
        if (options.string.includes(key))
          type5 = `[${__("string")}]`;
        if (options.normalize.includes(key))
          type5 = `[${__("string")}]`;
        if (options.array.includes(key))
          type5 = `[${__("array")}]`;
        if (options.number.includes(key))
          type5 = `[${__("number")}]`;
        const deprecatedExtra = (deprecated) => typeof deprecated === "string" ? `[${__("deprecated: %s", deprecated)}]` : `[${__("deprecated")}]`;
        const extra = [
          key in deprecatedOptions ? deprecatedExtra(deprecatedOptions[key]) : null,
          type5,
          key in demandedOptions ? `[${__("required")}]` : null,
          options.choices && options.choices[key] ? `[${__("choices:")} ${self.stringifiedValues(options.choices[key])}]` : null,
          defaultString(options.default[key], options.defaultDescription[key])
        ].filter(Boolean).join(" ");
        ui2.span({
          text: getText(kswitch),
          padding: [0, 2, 0, 2 + getIndentation(kswitch)],
          width: maxWidth(switches, theWrap) + 4
        }, desc);
        const shouldHideOptionExtras = yargs.getInternalMethods().getUsageConfiguration()["hide-types"] === true;
        if (extra && !shouldHideOptionExtras)
          ui2.div({ text: extra, padding: [0, 0, 0, 2], align: "right" });
        else
          ui2.div();
      });
      ui2.div();
    });
    if (examples.length) {
      ui2.div(__("Examples:"));
      examples.forEach((example) => {
        example[0] = example[0].replace(/\$0/g, base$0);
      });
      examples.forEach((example) => {
        if (example[1] === "") {
          ui2.div({
            text: example[0],
            padding: [0, 2, 0, 2]
          });
        } else {
          ui2.div({
            text: example[0],
            padding: [0, 2, 0, 2],
            width: maxWidth(examples, theWrap) + 4
          }, {
            text: example[1]
          });
        }
      });
      ui2.div();
    }
    if (epilogs.length > 0) {
      const e = epilogs.map((epilog) => epilog.replace(/\$0/g, base$0)).join("\n");
      ui2.div(`${e}\n`);
    }
    return ui2.toString().replace(/\s*$/, "");
  };
  function maxWidth(table, theWrap, modifier) {
    let width = 0;
    if (!Array.isArray(table)) {
      table = Object.values(table).map((v) => [v]);
    }
    table.forEach((v) => {
      width = Math.max(shim2.stringWidth(modifier ? `${modifier} ${getText(v[0])}` : getText(v[0])) + getIndentation(v[0]), width);
    });
    if (theWrap)
      width = Math.min(width, parseInt((theWrap * 0.5).toString(), 10));
    return width;
  }
  function normalizeAliases() {
    const demandedOptions = yargs.getDemandedOptions();
    const options = yargs.getOptions();
    (Object.keys(options.alias) || []).forEach((key) => {
      options.alias[key].forEach((alias) => {
        if (descriptions[alias])
          self.describe(key, descriptions[alias]);
        if (alias in demandedOptions)
          yargs.demandOption(key, demandedOptions[alias]);
        if (options.boolean.includes(alias))
          yargs.boolean(key);
        if (options.count.includes(alias))
          yargs.count(key);
        if (options.string.includes(alias))
          yargs.string(key);
        if (options.normalize.includes(alias))
          yargs.normalize(key);
        if (options.array.includes(alias))
          yargs.array(key);
        if (options.number.includes(alias))
          yargs.number(key);
      });
    });
  }
  let cachedHelpMessage;
  self.cacheHelpMessage = function() {
    cachedHelpMessage = this.help();
  };
  self.clearCachedHelpMessage = function() {
    cachedHelpMessage = undefined;
  };
  self.hasCachedHelpMessage = function() {
    return !!cachedHelpMessage;
  };
  function addUngroupedKeys(keys, aliases, groups, defaultGroup) {
    let groupedKeys = [];
    let toCheck = null;
    Object.keys(groups).forEach((group) => {
      groupedKeys = groupedKeys.concat(groups[group]);
    });
    keys.forEach((key) => {
      toCheck = [key].concat(aliases[key]);
      if (!toCheck.some((k) => groupedKeys.indexOf(k) !== -1)) {
        groups[defaultGroup].push(key);
      }
    });
    return groupedKeys;
  }
  function filterHiddenOptions(key) {
    return yargs.getOptions().hiddenOptions.indexOf(key) < 0 || yargs.parsed.argv[yargs.getOptions().showHiddenOpt];
  }
  self.showHelp = (level) => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level)
      level = "error";
    const emit = typeof level === "function" ? level : logger[level];
    emit(self.help());
  };
  self.functionDescription = (fn) => {
    const description = fn.name ? shim2.Parser.decamelize(fn.name, "-") : __("generated-value");
    return ["(", description, ")"].join("");
  };
  self.stringifiedValues = function stringifiedValues(values, separator) {
    let string = "";
    const sep = separator || ", ";
    const array4 = [].concat(values);
    if (!values || !array4.length)
      return string;
    array4.forEach((value) => {
      if (string.length)
        string += sep;
      string += JSON.stringify(value);
    });
    return string;
  };
  function defaultString(value, defaultDescription) {
    let string = `[${__("default:")} `;
    if (value === undefined && !defaultDescription)
      return null;
    if (defaultDescription) {
      string += defaultDescription;
    } else {
      switch (typeof value) {
        case "string":
          string += `"${value}"`;
          break;
        case "object":
          string += JSON.stringify(value);
          break;
        default:
          string += value;
      }
    }
    return `${string}]`;
  }
  function windowWidth() {
    const maxWidth2 = 80;
    if (shim2.process.stdColumns) {
      return Math.min(maxWidth2, shim2.process.stdColumns);
    } else {
      return maxWidth2;
    }
  }
  let version = null;
  self.version = (ver) => {
    version = ver;
  };
  self.showVersion = (level) => {
    const logger = yargs.getInternalMethods().getLoggerInstance();
    if (!level)
      level = "error";
    const emit = typeof level === "function" ? level : logger[level];
    emit(version);
  };
  self.reset = function reset(localLookup) {
    failMessage = null;
    failureOutput = false;
    usages = [];
    usageDisabled = false;
    epilogs = [];
    examples = [];
    commands = [];
    descriptions = objFilter(descriptions, (k) => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      failMessage,
      failureOutput,
      usages,
      usageDisabled,
      epilogs,
      examples,
      commands,
      descriptions
    });
  };
  self.unfreeze = function unfreeze(defaultCommand = false) {
    const frozen = frozens.pop();
    if (!frozen)
      return;
    if (defaultCommand) {
      descriptions = { ...frozen.descriptions, ...descriptions };
      commands = [...frozen.commands, ...commands];
      usages = [...frozen.usages, ...usages];
      examples = [...frozen.examples, ...examples];
      epilogs = [...frozen.epilogs, ...epilogs];
    } else {
      ({
        failMessage,
        failureOutput,
        usages,
        usageDisabled,
        epilogs,
        examples,
        commands,
        descriptions
      } = frozen);
    }
  };
  return self;
}
function isIndentedText(text) {
  return typeof text === "object";
}
function addIndentation(text, indent) {
  return isIndentedText(text) ? { text: text.text, indentation: text.indentation + indent } : { text, indentation: indent };
}
function getIndentation(text) {
  return isIndentedText(text) ? text.indentation : 0;
}
function getText(text) {
  return isIndentedText(text) ? text.text : text;
}

// node_modules/yargs/build/lib/completion-templates.js
var completionShTemplate = `###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.bashrc
#    or {{app_path}} {{completion_command}} >> ~/.bash_profile on OSX.
#
_{{app_name}}_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    type_list=$({{app_path}} --get-yargs-completions "\${args[@]}")

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o bashdefault -o default -F _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;
var completionZshTemplate = `#compdef {{app_name}}
###-begin-{{app_name}}-completions-###
#
# yargs command completion script
#
# Installation: {{app_path}} {{completion_command}} >> ~/.zshrc
#    or {{app_path}} {{completion_command}} >> ~/.zprofile on OSX.
#
_{{app_name}}_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" {{app_path}} --get-yargs-completions "\${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _{{app_name}}_yargs_completions {{app_name}}
###-end-{{app_name}}-completions-###
`;

// node_modules/yargs/build/lib/completion.js
function completion(yargs, usage2, command3, shim2) {
  return new Completion(yargs, usage2, command3, shim2);
}
function isSyncCompletionFunction(completionFunction) {
  return completionFunction.length < 3;
}
function isFallbackCompletionFunction(completionFunction) {
  return completionFunction.length > 3;
}

class Completion {
  constructor(yargs, usage2, command3, shim2) {
    var _a2, _b2, _c2;
    this.yargs = yargs;
    this.usage = usage2;
    this.command = command3;
    this.shim = shim2;
    this.completionKey = "get-yargs-completions";
    this.aliases = null;
    this.customCompletionFunction = null;
    this.indexAfterLastReset = 0;
    this.zshShell = (_c2 = ((_a2 = this.shim.getEnv("SHELL")) === null || _a2 === undefined ? undefined : _a2.includes("zsh")) || ((_b2 = this.shim.getEnv("ZSH_NAME")) === null || _b2 === undefined ? undefined : _b2.includes("zsh"))) !== null && _c2 !== undefined ? _c2 : false;
  }
  defaultCompletion(args, argv, current, done) {
    const handlers = this.command.getCommandHandlers();
    for (let i = 0, ii = args.length;i < ii; ++i) {
      if (handlers[args[i]] && handlers[args[i]].builder) {
        const builder = handlers[args[i]].builder;
        if (isCommandBuilderCallback(builder)) {
          this.indexAfterLastReset = i + 1;
          const y2 = this.yargs.getInternalMethods().reset();
          builder(y2, true);
          return y2.argv;
        }
      }
    }
    const completions = [];
    this.commandCompletions(completions, args, current);
    this.optionCompletions(completions, args, argv, current);
    this.choicesFromOptionsCompletions(completions, args, argv, current);
    this.choicesFromPositionalsCompletions(completions, args, argv, current);
    done(null, completions);
  }
  commandCompletions(completions, args, current) {
    const parentCommands = this.yargs.getInternalMethods().getContext().commands;
    if (!current.match(/^-/) && parentCommands[parentCommands.length - 1] !== current && !this.previousArgHasChoices(args)) {
      this.usage.getCommands().forEach((usageCommand) => {
        const commandName = parseCommand(usageCommand[0]).cmd;
        if (args.indexOf(commandName) === -1) {
          if (!this.zshShell) {
            completions.push(commandName);
          } else {
            const desc = usageCommand[1] || "";
            completions.push(commandName.replace(/:/g, "\\:") + ":" + desc);
          }
        }
      });
    }
  }
  optionCompletions(completions, args, argv, current) {
    if ((current.match(/^-/) || current === "" && completions.length === 0) && !this.previousArgHasChoices(args)) {
      const options = this.yargs.getOptions();
      const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
      Object.keys(options.key).forEach((key) => {
        const negable = !!options.configuration["boolean-negation"] && options.boolean.includes(key);
        const isPositionalKey = positionalKeys.includes(key);
        if (!isPositionalKey && !options.hiddenOptions.includes(key) && !this.argsContainKey(args, key, negable)) {
          this.completeOptionKey(key, completions, current, negable && !!options.default[key]);
        }
      });
    }
  }
  choicesFromOptionsCompletions(completions, args, argv, current) {
    if (this.previousArgHasChoices(args)) {
      const choices = this.getPreviousArgChoices(args);
      if (choices && choices.length > 0) {
        completions.push(...choices.map((c) => c.replace(/:/g, "\\:")));
      }
    }
  }
  choicesFromPositionalsCompletions(completions, args, argv, current) {
    if (current === "" && completions.length > 0 && this.previousArgHasChoices(args)) {
      return;
    }
    const positionalKeys = this.yargs.getGroups()[this.usage.getPositionalGroupName()] || [];
    const offset = Math.max(this.indexAfterLastReset, this.yargs.getInternalMethods().getContext().commands.length + 1);
    const positionalKey = positionalKeys[argv._.length - offset - 1];
    if (!positionalKey) {
      return;
    }
    const choices = this.yargs.getOptions().choices[positionalKey] || [];
    for (const choice of choices) {
      if (choice.startsWith(current)) {
        completions.push(choice.replace(/:/g, "\\:"));
      }
    }
  }
  getPreviousArgChoices(args) {
    if (args.length < 1)
      return;
    let previousArg = args[args.length - 1];
    let filter = "";
    if (!previousArg.startsWith("-") && args.length > 1) {
      filter = previousArg;
      previousArg = args[args.length - 2];
    }
    if (!previousArg.startsWith("-"))
      return;
    const previousArgKey = previousArg.replace(/^-+/, "");
    const options = this.yargs.getOptions();
    const possibleAliases = [
      previousArgKey,
      ...this.yargs.getAliases()[previousArgKey] || []
    ];
    let choices;
    for (const possibleAlias of possibleAliases) {
      if (Object.prototype.hasOwnProperty.call(options.key, possibleAlias) && Array.isArray(options.choices[possibleAlias])) {
        choices = options.choices[possibleAlias];
        break;
      }
    }
    if (choices) {
      return choices.filter((choice) => !filter || choice.startsWith(filter));
    }
  }
  previousArgHasChoices(args) {
    const choices = this.getPreviousArgChoices(args);
    return choices !== undefined && choices.length > 0;
  }
  argsContainKey(args, key, negable) {
    const argsContains = (s) => args.indexOf((/^[^0-9]$/.test(s) ? "-" : "--") + s) !== -1;
    if (argsContains(key))
      return true;
    if (negable && argsContains(`no-${key}`))
      return true;
    if (this.aliases) {
      for (const alias of this.aliases[key]) {
        if (argsContains(alias))
          return true;
      }
    }
    return false;
  }
  completeOptionKey(key, completions, current, negable) {
    var _a2, _b2, _c2, _d;
    let keyWithDesc = key;
    if (this.zshShell) {
      const descs = this.usage.getDescriptions();
      const aliasKey = (_b2 = (_a2 = this === null || this === undefined ? undefined : this.aliases) === null || _a2 === undefined ? undefined : _a2[key]) === null || _b2 === undefined ? undefined : _b2.find((alias) => {
        const desc2 = descs[alias];
        return typeof desc2 === "string" && desc2.length > 0;
      });
      const descFromAlias = aliasKey ? descs[aliasKey] : undefined;
      const desc = (_d = (_c2 = descs[key]) !== null && _c2 !== undefined ? _c2 : descFromAlias) !== null && _d !== undefined ? _d : "";
      keyWithDesc = `${key.replace(/:/g, "\\:")}:${desc.replace("__yargsString__:", "").replace(/(\r\n|\n|\r)/gm, " ")}`;
    }
    const startsByTwoDashes = (s) => /^--/.test(s);
    const isShortOption = (s) => /^[^0-9]$/.test(s);
    const dashes = !startsByTwoDashes(current) && isShortOption(key) ? "-" : "--";
    completions.push(dashes + keyWithDesc);
    if (negable) {
      completions.push(dashes + "no-" + keyWithDesc);
    }
  }
  customCompletion(args, argv, current, done) {
    assertNotStrictEqual(this.customCompletionFunction, null, this.shim);
    if (isSyncCompletionFunction(this.customCompletionFunction)) {
      const result = this.customCompletionFunction(current, argv);
      if (isPromise(result)) {
        return result.then((list) => {
          this.shim.process.nextTick(() => {
            done(null, list);
          });
        }).catch((err) => {
          this.shim.process.nextTick(() => {
            done(err, undefined);
          });
        });
      }
      return done(null, result);
    } else if (isFallbackCompletionFunction(this.customCompletionFunction)) {
      return this.customCompletionFunction(current, argv, (onCompleted = done) => this.defaultCompletion(args, argv, current, onCompleted), (completions) => {
        done(null, completions);
      });
    } else {
      return this.customCompletionFunction(current, argv, (completions) => {
        done(null, completions);
      });
    }
  }
  getCompletion(args, done) {
    const current = args.length ? args[args.length - 1] : "";
    const argv = this.yargs.parse(args, true);
    const completionFunction = this.customCompletionFunction ? (argv2) => this.customCompletion(args, argv2, current, done) : (argv2) => this.defaultCompletion(args, argv2, current, done);
    return isPromise(argv) ? argv.then(completionFunction) : completionFunction(argv);
  }
  generateCompletionScript($0, cmd) {
    let script = this.zshShell ? completionZshTemplate : completionShTemplate;
    const name = this.shim.path.basename($0);
    if ($0.match(/\.js$/))
      $0 = `./${$0}`;
    script = script.replace(/{{app_name}}/g, name);
    script = script.replace(/{{completion_command}}/g, cmd);
    return script.replace(/{{app_path}}/g, $0);
  }
  registerFunction(fn) {
    this.customCompletionFunction = fn;
  }
  setParsed(parsed) {
    this.aliases = parsed.aliases;
  }
}

// node_modules/yargs/build/lib/utils/levenshtein.js
function levenshtein(a, b2) {
  if (a.length === 0)
    return b2.length;
  if (b2.length === 0)
    return a.length;
  const matrix = [];
  let i;
  for (i = 0;i <= b2.length; i++) {
    matrix[i] = [i];
  }
  let j;
  for (j = 0;j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1;i <= b2.length; i++) {
    for (j = 1;j <= a.length; j++) {
      if (b2.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        if (i > 1 && j > 1 && b2.charAt(i - 2) === a.charAt(j - 1) && b2.charAt(i - 1) === a.charAt(j - 2)) {
          matrix[i][j] = matrix[i - 2][j - 2] + 1;
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
  }
  return matrix[b2.length][a.length];
}

// node_modules/yargs/build/lib/validation.js
function validation(yargs, usage2, shim2) {
  const __ = shim2.y18n.__;
  const __n = shim2.y18n.__n;
  const self = {};
  self.nonOptionCount = function nonOptionCount(argv) {
    const demandedCommands = yargs.getDemandedCommands();
    const positionalCount = argv._.length + (argv["--"] ? argv["--"].length : 0);
    const _s = positionalCount - yargs.getInternalMethods().getContext().commands.length;
    if (demandedCommands._ && (_s < demandedCommands._.min || _s > demandedCommands._.max)) {
      if (_s < demandedCommands._.min) {
        if (demandedCommands._.minMsg !== undefined) {
          usage2.fail(demandedCommands._.minMsg ? demandedCommands._.minMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.min.toString()) : null);
        } else {
          usage2.fail(__n("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", _s, _s.toString(), demandedCommands._.min.toString()));
        }
      } else if (_s > demandedCommands._.max) {
        if (demandedCommands._.maxMsg !== undefined) {
          usage2.fail(demandedCommands._.maxMsg ? demandedCommands._.maxMsg.replace(/\$0/g, _s.toString()).replace(/\$1/, demandedCommands._.max.toString()) : null);
        } else {
          usage2.fail(__n("Too many non-option arguments: got %s, maximum of %s", "Too many non-option arguments: got %s, maximum of %s", _s, _s.toString(), demandedCommands._.max.toString()));
        }
      }
    }
  };
  self.positionalCount = function positionalCount(required, observed) {
    if (observed < required) {
      usage2.fail(__n("Not enough non-option arguments: got %s, need at least %s", "Not enough non-option arguments: got %s, need at least %s", observed, observed + "", required + ""));
    }
  };
  self.requiredArguments = function requiredArguments(argv, demandedOptions) {
    let missing = null;
    for (const key of Object.keys(demandedOptions)) {
      if (!Object.prototype.hasOwnProperty.call(argv, key) || typeof argv[key] === "undefined") {
        missing = missing || {};
        missing[key] = demandedOptions[key];
      }
    }
    if (missing) {
      const customMsgs = [];
      for (const key of Object.keys(missing)) {
        const msg = missing[key];
        if (msg && customMsgs.indexOf(msg) < 0) {
          customMsgs.push(msg);
        }
      }
      const customMsg = customMsgs.length ? `\n${customMsgs.join("\n")}` : "";
      usage2.fail(__n("Missing required argument: %s", "Missing required arguments: %s", Object.keys(missing).length, Object.keys(missing).join(", ") + customMsg));
    }
  };
  self.unknownArguments = function unknownArguments(argv, aliases, positionalMap, isDefaultCommand, checkPositionals = true) {
    var _a2;
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    Object.keys(argv).forEach((key) => {
      if (!specialKeys.includes(key) && !Object.prototype.hasOwnProperty.call(positionalMap, key) && !Object.prototype.hasOwnProperty.call(yargs.getInternalMethods().getParseContext(), key) && !self.isValidAndSomeAliasIsNotNew(key, aliases)) {
        unknown.push(key);
      }
    });
    if (checkPositionals && (currentContext.commands.length > 0 || commandKeys.length > 0 || isDefaultCommand)) {
      argv._.slice(currentContext.commands.length).forEach((key) => {
        if (!commandKeys.includes("" + key)) {
          unknown.push("" + key);
        }
      });
    }
    if (checkPositionals) {
      const demandedCommands = yargs.getDemandedCommands();
      const maxNonOptDemanded = ((_a2 = demandedCommands._) === null || _a2 === undefined ? undefined : _a2.max) || 0;
      const expected = currentContext.commands.length + maxNonOptDemanded;
      if (expected < argv._.length) {
        argv._.slice(expected).forEach((key) => {
          key = String(key);
          if (!currentContext.commands.includes(key) && !unknown.includes(key)) {
            unknown.push(key);
          }
        });
      }
    }
    if (unknown.length) {
      usage2.fail(__n("Unknown argument: %s", "Unknown arguments: %s", unknown.length, unknown.map((s) => s.trim() ? s : `"${s}"`).join(", ")));
    }
  };
  self.unknownCommands = function unknownCommands(argv) {
    const commandKeys = yargs.getInternalMethods().getCommandInstance().getCommands();
    const unknown = [];
    const currentContext = yargs.getInternalMethods().getContext();
    if (currentContext.commands.length > 0 || commandKeys.length > 0) {
      argv._.slice(currentContext.commands.length).forEach((key) => {
        if (!commandKeys.includes("" + key)) {
          unknown.push("" + key);
        }
      });
    }
    if (unknown.length > 0) {
      usage2.fail(__n("Unknown command: %s", "Unknown commands: %s", unknown.length, unknown.join(", ")));
      return true;
    } else {
      return false;
    }
  };
  self.isValidAndSomeAliasIsNotNew = function isValidAndSomeAliasIsNotNew(key, aliases) {
    if (!Object.prototype.hasOwnProperty.call(aliases, key)) {
      return false;
    }
    const newAliases = yargs.parsed.newAliases;
    return [key, ...aliases[key]].some((a) => !Object.prototype.hasOwnProperty.call(newAliases, a) || !newAliases[key]);
  };
  self.limitedChoices = function limitedChoices(argv) {
    const options = yargs.getOptions();
    const invalid = {};
    if (!Object.keys(options.choices).length)
      return;
    Object.keys(argv).forEach((key) => {
      if (specialKeys.indexOf(key) === -1 && Object.prototype.hasOwnProperty.call(options.choices, key)) {
        [].concat(argv[key]).forEach((value) => {
          if (options.choices[key].indexOf(value) === -1 && value !== undefined) {
            invalid[key] = (invalid[key] || []).concat(value);
          }
        });
      }
    });
    const invalidKeys = Object.keys(invalid);
    if (!invalidKeys.length)
      return;
    let msg = __("Invalid values:");
    invalidKeys.forEach((key) => {
      msg += `\n  ${__("Argument: %s, Given: %s, Choices: %s", key, usage2.stringifiedValues(invalid[key]), usage2.stringifiedValues(options.choices[key]))}`;
    });
    usage2.fail(msg);
  };
  let implied = {};
  self.implies = function implies(key, value) {
    argsert("<string|object> [array|number|string]", [key, value], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        self.implies(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!implied[key]) {
        implied[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach((i) => self.implies(key, i));
      } else {
        assertNotStrictEqual(value, undefined, shim2);
        implied[key].push(value);
      }
    }
  };
  self.getImplied = function getImplied() {
    return implied;
  };
  function keyExists(argv, val) {
    const num = Number(val);
    val = isNaN(num) ? val : num;
    if (typeof val === "number") {
      val = argv._.length >= val;
    } else if (val.match(/^--no-.+/)) {
      val = val.match(/^--no-(.+)/)[1];
      val = !Object.prototype.hasOwnProperty.call(argv, val);
    } else {
      val = Object.prototype.hasOwnProperty.call(argv, val);
    }
    return val;
  }
  self.implications = function implications(argv) {
    const implyFail = [];
    Object.keys(implied).forEach((key) => {
      const origKey = key;
      (implied[key] || []).forEach((value) => {
        let key2 = origKey;
        const origValue = value;
        key2 = keyExists(argv, key2);
        value = keyExists(argv, value);
        if (key2 && !value) {
          implyFail.push(` ${origKey} -> ${origValue}`);
        }
      });
    });
    if (implyFail.length) {
      let msg = `${__("Implications failed:")}\n`;
      implyFail.forEach((value) => {
        msg += value;
      });
      usage2.fail(msg);
    }
  };
  let conflicting = {};
  self.conflicts = function conflicts(key, value) {
    argsert("<string|object> [array|string]", [key, value], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        self.conflicts(k, key[k]);
      });
    } else {
      yargs.global(key);
      if (!conflicting[key]) {
        conflicting[key] = [];
      }
      if (Array.isArray(value)) {
        value.forEach((i) => self.conflicts(key, i));
      } else {
        conflicting[key].push(value);
      }
    }
  };
  self.getConflicting = () => conflicting;
  self.conflicting = function conflictingFn(argv) {
    Object.keys(argv).forEach((key) => {
      if (conflicting[key]) {
        conflicting[key].forEach((value) => {
          if (value && argv[key] !== undefined && argv[value] !== undefined) {
            usage2.fail(__("Arguments %s and %s are mutually exclusive", key, value));
          }
        });
      }
    });
    if (yargs.getInternalMethods().getParserConfiguration()["strip-dashed"]) {
      Object.keys(conflicting).forEach((key) => {
        conflicting[key].forEach((value) => {
          if (value && argv[shim2.Parser.camelCase(key)] !== undefined && argv[shim2.Parser.camelCase(value)] !== undefined) {
            usage2.fail(__("Arguments %s and %s are mutually exclusive", key, value));
          }
        });
      });
    }
  };
  self.recommendCommands = function recommendCommands(cmd, potentialCommands) {
    const threshold = 3;
    potentialCommands = potentialCommands.sort((a, b2) => b2.length - a.length);
    let recommended = null;
    let bestDistance = Infinity;
    for (let i = 0, candidate;(candidate = potentialCommands[i]) !== undefined; i++) {
      const d = levenshtein(cmd, candidate);
      if (d <= threshold && d < bestDistance) {
        bestDistance = d;
        recommended = candidate;
      }
    }
    if (recommended)
      usage2.fail(__("Did you mean %s?", recommended));
  };
  self.reset = function reset(localLookup) {
    implied = objFilter(implied, (k) => !localLookup[k]);
    conflicting = objFilter(conflicting, (k) => !localLookup[k]);
    return self;
  };
  const frozens = [];
  self.freeze = function freeze() {
    frozens.push({
      implied,
      conflicting
    });
  };
  self.unfreeze = function unfreeze() {
    const frozen = frozens.pop();
    assertNotStrictEqual(frozen, undefined, shim2);
    ({ implied, conflicting } = frozen);
  };
  return self;
}
var specialKeys = ["$0", "--", "_"];

// node_modules/yargs/build/lib/utils/apply-extends.js
function applyExtends(config, cwd, mergeExtends, _shim) {
  shim2 = _shim;
  let defaultConfig = {};
  if (Object.prototype.hasOwnProperty.call(config, "extends")) {
    if (typeof config.extends !== "string")
      return defaultConfig;
    const isPath = /\.json|\..*rc$/.test(config.extends);
    let pathToDefault = null;
    if (!isPath) {
      try {
        pathToDefault = import.meta.require.resolve(config.extends);
      } catch (_err) {
        return config;
      }
    } else {
      pathToDefault = getPathToDefaultConfig(cwd, config.extends);
    }
    checkForCircularExtends(pathToDefault);
    previouslyVisitedConfigs.push(pathToDefault);
    defaultConfig = isPath ? JSON.parse(shim2.readFileSync(pathToDefault, "utf8")) : import.meta.require(config.extends);
    delete config.extends;
    defaultConfig = applyExtends(defaultConfig, shim2.path.dirname(pathToDefault), mergeExtends, shim2);
  }
  previouslyVisitedConfigs = [];
  return mergeExtends ? mergeDeep(defaultConfig, config) : Object.assign({}, defaultConfig, config);
}
function checkForCircularExtends(cfgPath) {
  if (previouslyVisitedConfigs.indexOf(cfgPath) > -1) {
    throw new YError(`Circular extended configurations: '${cfgPath}'.`);
  }
}
function getPathToDefaultConfig(cwd, pathToExtend) {
  return shim2.path.resolve(cwd, pathToExtend);
}
function mergeDeep(config1, config2) {
  const target = {};
  function isObject(obj) {
    return obj && typeof obj === "object" && !Array.isArray(obj);
  }
  Object.assign(target, config1);
  for (const key of Object.keys(config2)) {
    if (isObject(config2[key]) && isObject(target[key])) {
      target[key] = mergeDeep(config1[key], config2[key]);
    } else {
      target[key] = config2[key];
    }
  }
  return target;
}
var previouslyVisitedConfigs = [];
var shim2;

// node_modules/yargs/build/lib/yargs-factory.js
function YargsFactory(_shim) {
  return (processArgs = [], cwd = _shim.process.cwd(), parentRequire) => {
    const yargs = new YargsInstance(processArgs, cwd, parentRequire, _shim);
    Object.defineProperty(yargs, "argv", {
      get: () => {
        return yargs.parse();
      },
      enumerable: true
    });
    yargs.help();
    yargs.version();
    return yargs;
  };
}
function isYargsInstance(y2) {
  return !!y2 && typeof y2.getInternalMethods === "function";
}
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _YargsInstance_command;
var _YargsInstance_cwd;
var _YargsInstance_context;
var _YargsInstance_completion;
var _YargsInstance_completionCommand;
var _YargsInstance_defaultShowHiddenOpt;
var _YargsInstance_exitError;
var _YargsInstance_detectLocale;
var _YargsInstance_emittedWarnings;
var _YargsInstance_exitProcess;
var _YargsInstance_frozens;
var _YargsInstance_globalMiddleware;
var _YargsInstance_groups;
var _YargsInstance_hasOutput;
var _YargsInstance_helpOpt;
var _YargsInstance_isGlobalContext;
var _YargsInstance_logger;
var _YargsInstance_output;
var _YargsInstance_options;
var _YargsInstance_parentRequire;
var _YargsInstance_parserConfig;
var _YargsInstance_parseFn;
var _YargsInstance_parseContext;
var _YargsInstance_pkgs;
var _YargsInstance_preservedGroups;
var _YargsInstance_processArgs;
var _YargsInstance_recommendCommands;
var _YargsInstance_shim;
var _YargsInstance_strict;
var _YargsInstance_strictCommands;
var _YargsInstance_strictOptions;
var _YargsInstance_usage;
var _YargsInstance_usageConfig;
var _YargsInstance_versionOpt;
var _YargsInstance_validation;
var kCopyDoubleDash = Symbol("copyDoubleDash");
var kCreateLogger = Symbol("copyDoubleDash");
var kDeleteFromParserHintObject = Symbol("deleteFromParserHintObject");
var kEmitWarning = Symbol("emitWarning");
var kFreeze = Symbol("freeze");
var kGetDollarZero = Symbol("getDollarZero");
var kGetParserConfiguration = Symbol("getParserConfiguration");
var kGetUsageConfiguration = Symbol("getUsageConfiguration");
var kGuessLocale = Symbol("guessLocale");
var kGuessVersion = Symbol("guessVersion");
var kParsePositionalNumbers = Symbol("parsePositionalNumbers");
var kPkgUp = Symbol("pkgUp");
var kPopulateParserHintArray = Symbol("populateParserHintArray");
var kPopulateParserHintSingleValueDictionary = Symbol("populateParserHintSingleValueDictionary");
var kPopulateParserHintArrayDictionary = Symbol("populateParserHintArrayDictionary");
var kPopulateParserHintDictionary = Symbol("populateParserHintDictionary");
var kSanitizeKey = Symbol("sanitizeKey");
var kSetKey = Symbol("setKey");
var kUnfreeze = Symbol("unfreeze");
var kValidateAsync = Symbol("validateAsync");
var kGetCommandInstance = Symbol("getCommandInstance");
var kGetContext = Symbol("getContext");
var kGetHasOutput = Symbol("getHasOutput");
var kGetLoggerInstance = Symbol("getLoggerInstance");
var kGetParseContext = Symbol("getParseContext");
var kGetUsageInstance = Symbol("getUsageInstance");
var kGetValidationInstance = Symbol("getValidationInstance");
var kHasParseCallback = Symbol("hasParseCallback");
var kIsGlobalContext = Symbol("isGlobalContext");
var kPostProcess = Symbol("postProcess");
var kRebase = Symbol("rebase");
var kReset = Symbol("reset");
var kRunYargsParserAndExecuteCommands = Symbol("runYargsParserAndExecuteCommands");
var kRunValidation = Symbol("runValidation");
var kSetHasOutput = Symbol("setHasOutput");
var kTrackManuallySetKeys = Symbol("kTrackManuallySetKeys");

class YargsInstance {
  constructor(processArgs = [], cwd, parentRequire, shim3) {
    this.customScriptName = false;
    this.parsed = false;
    _YargsInstance_command.set(this, undefined);
    _YargsInstance_cwd.set(this, undefined);
    _YargsInstance_context.set(this, { commands: [], fullCommands: [] });
    _YargsInstance_completion.set(this, null);
    _YargsInstance_completionCommand.set(this, null);
    _YargsInstance_defaultShowHiddenOpt.set(this, "show-hidden");
    _YargsInstance_exitError.set(this, null);
    _YargsInstance_detectLocale.set(this, true);
    _YargsInstance_emittedWarnings.set(this, {});
    _YargsInstance_exitProcess.set(this, true);
    _YargsInstance_frozens.set(this, []);
    _YargsInstance_globalMiddleware.set(this, undefined);
    _YargsInstance_groups.set(this, {});
    _YargsInstance_hasOutput.set(this, false);
    _YargsInstance_helpOpt.set(this, null);
    _YargsInstance_isGlobalContext.set(this, true);
    _YargsInstance_logger.set(this, undefined);
    _YargsInstance_output.set(this, "");
    _YargsInstance_options.set(this, undefined);
    _YargsInstance_parentRequire.set(this, undefined);
    _YargsInstance_parserConfig.set(this, {});
    _YargsInstance_parseFn.set(this, null);
    _YargsInstance_parseContext.set(this, null);
    _YargsInstance_pkgs.set(this, {});
    _YargsInstance_preservedGroups.set(this, {});
    _YargsInstance_processArgs.set(this, undefined);
    _YargsInstance_recommendCommands.set(this, false);
    _YargsInstance_shim.set(this, undefined);
    _YargsInstance_strict.set(this, false);
    _YargsInstance_strictCommands.set(this, false);
    _YargsInstance_strictOptions.set(this, false);
    _YargsInstance_usage.set(this, undefined);
    _YargsInstance_usageConfig.set(this, {});
    _YargsInstance_versionOpt.set(this, null);
    _YargsInstance_validation.set(this, undefined);
    __classPrivateFieldSet(this, _YargsInstance_shim, shim3, "f");
    __classPrivateFieldSet(this, _YargsInstance_processArgs, processArgs, "f");
    __classPrivateFieldSet(this, _YargsInstance_cwd, cwd, "f");
    __classPrivateFieldSet(this, _YargsInstance_parentRequire, parentRequire, "f");
    __classPrivateFieldSet(this, _YargsInstance_globalMiddleware, new GlobalMiddleware(this), "f");
    this.$0 = this[kGetDollarZero]();
    this[kReset]();
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f"), "f");
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f"), "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    __classPrivateFieldSet(this, _YargsInstance_logger, this[kCreateLogger](), "f");
  }
  addHelpOpt(opt, msg) {
    const defaultHelpOpt = "help";
    argsert("[string|boolean] [string]", [opt, msg], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
      __classPrivateFieldSet(this, _YargsInstance_helpOpt, null, "f");
    }
    if (opt === false && msg === undefined)
      return this;
    __classPrivateFieldSet(this, _YargsInstance_helpOpt, typeof opt === "string" ? opt : defaultHelpOpt, "f");
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f"), msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show help"));
    return this;
  }
  help(opt, msg) {
    return this.addHelpOpt(opt, msg);
  }
  addShowHiddenOpt(opt, msg) {
    argsert("[string|boolean] [string]", [opt, msg], arguments.length);
    if (opt === false && msg === undefined)
      return this;
    const showHiddenOpt = typeof opt === "string" ? opt : __classPrivateFieldGet(this, _YargsInstance_defaultShowHiddenOpt, "f");
    this.boolean(showHiddenOpt);
    this.describe(showHiddenOpt, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show hidden options"));
    __classPrivateFieldGet(this, _YargsInstance_options, "f").showHiddenOpt = showHiddenOpt;
    return this;
  }
  showHidden(opt, msg) {
    return this.addShowHiddenOpt(opt, msg);
  }
  alias(key, value) {
    argsert("<object|string|array> [string|array]", [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.alias.bind(this), "alias", key, value);
    return this;
  }
  array(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("array", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  boolean(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("boolean", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  check(f, global) {
    argsert("<function> [boolean]", [f, global], arguments.length);
    this.middleware((argv, _yargs) => {
      return maybeAsyncResult(() => {
        return f(argv, _yargs.getOptions());
      }, (result) => {
        if (!result) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(__classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__("Argument check failed: %s", f.toString()));
        } else if (typeof result === "string" || result instanceof Error) {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(result.toString(), result);
        }
        return argv;
      }, (err) => {
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message ? err.message : err.toString(), err);
        return argv;
      });
    }, false, global);
    return this;
  }
  choices(key, value) {
    argsert("<object|string|array> [string|array]", [key, value], arguments.length);
    this[kPopulateParserHintArrayDictionary](this.choices.bind(this), "choices", key, value);
    return this;
  }
  coerce(keys, value) {
    argsert("<object|string|array> [function]", [keys, value], arguments.length);
    if (Array.isArray(keys)) {
      if (!value) {
        throw new YError("coerce callback must be provided");
      }
      for (const key of keys) {
        this.coerce(key, value);
      }
      return this;
    } else if (typeof keys === "object") {
      for (const key of Object.keys(keys)) {
        this.coerce(key, keys[key]);
      }
      return this;
    }
    if (!value) {
      throw new YError("coerce callback must be provided");
    }
    __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addCoerceMiddleware((argv, yargs) => {
      let aliases;
      const shouldCoerce = Object.prototype.hasOwnProperty.call(argv, keys);
      if (!shouldCoerce) {
        return argv;
      }
      return maybeAsyncResult(() => {
        aliases = yargs.getAliases();
        return value(argv[keys]);
      }, (result) => {
        argv[keys] = result;
        const stripAliased = yargs.getInternalMethods().getParserConfiguration()["strip-aliased"];
        if (aliases[keys] && stripAliased !== true) {
          for (const alias of aliases[keys]) {
            argv[alias] = result;
          }
        }
        return argv;
      }, (err) => {
        throw new YError(err.message);
      });
    }, keys);
    return this;
  }
  conflicts(key1, key2) {
    argsert("<string|object> [string|array]", [key1, key2], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicts(key1, key2);
    return this;
  }
  config(key = "config", msg, parseFn) {
    argsert("[object|string] [string|function] [function]", [key, msg, parseFn], arguments.length);
    if (typeof key === "object" && !Array.isArray(key)) {
      key = applyExtends(key, __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()["deep-merge-config"] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(key);
      return this;
    }
    if (typeof msg === "function") {
      parseFn = msg;
      msg = undefined;
    }
    this.describe(key, msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Path to JSON config file"));
    (Array.isArray(key) ? key : [key]).forEach((k) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").config[k] = parseFn || true;
    });
    return this;
  }
  completion(cmd, desc, fn) {
    argsert("[string] [string|boolean|function] [function]", [cmd, desc, fn], arguments.length);
    if (typeof desc === "function") {
      fn = desc;
      desc = undefined;
    }
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || "completion", "f");
    if (!desc && desc !== false) {
      desc = "generate completion script";
    }
    this.command(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"), desc);
    if (fn)
      __classPrivateFieldGet(this, _YargsInstance_completion, "f").registerFunction(fn);
    return this;
  }
  command(cmd, description, builder, handler, middlewares, deprecated) {
    argsert("<string|array|object> [string|boolean] [function|object] [function] [array] [boolean|string]", [cmd, description, builder, handler, middlewares, deprecated], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addHandler(cmd, description, builder, handler, middlewares, deprecated);
    return this;
  }
  commands(cmd, description, builder, handler, middlewares, deprecated) {
    return this.command(cmd, description, builder, handler, middlewares, deprecated);
  }
  commandDir(dir, opts) {
    argsert("<string> [object]", [dir, opts], arguments.length);
    const req = __classPrivateFieldGet(this, _YargsInstance_parentRequire, "f") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").require;
    __classPrivateFieldGet(this, _YargsInstance_command, "f").addDirectory(dir, req, __classPrivateFieldGet(this, _YargsInstance_shim, "f").getCallerFile(), opts);
    return this;
  }
  count(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("count", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  default(key, value, defaultDescription) {
    argsert("<object|string|array> [*] [string]", [key, value, defaultDescription], arguments.length);
    if (defaultDescription) {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = defaultDescription;
    }
    if (typeof value === "function") {
      assertSingleKey(key, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key])
        __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = __classPrivateFieldGet(this, _YargsInstance_usage, "f").functionDescription(value);
      value = value.call();
    }
    this[kPopulateParserHintSingleValueDictionary](this.default.bind(this), "default", key, value);
    return this;
  }
  defaults(key, value, defaultDescription) {
    return this.default(key, value, defaultDescription);
  }
  demandCommand(min = 1, max, minMsg, maxMsg) {
    argsert("[number] [number|string] [string|null|undefined] [string|null|undefined]", [min, max, minMsg, maxMsg], arguments.length);
    if (typeof max !== "number") {
      minMsg = max;
      max = Infinity;
    }
    this.global("_", false);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands._ = {
      min,
      max,
      minMsg,
      maxMsg
    };
    return this;
  }
  demand(keys, max, msg) {
    if (Array.isArray(max)) {
      max.forEach((key) => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
      max = Infinity;
    } else if (typeof max !== "number") {
      msg = max;
      max = Infinity;
    }
    if (typeof keys === "number") {
      assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      this.demandCommand(keys, max, msg, msg);
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        assertNotStrictEqual(msg, true, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
        this.demandOption(key, msg);
      });
    } else {
      if (typeof msg === "string") {
        this.demandOption(keys, msg);
      } else if (msg === true || typeof msg === "undefined") {
        this.demandOption(keys);
      }
    }
    return this;
  }
  demandOption(keys, msg) {
    argsert("<object|string|array> [string]", [keys, msg], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.demandOption.bind(this), "demandedOptions", keys, msg);
    return this;
  }
  deprecateOption(option, message) {
    argsert("<string> [string|boolean]", [option, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions[option] = message;
    return this;
  }
  describe(keys, description) {
    argsert("<object|string|array> [string]", [keys, description], arguments.length);
    this[kSetKey](keys, true);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").describe(keys, description);
    return this;
  }
  detectLocale(detect) {
    argsert("<boolean>", [detect], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, detect, "f");
    return this;
  }
  env(prefix) {
    argsert("[string|boolean]", [prefix], arguments.length);
    if (prefix === false)
      delete __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
    else
      __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix = prefix || "";
    return this;
  }
  epilogue(msg) {
    argsert("<string>", [msg], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").epilog(msg);
    return this;
  }
  epilog(msg) {
    return this.epilogue(msg);
  }
  example(cmd, description) {
    argsert("<string|array> [string]", [cmd, description], arguments.length);
    if (Array.isArray(cmd)) {
      cmd.forEach((exampleParams) => this.example(...exampleParams));
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").example(cmd, description);
    }
    return this;
  }
  exit(code, err) {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, err, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
      __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.exit(code);
  }
  exitProcess(enabled = true) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_exitProcess, enabled, "f");
    return this;
  }
  fail(f) {
    argsert("<function|boolean>", [f], arguments.length);
    if (typeof f === "boolean" && f !== false) {
      throw new YError("Invalid first argument. Expected function or boolean 'false'");
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").failFn(f);
    return this;
  }
  getAliases() {
    return this.parsed ? this.parsed.aliases : {};
  }
  async getCompletion(args, done) {
    argsert("<array> [function]", [args, done], arguments.length);
    if (!done) {
      return new Promise((resolve5, reject) => {
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, (err, completions) => {
          if (err)
            reject(err);
          else
            resolve5(completions);
        });
      });
    } else {
      return __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(args, done);
    }
  }
  getDemandedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedOptions;
  }
  getDemandedCommands() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").demandedCommands;
  }
  getDeprecatedOptions() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_options, "f").deprecatedOptions;
  }
  getDetectLocale() {
    return __classPrivateFieldGet(this, _YargsInstance_detectLocale, "f");
  }
  getExitProcess() {
    return __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f");
  }
  getGroups() {
    return Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_groups, "f"), __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"));
  }
  getHelp() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
        if (isPromise(parse)) {
          return parse.then(() => {
            return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
          });
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        return builderResponse.then(() => {
          return __classPrivateFieldGet(this, _YargsInstance_usage, "f").help();
        });
      }
    }
    return Promise.resolve(__classPrivateFieldGet(this, _YargsInstance_usage, "f").help());
  }
  getOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_options, "f");
  }
  getStrict() {
    return __classPrivateFieldGet(this, _YargsInstance_strict, "f");
  }
  getStrictCommands() {
    return __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f");
  }
  getStrictOptions() {
    return __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f");
  }
  global(globals, global) {
    argsert("<string|array> [boolean]", [globals, global], arguments.length);
    globals = [].concat(globals);
    if (global !== false) {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local.filter((l) => globals.indexOf(l) === -1);
    } else {
      globals.forEach((g) => {
        if (!__classPrivateFieldGet(this, _YargsInstance_options, "f").local.includes(g))
          __classPrivateFieldGet(this, _YargsInstance_options, "f").local.push(g);
      });
    }
    return this;
  }
  group(opts, groupName) {
    argsert("<string|array> <string>", [opts, groupName], arguments.length);
    const existing = __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName] || __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName];
    if (__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName]) {
      delete __classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f")[groupName];
    }
    const seen = {};
    __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName] = (existing || []).concat(opts).filter((key) => {
      if (seen[key])
        return false;
      return seen[key] = true;
    });
    return this;
  }
  hide(key) {
    argsert("<string>", [key], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_options, "f").hiddenOptions.push(key);
    return this;
  }
  implies(key, value) {
    argsert("<string|object> [number|string|array]", [key, value], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").implies(key, value);
    return this;
  }
  locale(locale) {
    argsert("[string]", [locale], arguments.length);
    if (locale === undefined) {
      this[kGuessLocale]();
      return __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.getLocale();
    }
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.setLocale(locale);
    return this;
  }
  middleware(callback, applyBeforeValidation, global) {
    return __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").addMiddleware(callback, !!applyBeforeValidation, global);
  }
  nargs(key, value) {
    argsert("<string|object|array> [number]", [key, value], arguments.length);
    this[kPopulateParserHintSingleValueDictionary](this.nargs.bind(this), "narg", key, value);
    return this;
  }
  normalize(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("normalize", keys);
    return this;
  }
  number(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("number", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  option(key, opt) {
    argsert("<string|object> [object]", [key, opt], arguments.length);
    if (typeof key === "object") {
      Object.keys(key).forEach((k) => {
        this.options(k, key[k]);
      });
    } else {
      if (typeof opt !== "object") {
        opt = {};
      }
      this[kTrackManuallySetKeys](key);
      if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && (key === "version" || (opt === null || opt === undefined ? undefined : opt.alias) === "version")) {
        this[kEmitWarning]([
          '"version" is a reserved word.',
          "Please do one of the following:",
          '- Disable version with `yargs.version(false)` if using "version" as an option',
          "- Use the built-in `yargs.version` method instead (if applicable)",
          "- Use a different option key",
          "https://yargs.js.org/docs/#api-reference-version"
        ].join("\n"), undefined, "versionWarning");
      }
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[key] = true;
      if (opt.alias)
        this.alias(key, opt.alias);
      const deprecate = opt.deprecate || opt.deprecated;
      if (deprecate) {
        this.deprecateOption(key, deprecate);
      }
      const demand = opt.demand || opt.required || opt.require;
      if (demand) {
        this.demand(key, demand);
      }
      if (opt.demandOption) {
        this.demandOption(key, typeof opt.demandOption === "string" ? opt.demandOption : undefined);
      }
      if (opt.conflicts) {
        this.conflicts(key, opt.conflicts);
      }
      if ("default" in opt) {
        this.default(key, opt.default);
      }
      if (opt.implies !== undefined) {
        this.implies(key, opt.implies);
      }
      if (opt.nargs !== undefined) {
        this.nargs(key, opt.nargs);
      }
      if (opt.config) {
        this.config(key, opt.configParser);
      }
      if (opt.normalize) {
        this.normalize(key);
      }
      if (opt.choices) {
        this.choices(key, opt.choices);
      }
      if (opt.coerce) {
        this.coerce(key, opt.coerce);
      }
      if (opt.group) {
        this.group(key, opt.group);
      }
      if (opt.boolean || opt.type === "boolean") {
        this.boolean(key);
        if (opt.alias)
          this.boolean(opt.alias);
      }
      if (opt.array || opt.type === "array") {
        this.array(key);
        if (opt.alias)
          this.array(opt.alias);
      }
      if (opt.number || opt.type === "number") {
        this.number(key);
        if (opt.alias)
          this.number(opt.alias);
      }
      if (opt.string || opt.type === "string") {
        this.string(key);
        if (opt.alias)
          this.string(opt.alias);
      }
      if (opt.count || opt.type === "count") {
        this.count(key);
      }
      if (typeof opt.global === "boolean") {
        this.global(key, opt.global);
      }
      if (opt.defaultDescription) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").defaultDescription[key] = opt.defaultDescription;
      }
      if (opt.skipValidation) {
        this.skipValidation(key);
      }
      const desc = opt.describe || opt.description || opt.desc;
      const descriptions = __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions();
      if (!Object.prototype.hasOwnProperty.call(descriptions, key) || typeof desc === "string") {
        this.describe(key, desc);
      }
      if (opt.hidden) {
        this.hide(key);
      }
      if (opt.requiresArg) {
        this.requiresArg(key);
      }
    }
    return this;
  }
  options(key, opt) {
    return this.option(key, opt);
  }
  parse(args, shortCircuit, _parseFn) {
    argsert("[string|array] [function|boolean|object] [function]", [args, shortCircuit, _parseFn], arguments.length);
    this[kFreeze]();
    if (typeof args === "undefined") {
      args = __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    }
    if (typeof shortCircuit === "object") {
      __classPrivateFieldSet(this, _YargsInstance_parseContext, shortCircuit, "f");
      shortCircuit = _parseFn;
    }
    if (typeof shortCircuit === "function") {
      __classPrivateFieldSet(this, _YargsInstance_parseFn, shortCircuit, "f");
      shortCircuit = false;
    }
    if (!shortCircuit)
      __classPrivateFieldSet(this, _YargsInstance_processArgs, args, "f");
    if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
      __classPrivateFieldSet(this, _YargsInstance_exitProcess, false, "f");
    const parsed = this[kRunYargsParserAndExecuteCommands](args, !!shortCircuit);
    const tmpParsed = this.parsed;
    __classPrivateFieldGet(this, _YargsInstance_completion, "f").setParsed(this.parsed);
    if (isPromise(parsed)) {
      return parsed.then((argv) => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
          __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        return argv;
      }).catch((err) => {
        if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f")) {
          __classPrivateFieldGet(this, _YargsInstance_parseFn, "f")(err, this.parsed.argv, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
        }
        throw err;
      }).finally(() => {
        this[kUnfreeze]();
        this.parsed = tmpParsed;
      });
    } else {
      if (__classPrivateFieldGet(this, _YargsInstance_parseFn, "f"))
        __classPrivateFieldGet(this, _YargsInstance_parseFn, "f").call(this, __classPrivateFieldGet(this, _YargsInstance_exitError, "f"), parsed, __classPrivateFieldGet(this, _YargsInstance_output, "f"));
      this[kUnfreeze]();
      this.parsed = tmpParsed;
    }
    return parsed;
  }
  parseAsync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    return !isPromise(maybePromise) ? Promise.resolve(maybePromise) : maybePromise;
  }
  parseSync(args, shortCircuit, _parseFn) {
    const maybePromise = this.parse(args, shortCircuit, _parseFn);
    if (isPromise(maybePromise)) {
      throw new YError(".parseSync() must not be used with asynchronous builders, handlers, or middleware");
    }
    return maybePromise;
  }
  parserConfiguration(config) {
    argsert("<object>", [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_parserConfig, config, "f");
    return this;
  }
  pkgConf(key, rootPath) {
    argsert("<string> [string]", [key, rootPath], arguments.length);
    let conf = null;
    const obj = this[kPkgUp](rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"));
    if (obj[key] && typeof obj[key] === "object") {
      conf = applyExtends(obj[key], rootPath || __classPrivateFieldGet(this, _YargsInstance_cwd, "f"), this[kGetParserConfiguration]()["deep-merge-config"] || false, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = (__classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || []).concat(conf);
    }
    return this;
  }
  positional(key, opts) {
    argsert("<string> <object>", [key, opts], arguments.length);
    const supportedOpts = [
      "default",
      "defaultDescription",
      "implies",
      "normalize",
      "choices",
      "conflicts",
      "coerce",
      "type",
      "describe",
      "desc",
      "description",
      "alias"
    ];
    opts = objFilter(opts, (k, v) => {
      if (k === "type" && !["string", "number", "boolean"].includes(v))
        return false;
      return supportedOpts.includes(k);
    });
    const fullCommand = __classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands[__classPrivateFieldGet(this, _YargsInstance_context, "f").fullCommands.length - 1];
    const parseOptions = fullCommand ? __classPrivateFieldGet(this, _YargsInstance_command, "f").cmdToParseOptions(fullCommand) : {
      array: [],
      alias: {},
      default: {},
      demand: {}
    };
    objectKeys(parseOptions).forEach((pk) => {
      const parseOption = parseOptions[pk];
      if (Array.isArray(parseOption)) {
        if (parseOption.indexOf(key) !== -1)
          opts[pk] = true;
      } else {
        if (parseOption[key] && !(pk in opts))
          opts[pk] = parseOption[key];
      }
    });
    this.group(key, __classPrivateFieldGet(this, _YargsInstance_usage, "f").getPositionalGroupName());
    return this.option(key, opts);
  }
  recommendCommands(recommend = true) {
    argsert("[boolean]", [recommend], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_recommendCommands, recommend, "f");
    return this;
  }
  required(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  require(keys, max, msg) {
    return this.demand(keys, max, msg);
  }
  requiresArg(keys) {
    argsert("<array|string|object> [number]", [keys], arguments.length);
    if (typeof keys === "string" && __classPrivateFieldGet(this, _YargsInstance_options, "f").narg[keys]) {
      return this;
    } else {
      this[kPopulateParserHintSingleValueDictionary](this.requiresArg.bind(this), "narg", keys, NaN);
    }
    return this;
  }
  showCompletionScript($0, cmd) {
    argsert("[string] [string]", [$0, cmd], arguments.length);
    $0 = $0 || this.$0;
    __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(__classPrivateFieldGet(this, _YargsInstance_completion, "f").generateCompletionScript($0, cmd || __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") || "completion"));
    return this;
  }
  showHelp(level) {
    argsert("[string|function]", [level], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_usage, "f").hasCachedHelpMessage()) {
      if (!this.parsed) {
        const parse = this[kRunYargsParserAndExecuteCommands](__classPrivateFieldGet(this, _YargsInstance_processArgs, "f"), undefined, undefined, 0, true);
        if (isPromise(parse)) {
          parse.then(() => {
            __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
          });
          return this;
        }
      }
      const builderResponse = __classPrivateFieldGet(this, _YargsInstance_command, "f").runDefaultBuilderOn(this);
      if (isPromise(builderResponse)) {
        builderResponse.then(() => {
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
        });
        return this;
      }
    }
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelp(level);
    return this;
  }
  scriptName(scriptName) {
    this.customScriptName = true;
    this.$0 = scriptName;
    return this;
  }
  showHelpOnFail(enabled, message) {
    argsert("[boolean|string] [string]", [enabled, message], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showHelpOnFail(enabled, message);
    return this;
  }
  showVersion(level) {
    argsert("[string|function]", [level], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion(level);
    return this;
  }
  skipValidation(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("skipValidation", keys);
    return this;
  }
  strict(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strict, enabled !== false, "f");
    return this;
  }
  strictCommands(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictCommands, enabled !== false, "f");
    return this;
  }
  strictOptions(enabled) {
    argsert("[boolean]", [enabled], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_strictOptions, enabled !== false, "f");
    return this;
  }
  string(keys) {
    argsert("<array|string>", [keys], arguments.length);
    this[kPopulateParserHintArray]("string", keys);
    this[kTrackManuallySetKeys](keys);
    return this;
  }
  terminalWidth() {
    argsert([], 0);
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.stdColumns;
  }
  updateLocale(obj) {
    return this.updateStrings(obj);
  }
  updateStrings(obj) {
    argsert("<object>", [obj], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_detectLocale, false, "f");
    __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.updateLocale(obj);
    return this;
  }
  usage(msg, description, builder, handler) {
    argsert("<string|null|undefined> [string|boolean] [function|object] [function]", [msg, description, builder, handler], arguments.length);
    if (description !== undefined) {
      assertNotStrictEqual(msg, null, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      if ((msg || "").match(/^\$0( |$)/)) {
        return this.command(msg, description, builder, handler);
      } else {
        throw new YError(".usage() description must start with $0 if being used as alias for .command()");
      }
    } else {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").usage(msg);
      return this;
    }
  }
  usageConfiguration(config) {
    argsert("<object>", [config], arguments.length);
    __classPrivateFieldSet(this, _YargsInstance_usageConfig, config, "f");
    return this;
  }
  version(opt, msg, ver) {
    const defaultVersionOpt = "version";
    argsert("[boolean|string] [string] [string]", [opt, msg, ver], arguments.length);
    if (__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f")) {
      this[kDeleteFromParserHintObject](__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(undefined);
      __classPrivateFieldSet(this, _YargsInstance_versionOpt, null, "f");
    }
    if (arguments.length === 0) {
      ver = this[kGuessVersion]();
      opt = defaultVersionOpt;
    } else if (arguments.length === 1) {
      if (opt === false) {
        return this;
      }
      ver = opt;
      opt = defaultVersionOpt;
    } else if (arguments.length === 2) {
      ver = msg;
      msg = undefined;
    }
    __classPrivateFieldSet(this, _YargsInstance_versionOpt, typeof opt === "string" ? opt : defaultVersionOpt, "f");
    msg = msg || __classPrivateFieldGet(this, _YargsInstance_usage, "f").deferY18nLookup("Show version number");
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").version(ver || undefined);
    this.boolean(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"));
    this.describe(__classPrivateFieldGet(this, _YargsInstance_versionOpt, "f"), msg);
    return this;
  }
  wrap(cols) {
    argsert("<number|null|undefined>", [cols], arguments.length);
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").wrap(cols);
    return this;
  }
  [(_YargsInstance_command = new WeakMap, _YargsInstance_cwd = new WeakMap, _YargsInstance_context = new WeakMap, _YargsInstance_completion = new WeakMap, _YargsInstance_completionCommand = new WeakMap, _YargsInstance_defaultShowHiddenOpt = new WeakMap, _YargsInstance_exitError = new WeakMap, _YargsInstance_detectLocale = new WeakMap, _YargsInstance_emittedWarnings = new WeakMap, _YargsInstance_exitProcess = new WeakMap, _YargsInstance_frozens = new WeakMap, _YargsInstance_globalMiddleware = new WeakMap, _YargsInstance_groups = new WeakMap, _YargsInstance_hasOutput = new WeakMap, _YargsInstance_helpOpt = new WeakMap, _YargsInstance_isGlobalContext = new WeakMap, _YargsInstance_logger = new WeakMap, _YargsInstance_output = new WeakMap, _YargsInstance_options = new WeakMap, _YargsInstance_parentRequire = new WeakMap, _YargsInstance_parserConfig = new WeakMap, _YargsInstance_parseFn = new WeakMap, _YargsInstance_parseContext = new WeakMap, _YargsInstance_pkgs = new WeakMap, _YargsInstance_preservedGroups = new WeakMap, _YargsInstance_processArgs = new WeakMap, _YargsInstance_recommendCommands = new WeakMap, _YargsInstance_shim = new WeakMap, _YargsInstance_strict = new WeakMap, _YargsInstance_strictCommands = new WeakMap, _YargsInstance_strictOptions = new WeakMap, _YargsInstance_usage = new WeakMap, _YargsInstance_usageConfig = new WeakMap, _YargsInstance_versionOpt = new WeakMap, _YargsInstance_validation = new WeakMap, kCopyDoubleDash)](argv) {
    if (!argv._ || !argv["--"])
      return argv;
    argv._.push.apply(argv._, argv["--"]);
    try {
      delete argv["--"];
    } catch (_err) {
    }
    return argv;
  }
  [kCreateLogger]() {
    return {
      log: (...args) => {
        if (!this[kHasParseCallback]())
          console.log(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length)
          __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + "\n", "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(" "), "f");
      },
      error: (...args) => {
        if (!this[kHasParseCallback]())
          console.error(...args);
        __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
        if (__classPrivateFieldGet(this, _YargsInstance_output, "f").length)
          __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + "\n", "f");
        __classPrivateFieldSet(this, _YargsInstance_output, __classPrivateFieldGet(this, _YargsInstance_output, "f") + args.join(" "), "f");
      }
    };
  }
  [kDeleteFromParserHintObject](optionKey) {
    objectKeys(__classPrivateFieldGet(this, _YargsInstance_options, "f")).forEach((hintKey) => {
      if (((key) => key === "configObjects")(hintKey))
        return;
      const hint = __classPrivateFieldGet(this, _YargsInstance_options, "f")[hintKey];
      if (Array.isArray(hint)) {
        if (hint.includes(optionKey))
          hint.splice(hint.indexOf(optionKey), 1);
      } else if (typeof hint === "object") {
        delete hint[optionKey];
      }
    });
    delete __classPrivateFieldGet(this, _YargsInstance_usage, "f").getDescriptions()[optionKey];
  }
  [kEmitWarning](warning, type5, deduplicationId) {
    if (!__classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId]) {
      __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.emitWarning(warning, type5);
      __classPrivateFieldGet(this, _YargsInstance_emittedWarnings, "f")[deduplicationId] = true;
    }
  }
  [kFreeze]() {
    __classPrivateFieldGet(this, _YargsInstance_frozens, "f").push({
      options: __classPrivateFieldGet(this, _YargsInstance_options, "f"),
      configObjects: __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects.slice(0),
      exitProcess: __classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"),
      groups: __classPrivateFieldGet(this, _YargsInstance_groups, "f"),
      strict: __classPrivateFieldGet(this, _YargsInstance_strict, "f"),
      strictCommands: __classPrivateFieldGet(this, _YargsInstance_strictCommands, "f"),
      strictOptions: __classPrivateFieldGet(this, _YargsInstance_strictOptions, "f"),
      completionCommand: __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f"),
      output: __classPrivateFieldGet(this, _YargsInstance_output, "f"),
      exitError: __classPrivateFieldGet(this, _YargsInstance_exitError, "f"),
      hasOutput: __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f"),
      parsed: this.parsed,
      parseFn: __classPrivateFieldGet(this, _YargsInstance_parseFn, "f"),
      parseContext: __classPrivateFieldGet(this, _YargsInstance_parseContext, "f")
    });
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").freeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").freeze();
  }
  [kGetDollarZero]() {
    let $0 = "";
    let default$0;
    if (/\b(node|iojs|electron)(\.exe)?$/.test(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv()[0])) {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(1, 2);
    } else {
      default$0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").process.argv().slice(0, 1);
    }
    $0 = default$0.map((x) => {
      const b2 = this[kRebase](__classPrivateFieldGet(this, _YargsInstance_cwd, "f"), x);
      return x.match(/^(\/|([a-zA-Z]:)?\\)/) && b2.length < x.length ? b2 : x;
    }).join(" ").trim();
    if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_") && __classPrivateFieldGet(this, _YargsInstance_shim, "f").getProcessArgvBin() === __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_")) {
      $0 = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("_").replace(`${__classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(__classPrivateFieldGet(this, _YargsInstance_shim, "f").process.execPath())}/`, "");
    }
    return $0;
  }
  [kGetParserConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_parserConfig, "f");
  }
  [kGetUsageConfiguration]() {
    return __classPrivateFieldGet(this, _YargsInstance_usageConfig, "f");
  }
  [kGuessLocale]() {
    if (!__classPrivateFieldGet(this, _YargsInstance_detectLocale, "f"))
      return;
    const locale = __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LC_ALL") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LC_MESSAGES") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LANG") || __classPrivateFieldGet(this, _YargsInstance_shim, "f").getEnv("LANGUAGE") || "en_US";
    this.locale(locale.replace(/[.:].*/, ""));
  }
  [kGuessVersion]() {
    const obj = this[kPkgUp]();
    return obj.version || "unknown";
  }
  [kParsePositionalNumbers](argv) {
    const args = argv["--"] ? argv["--"] : argv._;
    for (let i = 0, arg;(arg = args[i]) !== undefined; i++) {
      if (__classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.looksLikeNumber(arg) && Number.isSafeInteger(Math.floor(parseFloat(`${arg}`)))) {
        args[i] = Number(arg);
      }
    }
    return argv;
  }
  [kPkgUp](rootPath) {
    const npath = rootPath || "*";
    if (__classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath])
      return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
    let obj = {};
    try {
      let startDir = rootPath || __classPrivateFieldGet(this, _YargsInstance_shim, "f").mainFilename;
      if (!rootPath && __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.extname(startDir)) {
        startDir = __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.dirname(startDir);
      }
      const pkgJsonPath = __classPrivateFieldGet(this, _YargsInstance_shim, "f").findUp(startDir, (dir, names) => {
        if (names.includes("package.json")) {
          return "package.json";
        } else {
          return;
        }
      });
      assertNotStrictEqual(pkgJsonPath, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
      obj = JSON.parse(__classPrivateFieldGet(this, _YargsInstance_shim, "f").readFileSync(pkgJsonPath, "utf8"));
    } catch (_noop) {
    }
    __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath] = obj || {};
    return __classPrivateFieldGet(this, _YargsInstance_pkgs, "f")[npath];
  }
  [kPopulateParserHintArray](type5, keys) {
    keys = [].concat(keys);
    keys.forEach((key) => {
      key = this[kSanitizeKey](key);
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type5].push(key);
    });
  }
  [kPopulateParserHintSingleValueDictionary](builder, type5, key, value) {
    this[kPopulateParserHintDictionary](builder, type5, key, value, (type6, key2, value2) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type6][key2] = value2;
    });
  }
  [kPopulateParserHintArrayDictionary](builder, type5, key, value) {
    this[kPopulateParserHintDictionary](builder, type5, key, value, (type6, key2, value2) => {
      __classPrivateFieldGet(this, _YargsInstance_options, "f")[type6][key2] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[type6][key2] || []).concat(value2);
    });
  }
  [kPopulateParserHintDictionary](builder, type5, key, value, singleKeyHandler) {
    if (Array.isArray(key)) {
      key.forEach((k) => {
        builder(k, value);
      });
    } else if (((key2) => typeof key2 === "object")(key)) {
      for (const k of objectKeys(key)) {
        builder(k, key[k]);
      }
    } else {
      singleKeyHandler(type5, this[kSanitizeKey](key), value);
    }
  }
  [kSanitizeKey](key) {
    if (key === "__proto__")
      return "___proto___";
    return key;
  }
  [kSetKey](key, set4) {
    this[kPopulateParserHintSingleValueDictionary](this[kSetKey].bind(this), "key", key, set4);
    return this;
  }
  [kUnfreeze]() {
    var _a2, _b2, _c2, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const frozen = __classPrivateFieldGet(this, _YargsInstance_frozens, "f").pop();
    assertNotStrictEqual(frozen, undefined, __classPrivateFieldGet(this, _YargsInstance_shim, "f"));
    let configObjects;
    _a2 = this, _b2 = this, _c2 = this, _d = this, _e = this, _f = this, _g = this, _h = this, _j = this, _k = this, _l = this, _m = this, {
      options: { set value(_o) {
        __classPrivateFieldSet(_a2, _YargsInstance_options, _o, "f");
      } }.value,
      configObjects,
      exitProcess: { set value(_o) {
        __classPrivateFieldSet(_b2, _YargsInstance_exitProcess, _o, "f");
      } }.value,
      groups: { set value(_o) {
        __classPrivateFieldSet(_c2, _YargsInstance_groups, _o, "f");
      } }.value,
      output: { set value(_o) {
        __classPrivateFieldSet(_d, _YargsInstance_output, _o, "f");
      } }.value,
      exitError: { set value(_o) {
        __classPrivateFieldSet(_e, _YargsInstance_exitError, _o, "f");
      } }.value,
      hasOutput: { set value(_o) {
        __classPrivateFieldSet(_f, _YargsInstance_hasOutput, _o, "f");
      } }.value,
      parsed: this.parsed,
      strict: { set value(_o) {
        __classPrivateFieldSet(_g, _YargsInstance_strict, _o, "f");
      } }.value,
      strictCommands: { set value(_o) {
        __classPrivateFieldSet(_h, _YargsInstance_strictCommands, _o, "f");
      } }.value,
      strictOptions: { set value(_o) {
        __classPrivateFieldSet(_j, _YargsInstance_strictOptions, _o, "f");
      } }.value,
      completionCommand: { set value(_o) {
        __classPrivateFieldSet(_k, _YargsInstance_completionCommand, _o, "f");
      } }.value,
      parseFn: { set value(_o) {
        __classPrivateFieldSet(_l, _YargsInstance_parseFn, _o, "f");
      } }.value,
      parseContext: { set value(_o) {
        __classPrivateFieldSet(_m, _YargsInstance_parseContext, _o, "f");
      } }.value
    } = frozen;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects = configObjects;
    __classPrivateFieldGet(this, _YargsInstance_usage, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_validation, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_command, "f").unfreeze();
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").unfreeze();
  }
  [kValidateAsync](validation3, argv) {
    return maybeAsyncResult(argv, (result) => {
      validation3(result);
      return result;
    });
  }
  getInternalMethods() {
    return {
      getCommandInstance: this[kGetCommandInstance].bind(this),
      getContext: this[kGetContext].bind(this),
      getHasOutput: this[kGetHasOutput].bind(this),
      getLoggerInstance: this[kGetLoggerInstance].bind(this),
      getParseContext: this[kGetParseContext].bind(this),
      getParserConfiguration: this[kGetParserConfiguration].bind(this),
      getUsageConfiguration: this[kGetUsageConfiguration].bind(this),
      getUsageInstance: this[kGetUsageInstance].bind(this),
      getValidationInstance: this[kGetValidationInstance].bind(this),
      hasParseCallback: this[kHasParseCallback].bind(this),
      isGlobalContext: this[kIsGlobalContext].bind(this),
      postProcess: this[kPostProcess].bind(this),
      reset: this[kReset].bind(this),
      runValidation: this[kRunValidation].bind(this),
      runYargsParserAndExecuteCommands: this[kRunYargsParserAndExecuteCommands].bind(this),
      setHasOutput: this[kSetHasOutput].bind(this)
    };
  }
  [kGetCommandInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_command, "f");
  }
  [kGetContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_context, "f");
  }
  [kGetHasOutput]() {
    return __classPrivateFieldGet(this, _YargsInstance_hasOutput, "f");
  }
  [kGetLoggerInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_logger, "f");
  }
  [kGetParseContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_parseContext, "f") || {};
  }
  [kGetUsageInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_usage, "f");
  }
  [kGetValidationInstance]() {
    return __classPrivateFieldGet(this, _YargsInstance_validation, "f");
  }
  [kHasParseCallback]() {
    return !!__classPrivateFieldGet(this, _YargsInstance_parseFn, "f");
  }
  [kIsGlobalContext]() {
    return __classPrivateFieldGet(this, _YargsInstance_isGlobalContext, "f");
  }
  [kPostProcess](argv, populateDoubleDash, calledFromCommand, runGlobalMiddleware) {
    if (calledFromCommand)
      return argv;
    if (isPromise(argv))
      return argv;
    if (!populateDoubleDash) {
      argv = this[kCopyDoubleDash](argv);
    }
    const parsePositionalNumbers = this[kGetParserConfiguration]()["parse-positional-numbers"] || this[kGetParserConfiguration]()["parse-positional-numbers"] === undefined;
    if (parsePositionalNumbers) {
      argv = this[kParsePositionalNumbers](argv);
    }
    if (runGlobalMiddleware) {
      argv = applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
    }
    return argv;
  }
  [kReset](aliases = {}) {
    __classPrivateFieldSet(this, _YargsInstance_options, __classPrivateFieldGet(this, _YargsInstance_options, "f") || {}, "f");
    const tmpOptions = {};
    tmpOptions.local = __classPrivateFieldGet(this, _YargsInstance_options, "f").local || [];
    tmpOptions.configObjects = __classPrivateFieldGet(this, _YargsInstance_options, "f").configObjects || [];
    const localLookup = {};
    tmpOptions.local.forEach((l) => {
      localLookup[l] = true;
      (aliases[l] || []).forEach((a) => {
        localLookup[a] = true;
      });
    });
    Object.assign(__classPrivateFieldGet(this, _YargsInstance_preservedGroups, "f"), Object.keys(__classPrivateFieldGet(this, _YargsInstance_groups, "f")).reduce((acc, groupName) => {
      const keys = __classPrivateFieldGet(this, _YargsInstance_groups, "f")[groupName].filter((key) => !(key in localLookup));
      if (keys.length > 0) {
        acc[groupName] = keys;
      }
      return acc;
    }, {}));
    __classPrivateFieldSet(this, _YargsInstance_groups, {}, "f");
    const arrayOptions = [
      "array",
      "boolean",
      "string",
      "skipValidation",
      "count",
      "normalize",
      "number",
      "hiddenOptions"
    ];
    const objectOptions = [
      "narg",
      "key",
      "alias",
      "default",
      "defaultDescription",
      "config",
      "choices",
      "demandedOptions",
      "demandedCommands",
      "deprecatedOptions"
    ];
    arrayOptions.forEach((k) => {
      tmpOptions[k] = (__classPrivateFieldGet(this, _YargsInstance_options, "f")[k] || []).filter((k2) => !localLookup[k2]);
    });
    objectOptions.forEach((k) => {
      tmpOptions[k] = objFilter(__classPrivateFieldGet(this, _YargsInstance_options, "f")[k], (k2) => !localLookup[k2]);
    });
    tmpOptions.envPrefix = __classPrivateFieldGet(this, _YargsInstance_options, "f").envPrefix;
    __classPrivateFieldSet(this, _YargsInstance_options, tmpOptions, "f");
    __classPrivateFieldSet(this, _YargsInstance_usage, __classPrivateFieldGet(this, _YargsInstance_usage, "f") ? __classPrivateFieldGet(this, _YargsInstance_usage, "f").reset(localLookup) : usage(this, __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_validation, __classPrivateFieldGet(this, _YargsInstance_validation, "f") ? __classPrivateFieldGet(this, _YargsInstance_validation, "f").reset(localLookup) : validation(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldSet(this, _YargsInstance_command, __classPrivateFieldGet(this, _YargsInstance_command, "f") ? __classPrivateFieldGet(this, _YargsInstance_command, "f").reset() : command(__classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_validation, "f"), __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    if (!__classPrivateFieldGet(this, _YargsInstance_completion, "f"))
      __classPrivateFieldSet(this, _YargsInstance_completion, completion(this, __classPrivateFieldGet(this, _YargsInstance_usage, "f"), __classPrivateFieldGet(this, _YargsInstance_command, "f"), __classPrivateFieldGet(this, _YargsInstance_shim, "f")), "f");
    __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").reset();
    __classPrivateFieldSet(this, _YargsInstance_completionCommand, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_output, "", "f");
    __classPrivateFieldSet(this, _YargsInstance_exitError, null, "f");
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, false, "f");
    this.parsed = false;
    return this;
  }
  [kRebase](base, dir) {
    return __classPrivateFieldGet(this, _YargsInstance_shim, "f").path.relative(base, dir);
  }
  [kRunYargsParserAndExecuteCommands](args, shortCircuit, calledFromCommand, commandIndex = 0, helpOnly = false) {
    let skipValidation = !!calledFromCommand || helpOnly;
    args = args || __classPrivateFieldGet(this, _YargsInstance_processArgs, "f");
    __classPrivateFieldGet(this, _YargsInstance_options, "f").__ = __classPrivateFieldGet(this, _YargsInstance_shim, "f").y18n.__;
    __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration = this[kGetParserConfiguration]();
    const populateDoubleDash = !!__classPrivateFieldGet(this, _YargsInstance_options, "f").configuration["populate--"];
    const config = Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f").configuration, {
      "populate--": true
    });
    const parsed = __classPrivateFieldGet(this, _YargsInstance_shim, "f").Parser.detailed(args, Object.assign({}, __classPrivateFieldGet(this, _YargsInstance_options, "f"), {
      configuration: { "parse-positional-numbers": false, ...config }
    }));
    const argv = Object.assign(parsed.argv, __classPrivateFieldGet(this, _YargsInstance_parseContext, "f"));
    let argvPromise = undefined;
    const aliases = parsed.aliases;
    let helpOptSet = false;
    let versionOptSet = false;
    Object.keys(argv).forEach((key) => {
      if (key === __classPrivateFieldGet(this, _YargsInstance_helpOpt, "f") && argv[key]) {
        helpOptSet = true;
      } else if (key === __classPrivateFieldGet(this, _YargsInstance_versionOpt, "f") && argv[key]) {
        versionOptSet = true;
      }
    });
    argv.$0 = this.$0;
    this.parsed = parsed;
    if (commandIndex === 0) {
      __classPrivateFieldGet(this, _YargsInstance_usage, "f").clearCachedHelpMessage();
    }
    try {
      this[kGuessLocale]();
      if (shortCircuit) {
        return this[kPostProcess](argv, populateDoubleDash, !!calledFromCommand, false);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")) {
        const helpCmds = [__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")].concat(aliases[__classPrivateFieldGet(this, _YargsInstance_helpOpt, "f")] || []).filter((k) => k.length > 1);
        if (helpCmds.includes("" + argv._[argv._.length - 1])) {
          argv._.pop();
          helpOptSet = true;
        }
      }
      __classPrivateFieldSet(this, _YargsInstance_isGlobalContext, false, "f");
      const handlerKeys = __classPrivateFieldGet(this, _YargsInstance_command, "f").getCommands();
      const requestCompletions = __classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey in argv;
      const skipRecommendation = helpOptSet || requestCompletions || helpOnly;
      if (argv._.length) {
        if (handlerKeys.length) {
          let firstUnknownCommand;
          for (let i = commandIndex || 0, cmd;argv._[i] !== undefined; i++) {
            cmd = String(argv._[i]);
            if (handlerKeys.includes(cmd) && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(cmd, this, parsed, i + 1, helpOnly, helpOptSet || versionOptSet || helpOnly);
              return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
            } else if (!firstUnknownCommand && cmd !== __classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) {
              firstUnknownCommand = cmd;
              break;
            }
          }
          if (!__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && __classPrivateFieldGet(this, _YargsInstance_recommendCommands, "f") && firstUnknownCommand && !skipRecommendation) {
            __classPrivateFieldGet(this, _YargsInstance_validation, "f").recommendCommands(firstUnknownCommand, handlerKeys);
          }
        }
        if (__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f") && argv._.includes(__classPrivateFieldGet(this, _YargsInstance_completionCommand, "f")) && !requestCompletions) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          this.showCompletionScript();
          this.exit(0);
        }
      }
      if (__classPrivateFieldGet(this, _YargsInstance_command, "f").hasDefaultCommand() && !skipRecommendation) {
        const innerArgv = __classPrivateFieldGet(this, _YargsInstance_command, "f").runCommand(null, this, parsed, 0, helpOnly, helpOptSet || versionOptSet || helpOnly);
        return this[kPostProcess](innerArgv, populateDoubleDash, !!calledFromCommand, false);
      }
      if (requestCompletions) {
        if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
          setBlocking(true);
        args = [].concat(args);
        const completionArgs = args.slice(args.indexOf(`--${__classPrivateFieldGet(this, _YargsInstance_completion, "f").completionKey}`) + 1);
        __classPrivateFieldGet(this, _YargsInstance_completion, "f").getCompletion(completionArgs, (err, completions) => {
          if (err)
            throw new YError(err.message);
          (completions || []).forEach((completion3) => {
            __classPrivateFieldGet(this, _YargsInstance_logger, "f").log(completion3);
          });
          this.exit(0);
        });
        return this[kPostProcess](argv, !populateDoubleDash, !!calledFromCommand, false);
      }
      if (!__classPrivateFieldGet(this, _YargsInstance_hasOutput, "f")) {
        if (helpOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          skipValidation = true;
          this.showHelp("log");
          this.exit(0);
        } else if (versionOptSet) {
          if (__classPrivateFieldGet(this, _YargsInstance_exitProcess, "f"))
            setBlocking(true);
          skipValidation = true;
          __classPrivateFieldGet(this, _YargsInstance_usage, "f").showVersion("log");
          this.exit(0);
        }
      }
      if (!skipValidation && __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.length > 0) {
        skipValidation = Object.keys(argv).some((key) => __classPrivateFieldGet(this, _YargsInstance_options, "f").skipValidation.indexOf(key) >= 0 && argv[key] === true);
      }
      if (!skipValidation) {
        if (parsed.error)
          throw new YError(parsed.error.message);
        if (!requestCompletions) {
          const validation3 = this[kRunValidation](aliases, {}, parsed.error);
          if (!calledFromCommand) {
            argvPromise = applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), true);
          }
          argvPromise = this[kValidateAsync](validation3, argvPromise !== null && argvPromise !== undefined ? argvPromise : argv);
          if (isPromise(argvPromise) && !calledFromCommand) {
            argvPromise = argvPromise.then(() => {
              return applyMiddleware(argv, this, __classPrivateFieldGet(this, _YargsInstance_globalMiddleware, "f").getMiddleware(), false);
            });
          }
        }
      }
    } catch (err) {
      if (err instanceof YError)
        __classPrivateFieldGet(this, _YargsInstance_usage, "f").fail(err.message, err);
      else
        throw err;
    }
    return this[kPostProcess](argvPromise !== null && argvPromise !== undefined ? argvPromise : argv, populateDoubleDash, !!calledFromCommand, true);
  }
  [kRunValidation](aliases, positionalMap, parseErrors, isDefaultCommand) {
    const demandedOptions = { ...this.getDemandedOptions() };
    return (argv) => {
      if (parseErrors)
        throw new YError(parseErrors.message);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").nonOptionCount(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").requiredArguments(argv, demandedOptions);
      let failedStrictCommands = false;
      if (__classPrivateFieldGet(this, _YargsInstance_strictCommands, "f")) {
        failedStrictCommands = __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownCommands(argv);
      }
      if (__classPrivateFieldGet(this, _YargsInstance_strict, "f") && !failedStrictCommands) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv, aliases, positionalMap, !!isDefaultCommand);
      } else if (__classPrivateFieldGet(this, _YargsInstance_strictOptions, "f")) {
        __classPrivateFieldGet(this, _YargsInstance_validation, "f").unknownArguments(argv, aliases, {}, false, false);
      }
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").limitedChoices(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").implications(argv);
      __classPrivateFieldGet(this, _YargsInstance_validation, "f").conflicting(argv);
    };
  }
  [kSetHasOutput]() {
    __classPrivateFieldSet(this, _YargsInstance_hasOutput, true, "f");
  }
  [kTrackManuallySetKeys](keys) {
    if (typeof keys === "string") {
      __classPrivateFieldGet(this, _YargsInstance_options, "f").key[keys] = true;
    } else {
      for (const k of keys) {
        __classPrivateFieldGet(this, _YargsInstance_options, "f").key[k] = true;
      }
    }
  }
}

// node_modules/yargs/index.mjs
var Yargs = YargsFactory(esm_default);
var yargs_default = Yargs;

// node_modules/chatgpt-template/index.js
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    throw new OpenAIError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder;
  const lineDecoder = new LineDecoder;
  const iter = readableStreamAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array;
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
async function toFile(value, name, options) {
  value = await value;
  options ?? (options = isFileLike(value) ? { lastModified: value.lastModified, type: value.type } : {});
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop() ?? "unknown_file");
    return new File2([blob], name, options);
  }
  const bits = await getBytes(value);
  name || (name = getName(value) ?? "unknown_file");
  if (!options.type) {
    const type5 = bits[0]?.type;
    if (typeof type5 === "string") {
      options = { ...options, type: type5 };
    }
  }
  return new File2(bits, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(await value.arrayBuffer());
  } else if (isAsyncIterableIterator(value)) {
    for await (const chunk of value) {
      parts.push(chunk);
    }
  } else {
    throw new Error(`Unexpected data type: ${typeof value}; constructor: ${value?.constructor?.name}; props: ${propsForError(value)}`);
  }
  return parts;
}
async function defaultParseResponse(props) {
  const { response } = props;
  if (props.options.stream) {
    debug("response", response.status, response.url, response.headers, response.body);
    if (props.options.__streamClass) {
      return props.options.__streamClass.fromSSEResponse(response, props.controller);
    }
    return Stream.fromSSEResponse(response, props.controller);
  }
  if (response.status === 204) {
    return null;
  }
  if (props.options.__binaryResponse) {
    return response;
  }
  const contentType = response.headers.get("content-type");
  const isJSON = contentType?.includes("application/json") || contentType?.includes("application/vnd.api+json");
  if (isJSON) {
    const json = await response.json();
    debug("response", response.status, response.url, response.headers, json);
    return json;
  }
  const text = await response.text();
  debug("response", response.status, response.url, response.headers, text);
  return text;
}
async function pMap(iterable, mapper, {
  concurrency = Number.POSITIVE_INFINITY,
  stopOnError = true,
  signal
} = {}) {
  return new Promise((resolve5, reject_) => {
    if (iterable[Symbol.iterator] === undefined && iterable[Symbol.asyncIterator] === undefined) {
      throw new TypeError(`Expected \`input\` to be either an \`Iterable\` or \`AsyncIterable\`, got (${typeof iterable})`);
    }
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required");
    }
    if (!(Number.isSafeInteger(concurrency) && concurrency >= 1 || concurrency === Number.POSITIVE_INFINITY)) {
      throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
    }
    const result = [];
    const errors = [];
    const skippedIndexesMap = new Map;
    let isRejected = false;
    let isResolved = false;
    let isIterableDone = false;
    let resolvingCount = 0;
    let currentIndex = 0;
    const iterator = iterable[Symbol.iterator] === undefined ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
    const reject = (reason) => {
      isRejected = true;
      isResolved = true;
      reject_(reason);
    };
    if (signal) {
      if (signal.aborted) {
        reject(signal.reason);
      }
      signal.addEventListener("abort", () => {
        reject(signal.reason);
      });
    }
    const next = async () => {
      if (isResolved) {
        return;
      }
      const nextItem = await iterator.next();
      const index = currentIndex;
      currentIndex++;
      if (nextItem.done) {
        isIterableDone = true;
        if (resolvingCount === 0 && !isResolved) {
          if (!stopOnError && errors.length > 0) {
            reject(new AggregateError(errors));
            return;
          }
          isResolved = true;
          if (skippedIndexesMap.size === 0) {
            resolve5(result);
            return;
          }
          const pureResult = [];
          for (const [index2, value] of result.entries()) {
            if (skippedIndexesMap.get(index2) === pMapSkip) {
              continue;
            }
            pureResult.push(value);
          }
          resolve5(pureResult);
        }
        return;
      }
      resolvingCount++;
      (async () => {
        try {
          const element = await nextItem.value;
          if (isResolved) {
            return;
          }
          const value = await mapper(element, index);
          if (value === pMapSkip) {
            skippedIndexesMap.set(index, value);
          }
          result[index] = value;
          resolvingCount--;
          await next();
        } catch (error9) {
          if (stopOnError) {
            reject(error9);
          } else {
            errors.push(error9);
            resolvingCount--;
            try {
              await next();
            } catch (error10) {
              reject(error10);
            }
          }
        }
      })();
    };
    (async () => {
      for (let index = 0;index < concurrency; index++) {
        try {
          await next();
        } catch (error9) {
          reject(error9);
          break;
        }
        if (isIterableDone || isRejected) {
          break;
        }
      }
    })();
  });
}
async function toPromise3(src) {
  let res = undefined;
  if (isReadableLike3(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  let done = false;
  while (done == false) {
    let next = await reader.read();
    done = next.done;
    if (!done)
      res = next.value;
  }
  return res;
}
async function toArray3(src) {
  let res = [];
  if (isReadableLike3(src)) {
    src = src.readable;
  }
  let reader = src.getReader();
  try {
    let done = false;
    while (done == false) {
      let next = await reader.read();
      done = next.done;
      if (!done)
        res.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return res;
}
async function* streamAsyncIterator3() {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
var setShims = function(shims, options = { auto: false }) {
  if (auto) {
    throw new Error(`you must \`import 'openai/shims/${shims.kind}'\` before importing anything else from openai`);
  }
  if (kind) {
    throw new Error(`can't \`import 'openai/shims/${shims.kind}'\` after \`import 'openai/shims/${kind}'\``);
  }
  auto = options.auto;
  kind = shims.kind;
  fetch2 = shims.fetch;
  Request2 = shims.Request;
  Response2 = shims.Response;
  Headers2 = shims.Headers;
  FormData2 = shims.FormData;
  Blob2 = shims.Blob;
  File2 = shims.File;
  ReadableStream2 = shims.ReadableStream;
  getMultipartRequestOptions = shims.getMultipartRequestOptions;
  getDefaultAgent = shims.getDefaultAgent;
  fileFromPath = shims.fileFromPath;
  isFsReadStream = shims.isFsReadStream;
};
var getRuntime = function({ manuallyImported } = {}) {
  const recommendation = manuallyImported ? `You may need to use polyfills` : `Add one of these imports before your first \`import \u2026 from 'openai'\`:
- \`import 'openai/shims/node'\` (if you're running on Node)
- \`import 'openai/shims/web'\` (otherwise)
`;
  let _fetch, _Request, _Response, _Headers;
  try {
    _fetch = fetch;
    _Request = Request;
    _Response = Response;
    _Headers = Headers;
  } catch (error) {
    throw new Error(`this environment is missing the following Web Fetch API type: ${error.message}. ${recommendation}`);
  }
  return {
    kind: "web",
    fetch: _fetch,
    Request: _Request,
    Response: _Response,
    Headers: _Headers,
    FormData: typeof FormData !== "undefined" ? FormData : class FormData3 {
      constructor() {
        throw new Error(`file uploads aren't supported in this environment yet as 'FormData' is undefined. ${recommendation}`);
      }
    },
    Blob: typeof Blob !== "undefined" ? Blob : class Blob3 {
      constructor() {
        throw new Error(`file uploads aren't supported in this environment yet as 'Blob' is undefined. ${recommendation}`);
      }
    },
    File: typeof File !== "undefined" ? File : class File3 {
      constructor() {
        throw new Error(`file uploads aren't supported in this environment yet as 'File' is undefined. ${recommendation}`);
      }
    },
    ReadableStream: typeof ReadableStream !== "undefined" ? ReadableStream : class ReadableStream3 {
      constructor() {
        throw new Error(`streaming isn't supported in this environment yet as 'ReadableStream' is undefined. ${recommendation}`);
      }
    },
    getMultipartRequestOptions: async (form, opts) => ({
      ...opts,
      body: new MultipartBody(form)
    }),
    getDefaultAgent: (url) => {
      return;
    },
    fileFromPath: () => {
      throw new Error("The `fileFromPath` function is only supported in Node. See the README for more details: https://www.github.com/openai/openai-node#file-uploads");
    },
    isFsReadStream: (value) => false
  };
};
var readableStreamAsyncIterable = function(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
};
var isEmptyObj = function(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
};
var hasOwn = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
var debug = function(action, ...args) {
  if (typeof process !== "undefined" && process?.env?.["DEBUG"] === "true") {
    console.log(`OpenAI:DEBUG:${action}`, ...args);
  }
};
var isObj = function(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
};
var isRunnableFunctionWithParse = function(fn) {
  return typeof fn.parse === "function";
};
var curry2 = function(fn, args = []) {
  return (..._args) => ((rest) => rest.length >= fn.length ? fn(...rest) : curry2(fn, rest))([
    ...args,
    ..._args
  ]);
};
var baseSlice2 = function(array4, start4, end) {
  let index = -1;
  let { length } = array4;
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start4 > end ? 0 : end - start4 >>> 0;
  start4 >>>= 0;
  const result = Array(length);
  while (++index < length) {
    result[index] = array4[index + start4];
  }
  return result;
};
var take2 = function(howMany, listOrString) {
  if (arguments.length === 1)
    return (_listOrString) => take2(howMany, _listOrString);
  if (howMany < 0)
    return listOrString.slice();
  if (typeof listOrString === "string")
    return listOrString.slice(0, howMany);
  return baseSlice2(listOrString, 0, howMany);
};
var VERSION = "4.52.7";
var auto = false;
var kind = undefined;
var fetch2 = undefined;
var Request2 = undefined;
var Response2 = undefined;
var Headers2 = undefined;
var FormData2 = undefined;
var Blob2 = undefined;
var File2 = undefined;
var ReadableStream2 = undefined;
var getMultipartRequestOptions = undefined;
var getDefaultAgent = undefined;
var fileFromPath = undefined;
var isFsReadStream = undefined;

class MultipartBody {
  constructor(body) {
    this.body = body;
  }
  get [Symbol.toStringTag]() {
    return "MultipartBody";
  }
}
if (!kind)
  setShims(getRuntime(), { auto: true });
var findDoubleNewlineIndex = function(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0;i < buffer.length - 2; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
};
var partition = function(str, delimiter) {
  const index = str.indexOf(delimiter);
  if (index !== -1) {
    return [str.substring(0, index), delimiter, str.substring(index + delimiter.length)];
  }
  return [str, "", ""];
};

class Stream {
  constructor(iterator, controller) {
    this.iterator = iterator;
    this.controller = controller;
  }
  static fromSSEResponse(response, controller) {
    let consumed = false;
    async function* iterator() {
      if (consumed) {
        throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done)
            continue;
          if (sse.data.startsWith("[DONE]")) {
            done = true;
            continue;
          }
          if (sse.event === null) {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`Could not parse message into JSON:`, sse.data);
              console.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (data && data.error) {
              throw new APIError(undefined, data.error, undefined, undefined);
            }
            yield data;
          } else {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`Could not parse message into JSON:`, sse.data);
              console.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (sse.event == "error") {
              throw new APIError(undefined, data.error, data.message, undefined);
            }
            yield { event: sse.event, data };
          }
        }
        done = true;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError")
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new Stream(iterator, controller);
  }
  static fromReadableStream(readableStream, controller) {
    let consumed = false;
    async function* iterLines() {
      const lineDecoder = new LineDecoder;
      const iter = readableStreamAsyncIterable(readableStream);
      for await (const chunk of iter) {
        for (const line of lineDecoder.decode(chunk)) {
          yield line;
        }
      }
      for (const line of lineDecoder.flush()) {
        yield line;
      }
    }
    async function* iterator() {
      if (consumed) {
        throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const line of iterLines()) {
          if (done)
            continue;
          if (line)
            yield JSON.parse(line);
        }
        done = true;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError")
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new Stream(iterator, controller);
  }
  [Symbol.asyncIterator]() {
    return this.iterator();
  }
  tee() {
    const left2 = [];
    const right2 = [];
    const iterator = this.iterator();
    const teeIterator = (queue) => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left2.push(result);
            right2.push(result);
          }
          return queue.shift();
        }
      };
    };
    return [
      new Stream(() => teeIterator(left2), this.controller),
      new Stream(() => teeIterator(right2), this.controller)
    ];
  }
  toReadableStream() {
    const self = this;
    let iter;
    const encoder = new TextEncoder;
    return new ReadableStream2({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done)
            return ctrl.close();
          const bytes = encoder.encode(JSON.stringify(value) + "\n");
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      }
    });
  }
}

class SSEDecoder {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }
  decode(line) {
    if (line.endsWith("\r")) {
      line = line.substring(0, line.length - 1);
    }
    if (!line) {
      if (!this.event && !this.data.length)
        return null;
      const sse = {
        event: this.event,
        data: this.data.join("\n"),
        raw: this.chunks
      };
      this.event = null;
      this.data = [];
      this.chunks = [];
      return sse;
    }
    this.chunks.push(line);
    if (line.startsWith(":")) {
      return null;
    }
    let [fieldname, _2, value] = partition(line, ":");
    if (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (fieldname === "event") {
      this.event = value;
    } else if (fieldname === "data") {
      this.data.push(value);
    }
    return null;
  }
}

class LineDecoder {
  constructor() {
    this.buffer = [];
    this.trailingCR = false;
  }
  decode(chunk) {
    let text = this.decodeText(chunk);
    if (this.trailingCR) {
      text = "\r" + text;
      this.trailingCR = false;
    }
    if (text.endsWith("\r")) {
      this.trailingCR = true;
      text = text.slice(0, -1);
    }
    if (!text) {
      return [];
    }
    const trailingNewline = LineDecoder.NEWLINE_CHARS.has(text[text.length - 1] || "");
    let lines3 = text.split(LineDecoder.NEWLINE_REGEXP);
    if (trailingNewline) {
      lines3.pop();
    }
    if (lines3.length === 1 && !trailingNewline) {
      this.buffer.push(lines3[0]);
      return [];
    }
    if (this.buffer.length > 0) {
      lines3 = [this.buffer.join("") + lines3[0], ...lines3.slice(1)];
      this.buffer = [];
    }
    if (!trailingNewline) {
      this.buffer = [lines3.pop() || ""];
    }
    return lines3;
  }
  decodeText(bytes) {
    if (bytes == null)
      return "";
    if (typeof bytes === "string")
      return bytes;
    if (typeof Buffer !== "undefined") {
      if (bytes instanceof Buffer) {
        return bytes.toString();
      }
      if (bytes instanceof Uint8Array) {
        return Buffer.from(bytes).toString();
      }
      throw new OpenAIError(`Unexpected: received non-Uint8Array (${bytes.constructor.name}) stream chunk in an environment with a global "Buffer" defined, which this library assumes to be Node. Please report this error.`);
    }
    if (typeof TextDecoder !== "undefined") {
      if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) {
        this.textDecoder ?? (this.textDecoder = new TextDecoder("utf8"));
        return this.textDecoder.decode(bytes);
      }
      throw new OpenAIError(`Unexpected: received non-Uint8Array/ArrayBuffer (${bytes.constructor.name}) in a web platform. Please report this error.`);
    }
    throw new OpenAIError(`Unexpected: neither Buffer nor TextDecoder are available as globals. Please report this error.`);
  }
  flush() {
    if (!this.buffer.length && !this.trailingCR) {
      return [];
    }
    const lines3 = [this.buffer.join("")];
    this.buffer = [];
    this.trailingCR = false;
    return lines3;
  }
}
LineDecoder.NEWLINE_CHARS = new Set(["\n", "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
var propsForError = function(value) {
  const props = Object.getOwnPropertyNames(value);
  return `[${props.map((p) => `"${p}"`).join(", ")}]`;
};
var getName = function(value) {
  return getStringFromMaybeBuffer(value.name) || getStringFromMaybeBuffer(value.filename) || getStringFromMaybeBuffer(value.path)?.split(/[\\/]/).pop();
};
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isUploadable = (value) => {
  return isFileLike(value) || isResponseLike(value) || isFsReadStream(value);
};
var getStringFromMaybeBuffer = (x) => {
  if (typeof x === "string")
    return x;
  if (typeof Buffer !== "undefined" && x instanceof Buffer)
    return String(x);
  return;
};
var isAsyncIterableIterator = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
var isMultipartBody = (body) => body && typeof body === "object" && body.body && body[Symbol.toStringTag] === "MultipartBody";
var multipartFormRequestOptions = async (opts) => {
  const form = await createForm(opts.body);
  return getMultipartRequestOptions(form, opts);
};
var createForm = async (body) => {
  const form = new FormData2;
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
  return form;
};
var addFormValue = async (form, key, value) => {
  if (value === undefined)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (isUploadable(value)) {
    const file = await toFile(value);
    form.append(key, file);
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop2]) => addFormValue(form, `${key}[${name}]`, prop2)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};
var getBrowserInfo = function() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
};
var applyHeadersMut = function(targetHeaders, newHeaders) {
  for (const k in newHeaders) {
    if (!hasOwn(newHeaders, k))
      continue;
    const lowerKey = k.toLowerCase();
    if (!lowerKey)
      continue;
    const val = newHeaders[k];
    if (val === null) {
      delete targetHeaders[lowerKey];
    } else if (val !== undefined) {
      targetHeaders[lowerKey] = val;
    }
  }
};
var __classPrivateFieldSet2 = function(receiver, state, value, kind2, f) {
  if (kind2 === "m")
    throw new TypeError("Private method is not writable");
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet2 = function(receiver, state, kind2, f) {
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AbstractPage_client;

class APIPromise extends Promise {
  constructor(responsePromise, parseResponse = defaultParseResponse) {
    super((resolve5) => {
      resolve5(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse;
  }
  _thenUnwrap(transform4) {
    return new APIPromise(this.responsePromise, async (props) => transform4(await this.parseResponse(props)));
  }
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then(this.parseResponse);
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
}

class APIClient {
  constructor({
    baseURL,
    maxRetries = 2,
    timeout = 600000,
    httpAgent,
    fetch: overridenFetch
  }) {
    this.baseURL = baseURL;
    this.maxRetries = validatePositiveInteger("maxRetries", maxRetries);
    this.timeout = validatePositiveInteger("timeout", timeout);
    this.httpAgent = httpAgent;
    this.fetch = overridenFetch ?? fetch2;
  }
  authHeaders(opts) {
    return {};
  }
  defaultHeaders(opts) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": this.getUserAgent(),
      ...getPlatformHeaders(),
      ...this.authHeaders(opts)
    };
  }
  validateHeaders(headers, customHeaders) {
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  get(path2, opts) {
    return this.methodRequest("get", path2, opts);
  }
  post(path2, opts) {
    return this.methodRequest("post", path2, opts);
  }
  patch(path2, opts) {
    return this.methodRequest("patch", path2, opts);
  }
  put(path2, opts) {
    return this.methodRequest("put", path2, opts);
  }
  delete(path2, opts) {
    return this.methodRequest("delete", path2, opts);
  }
  methodRequest(method, path2, opts) {
    return this.request(Promise.resolve(opts).then(async (opts2) => {
      const body = opts2 && isBlobLike(opts2?.body) ? new DataView(await opts2.body.arrayBuffer()) : opts2?.body instanceof DataView ? opts2.body : opts2?.body instanceof ArrayBuffer ? new DataView(opts2.body) : opts2 && ArrayBuffer.isView(opts2?.body) ? new DataView(opts2.body.buffer) : opts2?.body;
      return { method, path: path2, ...opts2, body };
    }));
  }
  getAPIList(path2, Page, opts) {
    return this.requestAPIList(Page, { method: "get", path: path2, ...opts });
  }
  calculateContentLength(body) {
    if (typeof body === "string") {
      if (typeof Buffer !== "undefined") {
        return Buffer.byteLength(body, "utf8").toString();
      }
      if (typeof TextEncoder !== "undefined") {
        const encoder = new TextEncoder;
        const encoded = encoder.encode(body);
        return encoded.length.toString();
      }
    } else if (ArrayBuffer.isView(body)) {
      return body.byteLength.toString();
    }
    return null;
  }
  buildRequest(options) {
    const { method, path: path2, query, headers = {} } = options;
    const body = ArrayBuffer.isView(options.body) || options.__binaryRequest && typeof options.body === "string" ? options.body : isMultipartBody(options.body) ? options.body.body : options.body ? JSON.stringify(options.body, null, 2) : null;
    const contentLength = this.calculateContentLength(body);
    const url = this.buildURL(path2, query);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    const timeout = options.timeout ?? this.timeout;
    const httpAgent = options.httpAgent ?? this.httpAgent ?? getDefaultAgent(url);
    const minAgentTimeout = timeout + 1000;
    if (typeof httpAgent?.options?.timeout === "number" && minAgentTimeout > (httpAgent.options.timeout ?? 0)) {
      httpAgent.options.timeout = minAgentTimeout;
    }
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      headers[this.idempotencyHeader] = options.idempotencyKey;
    }
    const reqHeaders = this.buildHeaders({ options, headers, contentLength });
    const req = {
      method,
      ...body && { body },
      headers: reqHeaders,
      ...httpAgent && { agent: httpAgent },
      signal: options.signal ?? null
    };
    return { req, url, timeout };
  }
  buildHeaders({ options, headers, contentLength }) {
    const reqHeaders = {};
    if (contentLength) {
      reqHeaders["content-length"] = contentLength;
    }
    const defaultHeaders = this.defaultHeaders(options);
    applyHeadersMut(reqHeaders, defaultHeaders);
    applyHeadersMut(reqHeaders, headers);
    if (isMultipartBody(options.body) && kind !== "node") {
      delete reqHeaders["content-type"];
    }
    this.validateHeaders(reqHeaders, headers);
    return reqHeaders;
  }
  async prepareOptions(options) {
  }
  async prepareRequest(request, { url, options }) {
  }
  parseHeaders(headers) {
    return !headers ? {} : (Symbol.iterator in headers) ? Object.fromEntries(Array.from(headers).map((header) => [...header])) : { ...headers };
  }
  makeStatusError(status, error4, message, headers) {
    return APIError.generate(status, error4, message, headers);
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this.makeRequest(options, remainingRetries));
  }
  async makeRequest(optionsInput, retriesRemaining) {
    const options = await optionsInput;
    if (retriesRemaining == null) {
      retriesRemaining = options.maxRetries ?? this.maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = this.buildRequest(options);
    await this.prepareRequest(req, { url, options });
    debug("request", url, options, req.headers);
    if (options.signal?.aborted) {
      throw new APIUserAbortError;
    }
    const controller = new AbortController;
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    if (response instanceof Error) {
      if (options.signal?.aborted) {
        throw new APIUserAbortError;
      }
      if (retriesRemaining) {
        return this.retryRequest(options, retriesRemaining);
      }
      if (response.name === "AbortError") {
        throw new APIConnectionTimeoutError;
      }
      throw new APIConnectionError({ cause: response });
    }
    const responseHeaders = createResponseHeaders(response.headers);
    if (!response.ok) {
      if (retriesRemaining && this.shouldRetry(response)) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        debug(`response (error; ${retryMessage2})`, response.status, url, responseHeaders);
        return this.retryRequest(options, retriesRemaining, responseHeaders);
      }
      const errText = await response.text().catch((e) => castToError(e).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? undefined : errText;
      const retryMessage = retriesRemaining ? `(error; no more retries left)` : `(error; not retryable)`;
      debug(`response (error; ${retryMessage})`, response.status, url, responseHeaders, errMessage);
      const err = this.makeStatusError(response.status, errJSON, errMessage, responseHeaders);
      throw err;
    }
    return { response, options, controller };
  }
  requestAPIList(Page, options) {
    const request = this.makeRequest(options, null);
    return new PagePromise(this, request, Page);
  }
  buildURL(path2, query) {
    const url = isAbsoluteURL(path2) ? new URL(path2) : new URL(this.baseURL + (this.baseURL.endsWith("/") && path2.startsWith("/") ? path2.slice(1) : path2));
    const defaultQuery = this.defaultQuery();
    if (!isEmptyObj(defaultQuery)) {
      query = { ...defaultQuery, ...query };
    }
    if (typeof query === "object" && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query);
    }
    return url.toString();
  }
  stringifyQuery(query) {
    return Object.entries(query).filter(([_2, value]) => typeof value !== "undefined").map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
      if (value === null) {
        return `${encodeURIComponent(key)}=`;
      }
      throw new OpenAIError(`Cannot stringify type ${typeof value}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`);
    }).join("&");
  }
  async fetchWithTimeout(url, init4, ms, controller) {
    const { signal, ...options } = init4 || {};
    if (signal)
      signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    return this.getRequestClient().fetch.call(undefined, url, { signal: controller.signal, ...options }).finally(() => {
      clearTimeout(timeout);
    });
  }
  getRequestClient() {
    return { fetch: this.fetch };
  }
  shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.["retry-after-ms"];
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.["retry-after"];
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1000;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (!(timeoutMillis && 0 <= timeoutMillis && timeoutMillis < 60 * 1000)) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep4(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1000;
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
}

class AbstractPage {
  constructor(client, response, body, options) {
    _AbstractPage_client.set(this, undefined);
    __classPrivateFieldSet2(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageInfo() != null;
  }
  async getNextPage() {
    const nextInfo = this.nextPageInfo();
    if (!nextInfo) {
      throw new OpenAIError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    const nextOptions = { ...this.options };
    if ("params" in nextInfo && typeof nextOptions.query === "object") {
      nextOptions.query = { ...nextOptions.query, ...nextInfo.params };
    } else if ("url" in nextInfo) {
      const params = [...Object.entries(nextOptions.query || {}), ...nextInfo.url.searchParams.entries()];
      for (const [key, value] of params) {
        nextInfo.url.searchParams.set(key, value);
      }
      nextOptions.query = undefined;
      nextOptions.path = nextInfo.url.toString();
    }
    return await __classPrivateFieldGet2(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async* iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async* [(_AbstractPage_client = new WeakMap, Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
}

class PagePromise extends APIPromise {
  constructor(client, request, Page) {
    super(request, async (props) => new Page(client, props.response, await defaultParseResponse(props), props.options));
  }
  async* [Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
}
var createResponseHeaders = (headers) => {
  return new Proxy(Object.fromEntries(headers.entries()), {
    get(target, name) {
      const key = name.toString();
      return target[key.toLowerCase()] || target[key];
    }
  });
};
var requestOptionsKeys = {
  method: true,
  path: true,
  query: true,
  body: true,
  headers: true,
  maxRetries: true,
  stream: true,
  timeout: true,
  httpAgent: true,
  signal: true,
  idempotencyKey: true,
  __binaryRequest: true,
  __binaryResponse: true,
  __streamClass: true
};
var isRequestOptions = (obj) => {
  return typeof obj === "object" && obj !== null && !isEmptyObj(obj) && Object.keys(obj).every((k) => hasOwn(requestOptionsKeys, k));
};
var getPlatformProperties = () => {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": process.version
    };
  }
  if (Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(process.platform),
      "X-Stainless-Arch": normalizeArch(process.arch),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": process.version
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
var normalizeArch = (arch) => {
  if (arch === "x32")
    return "x32";
  if (arch === "x86_64" || arch === "x64")
    return "x64";
  if (arch === "arm")
    return "arm";
  if (arch === "aarch64" || arch === "arm64")
    return "arm64";
  if (arch)
    return `other:${arch}`;
  return "unknown";
};
var normalizePlatform = (platform) => {
  platform = platform.toLowerCase();
  if (platform.includes("ios"))
    return "iOS";
  if (platform === "android")
    return "Android";
  if (platform === "darwin")
    return "MacOS";
  if (platform === "win32")
    return "Windows";
  if (platform === "freebsd")
    return "FreeBSD";
  if (platform === "openbsd")
    return "OpenBSD";
  if (platform === "linux")
    return "Linux";
  if (platform)
    return `Other:${platform}`;
  return "Unknown";
};
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};
var safeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return;
  }
};
var startsWithSchemeRegexp = new RegExp("^(?:[a-z]+:)?//", "i");
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var sleep4 = (ms) => new Promise((resolve5) => setTimeout(resolve5, ms));
var validatePositiveInteger = (name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new OpenAIError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new OpenAIError(`${name} must be a positive integer`);
  }
  return n;
};
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  return new Error(err);
};
var readEnv = (env2) => {
  if (typeof process !== "undefined") {
    return process.env?.[env2]?.trim() ?? undefined;
  }
  if (typeof Deno !== "undefined") {
    return Deno.env?.get?.(env2)?.trim();
  }
  return;
};
var uuid4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
};
var isRunningInBrowser = () => {
  return typeof window !== "undefined" && typeof window.document !== "undefined" && typeof navigator !== "undefined";
};

class OpenAIError extends Error {
}

class APIError extends OpenAIError {
  constructor(status, error4, message, headers) {
    super(`${APIError.makeMessage(status, error4, message)}`);
    this.status = status;
    this.headers = headers;
    this.request_id = headers?.["x-request-id"];
    const data = error4;
    this.error = data;
    this.code = data?.["code"];
    this.param = data?.["param"];
    this.type = data?.["type"];
  }
  static makeMessage(status, error4, message) {
    const msg = error4?.message ? typeof error4.message === "string" ? error4.message : JSON.stringify(error4.message) : error4 ? JSON.stringify(error4) : message;
    if (status && msg) {
      return `${status} ${msg}`;
    }
    if (status) {
      return `${status} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status, errorResponse, message, headers) {
    if (!status) {
      return new APIConnectionError({ cause: castToError(errorResponse) });
    }
    const error4 = errorResponse?.["error"];
    if (status === 400) {
      return new BadRequestError(status, error4, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, error4, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error4, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, error4, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, error4, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error4, message, headers);
    }
    if (status === 429) {
      return new RateLimitError(status, error4, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, error4, message, headers);
    }
    return new APIError(status, error4, message, headers);
  }
}

class APIUserAbortError extends APIError {
  constructor({ message } = {}) {
    super(undefined, undefined, message || "Request was aborted.", undefined);
    this.status = undefined;
  }
}

class APIConnectionError extends APIError {
  constructor({ message, cause }) {
    super(undefined, undefined, message || "Connection error.", undefined);
    this.status = undefined;
    if (cause)
      this.cause = cause;
  }
}

class APIConnectionTimeoutError extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
}

class BadRequestError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 400;
  }
}

class AuthenticationError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 401;
  }
}

class PermissionDeniedError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 403;
  }
}

class NotFoundError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 404;
  }
}

class ConflictError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 409;
  }
}

class UnprocessableEntityError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 422;
  }
}

class RateLimitError extends APIError {
  constructor() {
    super(...arguments);
    this.status = 429;
  }
}

class InternalServerError extends APIError {
}

class Page extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.object = body.object;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageParams() {
    return null;
  }
  nextPageInfo() {
    return null;
  }
}

class CursorPage extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageParams() {
    const info = this.nextPageInfo();
    if (!info)
      return null;
    if ("params" in info)
      return info.params;
    const params = Object.fromEntries(info.url.searchParams);
    if (!Object.keys(params).length)
      return null;
    return params;
  }
  nextPageInfo() {
    const data = this.getPaginatedItems();
    if (!data.length) {
      return null;
    }
    const id4 = data[data.length - 1]?.id;
    if (!id4) {
      return null;
    }
    return { params: { after: id4 } };
  }
}

class APIResource {
  constructor(client) {
    this._client = client;
  }
}

class Completions extends APIResource {
  create(body, options) {
    return this._client.post("/chat/completions", { body, ...options, stream: body.stream ?? false });
  }
}
(function(Completions2) {
})(Completions || (Completions = {}));

class Chat extends APIResource {
  constructor() {
    super(...arguments);
    this.completions = new Completions(this._client);
  }
}
(function(Chat2) {
  Chat2.Completions = Completions;
})(Chat || (Chat = {}));

class Speech extends APIResource {
  create(body, options) {
    return this._client.post("/audio/speech", { body, ...options, __binaryResponse: true });
  }
}
(function(Speech2) {
})(Speech || (Speech = {}));

class Transcriptions extends APIResource {
  create(body, options) {
    return this._client.post("/audio/transcriptions", multipartFormRequestOptions({ body, ...options }));
  }
}
(function(Transcriptions2) {
})(Transcriptions || (Transcriptions = {}));

class Translations extends APIResource {
  create(body, options) {
    return this._client.post("/audio/translations", multipartFormRequestOptions({ body, ...options }));
  }
}
(function(Translations2) {
})(Translations || (Translations = {}));

class Audio extends APIResource {
  constructor() {
    super(...arguments);
    this.transcriptions = new Transcriptions(this._client);
    this.translations = new Translations(this._client);
    this.speech = new Speech(this._client);
  }
}
(function(Audio2) {
  Audio2.Transcriptions = Transcriptions;
  Audio2.Translations = Translations;
  Audio2.Speech = Speech;
})(Audio || (Audio = {}));

class Batches extends APIResource {
  create(body, options) {
    return this._client.post("/batches", { body, ...options });
  }
  retrieve(batchId, options) {
    return this._client.get(`/batches/${batchId}`, options);
  }
  list(query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.getAPIList("/batches", BatchesPage, { query, ...options });
  }
  cancel(batchId, options) {
    return this._client.post(`/batches/${batchId}/cancel`, options);
  }
}

class BatchesPage extends CursorPage {
}
(function(Batches2) {
  Batches2.BatchesPage = BatchesPage;
})(Batches || (Batches = {}));

class Assistants extends APIResource {
  create(body, options) {
    return this._client.post("/assistants", {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(assistantId, options) {
    return this._client.get(`/assistants/${assistantId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  update(assistantId, body, options) {
    return this._client.post(`/assistants/${assistantId}`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.getAPIList("/assistants", AssistantsPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  del(assistantId, options) {
    return this._client.delete(`/assistants/${assistantId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
}

class AssistantsPage extends CursorPage {
}
(function(Assistants2) {
  Assistants2.AssistantsPage = AssistantsPage;
})(Assistants || (Assistants = {}));
var isAssistantMessage = (message) => {
  return message?.role === "assistant";
};
var isFunctionMessage = (message) => {
  return message?.role === "function";
};
var isToolMessage = (message) => {
  return message?.role === "tool";
};
var __classPrivateFieldSet22 = function(receiver, state, value, kind2, f) {
  if (kind2 === "m")
    throw new TypeError("Private method is not writable");
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet22 = function(receiver, state, kind2, f) {
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AbstractChatCompletionRunner_instances;
var _AbstractChatCompletionRunner_connectedPromise;
var _AbstractChatCompletionRunner_resolveConnectedPromise;
var _AbstractChatCompletionRunner_rejectConnectedPromise;
var _AbstractChatCompletionRunner_endPromise;
var _AbstractChatCompletionRunner_resolveEndPromise;
var _AbstractChatCompletionRunner_rejectEndPromise;
var _AbstractChatCompletionRunner_listeners;
var _AbstractChatCompletionRunner_ended;
var _AbstractChatCompletionRunner_errored;
var _AbstractChatCompletionRunner_aborted;
var _AbstractChatCompletionRunner_catchingPromiseCreated;
var _AbstractChatCompletionRunner_getFinalContent;
var _AbstractChatCompletionRunner_getFinalMessage;
var _AbstractChatCompletionRunner_getFinalFunctionCall;
var _AbstractChatCompletionRunner_getFinalFunctionCallResult;
var _AbstractChatCompletionRunner_calculateTotalUsage;
var _AbstractChatCompletionRunner_handleError;
var _AbstractChatCompletionRunner_validateParams;
var _AbstractChatCompletionRunner_stringifyFunctionCallResult;
var DEFAULT_MAX_CHAT_COMPLETIONS = 10;

class AbstractChatCompletionRunner {
  constructor() {
    _AbstractChatCompletionRunner_instances.add(this);
    this.controller = new AbortController;
    _AbstractChatCompletionRunner_connectedPromise.set(this, undefined);
    _AbstractChatCompletionRunner_resolveConnectedPromise.set(this, () => {
    });
    _AbstractChatCompletionRunner_rejectConnectedPromise.set(this, () => {
    });
    _AbstractChatCompletionRunner_endPromise.set(this, undefined);
    _AbstractChatCompletionRunner_resolveEndPromise.set(this, () => {
    });
    _AbstractChatCompletionRunner_rejectEndPromise.set(this, () => {
    });
    _AbstractChatCompletionRunner_listeners.set(this, {});
    this._chatCompletions = [];
    this.messages = [];
    _AbstractChatCompletionRunner_ended.set(this, false);
    _AbstractChatCompletionRunner_errored.set(this, false);
    _AbstractChatCompletionRunner_aborted.set(this, false);
    _AbstractChatCompletionRunner_catchingPromiseCreated.set(this, false);
    _AbstractChatCompletionRunner_handleError.set(this, (error5) => {
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_errored, true, "f");
      if (error5 instanceof Error && error5.name === "AbortError") {
        error5 = new APIUserAbortError;
      }
      if (error5 instanceof APIUserAbortError) {
        __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_aborted, true, "f");
        return this._emit("abort", error5);
      }
      if (error5 instanceof OpenAIError) {
        return this._emit("error", error5);
      }
      if (error5 instanceof Error) {
        const openAIError = new OpenAIError(error5.message);
        openAIError.cause = error5;
        return this._emit("error", openAIError);
      }
      return this._emit("error", new OpenAIError(String(error5)));
    });
    __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_connectedPromise, new Promise((resolve5, reject) => {
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_resolveConnectedPromise, resolve5, "f");
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_endPromise, new Promise((resolve5, reject) => {
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_resolveEndPromise, resolve5, "f");
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_endPromise, "f").catch(() => {
    });
  }
  _run(executor) {
    setTimeout(() => {
      executor().then(() => {
        this._emitFinal();
        this._emit("end");
      }, __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_handleError, "f"));
    }, 0);
  }
  _addChatCompletion(chatCompletion) {
    this._chatCompletions.push(chatCompletion);
    this._emit("chatCompletion", chatCompletion);
    const message = chatCompletion.choices[0]?.message;
    if (message)
      this._addMessage(message);
    return chatCompletion;
  }
  _addMessage(message, emit = true) {
    if (!("content" in message))
      message.content = null;
    this.messages.push(message);
    if (emit) {
      this._emit("message", message);
      if ((isFunctionMessage(message) || isToolMessage(message)) && message.content) {
        this._emit("functionCallResult", message.content);
      } else if (isAssistantMessage(message) && message.function_call) {
        this._emit("functionCall", message.function_call);
      } else if (isAssistantMessage(message) && message.tool_calls) {
        for (const tool_call of message.tool_calls) {
          if (tool_call.type === "function") {
            this._emit("functionCall", tool_call.function);
          }
        }
      }
    }
  }
  _connected() {
    if (this.ended)
      return;
    __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_resolveConnectedPromise, "f").call(this);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  on(event, listener) {
    const listeners = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event] || (__classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  off(event, listener) {
    const listeners = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  once(event, listener) {
    const listeners = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event] || (__classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  emitted(event) {
    return new Promise((resolve5, reject) => {
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve5);
    });
  }
  async done() {
    __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_endPromise, "f");
  }
  async finalChatCompletion() {
    await this.done();
    const completion3 = this._chatCompletions[this._chatCompletions.length - 1];
    if (!completion3)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return completion3;
  }
  async finalContent() {
    await this.done();
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
  }
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
  }
  async finalFunctionCall() {
    await this.done();
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCall).call(this);
  }
  async finalFunctionCallResult() {
    await this.done();
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCallResult).call(this);
  }
  async totalUsage() {
    await this.done();
    return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this);
  }
  allChatCompletions() {
    return [...this._chatCompletions];
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet22(this, _AbstractChatCompletionRunner_ended, "f")) {
      return;
    }
    if (event === "end") {
      __classPrivateFieldSet22(this, _AbstractChatCompletionRunner_ended, true, "f");
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error5 = args[0];
      if (!__classPrivateFieldGet22(this, _AbstractChatCompletionRunner_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error5);
      }
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_rejectConnectedPromise, "f").call(this, error5);
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_rejectEndPromise, "f").call(this, error5);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error5 = args[0];
      if (!__classPrivateFieldGet22(this, _AbstractChatCompletionRunner_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error5);
      }
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_rejectConnectedPromise, "f").call(this, error5);
      __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_rejectEndPromise, "f").call(this, error5);
      this._emit("end");
    }
  }
  _emitFinal() {
    const completion3 = this._chatCompletions[this._chatCompletions.length - 1];
    if (completion3)
      this._emit("finalChatCompletion", completion3);
    const finalMessage = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
    if (finalMessage)
      this._emit("finalMessage", finalMessage);
    const finalContent = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
    if (finalContent)
      this._emit("finalContent", finalContent);
    const finalFunctionCall = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCall).call(this);
    if (finalFunctionCall)
      this._emit("finalFunctionCall", finalFunctionCall);
    const finalFunctionCallResult = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionCallResult).call(this);
    if (finalFunctionCallResult != null)
      this._emit("finalFunctionCallResult", finalFunctionCallResult);
    if (this._chatCompletions.some((c) => c.usage)) {
      this._emit("totalUsage", __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this));
    }
  }
  async _createChatCompletion(completions, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_validateParams).call(this, params);
    const chatCompletion = await completions.create({ ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addChatCompletion(chatCompletion);
  }
  async _runChatCompletion(completions, params, options) {
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    return await this._createChatCompletion(completions, params, options);
  }
  async _runFunctions(completions, params, options) {
    const role = "function";
    const { function_call = "auto", stream, ...restParams } = params;
    const singleFunctionToCall = typeof function_call !== "string" && function_call?.name;
    const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
    const functionsByName = {};
    for (const f of params.functions) {
      functionsByName[f.name || f.function.name] = f;
    }
    const functions = params.functions.map((f) => ({
      name: f.name || f.function.name,
      parameters: f.parameters,
      description: f.description
    }));
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    for (let i = 0;i < maxChatCompletions; ++i) {
      const chatCompletion = await this._createChatCompletion(completions, {
        ...restParams,
        function_call,
        functions,
        messages: [...this.messages]
      }, options);
      const message = chatCompletion.choices[0]?.message;
      if (!message) {
        throw new OpenAIError(`missing message in ChatCompletion response`);
      }
      if (!message.function_call)
        return;
      const { name, arguments: args } = message.function_call;
      const fn = functionsByName[name];
      if (!fn) {
        const content2 = `Invalid function_call: ${JSON.stringify(name)}. Available options are: ${functions.map((f) => JSON.stringify(f.name)).join(", ")}. Please try again`;
        this._addMessage({ role, name, content: content2 });
        continue;
      } else if (singleFunctionToCall && singleFunctionToCall !== name) {
        const content2 = `Invalid function_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
        this._addMessage({ role, name, content: content2 });
        continue;
      }
      let parsed;
      try {
        parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
      } catch (error5) {
        this._addMessage({
          role,
          name,
          content: error5 instanceof Error ? error5.message : String(error5)
        });
        continue;
      }
      const rawContent = await fn.function(parsed, this);
      const content = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
      this._addMessage({ role, name, content });
      if (singleFunctionToCall)
        return;
    }
  }
  async _runTools(completions, params, options) {
    const role = "tool";
    const { tool_choice = "auto", stream, ...restParams } = params;
    const singleFunctionToCall = typeof tool_choice !== "string" && tool_choice?.function?.name;
    const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
    const functionsByName = {};
    for (const f of params.tools) {
      if (f.type === "function") {
        functionsByName[f.function.name || f.function.function.name] = f.function;
      }
    }
    const tools = "tools" in params ? params.tools.map((t) => t.type === "function" ? {
      type: "function",
      function: {
        name: t.function.name || t.function.function.name,
        parameters: t.function.parameters,
        description: t.function.description
      }
    } : t) : undefined;
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    for (let i = 0;i < maxChatCompletions; ++i) {
      const chatCompletion = await this._createChatCompletion(completions, {
        ...restParams,
        tool_choice,
        tools,
        messages: [...this.messages]
      }, options);
      const message = chatCompletion.choices[0]?.message;
      if (!message) {
        throw new OpenAIError(`missing message in ChatCompletion response`);
      }
      if (!message.tool_calls) {
        return;
      }
      for (const tool_call of message.tool_calls) {
        if (tool_call.type !== "function")
          continue;
        const tool_call_id = tool_call.id;
        const { name, arguments: args } = tool_call.function;
        const fn = functionsByName[name];
        if (!fn) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. Available options are: ${tools.map((f) => JSON.stringify(f.function.name)).join(", ")}. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        } else if (singleFunctionToCall && singleFunctionToCall !== name) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        let parsed;
        try {
          parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
        } catch (error5) {
          const content2 = error5 instanceof Error ? error5.message : String(error5);
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        const rawContent = await fn.function(parsed, this);
        const content = __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
        this._addMessage({ role, tool_call_id, content });
        if (singleFunctionToCall) {
          return;
        }
      }
    }
    return;
  }
}
_AbstractChatCompletionRunner_connectedPromise = new WeakMap, _AbstractChatCompletionRunner_resolveConnectedPromise = new WeakMap, _AbstractChatCompletionRunner_rejectConnectedPromise = new WeakMap, _AbstractChatCompletionRunner_endPromise = new WeakMap, _AbstractChatCompletionRunner_resolveEndPromise = new WeakMap, _AbstractChatCompletionRunner_rejectEndPromise = new WeakMap, _AbstractChatCompletionRunner_listeners = new WeakMap, _AbstractChatCompletionRunner_ended = new WeakMap, _AbstractChatCompletionRunner_errored = new WeakMap, _AbstractChatCompletionRunner_aborted = new WeakMap, _AbstractChatCompletionRunner_catchingPromiseCreated = new WeakMap, _AbstractChatCompletionRunner_handleError = new WeakMap, _AbstractChatCompletionRunner_instances = new WeakSet, _AbstractChatCompletionRunner_getFinalContent = function _AbstractChatCompletionRunner_getFinalContent2() {
  return __classPrivateFieldGet22(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this).content ?? null;
}, _AbstractChatCompletionRunner_getFinalMessage = function _AbstractChatCompletionRunner_getFinalMessage2() {
  let i = this.messages.length;
  while (i-- > 0) {
    const message = this.messages[i];
    if (isAssistantMessage(message)) {
      const { function_call, ...rest } = message;
      const ret = { ...rest, content: message.content ?? null };
      if (function_call) {
        ret.function_call = function_call;
      }
      return ret;
    }
  }
  throw new OpenAIError("stream ended without producing a ChatCompletionMessage with role=assistant");
}, _AbstractChatCompletionRunner_getFinalFunctionCall = function _AbstractChatCompletionRunner_getFinalFunctionCall2() {
  for (let i = this.messages.length - 1;i >= 0; i--) {
    const message = this.messages[i];
    if (isAssistantMessage(message) && message?.function_call) {
      return message.function_call;
    }
    if (isAssistantMessage(message) && message?.tool_calls?.length) {
      return message.tool_calls.at(-1)?.function;
    }
  }
  return;
}, _AbstractChatCompletionRunner_getFinalFunctionCallResult = function _AbstractChatCompletionRunner_getFinalFunctionCallResult2() {
  for (let i = this.messages.length - 1;i >= 0; i--) {
    const message = this.messages[i];
    if (isFunctionMessage(message) && message.content != null) {
      return message.content;
    }
    if (isToolMessage(message) && message.content != null && this.messages.some((x) => x.role === "assistant" && x.tool_calls?.some((y2) => y2.type === "function" && y2.id === message.tool_call_id))) {
      return message.content;
    }
  }
  return;
}, _AbstractChatCompletionRunner_calculateTotalUsage = function _AbstractChatCompletionRunner_calculateTotalUsage2() {
  const total = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0
  };
  for (const { usage: usage3 } of this._chatCompletions) {
    if (usage3) {
      total.completion_tokens += usage3.completion_tokens;
      total.prompt_tokens += usage3.prompt_tokens;
      total.total_tokens += usage3.total_tokens;
    }
  }
  return total;
}, _AbstractChatCompletionRunner_validateParams = function _AbstractChatCompletionRunner_validateParams2(params) {
  if (params.n != null && params.n > 1) {
    throw new OpenAIError("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
  }
}, _AbstractChatCompletionRunner_stringifyFunctionCallResult = function _AbstractChatCompletionRunner_stringifyFunctionCallResult2(rawContent) {
  return typeof rawContent === "string" ? rawContent : rawContent === undefined ? "undefined" : JSON.stringify(rawContent);
};

class ChatCompletionRunner extends AbstractChatCompletionRunner {
  static runFunctions(completions, params, options) {
    const runner = new ChatCompletionRunner;
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runFunctions" }
    };
    runner._run(() => runner._runFunctions(completions, params, opts));
    return runner;
  }
  static runTools(completions, params, options) {
    const runner = new ChatCompletionRunner;
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(completions, params, opts));
    return runner;
  }
  _addMessage(message) {
    super._addMessage(message);
    if (isAssistantMessage(message) && message.content) {
      this._emit("content", message.content);
    }
  }
}
var finalizeChatCompletion = function(snapshot) {
  const { id: id4, choices, created, model, system_fingerprint, ...rest } = snapshot;
  return {
    ...rest,
    id: id4,
    choices: choices.map(({ message, finish_reason, index, logprobs, ...choiceRest }) => {
      if (!finish_reason)
        throw new OpenAIError(`missing finish_reason for choice ${index}`);
      const { content = null, function_call, tool_calls, ...messageRest } = message;
      const role = message.role;
      if (!role)
        throw new OpenAIError(`missing role for choice ${index}`);
      if (function_call) {
        const { arguments: args, name } = function_call;
        if (args == null)
          throw new OpenAIError(`missing function_call.arguments for choice ${index}`);
        if (!name)
          throw new OpenAIError(`missing function_call.name for choice ${index}`);
        return {
          ...choiceRest,
          message: { content, function_call: { arguments: args, name }, role },
          finish_reason,
          index,
          logprobs
        };
      }
      if (tool_calls) {
        return {
          ...choiceRest,
          index,
          finish_reason,
          logprobs,
          message: {
            ...messageRest,
            role,
            content,
            tool_calls: tool_calls.map((tool_call, i) => {
              const { function: fn, type: type5, id: id22, ...toolRest } = tool_call;
              const { arguments: args, name, ...fnRest } = fn || {};
              if (id22 == null)
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].id\n${str(snapshot)}`);
              if (type5 == null)
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].type\n${str(snapshot)}`);
              if (name == null)
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.name\n${str(snapshot)}`);
              if (args == null)
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.arguments\n${str(snapshot)}`);
              return { ...toolRest, id: id22, type: type5, function: { ...fnRest, name, arguments: args } };
            })
          }
        };
      }
      return {
        ...choiceRest,
        message: { ...messageRest, content, role },
        finish_reason,
        index,
        logprobs
      };
    }),
    created,
    model,
    object: "chat.completion",
    ...system_fingerprint ? { system_fingerprint } : {}
  };
};
var str = function(x) {
  return JSON.stringify(x);
};
var __classPrivateFieldGet3 = function(receiver, state, kind2, f) {
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet3 = function(receiver, state, value, kind2, f) {
  if (kind2 === "m")
    throw new TypeError("Private method is not writable");
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _ChatCompletionStream_instances;
var _ChatCompletionStream_currentChatCompletionSnapshot;
var _ChatCompletionStream_beginRequest;
var _ChatCompletionStream_addChunk;
var _ChatCompletionStream_endRequest;
var _ChatCompletionStream_accumulateChatCompletion;

class ChatCompletionStream extends AbstractChatCompletionRunner {
  constructor() {
    super(...arguments);
    _ChatCompletionStream_instances.add(this);
    _ChatCompletionStream_currentChatCompletionSnapshot.set(this, undefined);
  }
  get currentChatCompletionSnapshot() {
    return __classPrivateFieldGet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
  }
  static fromReadableStream(stream) {
    const runner = new ChatCompletionStream;
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createChatCompletion(completions, params, options) {
    const runner = new ChatCompletionStream;
    runner._run(() => runner._runChatCompletion(completions, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  async _createChatCompletion(completions, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    const stream = await completions.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const chunk of stream) {
      __classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addChatCompletion(__classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    let chatId;
    for await (const chunk of stream) {
      if (chatId && chatId !== chunk.id) {
        this._addChatCompletion(__classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
      }
      __classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
      chatId = chunk.id;
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addChatCompletion(__classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  [(_ChatCompletionStream_currentChatCompletionSnapshot = new WeakMap, _ChatCompletionStream_instances = new WeakSet, _ChatCompletionStream_beginRequest = function _ChatCompletionStream_beginRequest() {
    if (this.ended)
      return;
    __classPrivateFieldSet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, undefined, "f");
  }, _ChatCompletionStream_addChunk = function _ChatCompletionStream_addChunk(chunk) {
    if (this.ended)
      return;
    const completion3 = __classPrivateFieldGet3(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_accumulateChatCompletion).call(this, chunk);
    this._emit("chunk", chunk, completion3);
    const delta = chunk.choices[0]?.delta?.content;
    const snapshot = completion3.choices[0]?.message;
    if (delta != null && snapshot?.role === "assistant" && snapshot?.content) {
      this._emit("content", delta, snapshot.content);
    }
  }, _ChatCompletionStream_endRequest = function _ChatCompletionStream_endRequest() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, undefined, "f");
    return finalizeChatCompletion(snapshot);
  }, _ChatCompletionStream_accumulateChatCompletion = function _ChatCompletionStream_accumulateChatCompletion(chunk) {
    var _a2, _b2, _c2;
    let snapshot = __classPrivateFieldGet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    const { choices, ...rest } = chunk;
    if (!snapshot) {
      snapshot = __classPrivateFieldSet3(this, _ChatCompletionStream_currentChatCompletionSnapshot, {
        ...rest,
        choices: []
      }, "f");
    } else {
      Object.assign(snapshot, rest);
    }
    for (const { delta, finish_reason, index, logprobs = null, ...other } of chunk.choices) {
      let choice = snapshot.choices[index];
      if (!choice) {
        choice = snapshot.choices[index] = { finish_reason, index, message: {}, logprobs, ...other };
      }
      if (logprobs) {
        if (!choice.logprobs) {
          choice.logprobs = Object.assign({}, logprobs);
        } else {
          const { content: content2, ...rest3 } = logprobs;
          Object.assign(choice.logprobs, rest3);
          if (content2) {
            (_a2 = choice.logprobs).content ?? (_a2.content = []);
            choice.logprobs.content.push(...content2);
          }
        }
      }
      if (finish_reason)
        choice.finish_reason = finish_reason;
      Object.assign(choice, other);
      if (!delta)
        continue;
      const { content, function_call, role, tool_calls, ...rest2 } = delta;
      Object.assign(choice.message, rest2);
      if (content)
        choice.message.content = (choice.message.content || "") + content;
      if (role)
        choice.message.role = role;
      if (function_call) {
        if (!choice.message.function_call) {
          choice.message.function_call = function_call;
        } else {
          if (function_call.name)
            choice.message.function_call.name = function_call.name;
          if (function_call.arguments) {
            (_b2 = choice.message.function_call).arguments ?? (_b2.arguments = "");
            choice.message.function_call.arguments += function_call.arguments;
          }
        }
      }
      if (tool_calls) {
        if (!choice.message.tool_calls)
          choice.message.tool_calls = [];
        for (const { index: index2, id: id4, type: type5, function: fn, ...rest3 } of tool_calls) {
          const tool_call = (_c2 = choice.message.tool_calls)[index2] ?? (_c2[index2] = {});
          Object.assign(tool_call, rest3);
          if (id4)
            tool_call.id = id4;
          if (type5)
            tool_call.type = type5;
          if (fn)
            tool_call.function ?? (tool_call.function = { arguments: "" });
          if (fn?.name)
            tool_call.function.name = fn.name;
          if (fn?.arguments)
            tool_call.function.arguments += fn.arguments;
        }
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("chunk", (chunk) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(chunk);
      } else {
        pushQueue.push(chunk);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(undefined);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: undefined, done: true };
          }
          return new Promise((resolve5, reject) => readQueue.push({ resolve: resolve5, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: undefined, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: undefined, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
}

class ChatCompletionStreamingRunner extends ChatCompletionStream {
  static fromReadableStream(stream) {
    const runner = new ChatCompletionStreamingRunner;
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static runFunctions(completions, params, options) {
    const runner = new ChatCompletionStreamingRunner;
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runFunctions" }
    };
    runner._run(() => runner._runFunctions(completions, params, opts));
    return runner;
  }
  static runTools(completions, params, options) {
    const runner = new ChatCompletionStreamingRunner;
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(completions, params, opts));
    return runner;
  }
}

class Completions2 extends APIResource {
  runFunctions(body, options) {
    if (body.stream) {
      return ChatCompletionStreamingRunner.runFunctions(this._client.chat.completions, body, options);
    }
    return ChatCompletionRunner.runFunctions(this._client.chat.completions, body, options);
  }
  runTools(body, options) {
    if (body.stream) {
      return ChatCompletionStreamingRunner.runTools(this._client.chat.completions, body, options);
    }
    return ChatCompletionRunner.runTools(this._client.chat.completions, body, options);
  }
  stream(body, options) {
    return ChatCompletionStream.createChatCompletion(this._client.chat.completions, body, options);
  }
}

class Chat2 extends APIResource {
  constructor() {
    super(...arguments);
    this.completions = new Completions2(this._client);
  }
}
(function(Chat3) {
  Chat3.Completions = Completions2;
})(Chat2 || (Chat2 = {}));
var __classPrivateFieldSet4 = function(receiver, state, value, kind2, f) {
  if (kind2 === "m")
    throw new TypeError("Private method is not writable");
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet4 = function(receiver, state, kind2, f) {
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AbstractAssistantStreamRunner_connectedPromise;
var _AbstractAssistantStreamRunner_resolveConnectedPromise;
var _AbstractAssistantStreamRunner_rejectConnectedPromise;
var _AbstractAssistantStreamRunner_endPromise;
var _AbstractAssistantStreamRunner_resolveEndPromise;
var _AbstractAssistantStreamRunner_rejectEndPromise;
var _AbstractAssistantStreamRunner_listeners;
var _AbstractAssistantStreamRunner_ended;
var _AbstractAssistantStreamRunner_errored;
var _AbstractAssistantStreamRunner_aborted;
var _AbstractAssistantStreamRunner_catchingPromiseCreated;
var _AbstractAssistantStreamRunner_handleError;

class AbstractAssistantStreamRunner {
  constructor() {
    this.controller = new AbortController;
    _AbstractAssistantStreamRunner_connectedPromise.set(this, undefined);
    _AbstractAssistantStreamRunner_resolveConnectedPromise.set(this, () => {
    });
    _AbstractAssistantStreamRunner_rejectConnectedPromise.set(this, () => {
    });
    _AbstractAssistantStreamRunner_endPromise.set(this, undefined);
    _AbstractAssistantStreamRunner_resolveEndPromise.set(this, () => {
    });
    _AbstractAssistantStreamRunner_rejectEndPromise.set(this, () => {
    });
    _AbstractAssistantStreamRunner_listeners.set(this, {});
    _AbstractAssistantStreamRunner_ended.set(this, false);
    _AbstractAssistantStreamRunner_errored.set(this, false);
    _AbstractAssistantStreamRunner_aborted.set(this, false);
    _AbstractAssistantStreamRunner_catchingPromiseCreated.set(this, false);
    _AbstractAssistantStreamRunner_handleError.set(this, (error7) => {
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_errored, true, "f");
      if (error7 instanceof Error && error7.name === "AbortError") {
        error7 = new APIUserAbortError;
      }
      if (error7 instanceof APIUserAbortError) {
        __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_aborted, true, "f");
        return this._emit("abort", error7);
      }
      if (error7 instanceof OpenAIError) {
        return this._emit("error", error7);
      }
      if (error7 instanceof Error) {
        const openAIError = new OpenAIError(error7.message);
        openAIError.cause = error7;
        return this._emit("error", openAIError);
      }
      return this._emit("error", new OpenAIError(String(error7)));
    });
    __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_connectedPromise, new Promise((resolve5, reject) => {
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_resolveConnectedPromise, resolve5, "f");
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_endPromise, new Promise((resolve5, reject) => {
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_resolveEndPromise, resolve5, "f");
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_endPromise, "f").catch(() => {
    });
  }
  _run(executor) {
    setTimeout(() => {
      executor().then(() => {
        this._emit("end");
      }, __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_handleError, "f"));
    }, 0);
  }
  _addRun(run) {
    return run;
  }
  _connected() {
    if (this.ended)
      return;
    __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_resolveConnectedPromise, "f").call(this);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  on(event, listener) {
    const listeners = __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event] || (__classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  off(event, listener) {
    const listeners = __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  once(event, listener) {
    const listeners = __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event] || (__classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  emitted(event) {
    return new Promise((resolve5, reject) => {
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve5);
    });
  }
  async done() {
    __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_endPromise, "f");
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_ended, "f")) {
      return;
    }
    if (event === "end") {
      __classPrivateFieldSet4(this, _AbstractAssistantStreamRunner_ended, true, "f");
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error7 = args[0];
      if (!__classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error7);
      }
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_rejectConnectedPromise, "f").call(this, error7);
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_rejectEndPromise, "f").call(this, error7);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error7 = args[0];
      if (!__classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error7);
      }
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_rejectConnectedPromise, "f").call(this, error7);
      __classPrivateFieldGet4(this, _AbstractAssistantStreamRunner_rejectEndPromise, "f").call(this, error7);
      this._emit("end");
    }
  }
  async _threadAssistantStream(body, thread, options) {
    return await this._createThreadAssistantStream(thread, body, options);
  }
  async _runAssistantStream(threadId, runs, params, options) {
    return await this._createAssistantStream(runs, threadId, params, options);
  }
  async _runToolAssistantStream(threadId, runId, runs, params, options) {
    return await this._createToolAssistantStream(runs, threadId, runId, params, options);
  }
  async _createThreadAssistantStream(thread, body, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const runResult = await thread.createAndRun({ ...body, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addRun(runResult);
  }
  async _createToolAssistantStream(run, threadId, runId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const runResult = await run.submitToolOutputs(threadId, runId, { ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addRun(runResult);
  }
  async _createAssistantStream(run, threadId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const runResult = await run.create(threadId, { ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addRun(runResult);
  }
}
_AbstractAssistantStreamRunner_connectedPromise = new WeakMap, _AbstractAssistantStreamRunner_resolveConnectedPromise = new WeakMap, _AbstractAssistantStreamRunner_rejectConnectedPromise = new WeakMap, _AbstractAssistantStreamRunner_endPromise = new WeakMap, _AbstractAssistantStreamRunner_resolveEndPromise = new WeakMap, _AbstractAssistantStreamRunner_rejectEndPromise = new WeakMap, _AbstractAssistantStreamRunner_listeners = new WeakMap, _AbstractAssistantStreamRunner_ended = new WeakMap, _AbstractAssistantStreamRunner_errored = new WeakMap, _AbstractAssistantStreamRunner_aborted = new WeakMap, _AbstractAssistantStreamRunner_catchingPromiseCreated = new WeakMap, _AbstractAssistantStreamRunner_handleError = new WeakMap;
var __classPrivateFieldGet5 = function(receiver, state, kind2, f) {
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind2 === "m" ? f : kind2 === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet5 = function(receiver, state, value, kind2, f) {
  if (kind2 === "m")
    throw new TypeError("Private method is not writable");
  if (kind2 === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind2 === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var _AssistantStream_instances;
var _AssistantStream_events;
var _AssistantStream_runStepSnapshots;
var _AssistantStream_messageSnapshots;
var _AssistantStream_messageSnapshot;
var _AssistantStream_finalRun;
var _AssistantStream_currentContentIndex;
var _AssistantStream_currentContent;
var _AssistantStream_currentToolCallIndex;
var _AssistantStream_currentToolCall;
var _AssistantStream_currentEvent;
var _AssistantStream_currentRunSnapshot;
var _AssistantStream_currentRunStepSnapshot;
var _AssistantStream_addEvent;
var _AssistantStream_endRequest;
var _AssistantStream_handleMessage;
var _AssistantStream_handleRunStep;
var _AssistantStream_handleEvent;
var _AssistantStream_accumulateRunStep;
var _AssistantStream_accumulateMessage;
var _AssistantStream_accumulateContent;
var _AssistantStream_handleRun;

class AssistantStream extends AbstractAssistantStreamRunner {
  constructor() {
    super(...arguments);
    _AssistantStream_instances.add(this);
    _AssistantStream_events.set(this, []);
    _AssistantStream_runStepSnapshots.set(this, {});
    _AssistantStream_messageSnapshots.set(this, {});
    _AssistantStream_messageSnapshot.set(this, undefined);
    _AssistantStream_finalRun.set(this, undefined);
    _AssistantStream_currentContentIndex.set(this, undefined);
    _AssistantStream_currentContent.set(this, undefined);
    _AssistantStream_currentToolCallIndex.set(this, undefined);
    _AssistantStream_currentToolCall.set(this, undefined);
    _AssistantStream_currentEvent.set(this, undefined);
    _AssistantStream_currentRunSnapshot.set(this, undefined);
    _AssistantStream_currentRunStepSnapshot.set(this, undefined);
  }
  [(_AssistantStream_events = new WeakMap, _AssistantStream_runStepSnapshots = new WeakMap, _AssistantStream_messageSnapshots = new WeakMap, _AssistantStream_messageSnapshot = new WeakMap, _AssistantStream_finalRun = new WeakMap, _AssistantStream_currentContentIndex = new WeakMap, _AssistantStream_currentContent = new WeakMap, _AssistantStream_currentToolCallIndex = new WeakMap, _AssistantStream_currentToolCall = new WeakMap, _AssistantStream_currentEvent = new WeakMap, _AssistantStream_currentRunSnapshot = new WeakMap, _AssistantStream_currentRunStepSnapshot = new WeakMap, _AssistantStream_instances = new WeakSet, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(undefined);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: undefined, done: true };
          }
          return new Promise((resolve5, reject) => readQueue.push({ resolve: resolve5, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: undefined, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: undefined, done: true };
      }
    };
  }
  static fromReadableStream(stream) {
    const runner = new AssistantStream;
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    for await (const event of stream) {
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
  static createToolAssistantStream(threadId, runId, runs, body, options) {
    const runner = new AssistantStream;
    runner._run(() => runner._runToolAssistantStream(threadId, runId, runs, body, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createToolAssistantStream(run, threadId, runId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.submitToolOutputs(threadId, runId, body, {
      ...options,
      signal: this.controller.signal
    });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static createThreadAssistantStream(body, thread, options) {
    const runner = new AssistantStream;
    runner._run(() => runner._threadAssistantStream(body, thread, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  static createAssistantStream(threadId, runs, params, options) {
    const runner = new AssistantStream;
    runner._run(() => runner._runAssistantStream(threadId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  currentEvent() {
    return __classPrivateFieldGet5(this, _AssistantStream_currentEvent, "f");
  }
  currentRun() {
    return __classPrivateFieldGet5(this, _AssistantStream_currentRunSnapshot, "f");
  }
  currentMessageSnapshot() {
    return __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f");
  }
  currentRunStepSnapshot() {
    return __classPrivateFieldGet5(this, _AssistantStream_currentRunStepSnapshot, "f");
  }
  async finalRunSteps() {
    await this.done();
    return Object.values(__classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f"));
  }
  async finalMessages() {
    await this.done();
    return Object.values(__classPrivateFieldGet5(this, _AssistantStream_messageSnapshots, "f"));
  }
  async finalRun() {
    await this.done();
    if (!__classPrivateFieldGet5(this, _AssistantStream_finalRun, "f"))
      throw Error("Final run was not received.");
    return __classPrivateFieldGet5(this, _AssistantStream_finalRun, "f");
  }
  async _createThreadAssistantStream(thread, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await thread.createAndRun(body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  async _createAssistantStream(run, threadId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.create(threadId, body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError;
    }
    return this._addRun(__classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static accumulateDelta(acc, delta) {
    for (const [key, deltaValue] of Object.entries(delta)) {
      if (!acc.hasOwnProperty(key)) {
        acc[key] = deltaValue;
        continue;
      }
      let accValue = acc[key];
      if (accValue === null || accValue === undefined) {
        acc[key] = deltaValue;
        continue;
      }
      if (key === "index" || key === "type") {
        acc[key] = deltaValue;
        continue;
      }
      if (typeof accValue === "string" && typeof deltaValue === "string") {
        accValue += deltaValue;
      } else if (typeof accValue === "number" && typeof deltaValue === "number") {
        accValue += deltaValue;
      } else if (isObj(accValue) && isObj(deltaValue)) {
        accValue = this.accumulateDelta(accValue, deltaValue);
      } else if (Array.isArray(accValue) && Array.isArray(deltaValue)) {
        if (accValue.every((x) => typeof x === "string" || typeof x === "number")) {
          accValue.push(...deltaValue);
          continue;
        }
      } else {
        throw Error(`Unhandled record type: ${key}, deltaValue: ${deltaValue}, accValue: ${accValue}`);
      }
      acc[key] = accValue;
    }
    return acc;
  }
}
_AssistantStream_addEvent = function _AssistantStream_addEvent2(event) {
  if (this.ended)
    return;
  __classPrivateFieldSet5(this, _AssistantStream_currentEvent, event, "f");
  __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_handleEvent).call(this, event);
  switch (event.event) {
    case "thread.created":
      break;
    case "thread.run.created":
    case "thread.run.queued":
    case "thread.run.in_progress":
    case "thread.run.requires_action":
    case "thread.run.completed":
    case "thread.run.failed":
    case "thread.run.cancelling":
    case "thread.run.cancelled":
    case "thread.run.expired":
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_handleRun).call(this, event);
      break;
    case "thread.run.step.created":
    case "thread.run.step.in_progress":
    case "thread.run.step.delta":
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_handleRunStep).call(this, event);
      break;
    case "thread.message.created":
    case "thread.message.in_progress":
    case "thread.message.delta":
    case "thread.message.completed":
    case "thread.message.incomplete":
      __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_handleMessage).call(this, event);
      break;
    case "error":
      throw new Error("Encountered an error event in event processing - errors should be processed earlier");
  }
}, _AssistantStream_endRequest = function _AssistantStream_endRequest2() {
  if (this.ended) {
    throw new OpenAIError(`stream has ended, this shouldn't happen`);
  }
  if (!__classPrivateFieldGet5(this, _AssistantStream_finalRun, "f"))
    throw Error("Final run has not been received");
  return __classPrivateFieldGet5(this, _AssistantStream_finalRun, "f");
}, _AssistantStream_handleMessage = function _AssistantStream_handleMessage2(event) {
  const [accumulatedMessage, newContent] = __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_accumulateMessage).call(this, event, __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f"));
  __classPrivateFieldSet5(this, _AssistantStream_messageSnapshot, accumulatedMessage, "f");
  __classPrivateFieldGet5(this, _AssistantStream_messageSnapshots, "f")[accumulatedMessage.id] = accumulatedMessage;
  for (const content of newContent) {
    const snapshotContent = accumulatedMessage.content[content.index];
    if (snapshotContent?.type == "text") {
      this._emit("textCreated", snapshotContent.text);
    }
  }
  switch (event.event) {
    case "thread.message.created":
      this._emit("messageCreated", event.data);
      break;
    case "thread.message.in_progress":
      break;
    case "thread.message.delta":
      this._emit("messageDelta", event.data.delta, accumulatedMessage);
      if (event.data.delta.content) {
        for (const content of event.data.delta.content) {
          if (content.type == "text" && content.text) {
            let textDelta = content.text;
            let snapshot = accumulatedMessage.content[content.index];
            if (snapshot && snapshot.type == "text") {
              this._emit("textDelta", textDelta, snapshot.text);
            } else {
              throw Error("The snapshot associated with this text delta is not text or missing");
            }
          }
          if (content.index != __classPrivateFieldGet5(this, _AssistantStream_currentContentIndex, "f")) {
            if (__classPrivateFieldGet5(this, _AssistantStream_currentContent, "f")) {
              switch (__classPrivateFieldGet5(this, _AssistantStream_currentContent, "f").type) {
                case "text":
                  this._emit("textDone", __classPrivateFieldGet5(this, _AssistantStream_currentContent, "f").text, __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f"));
                  break;
                case "image_file":
                  this._emit("imageFileDone", __classPrivateFieldGet5(this, _AssistantStream_currentContent, "f").image_file, __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f"));
                  break;
              }
            }
            __classPrivateFieldSet5(this, _AssistantStream_currentContentIndex, content.index, "f");
          }
          __classPrivateFieldSet5(this, _AssistantStream_currentContent, accumulatedMessage.content[content.index], "f");
        }
      }
      break;
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (__classPrivateFieldGet5(this, _AssistantStream_currentContentIndex, "f") !== undefined) {
        const currentContent = event.data.content[__classPrivateFieldGet5(this, _AssistantStream_currentContentIndex, "f")];
        if (currentContent) {
          switch (currentContent.type) {
            case "image_file":
              this._emit("imageFileDone", currentContent.image_file, __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f"));
              break;
            case "text":
              this._emit("textDone", currentContent.text, __classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f"));
              break;
          }
        }
      }
      if (__classPrivateFieldGet5(this, _AssistantStream_messageSnapshot, "f")) {
        this._emit("messageDone", event.data);
      }
      __classPrivateFieldSet5(this, _AssistantStream_messageSnapshot, undefined, "f");
  }
}, _AssistantStream_handleRunStep = function _AssistantStream_handleRunStep2(event) {
  const accumulatedRunStep = __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_accumulateRunStep).call(this, event);
  __classPrivateFieldSet5(this, _AssistantStream_currentRunStepSnapshot, accumulatedRunStep, "f");
  switch (event.event) {
    case "thread.run.step.created":
      this._emit("runStepCreated", event.data);
      break;
    case "thread.run.step.delta":
      const delta = event.data.delta;
      if (delta.step_details && delta.step_details.type == "tool_calls" && delta.step_details.tool_calls && accumulatedRunStep.step_details.type == "tool_calls") {
        for (const toolCall of delta.step_details.tool_calls) {
          if (toolCall.index == __classPrivateFieldGet5(this, _AssistantStream_currentToolCallIndex, "f")) {
            this._emit("toolCallDelta", toolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index]);
          } else {
            if (__classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f")) {
              this._emit("toolCallDone", __classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f"));
            }
            __classPrivateFieldSet5(this, _AssistantStream_currentToolCallIndex, toolCall.index, "f");
            __classPrivateFieldSet5(this, _AssistantStream_currentToolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index], "f");
            if (__classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f"))
              this._emit("toolCallCreated", __classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f"));
          }
        }
      }
      this._emit("runStepDelta", event.data.delta, accumulatedRunStep);
      break;
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldSet5(this, _AssistantStream_currentRunStepSnapshot, undefined, "f");
      const details = event.data.step_details;
      if (details.type == "tool_calls") {
        if (__classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f")) {
          this._emit("toolCallDone", __classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f"));
          __classPrivateFieldSet5(this, _AssistantStream_currentToolCall, undefined, "f");
        }
      }
      this._emit("runStepDone", event.data, accumulatedRunStep);
      break;
    case "thread.run.step.in_progress":
      break;
  }
}, _AssistantStream_handleEvent = function _AssistantStream_handleEvent2(event) {
  __classPrivateFieldGet5(this, _AssistantStream_events, "f").push(event);
  this._emit("event", event);
}, _AssistantStream_accumulateRunStep = function _AssistantStream_accumulateRunStep2(event) {
  switch (event.event) {
    case "thread.run.step.created":
      __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      return event.data;
    case "thread.run.step.delta":
      let snapshot = __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
      if (!snapshot) {
        throw Error("Received a RunStepDelta before creation of a snapshot");
      }
      let data = event.data;
      if (data.delta) {
        const accumulated = AssistantStream.accumulateDelta(snapshot, data.delta);
        __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = accumulated;
      }
      return __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
    case "thread.run.step.in_progress":
      __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      break;
  }
  if (__classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id])
    return __classPrivateFieldGet5(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
  throw new Error("No snapshot available");
}, _AssistantStream_accumulateMessage = function _AssistantStream_accumulateMessage2(event, snapshot) {
  let newContent = [];
  switch (event.event) {
    case "thread.message.created":
      return [event.data, newContent];
    case "thread.message.delta":
      if (!snapshot) {
        throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
      }
      let data = event.data;
      if (data.delta.content) {
        for (const contentElement of data.delta.content) {
          if (contentElement.index in snapshot.content) {
            let currentContent = snapshot.content[contentElement.index];
            snapshot.content[contentElement.index] = __classPrivateFieldGet5(this, _AssistantStream_instances, "m", _AssistantStream_accumulateContent).call(this, contentElement, currentContent);
          } else {
            snapshot.content[contentElement.index] = contentElement;
            newContent.push(contentElement);
          }
        }
      }
      return [snapshot, newContent];
    case "thread.message.in_progress":
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (snapshot) {
        return [snapshot, newContent];
      } else {
        throw Error("Received thread message event with no existing snapshot");
      }
  }
  throw Error("Tried to accumulate a non-message event");
}, _AssistantStream_accumulateContent = function _AssistantStream_accumulateContent2(contentElement, currentContent) {
  return AssistantStream.accumulateDelta(currentContent, contentElement);
}, _AssistantStream_handleRun = function _AssistantStream_handleRun2(event) {
  __classPrivateFieldSet5(this, _AssistantStream_currentRunSnapshot, event.data, "f");
  switch (event.event) {
    case "thread.run.created":
      break;
    case "thread.run.queued":
      break;
    case "thread.run.in_progress":
      break;
    case "thread.run.requires_action":
    case "thread.run.cancelled":
    case "thread.run.failed":
    case "thread.run.completed":
    case "thread.run.expired":
      __classPrivateFieldSet5(this, _AssistantStream_finalRun, event.data, "f");
      if (__classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f")) {
        this._emit("toolCallDone", __classPrivateFieldGet5(this, _AssistantStream_currentToolCall, "f"));
        __classPrivateFieldSet5(this, _AssistantStream_currentToolCall, undefined, "f");
      }
      break;
    case "thread.run.cancelling":
      break;
  }
};

class Messages extends APIResource {
  create(threadId, body, options) {
    return this._client.post(`/threads/${threadId}/messages`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(threadId, messageId, options) {
    return this._client.get(`/threads/${threadId}/messages/${messageId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  update(threadId, messageId, body, options) {
    return this._client.post(`/threads/${threadId}/messages/${messageId}`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(threadId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list(threadId, {}, query);
    }
    return this._client.getAPIList(`/threads/${threadId}/messages`, MessagesPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  del(threadId, messageId, options) {
    return this._client.delete(`/threads/${threadId}/messages/${messageId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
}

class MessagesPage extends CursorPage {
}
(function(Messages2) {
  Messages2.MessagesPage = MessagesPage;
})(Messages || (Messages = {}));

class Steps extends APIResource {
  retrieve(threadId, runId, stepId, options) {
    return this._client.get(`/threads/${threadId}/runs/${runId}/steps/${stepId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(threadId, runId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list(threadId, runId, {}, query);
    }
    return this._client.getAPIList(`/threads/${threadId}/runs/${runId}/steps`, RunStepsPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
}

class RunStepsPage extends CursorPage {
}
(function(Steps2) {
  Steps2.RunStepsPage = RunStepsPage;
})(Steps || (Steps = {}));

class Runs extends APIResource {
  constructor() {
    super(...arguments);
    this.steps = new Steps(this._client);
  }
  create(threadId, body, options) {
    return this._client.post(`/threads/${threadId}/runs`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers },
      stream: body.stream ?? false
    });
  }
  retrieve(threadId, runId, options) {
    return this._client.get(`/threads/${threadId}/runs/${runId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  update(threadId, runId, body, options) {
    return this._client.post(`/threads/${threadId}/runs/${runId}`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(threadId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list(threadId, {}, query);
    }
    return this._client.getAPIList(`/threads/${threadId}/runs`, RunsPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  cancel(threadId, runId, options) {
    return this._client.post(`/threads/${threadId}/runs/${runId}/cancel`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  async createAndPoll(threadId, body, options) {
    const run = await this.create(threadId, body, options);
    return await this.poll(threadId, run.id, options);
  }
  createAndStream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  async poll(threadId, runId, options) {
    const headers = { ...options?.headers, "X-Stainless-Poll-Helper": "true" };
    if (options?.pollIntervalMs) {
      headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
    }
    while (true) {
      const { data: run, response } = await this.retrieve(threadId, runId, {
        ...options,
        headers: { ...options?.headers, ...headers }
      }).withResponse();
      switch (run.status) {
        case "queued":
        case "in_progress":
        case "cancelling":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep4(sleepInterval);
          break;
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return run;
      }
    }
  }
  stream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  submitToolOutputs(threadId, runId, body, options) {
    return this._client.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers },
      stream: body.stream ?? false
    });
  }
  async submitToolOutputsAndPoll(threadId, runId, body, options) {
    const run = await this.submitToolOutputs(threadId, runId, body, options);
    return await this.poll(threadId, run.id, options);
  }
  submitToolOutputsStream(threadId, runId, body, options) {
    return AssistantStream.createToolAssistantStream(threadId, runId, this._client.beta.threads.runs, body, options);
  }
}

class RunsPage extends CursorPage {
}
(function(Runs2) {
  Runs2.RunsPage = RunsPage;
  Runs2.Steps = Steps;
  Runs2.RunStepsPage = RunStepsPage;
})(Runs || (Runs = {}));

class Threads extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs(this._client);
    this.messages = new Messages(this._client);
  }
  create(body = {}, options) {
    if (isRequestOptions(body)) {
      return this.create({}, body);
    }
    return this._client.post("/threads", {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(threadId, options) {
    return this._client.get(`/threads/${threadId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  update(threadId, body, options) {
    return this._client.post(`/threads/${threadId}`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  del(threadId, options) {
    return this._client.delete(`/threads/${threadId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  createAndRun(body, options) {
    return this._client.post("/threads/runs", {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers },
      stream: body.stream ?? false
    });
  }
  async createAndRunPoll(body, options) {
    const run = await this.createAndRun(body, options);
    return await this.runs.poll(run.thread_id, run.id, options);
  }
  createAndRunStream(body, options) {
    return AssistantStream.createThreadAssistantStream(body, this._client.beta.threads, options);
  }
}
(function(Threads2) {
  Threads2.Runs = Runs;
  Threads2.RunsPage = RunsPage;
  Threads2.Messages = Messages;
  Threads2.MessagesPage = MessagesPage;
})(Threads || (Threads = {}));
var allSettledWithThrow = async (promises) => {
  const results = await Promise.allSettled(promises);
  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length) {
    for (const result of rejected) {
      console.error(result.reason);
    }
    throw new Error(`${rejected.length} promise(s) failed - see the above errors`);
  }
  const values = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      values.push(result.value);
    }
  }
  return values;
};

class Files extends APIResource {
  create(vectorStoreId, body, options) {
    return this._client.post(`/vector_stores/${vectorStoreId}/files`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(vectorStoreId, fileId, options) {
    return this._client.get(`/vector_stores/${vectorStoreId}/files/${fileId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(vectorStoreId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list(vectorStoreId, {}, query);
    }
    return this._client.getAPIList(`/vector_stores/${vectorStoreId}/files`, VectorStoreFilesPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  del(vectorStoreId, fileId, options) {
    return this._client.delete(`/vector_stores/${vectorStoreId}/files/${fileId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  async createAndPoll(vectorStoreId, body, options) {
    const file = await this.create(vectorStoreId, body, options);
    return await this.poll(vectorStoreId, file.id, options);
  }
  async poll(vectorStoreId, fileId, options) {
    const headers = { ...options?.headers, "X-Stainless-Poll-Helper": "true" };
    if (options?.pollIntervalMs) {
      headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
    }
    while (true) {
      const fileResponse = await this.retrieve(vectorStoreId, fileId, {
        ...options,
        headers
      }).withResponse();
      const file = fileResponse.data;
      switch (file.status) {
        case "in_progress":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = fileResponse.response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep4(sleepInterval);
          break;
        case "failed":
        case "completed":
          return file;
      }
    }
  }
  async upload(vectorStoreId, file, options) {
    const fileInfo = await this._client.files.create({ file, purpose: "assistants" }, options);
    return this.create(vectorStoreId, { file_id: fileInfo.id }, options);
  }
  async uploadAndPoll(vectorStoreId, file, options) {
    const fileInfo = await this.upload(vectorStoreId, file, options);
    return await this.poll(vectorStoreId, fileInfo.id, options);
  }
}

class VectorStoreFilesPage extends CursorPage {
}
(function(Files2) {
  Files2.VectorStoreFilesPage = VectorStoreFilesPage;
})(Files || (Files = {}));

class FileBatches extends APIResource {
  create(vectorStoreId, body, options) {
    return this._client.post(`/vector_stores/${vectorStoreId}/file_batches`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(vectorStoreId, batchId, options) {
    return this._client.get(`/vector_stores/${vectorStoreId}/file_batches/${batchId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  cancel(vectorStoreId, batchId, options) {
    return this._client.post(`/vector_stores/${vectorStoreId}/file_batches/${batchId}/cancel`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  async createAndPoll(vectorStoreId, body, options) {
    const batch = await this.create(vectorStoreId, body);
    return await this.poll(vectorStoreId, batch.id, options);
  }
  listFiles(vectorStoreId, batchId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.listFiles(vectorStoreId, batchId, {}, query);
    }
    return this._client.getAPIList(`/vector_stores/${vectorStoreId}/file_batches/${batchId}/files`, VectorStoreFilesPage, { query, ...options, headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers } });
  }
  async poll(vectorStoreId, batchId, options) {
    const headers = { ...options?.headers, "X-Stainless-Poll-Helper": "true" };
    if (options?.pollIntervalMs) {
      headers["X-Stainless-Custom-Poll-Interval"] = options.pollIntervalMs.toString();
    }
    while (true) {
      const { data: batch, response } = await this.retrieve(vectorStoreId, batchId, {
        ...options,
        headers
      }).withResponse();
      switch (batch.status) {
        case "in_progress":
          let sleepInterval = 5000;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep4(sleepInterval);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return batch;
      }
    }
  }
  async uploadAndPoll(vectorStoreId, { files: files2, fileIds = [] }, options) {
    if (files2 == null || files2.length == 0) {
      throw new Error(`No \`files\` provided to process. If you've already uploaded files you should use \`.createAndPoll()\` instead`);
    }
    const configuredConcurrency = options?.maxConcurrency ?? 5;
    const concurrencyLimit = Math.min(configuredConcurrency, files2.length);
    const client = this._client;
    const fileIterator = files2.values();
    const allFileIds = [...fileIds];
    async function processFiles(iterator) {
      for (let item of iterator) {
        const fileObj = await client.files.create({ file: item, purpose: "assistants" }, options);
        allFileIds.push(fileObj.id);
      }
    }
    const workers = Array(concurrencyLimit).fill(fileIterator).map(processFiles);
    await allSettledWithThrow(workers);
    return await this.createAndPoll(vectorStoreId, {
      file_ids: allFileIds
    });
  }
}
(function(FileBatches2) {
})(FileBatches || (FileBatches = {}));

class VectorStores extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files(this._client);
    this.fileBatches = new FileBatches(this._client);
  }
  create(body, options) {
    return this._client.post("/vector_stores", {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  retrieve(vectorStoreId, options) {
    return this._client.get(`/vector_stores/${vectorStoreId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  update(vectorStoreId, body, options) {
    return this._client.post(`/vector_stores/${vectorStoreId}`, {
      body,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  list(query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.getAPIList("/vector_stores", VectorStoresPage, {
      query,
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
  del(vectorStoreId, options) {
    return this._client.delete(`/vector_stores/${vectorStoreId}`, {
      ...options,
      headers: { "OpenAI-Beta": "assistants=v2", ...options?.headers }
    });
  }
}

class VectorStoresPage extends CursorPage {
}
(function(VectorStores2) {
  VectorStores2.VectorStoresPage = VectorStoresPage;
  VectorStores2.Files = Files;
  VectorStores2.VectorStoreFilesPage = VectorStoreFilesPage;
  VectorStores2.FileBatches = FileBatches;
})(VectorStores || (VectorStores = {}));

class Beta extends APIResource {
  constructor() {
    super(...arguments);
    this.vectorStores = new VectorStores(this._client);
    this.chat = new Chat2(this._client);
    this.assistants = new Assistants(this._client);
    this.threads = new Threads(this._client);
  }
}
(function(Beta2) {
  Beta2.VectorStores = VectorStores;
  Beta2.VectorStoresPage = VectorStoresPage;
  Beta2.Chat = Chat2;
  Beta2.Assistants = Assistants;
  Beta2.AssistantsPage = AssistantsPage;
  Beta2.Threads = Threads;
})(Beta || (Beta = {}));

class Completions3 extends APIResource {
  create(body, options) {
    return this._client.post("/completions", { body, ...options, stream: body.stream ?? false });
  }
}
(function(Completions4) {
})(Completions3 || (Completions3 = {}));

class Embeddings extends APIResource {
  create(body, options) {
    return this._client.post("/embeddings", { body, ...options });
  }
}
(function(Embeddings2) {
})(Embeddings || (Embeddings = {}));

class Files2 extends APIResource {
  create(body, options) {
    return this._client.post("/files", multipartFormRequestOptions({ body, ...options }));
  }
  retrieve(fileId, options) {
    return this._client.get(`/files/${fileId}`, options);
  }
  list(query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.getAPIList("/files", FileObjectsPage, { query, ...options });
  }
  del(fileId, options) {
    return this._client.delete(`/files/${fileId}`, options);
  }
  content(fileId, options) {
    return this._client.get(`/files/${fileId}/content`, { ...options, __binaryResponse: true });
  }
  retrieveContent(fileId, options) {
    return this._client.get(`/files/${fileId}/content`, {
      ...options,
      headers: { Accept: "application/json", ...options?.headers }
    });
  }
  async waitForProcessing(id4, { pollInterval = 5000, maxWait = 30 * 60 * 1000 } = {}) {
    const TERMINAL_STATES = new Set(["processed", "error", "deleted"]);
    const start4 = Date.now();
    let file = await this.retrieve(id4);
    while (!file.status || !TERMINAL_STATES.has(file.status)) {
      await sleep4(pollInterval);
      file = await this.retrieve(id4);
      if (Date.now() - start4 > maxWait) {
        throw new APIConnectionTimeoutError({
          message: `Giving up on waiting for file ${id4} to finish processing after ${maxWait} milliseconds.`
        });
      }
    }
    return file;
  }
}

class FileObjectsPage extends Page {
}
(function(Files3) {
  Files3.FileObjectsPage = FileObjectsPage;
})(Files2 || (Files2 = {}));

class Checkpoints extends APIResource {
  list(fineTuningJobId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list(fineTuningJobId, {}, query);
    }
    return this._client.getAPIList(`/fine_tuning/jobs/${fineTuningJobId}/checkpoints`, FineTuningJobCheckpointsPage, { query, ...options });
  }
}

class FineTuningJobCheckpointsPage extends CursorPage {
}
(function(Checkpoints2) {
  Checkpoints2.FineTuningJobCheckpointsPage = FineTuningJobCheckpointsPage;
})(Checkpoints || (Checkpoints = {}));

class Jobs extends APIResource {
  constructor() {
    super(...arguments);
    this.checkpoints = new Checkpoints(this._client);
  }
  create(body, options) {
    return this._client.post("/fine_tuning/jobs", { body, ...options });
  }
  retrieve(fineTuningJobId, options) {
    return this._client.get(`/fine_tuning/jobs/${fineTuningJobId}`, options);
  }
  list(query = {}, options) {
    if (isRequestOptions(query)) {
      return this.list({}, query);
    }
    return this._client.getAPIList("/fine_tuning/jobs", FineTuningJobsPage, { query, ...options });
  }
  cancel(fineTuningJobId, options) {
    return this._client.post(`/fine_tuning/jobs/${fineTuningJobId}/cancel`, options);
  }
  listEvents(fineTuningJobId, query = {}, options) {
    if (isRequestOptions(query)) {
      return this.listEvents(fineTuningJobId, {}, query);
    }
    return this._client.getAPIList(`/fine_tuning/jobs/${fineTuningJobId}/events`, FineTuningJobEventsPage, {
      query,
      ...options
    });
  }
}

class FineTuningJobsPage extends CursorPage {
}

class FineTuningJobEventsPage extends CursorPage {
}
(function(Jobs2) {
  Jobs2.FineTuningJobsPage = FineTuningJobsPage;
  Jobs2.FineTuningJobEventsPage = FineTuningJobEventsPage;
  Jobs2.Checkpoints = Checkpoints;
  Jobs2.FineTuningJobCheckpointsPage = FineTuningJobCheckpointsPage;
})(Jobs || (Jobs = {}));

class FineTuning extends APIResource {
  constructor() {
    super(...arguments);
    this.jobs = new Jobs(this._client);
  }
}
(function(FineTuning2) {
  FineTuning2.Jobs = Jobs;
  FineTuning2.FineTuningJobsPage = FineTuningJobsPage;
  FineTuning2.FineTuningJobEventsPage = FineTuningJobEventsPage;
})(FineTuning || (FineTuning = {}));

class Images extends APIResource {
  createVariation(body, options) {
    return this._client.post("/images/variations", multipartFormRequestOptions({ body, ...options }));
  }
  edit(body, options) {
    return this._client.post("/images/edits", multipartFormRequestOptions({ body, ...options }));
  }
  generate(body, options) {
    return this._client.post("/images/generations", { body, ...options });
  }
}
(function(Images2) {
})(Images || (Images = {}));

class Models extends APIResource {
  retrieve(model, options) {
    return this._client.get(`/models/${model}`, options);
  }
  list(options) {
    return this._client.getAPIList("/models", ModelsPage, options);
  }
  del(model, options) {
    return this._client.delete(`/models/${model}`, options);
  }
}

class ModelsPage extends Page {
}
(function(Models2) {
  Models2.ModelsPage = ModelsPage;
})(Models || (Models = {}));

class Moderations extends APIResource {
  create(body, options) {
    return this._client.post("/moderations", { body, ...options });
  }
}
(function(Moderations2) {
})(Moderations || (Moderations = {}));
var _a2;

class OpenAI extends APIClient {
  constructor({ baseURL = readEnv("OPENAI_BASE_URL"), apiKey = readEnv("OPENAI_API_KEY"), organization = readEnv("OPENAI_ORG_ID") ?? null, project = readEnv("OPENAI_PROJECT_ID") ?? null, ...opts } = {}) {
    if (apiKey === undefined) {
      throw new OpenAIError("The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).");
    }
    const options = {
      apiKey,
      organization,
      project,
      ...opts,
      baseURL: baseURL || `https://api.openai.com/v1`
    };
    if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new OpenAIError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew OpenAI({ apiKey, dangerouslyAllowBrowser: true });\n\nhttps://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety\n");
    }
    super({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 600000,
      httpAgent: options.httpAgent,
      maxRetries: options.maxRetries,
      fetch: options.fetch
    });
    this.completions = new Completions3(this);
    this.chat = new Chat(this);
    this.embeddings = new Embeddings(this);
    this.files = new Files2(this);
    this.images = new Images(this);
    this.audio = new Audio(this);
    this.moderations = new Moderations(this);
    this.models = new Models(this);
    this.fineTuning = new FineTuning(this);
    this.beta = new Beta(this);
    this.batches = new Batches(this);
    this._options = options;
    this.apiKey = apiKey;
    this.organization = organization;
    this.project = project;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  defaultHeaders(opts) {
    return {
      ...super.defaultHeaders(opts),
      "OpenAI-Organization": this.organization,
      "OpenAI-Project": this.project,
      ...this._options.defaultHeaders
    };
  }
  authHeaders(opts) {
    return { Authorization: `Bearer ${this.apiKey}` };
  }
}
_a2 = OpenAI;
OpenAI.OpenAI = _a2;
OpenAI.OpenAIError = OpenAIError;
OpenAI.APIError = APIError;
OpenAI.APIConnectionError = APIConnectionError;
OpenAI.APIConnectionTimeoutError = APIConnectionTimeoutError;
OpenAI.APIUserAbortError = APIUserAbortError;
OpenAI.NotFoundError = NotFoundError;
OpenAI.ConflictError = ConflictError;
OpenAI.RateLimitError = RateLimitError;
OpenAI.BadRequestError = BadRequestError;
OpenAI.AuthenticationError = AuthenticationError;
OpenAI.InternalServerError = InternalServerError;
OpenAI.PermissionDeniedError = PermissionDeniedError;
OpenAI.UnprocessableEntityError = UnprocessableEntityError;
OpenAI.toFile = toFile;
OpenAI.fileFromPath = fileFromPath;
(function(OpenAI2) {
  OpenAI2.Page = Page;
  OpenAI2.CursorPage = CursorPage;
  OpenAI2.Completions = Completions3;
  OpenAI2.Chat = Chat;
  OpenAI2.Embeddings = Embeddings;
  OpenAI2.Files = Files2;
  OpenAI2.FileObjectsPage = FileObjectsPage;
  OpenAI2.Images = Images;
  OpenAI2.Audio = Audio;
  OpenAI2.Moderations = Moderations;
  OpenAI2.Models = Models;
  OpenAI2.ModelsPage = ModelsPage;
  OpenAI2.FineTuning = FineTuning;
  OpenAI2.Beta = Beta;
  OpenAI2.Batches = Batches;
  OpenAI2.BatchesPage = BatchesPage;
})(OpenAI || (OpenAI = {}));
var _deployments_endpoints = new Set([
  "/completions",
  "/chat/completions",
  "/embeddings",
  "/audio/transcriptions",
  "/audio/translations",
  "/audio/speech",
  "/images/generations"
]);
var openai_default = OpenAI;
var pMapSkip = Symbol("skip");
var zipWithFn2 = function(fn, x, y2) {
  return take2(x.length > y2.length ? y2.length : x.length, x).map((xInstance, i) => fn(xInstance, y2[i]));
};
var zipWith2 = curry2(zipWithFn2);
var heads3 = function(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      return n-- > 0 ? ctrl.enqueue(chunk) : await never3();
    }
  });
};
var aborts = function(signal) {
  return new TransformStream({
    transform: async (chunk, ctrl) => signal?.aborted || !signal ? ctrl.terminate() : ctrl.enqueue(chunk)
  });
};
var chunks3 = function(n = Infinity) {
  let chunks22 = [];
  if (n <= 0)
    throw new Error("Buffer size must be greater than 0");
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      chunks22.push(chunk);
      if (chunks22.length >= n)
        ctrl.enqueue(chunks22.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks22.length && ctrl.enqueue(chunks22))
  });
};
var chunkBys3 = function(compareFn) {
  let chunks22 = [];
  let lastOrder;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const order = compareFn(chunk);
      if (lastOrder && lastOrder !== order)
        ctrl.enqueue(chunks22.splice(0, Infinity));
      chunks22.push(chunk);
      lastOrder = order;
    },
    flush: async (ctrl) => void (chunks22.length && ctrl.enqueue(chunks22))
  });
};
var debounces3 = function(t) {
  let id4 = null;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (id4)
        clearTimeout(id4);
      id4 = setTimeout(() => {
        ctrl.enqueue(chunk);
        id4 = null;
      }, t);
    },
    flush: async () => {
      while (id4)
        await new Promise((r) => setTimeout(r, t / 2));
    }
  });
};
var flatMaps3 = function(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      (await fn(chunk, i++)).map((e) => ctrl.enqueue(e));
    }
  });
};
var flats3 = function() {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      chunk.map((e) => ctrl.enqueue(e));
    }
  });
};
var chunkIntervals3 = function(interval4) {
  let chunks22 = [];
  let id4 = null;
  return new TransformStream({
    start: (ctrl) => {
      if (interval4)
        id4 = setInterval(() => ctrl.enqueue(chunks22), interval4);
    },
    transform: async (chunk, ctrl) => {
      if (!interval4)
        ctrl.enqueue([chunk]);
      chunks22.push(chunk);
    },
    flush: async (ctrl) => {
      if (chunks22.length)
        ctrl.enqueue(chunks22);
      id4 !== null && clearInterval(id4);
    }
  });
};
var map3 = function(select) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          let mapped = await select(next.value);
          if (mapped !== undefined)
            controller.enqueue(mapped);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
};
var isReadableLike3 = function(obj) {
  return obj["readable"] != null;
};
var from3 = function(src) {
  let it;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && it != null) {
        let next = await it.next();
        if (next.done) {
          it = null;
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  if (isReadableLike3(src)) {
    return src.readable;
  }
  return new ReadableStream({
    async start(controller) {
      let iterable;
      if (typeof src == "function") {
        src = src();
      }
      if (Symbol.asyncIterator && src[Symbol.asyncIterator])
        iterable = src[Symbol.asyncIterator].bind(src);
      else if (src[Symbol.iterator])
        iterable = src[Symbol.iterator].bind(src);
      else {
        let value = await Promise.resolve(src);
        controller.enqueue(value);
        controller.close();
        return;
      }
      it = iterable();
      return flush(controller);
    },
    async pull(controller) {
      return flush(controller);
    },
    async cancel(reason) {
      if (reason && it && it.throw) {
        it.throw(reason);
      } else if (it && it.return) {
        await it.return();
      }
      it = null;
    }
  });
};
var through3 = function(dst) {
  return function(src) {
    return src.pipeThrough(dst);
  };
};
var pipe3 = function(src, ...ops) {
  if (isReadableLike3(src)) {
    src = src.readable;
  }
  return ops.map((x) => isTransform3(x) ? through3(x) : x).reduce((p, c) => {
    return c(p, { highWaterMark: 1 });
  }, src);
};
var schedule3 = function(scheduler) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
        } else {
          await scheduler.nextTick();
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
        }
      }
    }, opts);
  };
};
var on3 = function(callbacks) {
  let reader = null;
  async function flush(controller) {
    try {
      while (controller.desiredSize > 0 && reader != null) {
        let next = await reader.read();
        if (next.done) {
          controller.close();
          reader = null;
          if (callbacks.complete)
            callbacks.complete();
        } else {
          controller.enqueue(next.value);
        }
      }
    } catch (err) {
      controller.error(err);
      if (callbacks.error)
        callbacks.error(err);
    }
  }
  return function(src, opts) {
    return new ReadableStream({
      start(controller) {
        reader = src.getReader();
        if (callbacks.start)
          callbacks.start();
        return flush(controller);
      },
      pull(controller) {
        return flush(controller);
      },
      cancel(reason) {
        if (reader) {
          reader.cancel(reason);
          reader.releaseLock();
          reader = null;
          if (callbacks.complete)
            callbacks.complete(reason);
        }
      }
    }, opts);
  };
};
var merge3 = function(concurrent = Infinity) {
  if (concurrent == 0)
    throw Error("zero is an invalid concurrency limit");
  return function(src) {
    let outerGate = new Gate3(concurrent);
    let innerQueue = new BlockingQueue3;
    let subscription;
    let errored = null;
    return new ReadableStream({
      start(outerController) {
        let reading = [];
        let readingDone = false;
        toPromise3(pipe3(src, schedule3({
          nextTick: async () => {
            await outerGate.wait();
          }
        }), map3((innerStream) => {
          if (!(innerStream instanceof ReadableStream)) {
            innerStream = from3(innerStream);
          }
          reading.push(innerStream);
          pipe3(innerStream, map3(async (value) => {
            await innerQueue.push({ done: false, value });
          }), on3({
            error(err) {
              outerController.error(err);
            },
            complete() {
              outerGate.increment();
              reading.splice(reading.indexOf(innerStream), 1);
              if (reading.length == 0 && readingDone) {
                innerQueue.push({ done: true });
              }
            }
          }));
        }), on3({
          error(err) {
            outerController.error(err);
            errored = err;
          },
          complete() {
            readingDone = true;
          }
        }))).catch((err) => {
          outerController.error(err);
        });
      },
      async pull(controller) {
        while (controller.desiredSize > 0) {
          let next = await innerQueue.pull();
          if (errored) {
            controller.error(errored);
          }
          if (next.done) {
            controller.close();
          } else {
            controller.enqueue(next.value);
          }
        }
      },
      cancel(reason) {
        if (subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
      }
    });
  };
};
var mapAddFields3 = function(key, fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => ctrl.enqueue({ ...chunk, [key]: await fn(chunk, i++) })
  });
};
var maps3 = function(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => ctrl.enqueue(await fn(chunk, i++))
  });
};
var nils3 = function() {
  return new WritableStream;
};
var peeks3 = function(fn) {
  let i = 0;
  return new TransformStream({
    transform: (chunk, ctrl) => {
      fn(chunk, i++);
      ctrl.enqueue(chunk);
    }
  });
};
var forEachs3 = function(fn) {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      await fn(chunk, i++);
      ctrl.enqueue(chunk);
    }
  });
};
var skips3 = function(n = 1) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (n <= 0)
        ctrl.enqueue(chunk);
      else
        n--;
    }
  });
};
var limits3 = function(n = 1, { terminate = false } = {}) {
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (n-- > 0) {
        ctrl.enqueue(chunk);
        return;
      }
      terminate && ctrl.terminate();
      return await never3();
    },
    flush: () => {
    }
  });
};
var slices3 = function(start4 = 0, end = Infinity) {
  const count = end - start4;
  const { readable, writable } = new TransformStream;
  return {
    writable,
    readable: readable.pipeThrough(skips3(start4)).pipeThrough(limits3(count))
  };
};
var tails3 = function(n = 1) {
  let chunks22 = [];
  return new TransformStream({
    transform: (chunk) => {
      chunks22.push(chunk);
      if (chunks22.length > n)
        chunks22.shift();
    },
    flush: (ctrl) => {
      chunks22.map((e) => ctrl.enqueue(e));
    }
  });
};
var throttles3 = function(t, keepLast = true) {
  let id4 = null;
  let lasts = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (id4) {
        if (keepLast)
          lasts = [chunk];
        return;
      }
      lasts = [];
      ctrl.enqueue(chunk);
      id4 = setTimeout(() => {
        id4 = null;
        lasts.map((e) => ctrl.enqueue(e));
      }, t);
    },
    flush: async () => {
      while (id4)
        await new Promise((r) => setTimeout(r, t / 2));
    }
  });
};
var unwinds3 = function(key) {
  return flatMaps3((e) => import_unwind_array4.unwind(e, { path: key }));
};
var logs3 = function(logFn = console.log) {
  return throughs3(peeks3(logFn));
};
var chunkIfs3 = function(predicate) {
  let chunks22 = [];
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      chunks22.push(chunk);
      if (!await predicate(chunk, i++, chunks22))
        ctrl.enqueue(chunks22.splice(0, Infinity));
    },
    flush: async (ctrl) => void (chunks22.length && ctrl.enqueue(chunks22))
  });
};
var __create6 = Object.create;
var __defProp6 = Object.defineProperty;
var __getProtoOf6 = Object.getPrototypeOf;
var __getOwnPropNames6 = Object.getOwnPropertyNames;
var __hasOwnProp6 = Object.prototype.hasOwnProperty;
var __toESM6 = (mod, isNodeMode, target) => {
  target = mod != null ? __create6(__getProtoOf6(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp6(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames6(mod))
    if (!__hasOwnProp6.call(to, key))
      __defProp6(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS6 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_src4 = __commonJS6((exports, module) => {
  var unwind = (dataObject, options) => {
    const unwindRecursive = (dataObject2, path2, currPath) => {
      const pathArr = path2.split(".");
      if (!currPath) {
        currPath = pathArr[0];
      }
      const result = [];
      let added = false;
      const addObject = (objectTempUnwind, objectKey) => {
        Object.keys(objectTempUnwind).forEach((objectTempUnwindKey) => {
          const newObjectCopy = {};
          Object.keys(dataObject2).forEach((dataObjectKey) => {
            newObjectCopy[dataObjectKey] = dataObject2[dataObjectKey];
          });
          newObjectCopy[objectKey] = objectTempUnwind[objectTempUnwindKey];
          added = true;
          result.push(newObjectCopy);
        });
      };
      Object.keys(dataObject2).forEach((objectKey) => {
        if (currPath === objectKey) {
          if (dataObject2[objectKey] instanceof Array) {
            if (dataObject2[objectKey].length === 0 && options.preserveEmptyArray !== true) {
              delete dataObject2[objectKey];
            } else {
              Object.keys(dataObject2[objectKey]).forEach((objectElementKey) => {
                addObject(unwindRecursive(dataObject2[objectKey][objectElementKey], path2.replace(`${currPath}.`, "")), objectKey);
              });
            }
          } else {
            addObject(unwindRecursive(dataObject2[objectKey], path2.replace(`${currPath}.`, "")), objectKey);
          }
        }
      });
      if (!added) {
        result.push(dataObject2);
      }
      return result;
    };
    return unwindRecursive(dataObject, options.path);
  };
  module.exports = { unwind };
});
var never3 = () => new Promise(() => null);
var filters3 = (fn) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      if (fn) {
        const shouldEnqueue = await fn(chunk, i++);
        if (shouldEnqueue)
          ctrl.enqueue(chunk);
      } else {
        const isNull = chunk === undefined || chunk === null;
        if (!isNull)
          ctrl.enqueue(chunk);
      }
    }
  });
};
var isTransform3 = function(x) {
  return x["readable"] != null && x["writable"] != null;
};

class Gate3 {
  _count;
  _queue = [];
  constructor(_count) {
    this._count = _count;
  }
  async wait() {
    if (this._count > 0) {
      --this._count;
      return Promise.resolve();
    }
    return new Promise((r) => {
      let cb = () => {
        this._queue.splice(this._queue.indexOf(cb), 1);
        --this._count;
        r();
      };
      this._queue.push(cb);
    });
  }
  increment() {
    ++this._count;
    this.clearQueue();
  }
  setCount(count) {
    this._count = count;
    this.clearQueue();
  }
  clearQueue() {
    while (this._count > 0 && this._queue.length > 0) {
      this._queue.shift()();
    }
  }
}

class BlockingQueue3 {
  _pushers = [];
  _pullers = [];
  constructor() {
  }
  async push(value) {
    return new Promise((r) => {
      this._pushers.unshift(() => {
        r();
        return value;
      });
      this.dequeue();
    });
  }
  async pull() {
    return new Promise((r) => {
      this._pullers.unshift((value) => {
        r(value);
      });
      this.dequeue();
    });
  }
  dequeue() {
    while (this._pullers.length > 0 && this._pushers.length > 0) {
      let puller = this._pullers.pop();
      let pusher = this._pushers.pop();
      puller(pusher());
    }
  }
}

class Subscribable4 {
  closed = false;
  subscribers = [];
  subscribe(cb) {
    let self = this;
    self.subscribers.push(cb);
    let _closed = false;
    return {
      get closed() {
        return _closed || self.closed;
      },
      unsubscribe() {
        let index = self.subscribers.findIndex((x) => x === cb);
        if (index >= 0) {
          self.subscribers.splice(index, 1);
        }
        _closed = true;
      }
    };
  }
  next(value) {
    return Math.min(...this.subscribers.map((x) => x.next(value)));
  }
  complete() {
    for (let sub of this.subscribers) {
      sub.complete();
    }
    this.subscribers = [];
    this.closed = true;
  }
  error(err) {
    for (let sub of this.subscribers) {
      sub.error(err);
    }
    this.subscribers = [];
    this.closed = true;
  }
}

class Subject4 {
  _subscribable = new Subscribable4;
  _closingResolve;
  _closing = new Promise((r) => this._closingResolve = r);
  get closed() {
    return this._subscribable.closed;
  }
  get readable() {
    let self = this;
    let subscription;
    let cancelled = false;
    return new ReadableStream({
      async start(controller) {
        subscription = self.subscribe({
          next: (value) => {
            if (cancelled)
              return;
            controller.enqueue(value);
            return controller.desiredSize;
          },
          complete: () => {
            controller.close();
          },
          error: (err) => {
            controller.error(err);
          }
        });
      },
      cancel() {
        cancelled = true;
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });
  }
  get writable() {
    const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });
    const self = this;
    let stream = new WritableStream({
      write(chunk, controller) {
        if (self.closed && controller.signal.aborted == false) {
          controller.error();
          return;
        }
        if (controller.signal.aborted) {
          self._error(controller.signal.reason);
          return;
        }
        self._next(chunk);
      },
      close() {
        self._complete();
      },
      abort(reason) {
        self._error(reason);
      }
    }, queuingStrategy);
    this._closing.then((_2) => {
      if (stream.locked == false) {
        stream.close();
      }
    });
    return stream;
  }
  subscribe(cb) {
    let subscription = this._subscribable.subscribe(cb);
    return subscription;
  }
  _next(value) {
    return this._subscribable.next(value);
  }
  _complete() {
    this._subscribable.complete();
  }
  _error(err) {
    this._subscribable.error(err);
  }
  async next(value) {
    return this._next(value);
  }
  async complete() {
    this._closingResolve(undefined);
    return this._complete();
  }
  async error(err) {
    this._closingResolve(undefined);
    return this._error(err);
  }
}
var wseMerges3 = merge3;
var parallels3 = (...srcs) => wseMerges3()(from3(srcs));
var joins = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof ReadableStream)
    return joins((s) => arg.pipeTo(s));
  const fn = arg;
  const s1 = new TransformStream;
  const s2 = new TransformStream;
  const writable = s1.writable;
  fn(s2.writable);
  const readable = parallels3(s1.readable, s2.readable);
  return { writable, readable };
};
var DIE3 = function(reason) {
  if (typeof reason === "string") {
    throw reason.trim();
  }
  throw reason;
};
var pMaps3 = (arg1, arg2) => {
  const concurrent = typeof arg1 === "number" ? arg1 : Infinity;
  const fn = typeof arg2 === "function" ? arg2 : typeof arg1 === "function" ? arg1 : DIE3("NEVER");
  let i = 0;
  let promises = [];
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      promises.push(fn(chunk, i++));
      if (promises.length >= concurrent)
        ctrl.enqueue(await promises.shift());
    },
    flush: async (ctrl) => {
      while (promises.length)
        ctrl.enqueue(await promises.shift());
    }
  });
};
var reduces3 = (...args) => {
  const fn = typeof args[1] === "function" ? args[1] : typeof args[0] === "function" ? args[0] : null;
  let state = typeof args[1] === "function" ? args[0] : null;
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const next = await fn(state, chunk, i++);
      if (next !== undefined)
        return ctrl.enqueue(state = next);
    }
  });
};
var reduceEmits3 = (state, fn) => {
  let i = 0;
  return new TransformStream({
    transform: async (chunk, ctrl) => {
      const { next, emit } = await fn(state, chunk, i++);
      state = next;
      ctrl.enqueue(emit);
    }
  });
};
var import_unwind_array4 = __toESM6(require_src4(), 1);
var throughs3 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs3((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: fn(readable) };
};
var uniqs3 = () => throughs3((s) => s.pipeThrough(reduces3({ set: new Set, next: null }, (s2, x) => {
  if (s2.set.has(x))
    return;
  s2.set.add(x);
  s2.next = x;
  return s2;
})).pipeThrough(maps3((s2) => s2.next)));
var uniqBys3 = (keyFn) => throughs3((s) => s.pipeThrough(reduces3({ set: new Map, next: null }, async (s2, x) => {
  const key = await keyFn(x);
  if (s2.set.has(key))
    return;
  s2.set.set(key, x);
  s2.next = x;
  return s2;
})).pipeThrough(maps3((s2) => s2.next)));
var tees3 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees3((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(a);
  return { writable, readable: b2 };
};
var snoflow = (src) => {
  const r = src instanceof ReadableStream ? src : from3(src);
  return Object.assign(r, {
    _type: null,
    get readable() {
      return r;
    },
    through: (...args) => snoflow(r.pipeThrough(_throughs3(...args))),
    mapAddField: (...args) => snoflow(r.pipeThrough(mapAddFields3(...args))),
    chunkBy: (...args) => snoflow(r.pipeThrough(chunkBys3(...args))),
    chunkIf: (...args) => snoflow(r.pipeThrough(chunkIfs3(...args))),
    buffer: (...args) => snoflow(r.pipeThrough(chunks3(...args))),
    chunk: (...args) => snoflow(r.pipeThrough(chunks3(...args))),
    abort: (...args) => snoflow(r.pipeThrough(aborts(...args))),
    chunkInterval: (...args) => snoflow(r.pipeThrough(chunkIntervals3(...args))),
    interval: (...args) => snoflow(r.pipeThrough(chunkIntervals3(...args))),
    debounce: (...args) => snoflow(r.pipeThrough(debounces3(...args))),
    done: (dst = nils3()) => r.pipeTo(dst),
    end: (dst = nils3()) => r.pipeTo(dst),
    filter: (...args) => snoflow(r.pipeThrough(filters3(...args))),
    flatMap: (...args) => snoflow(r.pipeThrough(flatMaps3(...args))),
    flat: (...args) => snoflow(r.pipeThrough(flats3(...args))),
    join: (...args) => snoflow(r.pipeThrough(joins(...args))),
    limit: (...args) => snoflow(r.pipeThrough(limits3(...args))),
    head: (...args) => snoflow(r.pipeThrough(heads3(...args))),
    map: (...args) => snoflow(r.pipeThrough(maps3(...args))),
    log: (...args) => snoflow(r.pipeThrough(logs3(...args))),
    uniq: (...args) => snoflow(r.pipeThrough(uniqs3(...args))),
    uniqBy: (...args) => snoflow(r.pipeThrough(uniqBys3(...args))),
    unwind: (...args) => snoflow(r.pipeThrough(unwinds3(...args))),
    pMap: (...args) => snoflow(r.pipeThrough(pMaps3(...args))),
    peek: (...args) => snoflow(r.pipeThrough(peeks3(...args))),
    forEach: (...args) => snoflow(r.pipeThrough(forEachs3(...args))),
    reduce: (...args) => snoflow(r.pipeThrough(reduces3(...args))),
    reduceEmit: (...args) => snoflow(r.pipeThrough(reduceEmits3(...args))),
    skip: (...args) => snoflow(r.pipeThrough(skips3(...args))),
    slice: (...args) => snoflow(r.pipeThrough(slices3(...args))),
    tail: (...args) => snoflow(r.pipeThrough(tails3(...args))),
    tees: (...args) => snoflow(r.pipeThrough(_tees3(...args))),
    throttle: (...args) => snoflow(r.pipeThrough(throttles3(...args))),
    preventAbort: () => snoflow(r.pipeThrough(throughs3(), { preventAbort: true })),
    preventClose: () => snoflow(r.pipeThrough(throughs3(), { preventClose: true })),
    preventCancel: () => snoflow(r.pipeThrough(throughs3(), { preventCancel: true })),
    toNil: () => r.pipeTo(nils3()),
    toArray: () => toArray3(r),
    toCount: async () => (await toArray3(r)).length,
    toFirst: () => toPromise3(snoflow(r).limit(1)),
    toLast: () => toPromise3(snoflow(r).tail(1)),
    toLog: (...args) => snoflow(r.pipeThrough(logs3(...args))).done(),
    toResponse: (init4) => new Response(r, init4),
    text: (init4) => new Response(r, init4).text(),
    json: (init4) => new Response(r, init4).json(),
    blob: (init4) => new Response(r, init4).blob(),
    arrayBuffer: (init4) => new Response(r, init4).arrayBuffer(),
    [Symbol.asyncIterator]: streamAsyncIterator3
  });
};
var _tees3 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (arg instanceof WritableStream)
    return tees3((s) => s.pipeTo(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  const [a, b2] = readable.tee();
  fn(snoflow(a));
  return { writable, readable: b2 };
};
var _throughs3 = (arg) => {
  if (!arg)
    return new TransformStream;
  if (typeof arg !== "function")
    return throughs3((s) => s.pipeThrough(arg));
  const fn = arg;
  const { writable, readable } = new TransformStream;
  return { writable, readable: snoflow(fn(snoflow(readable))) };
};
var isXMLHTTPRequestBodyInit = (v) => v instanceof Blob || v instanceof ArrayBuffer || v instanceof FormData || v instanceof URLSearchParams || typeof v === "string";

class TextDecoderStream extends TransformStream {
  encoding;
  fatal;
  ignoreBOM;
  constructor(encoding = "utf-8", {
    fatal = false,
    ignoreBOM = false
  } = {}) {
    const decoder = new TextDecoder(encoding, { fatal, ignoreBOM });
    super({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          controller.enqueue(chunk);
          return;
        }
        const decoded = decoder.decode(chunk);
        if (decoded.length > 0) {
          controller.enqueue(decoded);
        }
      },
      flush(controller) {
        const output = decoder.decode();
        if (output.length > 0) {
          controller.enqueue(output);
        }
      }
    });
    this.encoding = encoding;
    this.fatal = fatal;
    this.ignoreBOM = ignoreBOM;
  }
}
var unpromises = function(promise) {
  const tr = new TransformStream;
  (async function() {
    const s = await promise;
    await s.pipeTo(tr.writable);
  })().catch((error9) => tr.readable.cancel(error9).catch(() => {
    throw error9;
  }));
  return tr.readable;
};
var gpt = (tsa, ...slots) => snoflow(unpromises((async () => {
  const u = [...tsa];
  const v = await pMap(slots ?? [], async (e) => isXMLHTTPRequestBodyInit(e) ? new Response(e).text() : snoflow(e).text());
  const body = zipWith2((a, b2) => a + b2, u, [...v, ""]).join("");
  const prompt = [body].join("");
  return snoflow(await new openai_default().chat.completions.create({
    model: process.env.CHATGPT_MODEL ?? "gpt-4o",
    messages: [{ content: `${prompt}`, role: "user" }],
    stream: true
  }).then((e) => e.toReadableStream())).through(new TextDecoderStream).map((e) => JSON.parse(e)?.choices?.[0]?.delta?.content ?? "");
})()));

// index.ts
function gptFlow(upstream) {
  return main_default22(gpt`${main_default22(upstream).text()}`).concat(main_default22(["\n"]));
}

// cli.ts
await yargs_default(hideBin(process.argv)).command(["$0 [prompts..]", "generate [prompts..]"], "Generate GPT answer, uses gpt-4o for now.", (y2) => y2.positional("prompts", {
  describe: "Prompts to generate answers, use - to read from stdin",
  type: "string",
  default: ["-"],
  coerce: (arg) => Array.isArray(arg) ? arg.join("") : arg
}).string("prefix").describe("prefix", "Add Prompts before stdin.").alias("p", "prefix").string("suffix").describe("suffix", "Add Prompts after stdin.").alias("s", "suffix"), async (argv) => {
  if (argv.prompts === "-")
    argv.prompts = "";
  const upstream = argv.prompts ? sflow2([argv.prompts]) : sflow2(fromReadable(stdin)).map((buffer) => buffer.toString());
  const downstream = fromWritable(stdout);
  await gptFlow(sflow2([argv.prefix?.concat("\n") ?? ""]).concat(upstream).concat(sflow2([argv.suffix?.concat("\n") ?? ""]))).lines().pipeTo(downstream);
}).command(["mod [output_file]"], "Code modify, uses gpt-4o for now.", (y2) => y2.positional("output_file", {
  describe: "output_file to generate, use - to generate to stdout only",
  type: "string"
}).string("prompt").describe("prompt", "Prompt for the codemod model. Could be a file or url").alias("p", "prompt").default("prompt", "Write output file based on the input files for me").string("promptUrl").describe("promptUrl", "prompt url").string("promptFile").describe("promptFile", "prompt file").string("glob").describe("glob", "Glob file inputs, for reference").alias("g", "glob").default("glob", "**/*").string("reference").describe("reference", "Add reference to the codemod model. Could be a file path or url").alias("r", "reference").example("mod index.ts -p ", "Modify index.ts"), async (argv) => {
  if (argv.output_file === "-")
    argv.output_file = "";
  const promptFlow = sfT`
# CODEMOD TASK

Act as a code mod bot, 

## Reference Files Path list

${globFlow([argv.glob]).join("\n")}

## Reference Files ( IN JSON encoded format )

${globFlow([argv.glob]).map(async (f) => `### ${f}\n\n${JSON.stringify(await readFile(f, "utf8"))}${f}`).join("\n\n")}

## Output File Name (if it's - then it's stdout)

${"```\n"}${argv.output_file ?? "-"}${"\n```"}

## PROMPT

${"```markdown"}
${async function() {
    console.log(argv.promptUrl);
    return (argv.promptUrl && await (await fetch(argv.promptUrl)).text()) ?? (argv.promptFile && await readFile(argv.promptFile, "utf8")) ?? argv.prompt;
  }()}
${"```"}

Please generate the content for the output file based on the input files and prompt. No explaination needed, no codeblock fences, every words will be used to generate the output file.
`;
  const downStream = argv.output_file && fromWritable(createWriteStream(argv.output_file)) || fromWritable(stdout);
  await gptFlow(promptFlow).lines().pipeTo(downStream);
}).help().alias("h", "help").version().alias("v", "version").parse();
