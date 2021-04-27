#!./node_modules/.bin/ts-node

import fs from "fs";
import prettier from "prettier";
import plugin from "../src/plugin";

let code: string;

if (!process.argv[2]) {
  code = fs.readFileSync("test.c", "utf-8");
} else if (fs.existsSync(process.argv[2])) {
  code = fs.readFileSync(process.argv[2], "utf-8");
} else {
  code = process.argv.slice(2).join(" ").replace(/\\n/g, "\n");
}

const { __debug } = prettier as any;
const doc = __debug.printToDoc(code, { parser: "c", plugins: [plugin] });
console.log(__debug.formatDoc(doc));
