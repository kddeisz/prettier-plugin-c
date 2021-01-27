// Based on https://www.lysator.liu.se/c/ANSI-C-grammar-l.html

const { createToken, CstParser, Lexer } = require("chevrotain");

const D = "[0-9]";
const L = "[a-zA-Z_]";
const H = "[a-fA-F0-9]";
const E = `[Ee][+-]?${D}+`;
const FS = "(f|F|l|L)";
const IS = "(u|U|l|L)*";

const tokens = [];

const makeToken = (options) => {
  tokens[options.name] = createToken(options);
};

makeToken({
  name: "WHITESPACE",
  pattern: /\s+/,
  group: Lexer.SKIPPED
});

makeToken({
  name: "LINE_COMMENT",
  pattern: /\/\/[^\n\r]*/,
  group: "comments"
});

makeToken({
  name: "BLOCK_COMMENT",
  pattern: /\/\*([^*]|\*(?!\/))*\*\//,
  group: "comments",
  line_breaks: true
});

const keywords = [
  "auto",
  "break",
  "case",
  "char",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "float",
  "for",
  "goto",
  "if",
  "int",
  "long",
  "register",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "typedef",
  "union",
  "unsigned",
  "void",
  "volatile",
  "while"
];

keywords.forEach((pattern) => {
  makeToken({ name: pattern.toUpperCase(), pattern });
});

makeToken({
  name: "IDENTIFIER",
  pattern: new RegExp(`${L}(${L}|${D})*`)
});

const constants = [
  `0[xX]${H}+${IS}?`,
  `0${D}+${IS}?`,
  `${D}+${IS}?`,
  `${L}?'(\\.|[^\\'])+`,
  `${D}+${E}${FS}?`,
  `${D}*\\.${D}+(${E})?${FS}?`,
  `${D}+\\.${D}*(${E})?${FS}?`
];

makeToken({
  name: "CONSTANT",
  pattern: new RegExp(constants.join("|"))
});

makeToken({
  name: "STRING_LITERAL",
  pattern: new RegExp(`${L}?"(\\.|[^\\"])*"`)
});

const operators = {
  "ELLIPSIS": "...",
  "RIGHT_ASSIGN": ">>=",
  "LEFT_ASSIGN": "<<=",
  "ADD_ASSIGN": "+=",
  "SUB_ASSIGN": "-=",
  "MUL_ASSIGN": "*=",
  "DIV_ASSIGN": "/=",
  "MOD_ASSIGN": "%=",
  "AND_ASSIGN": "&=",
  "XOR_ASSIGN": "^=",
  "OR_ASSIGN": "|=",
  "RIGHT_OP": ">>",
  "LEFT_OP": "<<",
  "INC_OP": "++",
  "DEC_OP": "--",
  "PTR_OP": "->",
  "AND_OP": "&&",
  "OR_OP": "||",
  "LE_OP": "<=",
  "GE_OP": ">=",
  "EQ_OP": "==",
  "NE_OP": "!=",
  ";": ";",
  "{": /{|<%/,
  "}": /}|%>/,
  ",": ",",
  ":": ":",
  "=": "=",
  "(": "(",
  ")": ")",
  "[": /\[|<:/,
  "]": /\]|:>/,
  ".": ".",
  "&": "&",
  "!": "!",
  "~": "~",
  "-": "-",
  "+": "+",
  "*": "*",
  "/": "/",
  "%": "%",
  "<": "<",
  ">": ">",
  "^": "^",
  "|": "|",
  "?": "?"
};

Object.keys(operators).forEach((name) => {
  makeToken({ name, pattern: operators[name] });
});

