#!/usr/bin/env bun
import { stdin, stdout } from "process";
import { fromReadable, fromWritable } from "sflow";
import gptFlow from "./index";

if (import.meta.main) {
    
    const upstream = fromReadable(stdin);
    const downstream = fromWritable(stdout);
    
    await gptFlow(upstream).pipeTo(downstream);

}    
