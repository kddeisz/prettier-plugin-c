const { concat, group, hardline, indent, join, line, softline } = require("prettier/doc").builders;

function genericPrint(path, opts, print) {
  return JSON.stringify(path.getValue());
}

module.exports = {
  print: genericPrint
};