class CParser extends CstParser {
  constructor() {
    super(Object.values(tokens));

    const $ = this

    $.RULE("primaryExpression", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        { ALT: () => $.CONSUME(tokens.CONSTANT) },
        { ALT: () => $.CONSUME(tokens.STRING_LITERAL) },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
          }
        }
      ])
    });

    $.RULE("postfixExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.primaryExpression) },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens["["]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens["("]);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.argumentExpressionList);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens["."]);
            $.CONSUME(tokens.IDENTIFIER);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens.PTR_OP);
            $.CONSUME(tokens.IDENTIFIER);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens.INC_OP);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.postfixExpression);
            $.CONSUME(tokens.DEC_OP);
          }
        }
      ]);
    });

    $.RULE("argumentExpressionList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.assignmentExpression) },
        {
          ALT: () => {
            $.SUBRULE($.argumentExpressionList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.assignmentExpression);
          }
        }
      ]);
    });

    $.RULE("unaryExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.postfixExpression) },
        {
          ALT: () => {
            $.CONSUME(tokens.INC_OP);
            $.SUBRULE($.unaryExpression);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.DEC_OP);
            $.SUBRULE($.unaryExpression);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.unaryOperator);
            $.SUBRULE($.castExpression);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.SIZEOF);
            $.SUBRULE($.unaryExpression);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.SIZEOF);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.typeName);
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
    });

    $.RULE("unaryOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens["&"]) },
        { ALT: () => $.CONSUME(tokens["*"]) },
        { ALT: () => $.CONSUME(tokens["+"]) },
        { ALT: () => $.CONSUME(tokens["-"]) },
        { ALT: () => $.CONSUME(tokens["~"]) },
        { ALT: () => $.CONSUME(tokens["!"]) }
      ]);
    });

    $.RULE("castExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.unaryExpression) },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.typeName);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.castExpression);
          }
        }
      ]);
    });

    $.RULE("multiplicativeExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.castExpression) },
        {
          ALT: () => {
            $.SUBRULE($.multiplicativeExpression);
            $.OR([
              { ALT: () => $.CONSUME(tokens["*"]) },
              { ALT: () => $.CONSUME(tokens["/"]) },
              { ALT: () => $.CONSUME(tokens["%"]) }
            ]);
            $.SUBRULE($.castExpression);
          }
        }
      ]);
    });

    $.RULE("additiveExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.multiplicativeExpression) },
        {
          ALT: () => {
            $.SUBRULE($.additiveExpression);
            $.OR([
              { ALT: () => $.CONSUME(tokens["+"]) },
              { ALT: () => $.CONSUME(tokens["-"]) }
            ]);
            $.SUBRULE($.multiplicativeExpression);
          }
        }
      ]);
    });

    $.RULE("shiftExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.additiveExpression) },
        {
          ALT: () => {
            $.SUBRULE($.shiftExpression);
            $.OR([
              { ALT: () => $.CONSUME(tokens.LEFT_OP) },
              { ALT: () => $.CONSUME(tokens.RIGHT_OP) }
            ]);
            $.SUBRULE($.additiveExpression);
          }
        }
      ]);
    });

    $.RULE("relationalExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.shiftExpression) },
        {
          ALT: () => {
            $.SUBRULE($.relationalExpression);
            $.OR([
              { ALT: () => $.CONSUME(tokens["<"]) },
              { ALT: () => $.CONSUME(tokens[">"]) },
              { ALT: () => $.CONSUME(tokens.LE_OP) },
              { ALT: () => $.CONSUME(tokens.GE_OP) }
            ]);
            $.SUBRULE($.shiftExpression);
          }
        }
      ]);
    });

    $.RULE("equalityExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.relationalExpression) },
        {
          ALT: () => {
            $.SUBRULE($.equalityExpression);
            $.OR([
              { ALT: () => $.CONSUME(tokens.EQ_OP) },
              { ALT: () => $.CONSUME(tokens.NE_OP) }
            ]);
            $.SUBRULE($.relationalExpression);
          }
        }
      ]);
    });

    $.RULE("andExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.equalityExpression) },
        {
          ALT: () => {
            $.SUBRULE($.andExpression);
            $.CONSUME(tokens["&"]);
            $.SUBRULE($.equalityExpression);
          }
        }
      ]);
    });

    $.RULE("exclusiveOrExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.andExpression) },
        {
          ALT: () => {
            $.SUBRULE($.exclusiveOrExpression);
            $.CONSUME(tokens["^"]);
            $.SUBRULE($.andExpression);
          }
        }
      ]);
    });

    $.RULE("inclusiveOrExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.exclusiveOrExpression) },
        {
          ALT: () => {
            $.SUBRULE($.inclusiveOrExpression);
            $.CONSUME(tokens["|"]);
            $.SUBRULE($.exclusiveOrExpression);
          }
        }
      ]);
    });

    $.RULE("logicalAndExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.inclusiveOrExpression) },
        {
          ALT: () => {
            $.SUBRULE($.logicalAndExpression);
            $.CONSUME(tokens.AND_OP);
            $.SUBRULE($.inclusiveOrExpression);
          }
        }
      ]);
    });

    $.RULE("logicalOrExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.logicalAndExpression) },
        {
          ALT: () => {
            $.SUBRULE($.logicalOrExpression);
            $.CONSUME(tokens.OR_OP);
            $.SUBRULE($.logicalAndExpression);
          }
        }
      ]);
    });

    $.RULE("conditionalExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.logicalOrExpression) },
        {
          ALT: () => {
            $.SUBRULE($.logicalOrExpression);
            $.CONSUME(tokens["?"]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.conditionalExpression);
          }
        }
      ]);
    });

    $.RULE("assignmentExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.conditionalExpression) },
        {
          ALT: () => {
            $.SUBRULE($.unaryExpression);
            $.SUBRULE($.assignmentOperator);
            $.SUBRULE($.assignmentExpression);
          }
        }
      ]);
    });

    $.RULE("assignmentOperator", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens["="]) },
        { ALT: () => $.CONSUME(tokens.MUL_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.DIV_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.MOD_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.ADD_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.SUB_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.LEFT_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.RIGHT_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.AND_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.XOR_ASSIGN) },
        { ALT: () => $.CONSUME(tokens.OR_ASSIGN) }
      ]);
    });

    $.RULE("expression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.assignmentExpression) },
        {
          ALT: () => {
            $.SUBRULE($.expression);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.assignmentExpression);
          }
        }
      ]);
    });

    $.RULE("constantExpression", () => $.SUBRULE($.conditionalExpression));

    $.RULE("declaration", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.SUBRULE($.initDeclaratorList);
            $.CONSUME(tokens[";"]);
          }
        }
      ]);
    });

    $.RULE("declarationSpecifiers", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.storageClassSpecifier) },
        {
          ALT: () => {
            $.SUBRULE($.storageClassSpecifier);
            $.SUBRULE($.declarationSpecifiers);
          }
        },
        { ALT: () => $.SUBRULE($.typeSpecifier) },
        {
          ALT: () => {
            $.SUBRULE($.typeSpecifier);
            $.SUBRULE($.declarationSpecifiers);
          }
        },
        { ALT: () => $.SUBRULE($.typeQualifier) },
        {
          ALT: () => {
            $.SUBRULE($.typeQualifier);
            $.SUBRULE($.declarationSpecifiers);
          }
        },
      ]);
    });

    $.RULE("initDeclaratorList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.initDeclarator) },
        {
          ALT: () => {
            $.SUBRULE($.initDeclaratorList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.initDeclarator);
          }
        }
      ]);
    });

    $.RULE("initDeclarator", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.declarator) },
        {
          ALT: () => {
            $.SUBRULE($.declarator);
            $.CONSUME(tokens["="]);
            $.SUBRULE($.initializer);
          }
        }
      ]);
    });

    $.RULE("storageClassSpecifier", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.TYPEDEF) },
        { ALT: () => $.CONSUME(tokens.EXTERN) },
        { ALT: () => $.CONSUME(tokens.STATIC) },
        { ALT: () => $.CONSUME(tokens.AUTO) },
        { ALT: () => $.CONSUME(tokens.REGISTER) }
      ]);
    });

    $.RULE("typeSpecifier", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.VOID) },
        { ALT: () => $.CONSUME(tokens.CHAR) },
        { ALT: () => $.CONSUME(tokens.SHORT) },
        { ALT: () => $.CONSUME(tokens.INT) },
        { ALT: () => $.CONSUME(tokens.LONG) },
        { ALT: () => $.CONSUME(tokens.FLOAT) },
        { ALT: () => $.CONSUME(tokens.DOUBLE) },
        { ALT: () => $.CONSUME(tokens.SIGNED) },
        { ALT: () => $.CONSUME(tokens.UNSIGNED) },
        { ALT: () => $.SUBRULE($.structOrUnionSpecifier) },
        { ALT: () => $.SUBRULE($.enumSpecifier) },
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) } // $.CONSUME(tokens.TYPE_NAME) }
      ]);
    });

    $.RULE("structOrUnionSpecifier", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.structOrUnion);
            $.CONSUME(tokens.IDENTIFIER);
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.structDeclarationList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.structOrUnion);
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.structDeclarationList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.structOrUnion);
            $.CONSUME(tokens.IDENTIFIER);
          }
        }
      ]);
    });

    $.RULE("structOrUnion", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.STRUCT) },
        { ALT: () => $.CONSUME(tokens.UNION) }
      ]);
    });

    $.RULE("structDeclarationList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.structDeclaration) },
        {
          ALT: () => {
            $.SUBRULE($.structDeclarationList);
            $.SUBRULE($.structDeclaration);
          }
        }
      ]);
    });

    $.RULE("structDeclaration", () => {
      $.SUBRULE($.specifierQualifierList);
      $.SUBRULE($.structDeclarationList);
      $.CONSUME(tokens[";"]);
    });

    $.RULE("specifierQualifierList", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.typeSpecifier);
            $.SUBRULE($.specifierQualifierList);
          }
        },
        { ALT: () => $.SUBRULE($.typeSpecifier) },
        {
          ALT: () => {
            $.SUBRULE($.typeQualifier);
            $.SUBRULE($.specifierQualifierList);
          }
        },
        { ALT: () => $.SUBRULE($.typeQualifier) }
      ]);
    });

    $.RULE("structDeclaratorList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.structDeclarator) },
        {
          ALT: () => {
            $.SUBRULE($.structDeclaratorList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.structDeclarator);
          }
        }
      ]);
    });

    $.RULE("structDeclarator", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.declarator) },
        {
          ALT: () => {
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.constantExpression);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarator);
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.constantExpression);
          }
        }
      ]);
    });

    $.RULE("enumSpecifier", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.ENUM);
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.enumeratorList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.ENUM);
            $.CONSUME(tokens.IDENTIFIER);
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.enumeratorList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.ENUM);
            $.CONSUME(tokens.IDENTIFIER);
          }
        }
      ]);
    });

    $.RULE("enumeratorList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.enumerator) },
        {
          ALT: () => {
            $.SUBRULE($.enumeratorList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.enumerator);
          }
        }
      ]);
    });

    $.RULE("enumerator", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        {
          ALT: () => {
            $.CONSUME(tokens.IDENTIFIER);
            $.CONSUME(tokens["="]);
            $.SUBRULE($.constantExpression);
          }
        }
      ]);
    });

    $.RULE("typeQualifier", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.CONST) },
        { ALT: () => $.CONSUME(tokens.VOLATILE) }
      ]);
    });

    $.RULE("declarator", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.pointer);
            $.SUBRULE($.directDeclarator);
          }
        },
        { ALT: () => $.SUBRULE($.directDeclarator) }
      ]);
    });

    $.RULE("directDeclarator", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.declarator);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directDeclarator);
            $.CONSUME(tokens["["]);
            $.SUBRULE($.constantExpression);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directDeclarator);
            $.CONSUME(tokens["["]);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directDeclarator);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.parameterTypeList);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directDeclarator);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.identifierList);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directDeclarator);
            $.CONSUME(tokens["("]);
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
    });

    $.RULE("pointer", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens["*"]) },
        {
          ALT: () => {
            $.CONSUME(tokens["*"]);
            $.SUBRULE($.typeQualifierList);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["*"]);
            $.SUBRULE($.pointer);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["*"]);
            $.SUBRULE($.typeQualifierList);
            $.SUBRULE($.pointer);
          }
        }
      ]);
    });

    $.RULE("typeQualifierList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.typeQualifier) },
        {
          ALT: () => {
            $.SUBRULE($.typeQualifierList);
            $.SUBRULE($.typeQualifier);
          }
        }
      ]);
    });

    $.RULE("parameterTypeList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.parameterList) },
        {
          ALT: () => {
            $.SUBRULE($.parameterList);
            $.CONSUME(tokens[","]);
            $.CONSUME(tokens.ELLIPSIS);
          }
        }
      ]);
    });

    $.RULE("parameterList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.parameterDeclaration) },
        {
          ALT: () => {
            $.SUBRULE($.parameterList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.parameterDeclaration);
          }
        }
      ]);
    });

    $.RULE("parameterDeclaration", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.SUBRULE($.declarator);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.SUBRULE($.abstractDeclarator);
          }
        },
        { ALT: () => $.SUBRULE($.declarationSpecifiers) }
      ]);
    });

    $.RULE("identifierList", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        {
          ALT: () => {
            $.SUBRULE($.identifierList);
            $.CONSUME(tokens[","]);
            $.CONSUME(tokens.IDENTIFIER);
          }
        }
      ]);
    });

    $.RULE("typeName", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.specifierQualifierList) },
        {
          ALT: () => {
            $.SUBRULE($.specifierQualifierList);
            $.SUBRULE($.abstractDeclarator);
          }
        }
      ]);
    });

    $.RULE("abstractDeclarator", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.pointer) },
        { ALT: () => $.SUBRULE($.directAbstractDeclarator) },
        {
          ALT: () => {
            $.SUBRULE($.pointer);
            $.SUBRULE($.directAbstractDeclarator);
          }
        }
      ]);
    });

    $.RULE("directAbstractDeclarator", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.abstractDeclarator);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["["]);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["["]);
            $.SUBRULE($.constantExpression);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directAbstractDeclarator);
            $.CONSUME(tokens["["]);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directAbstractDeclarator);
            $.CONSUME(tokens["["]);
            $.SUBRULE($.constantExpression);
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.parameterTypeList);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directAbstractDeclarator);
            $.CONSUME(tokens["("]);
            $.CONSUME(tokens[")"]);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.directAbstractDeclarator);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.parameterTypeList);
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
    });

    $.RULE("initializer", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.assignmentExpression) },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.initializerList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.initializerList);
            $.CONSUME(tokens[","]);
            $.CONSUME(tokens["}"]);
          }
        }
      ]);
    });

    $.RULE("initializerList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.initializer) },
        {
          ALT: () => {
            $.SUBRULE($.initializerList);
            $.CONSUME(tokens[","]);
            $.SUBRULE($.initializer);
          }
        }
      ]);
    });

    $.RULE("statement", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.labeledStatement) },
        { ALT: () => $.SUBRULE($.compoundStatement) },
        { ALT: () => $.SUBRULE($.expressionStatement) },
        { ALT: () => $.SUBRULE($.selectionStatement) },
        { ALT: () => $.SUBRULE($.iterationStatement) },
        { ALT: () => $.SUBRULE($.jumpStatement) },
      ]);
    });

    $.RULE("labeledStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.IDENTIFIER);
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.CASE);
            $.SUBRULE($.constantExpression);
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.DEFAULT);
            $.CONSUME(tokens[":"]);
            $.SUBRULE($.statement);
          }
        }
      ]);
    });

    $.RULE("compoundStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.statementList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.declarationList);
            $.CONSUME(tokens["}"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.declarationList);
            $.SUBRULE($.statementList);
            $.CONSUME(tokens["}"]);
          }
        }
      ]);
    });

    $.RULE("declarationList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.declaration) },
        {
          ALT: () => {
            $.SUBRULE($.declarationList);
            $.SUBRULE($.declaration);
          }
        }
      ]);
    });

    $.RULE("statementList", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.statement) },
        {
          ALT: () => {
            $.SUBRULE($.statementList);
            $.SUBRULE($.statement);
          }
        }
      ]);
    });

    $.RULE("expressionStatement", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens[";"]) },
        {
          ALT: () => {
            $.SUBRULE($.expression);
            $.CONSUME(tokens[";"]);
          }
        }
      ]);
    });

    $.RULE("selectionStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.IF);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.IF);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
            $.CONSUME(tokens.ELSE);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.SWITCH);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
          }
        }
      ]);
    });

    $.RULE("iterationStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.WHILE);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.DO);
            $.SUBRULE($.statement);
            $.CONSUME(tokens.WHILE);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.FOR);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expressionStatement);
            $.SUBRULE($.expressionStatement);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.FOR);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.expressionStatement);
            $.SUBRULE($.expressionStatement);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[")"]);
            $.SUBRULE($.statement);
          }
        }
      ]);
    });

    $.RULE("jumpStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.GOTO);
            $.CONSUME(tokens.IDENTIFIER);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.CONTINUE);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.BREAK);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.RETURN);
            $.CONSUME(tokens[";"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens.RETURN);
            $.SUBRULE($.expression);
            $.CONSUME(tokens[";"]);
          }
        }
      ]);
    });

    $.RULE("translationUnit", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.externalDeclaration) },
        {
          ALT: () => {
            $.SUBRULE($.translationUnit);
            $.SUBRULE($.externalDeclaration);
          }
        }
      ]);
    });

    $.RULE("externalDeclaration", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.functionDefinition) },
        { ALT: () => $.SUBRULE($.declaration) }
      ]);
    });

    $.RULE("functionDefinition", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.SUBRULE($.declarator);
            $.SUBRULE($.declarationList);
            $.SUBRULE($.compoundStatement);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarationSpecifiers);
            $.SUBRULE($.declarator);
            $.SUBRULE($.compoundStatement);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarator);
            $.SUBRULE($.declarationList);
            $.SUBRULE($.compoundStatement);
          }
        },
        {
          ALT: () => {
            $.SUBRULE($.declarator);
            $.SUBRULE($.compoundStatement);
          }
        }
      ]);
    });

    this.performSelfAnalysis();
  }
}

module.exports = CParser;
