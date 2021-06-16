import type { Plugin } from "prettier";
import type Ast from "./ast";
import parser from "./parser";
import printer from "./printer";

const plugin: Plugin<Ast> = {
  languages: [
    {
      name: "C",
      parsers: ["c"],
      extensions: [".c"],
      vscodeLanguageIds: ["c"]
    }
  ],
  parsers: {
    c: parser
  },
  printers: {
    c: printer
  },
  defaultOptions: {
    printWidth: 80,
    tabWidth: 2
  }
};

export default plugin;
