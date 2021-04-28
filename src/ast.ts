type AssignOper = "=" | "*=" | "%=" | "+=" | "-=" | "<<=" | ">>=" | "&=" | "^=" | "|=";
type BinaryOper = "*" | "/" | "%" | "+" | "-" | "<<" | ">>" | "<" | ">" | "<=" | ">=" | "==" | "!=" | "&" | "^" | "|" | "&&" | "||";

type Loc = { sl: number, sc: number, el: number, ec: number };
type AST = { loc: Loc } & (
  | { type: "assert", expr: AST, msg: string }
  | { type: "assign", lhs: AST, oper: AssignOper, rhs: AST }
  | { type: "binary", lhs: AST, oper: BinaryOper, rhs: AST }
  | { type: "bool" }
  | { type: "break" }
  | { type: "call", recv: AST, args?: AST[] }
  | { type: "cast", value: AST, expr: AST }
  | { type: "char" }
  | { type: "complex" }
  | { type: "compound", items?: AST[] }
  | { type: "const", value: string }
  | { type: "continue" }
  | { type: "decl", declSpecs: AST, initDecls?: AST[] }
  | { type: "declSpecs", specs: AST[] }
  | { type: "do", stmt: AST, expr: AST }
  | { type: "double" }
  | { type: "exprs", exprs: AST[] }
  | { type: "field", recv: AST, oper: "." | "->", ident: string }
  | { type: "float" }
  | { type: "for", init: AST, pred: AST, incr?: AST, stmt: AST }
  | { type: "func", declSpecs: AST, name: string, params?: AST[], body: AST }
  | { type: "goto", ident: string }
  | { type: "ident", value: string }
  | { type: "if", expr: AST, stmt: AST, consequent?: AST }
  | { type: "imaginary" }
  | { type: "initDecl", decl: AST, init?: AST }
  | { type: "int" }
  | { type: "long" }
  | { type: "parens", expr: AST }
  | { type: "postUnary", expr: AST, oper: "++" | "--" }
  | { type: "return", expr?: AST }
  | { type: "root", decls: AST[] }
  | { type: "short" }
  | { type: "signed" }
  | { type: "specQuals", quals: AST[] }
  | { type: "stmt", expr: AST }
  | { type: "ternary", pred: AST, truthy: AST, falsy: AST }
  | { type: "unary", oper: string, expr: AST, parens: boolean }
  | { type: "unsigned" }
  | { type: "while", pred: AST, stmt: AST }
  | { type: "void" }
);

export default AST;
