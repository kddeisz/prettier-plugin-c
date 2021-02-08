const { concat, group, hardline, indent, join } = require("prettier/doc").builders;

function genericPrint(path, opts, print) {
  const node = path.getValue();

  switch (node.type) {
    case "binary":
      return printBinary();
    case "compound":
      return printCompound();
    case "const":
    case "ident":
      return node.value;
    case "decl":
      return printDeclaration();
    case "declSpecs":
      return printDeclarationSpecifiers();
    case "exprs":
      return printExpressions();
    case "func":
      return printFunc();
    case "initDecl":
      return printInitDeclarator();
    case "int":
      return "int";
    case "root":
      return printRoot();
    case "specQuals":
      return printSpecifierQualifiers();
    case "stmt":
      return printStatement();
    case "ternary":
      return printTernary();
    case "unary":
      return printUnary();
    case "while":
      return printWhile();
    default:
      throw new Error(`Unsupported node: ${node.type}`);
  }

  function printBinary() {
    return group(concat([
      path.call(print, "lhs"),
      " ",
      node.oper,
      " ",
      path.call(print, "rhs")
    ]));
  }

  function printCompound() {
    const docs = ["{"];

    if (node.items) {
      docs.push(indent(concat([
        hardline,
        join(hardline, path.map(print, "items"))
      ])));
    }

    docs.push(hardline, "}");
    return group(concat(docs));
  }

  function printDeclaration() {
    const docs = [path.call(print, "declSpecs")];

    if (node.initDecls) {
      docs.push(" ", join(", ", path.map(print, "initDecls")));
    }

    docs.push(";");
    return group(concat(docs));
  }

  function printDeclarationSpecifiers() {
    return join(" ", path.map(print, "specs"));
  }

  function printExpressions() {
    return group(join(", ", path.map(print, "exprs")));
  }

  function printFunc() {
    const docs = [path.call(print, "declSpecs"), " ", path.call(print, "name")];

    if (node.initDecls) {
      docs.push("(", join(", ", path.map(print, "initDecls")), ") ");
    } else {
      docs.push("() ");
    }

    docs.push(path.call(print, "body"));
    return group(concat(docs));
  }

  function printInitDeclarator() {
    const docs = [path.call(print, "decl")];

    if (node.init) {
      docs.push(" = ", path.call(print, "init"));
    }

    return group(concat(docs));
  }

  function printRoot() {
    return concat([join(hardline, path.map(print, "declarations")), hardline]);
  }

  function printSpecifierQualifiers() {
    return join(" ", path.map(print, "value"));
  }

  function printStatement() {
    return concat([path.call(print, "expr"), ";"]);
  }

  function printTernary() {
    return group(concat([
      path.call(print, "pred"),
      " ? ",
      path.call(print, "truthy"),
      " : ",
      path.call(print, "falsy")
    ]));
  }

  function printUnary() {
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

  function printWhile() {
    const docs = ["while(", path.call(print, "pred"), ")"];

    if (node.stmt) {
      docs.push(" ", path.call(print, "stmt"));
    } else {
      docs.push(";");
    }

    return group(concat(docs));
  }
}

module.exports = {
  print: genericPrint
};
