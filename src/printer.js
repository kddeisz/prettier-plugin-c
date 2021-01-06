const { concat, group, hardline, join } = require("prettier/doc").builders;

function genericPrint(path, opts, print) {
  return "";
}

module.exports = {
  print: genericPrint
};
