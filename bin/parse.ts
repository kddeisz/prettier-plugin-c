#!./node_modules/.bin/ts-node

import fs from "fs";
import { parse } from "../src/parser/parser";

let code: string;

if (!process.argv[2]) {
  code = fs.readFileSync("test.c", "utf-8");
} else if (fs.existsSync(process.argv[2])) {
  code = fs.readFileSync(process.argv[2], "utf-8");
} else {
  code = process.argv.slice(2).join(" ").replace(/\\n/g, "\n");
}

console.log(JSON.stringify(parse(code), null, 2));
