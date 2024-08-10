#!bun

echo hello | bunx gptflow
# hello, how can i assist you today

# also support npx
echo hello | npx gptflow
# hello, how can i assist you today

echo hello | bun cli.ts
# hello, how can i assist you today

echo 'hello' | bun cli.ts --prefix "my name is snomiao"
# Hello, Snomiao! How can I assist you today?