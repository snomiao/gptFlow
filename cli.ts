#!/usr/bin/env bun
import { stdin, stdout } from "process";
import { fromReadable, fromWritable, sf } from "sflow";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import gptFlow from "./index";
await yargs(hideBin(process.argv))
  .command(
    ["$0", "generate"],
    "Generate GPT answer, uses gpt-4o for now.",
    (y) =>
      y
        .string("prefix")
        .describe("prefix", "Add Prompts before stdin.")
        .alias("p", "prefix")
        .string("suffix")
        .describe("suffix", "Add Prompts after stdin.")
        .alias("s", "suffix"),
    async (argv) => {
      const upstream = sf(fromReadable(stdin)).map((buffer) =>
        buffer.toString()
      );
      const downstream = fromWritable(stdout);

      await gptFlow(
        sf([argv.prefix?.concat("\n") ?? ""])
          .concat(upstream)
          .concat(sf([argv.suffix?.concat("\n") ?? ""]))
      ).pipeTo(downstream);
    }
  )
  .help()
  .version()
  .parse();
