import { gpt } from "chatgpt-template";
import sf from "sflow";

export default function gptFlow(
    upstream: ReadableStream<string | Uint8Array>): ReadableStream<string> {
    return gpt`${sf(upstream).text()}`.concat(['\n']);
}
