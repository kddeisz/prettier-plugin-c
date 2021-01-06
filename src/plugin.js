const parser = require("./parser");
const printer = require("./printer");

const plugin = {
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
  options: {},
  defaultOptions: {
    printWidth: 80,
    tabWidth: 2
  }
};

module.exports = plugin;
