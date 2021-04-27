import type { Parser } from "prettier";
import { parse } from "./parser/parser";

const parser: Parser = {
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
