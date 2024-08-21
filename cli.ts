#!/usr/bin/env bun
import { createWriteStream } from "fs";
import { readFile } from "fs/promises";
import globFlow from "globflow";
import { stdin, stdout } from "process";
import { sf, sfT } from "sflow";
import { fromReadable, fromWritable } from "sflow/fromNodeStream";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import gptFlow from "./index";

await yargs(hideBin(process.argv))
  .command(
    ["$0 [prompts..]", "generate [prompts..]"],
    "Generate GPT answer, uses gpt-4o for now.",
    (y) =>
      y
        // .string("code")
        // .describe(
        //   "code",
        //   "Postprocess: extract contents in code block ```.*```"
        // )
        // .alias("p", "code")
        //
        .positional("prompts", {
          describe: "Prompts to generate answers, use - to read from stdin",
          type: "string",
          default: ["-"],
          coerce: (arg: string | string[]) =>
            Array.isArray(arg) ? arg.join("") : arg,
        })
        .string("prefix")
        .describe("prefix", "Add Prompts before stdin.")
        .alias("p", "prefix")
        .string("suffix")
        .describe("suffix", "Add Prompts after stdin.")
        .alias("s", "suffix"),
    async (argv) => {
      if (argv.prompts === "-") argv.prompts = "";
      const upstream = argv.prompts
        ? sf([argv.prompts])
        : sf(fromReadable(stdin)).map((buffer) => buffer.toString());

      const downstream = fromWritable(stdout);

      await gptFlow(
        sf([argv.prefix?.concat("\n") ?? ""])
          .concat(upstream)
          .concat(sf([argv.suffix?.concat("\n") ?? ""]))
      )
        .lines()
        // .chunkIf((x) => x)
        .pipeTo(downstream);
    }
  )
  .command(
    ["mod [output_file]"],
    "Code modify, uses gpt-4o for now.",
    (y) =>
      y
        .positional("output_file", {
          describe: "output_file to generate, use - to generate to stdout only",
          type: "string",
        })
        // .string("code")
        // .describe(
        //   "code",
        //   "Postprocess: extract contents in code block ```.*```"
        // )
        // .alias("p", "code")
        //

        .string("prompt")
        .describe(
          "prompt",
          "Prompt for the codemod model. Could be a file or url"
        )
        .alias("p", "prompt")
        .default("prompt", "Write output file based on the input files for me")
        // .default("prompt", "Refactor this file to align to latest standards")

        .string("promptUrl")
        .describe("promptUrl", "prompt url")

        .string("promptFile")
        .describe("promptFile", "prompt file")

        .string("glob")
        .describe("glob", "Glob file inputs, for reference")
        .alias("g", "glob")
        .default("glob", "**/*")

        .string("reference")
        .describe(
          "reference",
          "Add reference to the codemod model. Could be a file path or url"
        )
        .alias("r", "reference")
        .example("mod index.ts -p ", "Modify index.ts"),
    async (argv) => {
      if (argv.output_file === "-") argv.output_file = "";
      const promptFlow = sfT`
# CODEMOD TASK

Act as a code mod bot, 

## Reference Files Path list

${globFlow([argv.glob]).join("\n")}

## Reference Files ( IN JSON encoded format )

${globFlow([argv.glob])
  // .map(
  //   async (f) => `### ${f}\n\n${"```\n"}${await readFile(f, "utf8")}${"\n```"}`
  // )
  .map(
    async (f) => `### ${f}\n\n${JSON.stringify(await readFile(f, "utf8"))}${f}`
  )
  .join("\n\n")}

## Output File Name (if it's - then it's stdout)

${"```\n"}${argv.output_file ?? "-"}${"\n```"}

## PROMPT

${"```markdown"}
${(async function () {
  console.log(argv.promptUrl);
  return (
    (argv.promptUrl && (await (await fetch(argv.promptUrl)).text())) ??
    (argv.promptFile && (await readFile(argv.promptFile, "utf8"))) ??
    argv.prompt!
  );
})()}
${"```"}

Please generate the content for the output file based on the input files and prompt. No explaination needed, no codeblock fences, every words will be used to generate the output file.
`;

      // console.log(promptFlow.text());
      const downStream =
        (argv.output_file &&
          fromWritable(createWriteStream(argv.output_file))) ||
        fromWritable(stdout);
      await gptFlow(promptFlow).lines().pipeTo(downStream);
    }
  )
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .parse();
