import type { Parser } from "prettier";

import type AST from "./ast";
import { parse } from "./parser/parser";

const parser: Parser<AST> = {
  parse,
  astFormat: "c",
  locStart() {
    return 0;
  },
  locEnd() {
    return 0;
  }
};

export default parser;
