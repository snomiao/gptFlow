import { gpt } from "chatgpt-template";
import sf from "sflow";

export default function gptFlow(upstream: ReadableStream<string | Uint8Array>) {
  return sf(gpt`${sf(upstream).text()}`).concat(sf(["\n"]));
}
