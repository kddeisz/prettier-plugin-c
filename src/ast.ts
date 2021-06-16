type AssignOper =
  | "="
  | "*="
  | "/="
  | "%="
  | "+="
  | "-="
  | "<<="
  | ">>="
  | "&="
  | "^="
  | "|=";
type BinaryOper =
  | "*"
  | "/"
  | "%"
  | "+"
  | "-"
  | "<<"
  | ">>"
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "&"
  | "^"
  | "|"
  | "&&"
  | "||";
type Keyword =
  | "typedef"
  | "extern"
  | "static"
  | "_Thread_local"
  | "auto"
  | "register"
  | "void"
  | "char"
  | "short"
  | "int"
  | "long"
  | "float"
  | "double"
  | "signed"
  | "unsigned"
  | "bool"
  | "complex"
  | "imaginary";

type Loc = { sl: number; sc: number; el: number; ec: number };
type Ast = { loc: Loc } & (
  | { type: "assert"; expr: Ast; msg: string }
  | { type: "assign"; lhs: Ast; oper: AssignOper; rhs: Ast }
  | { type: "atomic"; name: Ast }
  | { type: "binary"; lhs: Ast; oper: BinaryOper; rhs: Ast }
  | { type: "break" }
  | { type: "call"; recv: Ast; args?: Ast[] }
  | { type: "cast"; value: Ast; expr: Ast }
  | { type: "compound"; items?: Ast[] }
  | { type: "const"; value: string }
  | { type: "continue" }
  | { type: "decl"; declSpecs: Ast; initDecls?: Ast[] }
  | { type: "declSpecs"; specs: Ast[] }
  | { type: "do"; stmt: Ast; expr: Ast }
  | { type: "exprs"; exprs: Ast[] }
  | { type: "field"; recv: Ast; oper: "." | "->"; ident: string }
  | { type: "for"; init: Ast; pred: Ast; incr?: Ast; stmt: Ast }
  | { type: "func"; declSpecs: Ast; name: Ast; params?: Ast[]; body: Ast }
  | { type: "goto"; ident: string }
  | { type: "ident"; value: string }
  | { type: "if"; expr: Ast; stmt: Ast; consequent?: Ast }
  | { type: "initDecl"; decl: Ast; init?: Ast }
  | { type: "keyword"; keyword: Keyword }
  | { type: "parens"; expr: Ast }
  | { type: "postUnary"; expr: Ast; oper: "++" | "--" }
  | { type: "return"; expr?: Ast }
  | { type: "root"; decls: Ast[] }
  | { type: "specQuals"; quals: Ast[] }
  | { type: "stmt"; expr: Ast }
  | { type: "ternary"; pred: Ast; truthy: Ast; falsy: Ast }
  | { type: "unary"; oper: string; expr: Ast; parens: boolean }
  | { type: "while"; pred: Ast; stmt: Ast }
);

export default Ast;
