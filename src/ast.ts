type Loc = { sl: number, sc: number, el: number, ec: number };
type AST = { loc: Loc } & (
  | { type: "assign", lhs: AST, oper: string, rhs: AST }
  | { type: "binary", lhs: AST, oper: string, rhs: AST }
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
  | { type: "double" }
  | { type: "exprs", exprs: AST[] }
  | { type: "field", oper: "." | "->", ident: string }
  | { type: "float" }
  | { type: "func", declSpecs: AST, name: string, params?: AST[], body: AST }
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
