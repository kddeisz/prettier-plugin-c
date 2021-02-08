#!/usr/bin/env node

const { parse } = require("./parser/parser");

function locStart() {
  return 0;
}

function locEnd() {
  return 0;
}

module.exports = {
  parse,
  astFormat: "c",
  locStart,
  locEnd
};
