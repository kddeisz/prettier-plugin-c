import type { Parser } from "prettier";

import type Ast from "./ast";
import { parse } from "./parser/parser";

const parser: Parser<Ast> = {
  parse,
  astFormat: "c",
  locStart(node) {
    return node.loc.sc;
  },
  locEnd(node) {
    return node.loc.ec;
  }
};

export default parser;
