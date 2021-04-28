import type { Doc, Printer } from "prettier";
import { builders } from "prettier/doc";
import type AST from "./ast";

const { concat, group, hardline, indent, join, line, softline } = builders;

const printer: Printer<AST> = {
  print(path, opts, print) {
    const node = path.getValue();

    const call = <T>(node: T, prop: keyof T) => path.call(print, prop);
    const map = <T>(node: T, prop: keyof T) => path.map(print, prop);

    switch (node.type) {
      case "assert":
        return group(concat([
          "_Static_assert(",
          indent(concat([
            softline,
            call(node, "expr"),
            ",",
            line,
            node.msg
          ])),
          softline,
          ");"
        ]));
      case "assign":
        return group(concat([
          call(node, "lhs"),
          " ",
          node.oper,
          group(indent(concat([
            line,
            call(node, "rhs")
          ])))
        ]));
      case "bool":
      case "char":
      case "complex":
      case "double":
      case "float":
      case "imaginary":
      case "int":
      case "long":
      case "short":
      case "signed":
      case "unsigned":
      case "void":
        return node.type;
      case "binary":
        return group(concat([
          call(node, "lhs"),
          " ",
          node.oper,
          " ",
          call(node, "rhs")
        ]));
      case "break":
        return "break;";
      case "call": {
        const docs = [call(node, "recv"), "("];
  
        if (node.args) {
          docs.push(
            group(indent(concat([
              softline,
              join(concat([",", line]), map(node, "args"))
            ]))),
            softline
          );
        }
  
        docs.push(")");
        return group(concat(docs));
      }
      case "cast":
        return concat(["(", call(node, "value"), ") ", call(node, "expr")]);
      case "compound": {
        const docs: Doc[] = ["{"];
    
        if (node.items) {
          docs.push(
            indent(concat([hardline, join(hardline, map(node, "items"))])),
            hardline
          );
        }
    
        docs.push("}");
        return group(concat(docs));
      }
      case "const":
        return node.value;
      case "continue":
        return "continue;";
      case "decl": {
        const docs = [call(node, "declSpecs")];
    
        if (node.initDecls) {
          docs.push(" ", join(", ", map(node, "initDecls")));
        }
    
        docs.push(";");
        return group(concat(docs));
      }
      case "declSpecs":
        return join(" ", map(node, "specs"));
      case "exprs":
        return group(join(", ", map(node, "exprs")));
      case "field":
        return concat([call(node, "recv"), node.oper, node.ident]); 
      case "for": {
        const docs = ["for (", call(node, "init"), " ", call(node, "pred")];

        if (node.incr) {
          docs.push(" ", call(node, "incr"));
        }

        docs.push(") ", call(node, "stmt"));
        return group(concat(docs));
      }
      case "func": {
        const docs = [call(node, "declSpecs"), " ", call(node, "name")];
    
        if (node.params) {
          docs.push("(", join(", ", map(node, "params")), ") ");
        } else {
          docs.push("() ");
        }
    
        docs.push(call(node, "body"));
        return group(concat(docs));
      }
      case "goto":
        return concat(["goto ", node.ident, ";"]);
      case "ident":
        return node.value;
      case "if": {
        const docs = ["if (", call(node, "expr"), ") ", call(node, "stmt")];
  
        if (node.consequent) {
          docs.push(" else ", call(node, "consequent"));
        }
  
        return group(concat(docs));
      }
      case "initDecl": {
        const docs = [call(node, "decl")];
    
        if (node.init) {
          docs.push(" = ", call(node, "init"));
        }
    
        return group(concat(docs));
      }
      case "parens":
        return concat(["(", call(node, "expr"), ")"]);
      case "postUnary":
        return concat([call(node, "expr"), node.oper]);
      case "return": {
        const docs: Doc[] = ["return"];
  
        if (node.expr) {
          docs.push(" ", call(node, "expr"));
        }
  
        docs.push(";");
        return concat(docs);
      }
      case "root":
        return concat([join(hardline, map(node, "decls")), hardline]);
      case "specQuals":
        return join(" ", map(node, "quals"));
      case "stmt":
        return concat([call(node, "expr"), ";"]);
      case "ternary":
        return group(concat([
          call(node, "pred"),
          indent(concat([
            line,
            concat(["? ", call(node, "truthy")]),
            line,
            concat([": ", call(node, "falsy")])
          ]))
        ]));
      case "unary": {
        const docs: Doc[] = [node.oper];
    
        if (node.parens) {
          docs.push("(");
        } else if (!["++", "--", "*"].includes(node.oper)) {
          docs.push(" ");
        }
    
        docs.push(call(node, "expr"));
    
        if (node.parens) {
          docs.push(")");
        }
    
        return concat(docs);
      }
      case "while": {
        const docs = ["while(", call(node, "pred"), ")"];
    
        if (node.stmt) {
          docs.push(" ", call(node, "stmt"));
        } else {
          docs.push(";");
        }
    
        return group(concat(docs));
      }
      default:
        throwUnsupportedNode(node);
    }
  }
};

function throwUnsupportedNode(node: never): never;
function throwUnsupportedNode(node: AST) {
  throw new Error(`${node.type} not supported.`);
}

export default printer;
