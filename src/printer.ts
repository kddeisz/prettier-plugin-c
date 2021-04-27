import type { Doc, Printer } from "prettier";
import { builders } from "prettier/doc";

const { concat, group, hardline, indent, join, line, softline } = builders;

const printer: Printer = {
  print(path, opts, print) {
    const node = path.getValue();

    switch (node.type) {
      case "assign":
        return group(concat([
          path.call(print, "lhs"),
          " ",
          node.oper,
          group(indent(concat([
            line,
            path.call(print, "rhs")
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
          path.call(print, "lhs"),
          " ",
          node.oper,
          " ",
          path.call(print, "rhs")
        ]));
      case "break":
        return "break;";
      case "call": {
        const docs = [path.call(print, "recv"), "("];
  
        if (node.args) {
          docs.push(
            group(indent(concat([
              softline,
              join(concat([",", line]), path.map(print, "args"))
            ]))),
            softline
          );
        }
  
        docs.push(")");
        return group(concat(docs));
      }
      case "cast":
        return concat(["(", path.call(print, "value"), ") ", path.call(print, "expr")]);
      case "compound": {
        const docs: Doc[] = ["{"];
    
        if (node.items) {
          docs.push(
            indent(concat([hardline, join(hardline, path.map(print, "items"))])),
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
        const docs = [path.call(print, "declSpecs")];
    
        if (node.initDecls) {
          docs.push(" ", join(", ", path.map(print, "initDecls")));
        }
    
        docs.push(";");
        return group(concat(docs));
      }
      case "declSpecs":
        return join(" ", path.map(print, "specs"));
      case "exprs":
        return group(join(", ", path.map(print, "exprs")));
      case "field":
        return concat([path.call(print, "recv"), node.oper, node.ident]);  
      case "func": {
        const docs = [path.call(print, "declSpecs"), " ", path.call(print, "name")];
    
        if (node.initDecls) {
          docs.push("(", join(", ", path.map(print, "initDecls")), ") ");
        } else {
          docs.push("() ");
        }
    
        docs.push(path.call(print, "body"));
        return group(concat(docs));
      }
      case "ident":
        return node.value;
      case "if": {
        const docs = ["if (", path.call(print, "expr"), ") ", path.call(print, "stmt")];
  
        if (node.consequent) {
          docs.push(" else ", path.call(print, "consequent"));
        }
  
        return group(concat(docs));
      }
      case "initDecl": {
        const docs = [path.call(print, "decl")];
    
        if (node.init) {
          docs.push(" = ", path.call(print, "init"));
        }
    
        return group(concat(docs));
      }
      case "parens":
        return concat(["(", path.call(print, "expr"), ")"]);
      case "postUnary":
        return concat([path.call(print, "expr"), node.oper]);
      case "return": {
        const docs: Doc[] = ["return"];
  
        if (node.expr) {
          docs.push(" ", path.call(print, "expr"));
        }
  
        docs.push(";");
        return concat(docs);
      }
      case "root":
        return concat([join(hardline, path.map(print, "declarations")), hardline]);
      case "specQuals":
        return join(" ", path.map(print, "value"));
      case "stmt":
        return concat([path.call(print, "expr"), ";"]);
      case "ternary":
        return group(concat([
          path.call(print, "pred"),
          indent(concat([
            line,
            concat(["? ", path.call(print, "truthy")]),
            line,
            concat([": ", path.call(print, "falsy")])
          ]))
        ]));
      case "unary": {
        const docs = [node.oper];
    
        if (node.parens) {
          docs.push("(");
        } else if (!["++", "--"].includes(node.oper)) {
          docs.push(" ");
        }
    
        docs.push(path.call(print, "expr"));
    
        if (node.parens) {
          docs.push(")");
        }
    
        return concat(docs);
      }
      case "while": {
        const docs = ["while(", path.call(print, "pred"), ")"];
    
        if (node.stmt) {
          docs.push(" ", path.call(print, "stmt"));
        } else {
          docs.push(";");
        }
    
        return group(concat(docs));
      }
      default:
        throw new Error(`Unsupported node: ${node.type}`);
    }
  }
};

export default printer;
