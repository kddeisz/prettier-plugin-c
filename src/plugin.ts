import type { Plugin } from "prettier";
import parser from "./parser";
import printer from "./printer";

const plugin: Plugin = {
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
