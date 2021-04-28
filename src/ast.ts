type AssignOper = "=" | "*=" | "/=" | "%=" | "+=" | "-=" | "<<=" | ">>=" | "&=" | "^=" | "|=";
type BinaryOper = "*" | "/" | "%" | "+" | "-" | "<<" | ">>" | "<" | ">" | "<=" | ">=" | "==" | "!=" | "&" | "^" | "|" | "&&" | "||";
type Keyword = "typedef" | "extern" | "static" | "_Thread_local" | "auto" | "register" | "void" | "char" | "short" | "int" | "long" | "float" | "double" | "signed" | "unsigned" | "bool" | "complex" | "imaginary";

type Loc = { sl: number, sc: number, el: number, ec: number };
type AST = { loc: Loc } & (
  | { type: "assert", expr: AST, msg: string }
  | { type: "assign", lhs: AST, oper: AssignOper, rhs: AST }
  | { type: "atomic", name: AST }
  | { type: "binary", lhs: AST, oper: BinaryOper, rhs: AST }
  | { type: "break" }
  | { type: "call", recv: AST, args?: AST[] }
  | { type: "cast", value: AST, expr: AST }
  | { type: "compound", items?: AST[] }
  | { type: "const", value: string }
  | { type: "continue" }
  | { type: "decl", declSpecs: AST, initDecls?: AST[] }
  | { type: "declSpecs", specs: AST[] }
  | { type: "do", stmt: AST, expr: AST }
  | { type: "exprs", exprs: AST[] }
  | { type: "field", recv: AST, oper: "." | "->", ident: string }
  | { type: "for", init: AST, pred: AST, incr?: AST, stmt: AST }
  | { type: "func", declSpecs: AST, name: AST, params?: AST[], body: AST }
  | { type: "goto", ident: string }
  | { type: "ident", value: string }
  | { type: "if", expr: AST, stmt: AST, consequent?: AST }
  | { type: "initDecl", decl: AST, init?: AST }
  | { type: "keyword", keyword: Keyword }
  | { type: "parens", expr: AST }
  | { type: "postUnary", expr: AST, oper: "++" | "--" }
  | { type: "return", expr?: AST }
  | { type: "root", decls: AST[] }
  | { type: "specQuals", quals: AST[] }
  | { type: "stmt", expr: AST }
  | { type: "ternary", pred: AST, truthy: AST, falsy: AST }
  | { type: "unary", oper: string, expr: AST, parens: boolean }
  | { type: "while", pred: AST, stmt: AST }
);

export default AST;
