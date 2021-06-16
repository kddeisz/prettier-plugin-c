import type { Doc, Printer } from "prettier";
import { builders } from "prettier/doc";
import type Ast from "./ast";

const { group, hardline, indent, join, line, softline } = builders;

const printer: Printer<Ast> = {
  print(path, opts, print) {
    const node = path.getValue();

    const call = <T extends { [key in P]?: Ast }, P extends keyof T>(
      node: T,
      prop: P
    ) => path.call(print, prop);
    const map = <T extends { [key in P]?: Ast[] }, P extends keyof T>(
      node: T,
      prop: P
    ) => path.map(print, prop);

    switch (node.type) {
      case "assert":
        return group([
          "_Static_assert(",
          indent([softline, call(node, "expr"), ",", line, node.msg]),
          softline,
          ");"
        ]);
      case "assign":
        return group([
          call(node, "lhs"),
          " ",
          node.oper,
          group(indent([line, call(node, "rhs")]))
        ]);
      case "atomic":
        return group([
          "_Atomic(",
          indent([softline, call(node, "name")]),
          softline,
          ")"
        ]);
      case "binary":
        return group([
          call(node, "lhs"),
          " ",
          node.oper,
          " ",
          call(node, "rhs")
        ]);
      case "break":
        return "break;";
      case "call": {
        const docs = [call(node, "recv"), "("];

        if (node.args) {
          docs.push(
            group(indent([softline, join([",", line], map(node, "args"))])),
            softline
          );
        }

        return group([...docs, ")"]);
      }
      case "cast":
        return ["(", call(node, "value"), ") ", call(node, "expr")];
      case "compound": {
        const docs: Doc[] = ["{"];

        if (node.items) {
          docs.push(
            indent([hardline, join(hardline, map(node, "items"))]),
            hardline
          );
        }

        return group([...docs, "}"]);
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

        return group([...docs, ";"]);
      }
      case "declSpecs":
        return join(" ", map(node, "specs"));
      case "do":
        return group([
          "do ",
          call(node, "stmt"),
          " while (",
          call(node, "expr"),
          ");"
        ]);
      case "exprs":
        return group(join(", ", map(node, "exprs")));
      case "field":
        return [call(node, "recv"), node.oper, node.ident];
      case "for": {
        const docs = ["for (", call(node, "init"), " ", call(node, "pred")];

        if (node.incr) {
          docs.push(" ", call(node, "incr"));
        }

        return group([...docs, ") ", call(node, "stmt")]);
      }
      case "func": {
        const docs = [call(node, "declSpecs"), " ", call(node, "name")];

        if (node.params) {
          docs.push("(", join(", ", map(node, "params")), ") ");
        } else {
          docs.push("() ");
        }

        return group([...docs, call(node, "body")]);
      }
      case "goto":
        return ["goto ", node.ident, ";"];
      case "ident":
        return node.value;
      case "if": {
        const docs = ["if (", call(node, "expr"), ") ", call(node, "stmt")];

        if (node.consequent) {
          docs.push(" else ", call(node, "consequent"));
        }

        return group(docs);
      }
      case "initDecl": {
        const docs = [call(node, "decl")];

        if (node.init) {
          docs.push(" = ", call(node, "init"));
        }

        return group(docs);
      }
      case "keyword":
        return node.keyword;
      case "parens":
        return ["(", call(node, "expr"), ")"];
      case "postUnary":
        return [call(node, "expr"), node.oper];
      case "return": {
        const docs: Doc[] = ["return"];

        if (node.expr) {
          docs.push(" ", call(node, "expr"));
        }

        return [...docs, ";"];
      }
      case "root":
        return [join(hardline, map(node, "decls")), hardline];
      case "specQuals":
        return join(" ", map(node, "quals"));
      case "stmt":
        return [call(node, "expr"), ";"];
      case "ternary":
        return group([
          call(node, "pred"),
          indent([
            line,
            ["? ", call(node, "truthy")],
            line,
            [": ", call(node, "falsy")]
          ])
        ]);
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

        return docs;
      }
      case "while": {
        const docs = ["while(", call(node, "pred"), ")"];

        if (node.stmt) {
          docs.push(" ", call(node, "stmt"));
        } else {
          docs.push(";");
        }

        return group(docs);
      }
      default:
        throwUnsupportedNode(node);
    }
  }
};

function throwUnsupportedNode(node: never): never;
function throwUnsupportedNode(node: Ast) {
  throw new Error(`${node.type} not supported.`);
}

export default printer;
