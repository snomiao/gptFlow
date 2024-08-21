import gptFlow from "./index";

describe("gptFlow", () => {
  it("should process the upstream content through GPT and return the result", async () => {
    const input = new ReadableStream<string>({
      start(controller) {
        controller.enqueue("hello, my name is snomiao");
        controller.close();
      },
    });

    const resultStream = gptFlow(input);

    const reader = resultStream.getReader();
    const chunks = [];
    let done, value;

    while (!done) {
      ({ done, value } = await reader.read());
      if (value) chunks.push(value);
    }

    // const result = Buffer.concat(chunks).toString();
    expect(chunks.join('')).toContain("nomiao"); // maybe Snomiao
  });
});
