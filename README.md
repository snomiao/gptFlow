# gptFlow

**gptFlow** is a command-line interface (CLI) tool that integrates with ChatGPT, allowing you to process text streams via the shell.

## Features

- Seamlessly pipe input and output through ChatGPT.
- Simple CLI usage via Bun or npx.
- Easily customizable with shell scripts.

## Installation

Install using npm:

```sh
npm install -g gptflow
```

Alternatively, you can use it directly with `bun` or `npx`.

## Usage

### Basic Example

Pipe text to `gptflow`:

```sh
echo "hello" | bunx gptflow
# Output: hello, how can i assist you today
```

Or with `npx`:

```sh
echo "hello" | npx gptflow
# Output: hello, how can i assist you today
```

### Using shell scripts

You can create comprehensive shell scripts to automate tasks. Here are examples:

#### `example.sh`

```sh
bunx globflow *.{ts,json,sh} --md -m "Given the file list, write a README.md for this project, dont explain just give me md" | bunx gptflow | tee README.md

bunx globflow@0.0.2 *.{ts,json,sh,md} --md -m "Given the file list, optimize the README.md for this project, dont explain just give me md" | bunx gptflow@0.0.4 | tee README.md
```

#### `spec.sh`

```sh
#!/usr/bin/env bun
echo hello | bunx gptflow
# hello, how can i assist you today

echo hello | npx gptflow
# hello, how can i assist you today

echo hello | bun cli.ts
# hello, how can i assist you today
```

## Development

### Building the project

Build the project using the provided scripts:

```sh
bun run build
```

### Running tests

Execute tests using:

```sh
bun run test
```

## Contributing

Feel free to submit issues or pull requests. Check out the [issues page](https://github.com/snomiao/gptFlow/issues) for open issues.

## Changelog

See the [CHANGELOG.md](./CHANGELOG.md) for details on changes made in each release.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
