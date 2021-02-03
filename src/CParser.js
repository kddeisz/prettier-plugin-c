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
  const token = createToken(options);
  tokens[options.name] = token;
  return token;
};

const storageClassSpecifier = makeToken({ name: "storageClassSpecifier", pattern: Lexer.NA });
const structOrUnion = makeToken({ name: "structOrUnion", pattern: Lexer.NA });
const typeQualifier = makeToken({ name: "typeQualifier", pattern: Lexer.NA });

const assignmentOperator = makeToken({ name: "assignmentOperator", pattern: Lexer.NA });
const multiplicativeOperator = makeToken({ name: "multiplicativeOperator", pattern: Lexer.NA });
const additiveOperator = makeToken({ name: "additiveOperator", pattern: Lexer.NA });
const shiftOperator = makeToken({ name: "shiftOperator", pattern: Lexer.NA });
const relationalOperator = makeToken({ name: "relationalOperator", pattern: Lexer.NA });
const equalityOperator = makeToken({ name: "equalityOperator", pattern: Lexer.NA });
const unaryOperator = makeToken({ name: "unaryOperator", pattern: Lexer.NA });
const unaryCountOperator = makeToken({ name: "unaryCountOperator", pattern: Lexer.NA });

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

makeToken({ name: "AUTO", pattern: "auto", categories: storageClassSpecifier });
makeToken({ name: "EXTERN", pattern: "extern", categories: storageClassSpecifier });
makeToken({ name: "REGISTER", pattern: "register", categories: storageClassSpecifier });
makeToken({ name: "STATIC", pattern: "static", categories: storageClassSpecifier });
makeToken({ name: "TYPEDEF", pattern: "typedef", categories: storageClassSpecifier });

makeToken({ name: "STRUCT", pattern: "struct", categories: structOrUnion });
makeToken({ name: "UNION", pattern: "union", categories: structOrUnion });

makeToken({ name: "CONST", pattern: "const", categories: typeQualifier });
makeToken({ name: "VOLATILE", pattern: "volatile", categories: typeQualifier });

const keywords = [
  "break",
  "case",
  "char",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "float",
  "for",
  "goto",
  "if",
  "int",
  "long",
  "return",
  "short",
  "signed",
  "sizeof",
  "switch",
  "unsigned",
  "void",
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

makeToken({ name: "...", pattern: "..." });

makeToken({ name: "<<=", pattern: "<<=", categories: assignmentOperator });
makeToken({ name: ">>=", pattern: ">>=", categories: assignmentOperator });
makeToken({ name: "+=", pattern: "+=", categories: assignmentOperator });
makeToken({ name: "-=", pattern: "-=", categories: assignmentOperator });
makeToken({ name: "*=", pattern: "*=", categories: assignmentOperator });
makeToken({ name: "/=", pattern: "/=", categories: assignmentOperator });
makeToken({ name: "%=", pattern: "%=", categories: assignmentOperator });
makeToken({ name: "&=", pattern: "&=", categories: assignmentOperator });
makeToken({ name: "|=", pattern: "|=", categories: assignmentOperator });
makeToken({ name: "^=", pattern: "^=", categories: assignmentOperator });

makeToken({ name: "++", pattern: "++", categories: unaryCountOperator });
makeToken({ name: "--", pattern: "--", categories: unaryCountOperator });

makeToken({ name: "PTR_OP", pattern: "->" });
makeToken({ name: "AND_OP", pattern: "&&" });
makeToken({ name: "OR_OP", pattern: "||" });

makeToken({ name: "<=", pattern: "<=", categories: relationalOperator });
makeToken({ name: ">=", pattern: ">=", categories: relationalOperator });

makeToken({ name: "==", pattern: "==", categories: equalityOperator });
makeToken({ name: "!=", pattern: "!=", categories: equalityOperator });

makeToken({ name: "*", pattern: "*", categories: [multiplicativeOperator, unaryOperator] });
makeToken({ name: "/", pattern: "/", categories: multiplicativeOperator });
makeToken({ name: "%", pattern: "%", categories: multiplicativeOperator });

makeToken({ name: "+", pattern: "+", categories: [additiveOperator, unaryOperator] });
makeToken({ name: "-", pattern: "-", categories: [additiveOperator, unaryOperator] });

makeToken({ name: "<<", pattern: "<<", categories: shiftOperator });
makeToken({ name: ">>", pattern: ">>", categories: shiftOperator });

makeToken({ name: "<", pattern: "<", categories: relationalOperator });
makeToken({ name: ">", pattern: ">", categories: relationalOperator });

makeToken({ name: "&", pattern: "&", categories: unaryOperator });
makeToken({ name: "~", pattern: "~", categories: unaryOperator });
makeToken({ name: "!", pattern: "!", categories: unaryOperator });

makeToken({ name: "=", pattern: "=", categories: assignmentOperator });

const operators = {
  ";": ";",
  "{": /{|<%/,
  "}": /}|%>/,
  ",": ",",
  ":": ":",
  "(": "(",
  ")": ")",
  "[": /\[|<:/,
  "]": /\]|:>/,
  ".": ".",
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
    const $ = this;

    // primary_expression
    //   : IDENTIFIER
    //   | CONSTANT
    //   | STRING_LITERAL
    //   | '(' expression ')'
    //   ;
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

    $.RULE("functionCallPostfixExpression", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens["."]) },
        { ALT: () => $.CONSUME(tokens.PTR_OP) }
      ]);
      $.CONSUME(tokens.IDENTIFIER);
    });

    // postfix_expression
    //   : primary_expression
    //   | postfix_expression '[' expression ']'
    //   | postfix_expression '(' ')'
    //   | postfix_expression '(' argument_expression_list ')'
    //   | postfix_expression '.' IDENTIFIER
    //   | postfix_expression PTR_OP IDENTIFIER
    //   | postfix_expression INC_OP
    //   | postfix_expression DEC_OP
    //   ;
    $.RULE("postfixExpression", () => {
      $.SUBRULE($.primaryExpression);
      $.MANY(() => {
        $.OR([
          {
            ALT: () => {
              $.CONSUME(tokens["["]);
              $.SUBRULE($.expression);
              $.CONSUME(tokens["]"]);
            }
          },
          {
            ALT: () => {
              $.CONSUME(tokens["("]);
              $.OPTION(() => $.SUBRULE($.argumentExpressionList));
              $.CONSUME(tokens[")"]);
            }
          },
          { ALT: () => $.SUBRULE($.functionCallPostfixExpression) },
          { ALT: () => $.CONSUME(unaryCountOperator) }
        ]);
      });
    });

    // argument_expression_list
    //   : assignment_expression
    //   | argument_expression_list ',' assignment_expression
    //   ;
    $.RULE("argumentExpressionList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.assignmentExpression)
      });
    });

    // unary_expression
    //   : postfix_expression
    //   | INC_OP unary_expression
    //   | DEC_OP unary_expression
    //   | unary_operator cast_expression
    //   | SIZEOF unary_expression
    //   | SIZEOF '(' type_name ')'
    //   ;
    $.RULE("unaryExpression", () => {
      $.MANY(() => {
        $.OR1([
          { ALT: () => $.CONSUME(unaryCountOperator) },
          { ALT: () => $.CONSUME1(tokens.SIZEOF) }
        ]);
      });

      $.OR2([
        { ALT: () => $.SUBRULE($.postfixExpression) },
        {
          ALT: () => {
            $.CONSUME(unaryOperator);
            $.SUBRULE($.castExpression);
          }
        },
        {
          ALT: () => {
            $.CONSUME2(tokens.SIZEOF);
            $.CONSUME(tokens["("]);
            $.SUBRULE($.typeName);
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
    });

    // cast_expression
    //   : unary_expression
    //   | '(' type_name ')' cast_expression
    //   ;
    $.RULE("castExpression", () => {
      $.MANY(() => {
        $.CONSUME(tokens["("]);
        $.SUBRULE($.typeName);
        $.CONSUME(tokens[")"]);
      });
      $.SUBRULE($.unaryExpression);
    });

    // multiplicative_expression
    //   : cast_expression
    //   | multiplicative_expression '*' cast_expression
    //   | multiplicative_expression '/' cast_expression
    //   | multiplicative_expression '%' cast_expression
    //   ;
    $.RULE("multiplicativeExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: multiplicativeOperator,
        DEF: () => $.SUBRULE($.castExpression)
      });
    });

    // additive_expression
    //   : multiplicative_expression
    //   | additive_expression '+' multiplicative_expression
    //   | additive_expression '-' multiplicative_expression
    //   ;
    $.RULE("additiveExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: additiveOperator,
        DEF: () => $.SUBRULE($.multiplicativeExpression)
      });
    });

    // shift_expression
    //   : additive_expression
    //   | shift_expression LEFT_OP additive_expression
    //   | shift_expression RIGHT_OP additive_expression
    //   ;
    $.RULE("shiftExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: shiftOperator,
        DEF: () => $.SUBRULE($.additiveExpression)
      });
    });

    // relational_expression
    //   : shift_expression
    //   | relational_expression '<' shift_expression
    //   | relational_expression '>' shift_expression
    //   | relational_expression LE_OP shift_expression
    //   | relational_expression GE_OP shift_expression
    //   ;
    $.RULE("relationalExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: relationalOperator,
        DEF: () => $.SUBRULE($.shiftExpression)
      });
    });

    // equality_expression
    //   : relational_expression
    //   | equality_expression EQ_OP relational_expression
    //   | equality_expression NE_OP relational_expression
    //   ;
    $.RULE("equalityExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: equalityOperator,
        DEF: () => $.SUBRULE($.relationalExpression)
      });
    });

    // and_expression
    //   : equality_expression
    //   | and_expression '&' equality_expression
    //   ;
    $.RULE("andExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens["&"],
        DEF: () => $.SUBRULE($.equalityExpression)
      });
    });

    // exclusive_or_expression
    //   : and_expression
    //   | exclusive_or_expression '^' and_expression
    //   ;
    $.RULE("exclusiveOrExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens["^"],
        DEF: () => $.SUBRULE($.andExpression)
      });
    });

    // inclusive_or_expression
    //   : exclusive_or_expression
    //   | inclusive_or_expression '|' exclusive_or_expression
    //   ;
    $.RULE("inclusiveOrExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens["|"],
        DEF: () => $.SUBRULE($.exclusiveOrExpression)
      });
    });

    // logical_and_expression
    //   : inclusive_or_expression
    //   | logical_and_expression AND_OP inclusive_or_expression
    //   ;
    $.RULE("logicalAndExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens.AND_OP,
        DEF: () => $.SUBRULE($.inclusiveOrExpression)
      });
    });

    // logical_or_expression
    //   : logical_and_expression
    //   | logical_or_expression OR_OP logical_and_expression
    //   ;
    $.RULE("logicalOrExpression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens.OR_OP,
        DEF: () => $.SUBRULE($.logicalAndExpression)
      });
    });

    // conditional_expression
    //   : logical_or_expression
    //   | logical_or_expression '?' expression ':' conditional_expression
    //   ;
    $.RULE("conditionalExpression", () => {
      $.SUBRULE($.logicalOrExpression);
      $.OPTION(() => {
        $.CONSUME(tokens["?"]);
        $.SUBRULE($.expression);
        $.CONSUME(tokens[":"]);
        $.SUBRULE($.conditionalExpression);
      });
    });

    // assignment_expression
    //   : conditional_expression
    //   | unary_expression assignment_operator assignment_expression
    //   ;
    $.RULE("assignmentExpression", () => {
      $.MANY(() => {
        $.SUBRULE($.unaryExpression);
        $.CONSUME(assignmentOperator);
      });

      $.SUBRULE($.conditionalExpression);
    });

    // expression
    //   : assignment_expression
    //   | expression ',' assignment_expression
    //   ;
    $.RULE("expression", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.assignmentExpression)
      });
    });

    // constant_expression
    //   : conditional_expression
    //   ;
    $.RULE("constantExpression", () => $.SUBRULE($.conditionalExpression));

    // declaration
    //   : declaration_specifiers ';'
    //   | declaration_specifiers init_declarator_list ';'
    //   ;
    $.RULE("declaration", () => {
      $.SUBRULE($.declarationSpecifiers);
      $.OPTION(() => $.SUBRULE($.initDeclaratorList));
      $.CONSUME(tokens[";"]);
    });

    // declaration_specifiers
    //   : storage_class_specifier
    //   | storage_class_specifier declaration_specifiers
    //   | type_specifier
    //   | type_specifier declaration_specifiers
    //   | type_qualifier
    //   | type_qualifier declaration_specifiers
    //   ;
    $.RULE("declarationSpecifiers", () => {
      $.AT_LEAST_ONE(() => {
        $.OR([
          { ALT: () => $.CONSUME(storageClassSpecifier) },
          { ALT: () => $.SUBRULE($.typeSpecifier) },
          { ALT: () => $.CONSUME(typeQualifier) }
        ]);
      });
    });

    // init_declarator_list
    //   : init_declarator
    //   | init_declarator_list ',' init_declarator
    //   ;
    $.RULE("initDeclaratorList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.initDeclarator)
      });
    });

    // init_declarator
    //   : declarator
    //   | declarator '=' initializer
    //   ;
    $.RULE("initDeclarator", () => {
      $.SUBRULE($.declarator);
      $.OPTION(() => {
        $.CONSUME(tokens["="]);
        $.SUBRULE($.initializer);
      });
    });

    // type_specifier
    //   : VOID
    //   | CHAR
    //   | SHORT
    //   | INT
    //   | LONG
    //   | FLOAT
    //   | DOUBLE
    //   | SIGNED
    //   | UNSIGNED
    //   | struct_or_union_specifier
    //   | enum_specifier
    //   | TYPE_NAME
    //   ;
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

    // struct_or_union_specifier
    //   : struct_or_union IDENTIFIER '{' struct_declaration_list '}'
    //   | struct_or_union '{' struct_declaration_list '}'
    //   | struct_or_union IDENTIFIER
    //   ;
    $.RULE("structOrUnionSpecifier", () => {
      $.CONSUME(structOrUnion);
      $.OR([
        {
          ALT: () => {
            $.OPTION(() => $.CONSUME1(tokens.IDENTIFIER));
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.structDeclarationList);
            $.CONSUME(tokens["}"]);
          }
        },
        { ALT: () => $.CONSUME2(tokens.IDENTIFIER) }
      ]);
    });

    // struct_declaration_list
    //   : struct_declaration
    //   | struct_declaration_list struct_declaration
    //   ;
    $.RULE("structDeclarationList", () => {
      $.AT_LEAST_ONE(() => $.SUBRULE($.structDeclaration));
    });

    // struct_declaration
    //   : specifier_qualifier_list struct_declarator_list ';'
    //   ;
    $.RULE("structDeclaration", () => {
      $.SUBRULE($.specifierQualifierList);
      $.SUBRULE($.structDeclarationList);
      $.CONSUME(tokens[";"]);
    });

    // specifier_qualifier_list
    //   : type_specifier specifier_qualifier_list
    //   | type_specifier
    //   | type_qualifier specifier_qualifier_list
    //   | type_qualifier
    //   ;
    $.RULE("specifierQualifierList", () => {
      $.AT_LEAST_ONE(() => {
        $.OR([
          { ALT: () => $.SUBRULE($.typeSpecifier) },
          { ALT: () => $.CONSUME(typeQualifier) }
        ]);
      });
    });

    // struct_declarator_list
    //   : struct_declarator
    //   | struct_declarator_list ',' struct_declarator
    //   ;
    $.RULE("structDeclaratorList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.structDeclarator)
      });
    });

    $.RULE("structDeclaratorSuffix", () => {
      $.CONSUME(tokens[":"]);
      $.SUBRULE($.constantExpression);
    });

    // struct_declarator
    //   : declarator
    //   | ':' constant_expression
    //   | declarator ':' constant_expression
    //   ;
    $.RULE("structDeclarator", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.declarator);
            $.OPTION(() => $.SUBRULE2($.structDeclaratorSuffix));
          }
        },
        { ALT: () => $.SUBRULE1($.structDeclaratorSuffix) }
      ]);
    });

    // enum_specifier
    //   : ENUM '{' enumerator_list '}'
    //   | ENUM IDENTIFIER '{' enumerator_list '}'
    //   | ENUM IDENTIFIER
    //   ;
    $.RULE("enumSpecifier", () => {
      $.CONSUME(tokens.ENUM);
      $.OR([
        {
          ALT: () => {
            $.OPTION(() => $.CONSUME1(tokens.IDENTIFIER));
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.enumeratorList);
            $.CONSUME(tokens["}"]);
          }
        },
        { ALT: () => $.CONSUME2(tokens.IDENTIFIER) }
      ]);
    });

    // enumerator_list
    //   : enumerator
    //   | enumerator_list ',' enumerator
    //   ;
    $.RULE("enumeratorList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.enumerator)
      });
    });

    // enumerator
    //   : IDENTIFIER
    //   | IDENTIFIER '=' constant_expression
    //   ;
    $.RULE("enumerator", () => {
      $.CONSUME(tokens.IDENTIFIER);
      $.OPTION(() => {
        $.CONSUME(tokens["="]);
        $.SUBRULE($.constantExpression);
      });
    });

    // declarator
    //   : pointer direct_declarator
    //   | direct_declarator
    //   ;
    $.RULE("declarator", () => {
      $.OPTION(() => $.SUBRULE($.pointer));
      $.SUBRULE($.directDeclarator);
    });

    $.RULE("directDeclaratorBracketSuffix", () => {
      $.CONSUME(tokens["["]);
      $.OPTION(() => $.SUBRULE($.constantExpression));
      $.CONSUME(tokens["]"]);
    });

    $.RULE("directDeclaratorParenSuffix", () => {
      $.CONSUME(tokens["("]);
      $.SUBRULE($.parameterTypeList);
      $.CONSUME(tokens[")"]);
    });

    // direct_declarator
    //   : IDENTIFIER
    //   | '(' declarator ')'
    //   | direct_declarator '[' constant_expression ']'
    //   | direct_declarator '[' ']'
    //   | direct_declarator '(' parameter_type_list ')'
    //   | direct_declarator '(' identifier_list ')'
    //   | direct_declarator '(' ')'
    //   ;
    $.RULE("directDeclarator", () => {
      $.OR1([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.SUBRULE($.declarator);
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
      $.MANY(() => {
        $.OR2([
          { ALT: () => $.SUBRULE($.directDeclaratorBracketSuffix) },
          { ALT: () => $.SUBRULE($.directDeclaratorParenSuffix) }
        ]);
      });
    });

    // pointer
    //   : '*'
    //   | '*' type_qualifier_list
    //   | '*' pointer
    //   | '*' type_qualifier_list pointer
    //   ;
    $.RULE("pointer", () => {
      $.CONSUME1(tokens["*"]);
      $.MANY(() => {
        $.OR([
          { ALT: () => $.CONSUME2(tokens["*"]) },
          { ALT: () => $.SUBRULE($.typeQualifierList) }
        ]);
      });
    });

    // type_qualifier_list
    //   : type_qualifier
    //   | type_qualifier_list type_qualifier
    //   ;
    $.RULE("typeQualifierList", () => {
      $.AT_LEAST_ONE(() => $.CONSUME(typeQualifier));
    });

    // parameter_type_list
    //   : parameter_list
    //   | parameter_list ',' ELLIPSIS
    //   ;
    $.RULE("parameterTypeList", () => {
      $.SUBRULE($.parameterList);
      $.OPTION(() => {
        $.CONSUME(tokens[","]);
        $.CONSUME(tokens["..."]);
      });
    });

    // parameter_list
    //   : parameter_declaration
    //   | parameter_list ',' parameter_declaration
    //   ;
    $.RULE("parameterList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.parameterDeclaration)
      });
    });

    // parameter_declaration
    //   : declaration_specifiers declarator
    //   | declaration_specifiers abstract_declarator
    //   | declaration_specifiers
    //   ;
    $.RULE("parameterDeclaration", () => {
      $.SUBRULE($.declarationSpecifiers);
      $.OPTION(() => {
        $.OR({
          IGNORE_AMBIGUITIES: true,
          DEF: [
            { ALT: () => $.SUBRULE($.declarator) },
            { ALT: () => $.SUBRULE($.abstractDeclarator) }
          ]
        });
      });
    });

    // identifier_list
    //   : IDENTIFIER
    //   | identifier_list ',' IDENTIFIER
    //   ;
    $.RULE("identifierList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.CONSUME(tokens.IDENTIFIER)
      });
    });

    // type_name
    //   : specifier_qualifier_list
    //   | specifier_qualifier_list abstract_declarator
    //   ;
    $.RULE("typeName", () => {
      $.SUBRULE($.specifierQualifierList);
      $.OPTION(() => $.SUBRULE($.abstractDeclarator));
    });

    // abstract_declarator
    //   : pointer
    //   | direct_abstract_declarator
    //   | pointer direct_abstract_declarator
    //   ;
    $.RULE("abstractDeclarator", () => {
      $.OR([
        {
          ALT: () => {
            $.SUBRULE($.pointer);
            $.OPTION(() => $.SUBRULE2($.directAbstractDeclarator));
          }
        },
        { ALT: () => $.SUBRULE1($.directAbstractDeclarator) }
      ]);
    });

    $.RULE("directAbstractDeclaratorSuffix", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens["["]);
            $.OPTION2(() => $.SUBRULE($.constantExpression));
            $.CONSUME(tokens["]"]);
          }
        },
        {
          ALT: () => {
            $.CONSUME(tokens["("]);
            $.OPTION(() => $.SUBRULE($.parameterTypeList));
            $.CONSUME(tokens[")"]);
          }
        }
      ]);
    });

    // direct_abstract_declarator
    //   : '(' abstract_declarator ')'
    //   | '[' ']'
    //   | '[' constant_expression ']'
    //   | '(' ')'
    //   | '(' parameter_type_list ')'
    //   | direct_abstract_declarator '[' ']'
    //   | direct_abstract_declarator '[' constant_expression ']'
    //   | direct_abstract_declarator '(' ')'
    //   | direct_abstract_declarator '(' parameter_type_list ')'
    //   ;
    $.RULE("directAbstractDeclarator", () => {
      $.OPTION(() => {
        $.CONSUME(tokens["("]);
        $.SUBRULE($.abstractDeclarator);
        $.CONSUME(tokens[")"]);
      });
      $.MANY(() => $.SUBRULE($.directAbstractDeclaratorSuffix));
    });

    // initializer
    //   : assignment_expression
    //   | '{' initializer_list '}'
    //   | '{' initializer_list ',' '}'
    //   ;
    $.RULE("initializer", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.assignmentExpression) },
        {
          ALT: () => {
            $.CONSUME(tokens["{"]);
            $.SUBRULE($.initializerList);
            $.OPTION(() => $.CONSUME(tokens[","]));
            $.CONSUME(tokens["}"]);
          }
        }
      ]);
    });

    // initializer_list
    //   : initializer
    //   | initializer_list ',' initializer
    //   ;
    $.RULE("initializerList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: tokens[","],
        DEF: () => $.SUBRULE($.initializer)
      });
    });

    // statement
    //   : labeled_statement
    //   | compound_statement
    //   | expression_statement
    //   | selection_statement
    //   | iteration_statement
    //   | jump_statement
    //   ;
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

    $.RULE("caseStatement", () => {
      $.CONSUME(tokens.CASE);
      $.SUBRULE($.constantExpression);
    });

    // labeled_statement
    //   : IDENTIFIER ':' statement
    //   | CASE constant_expression ':' statement
    //   | DEFAULT ':' statement
    //   ;
    $.RULE("labeledStatement", () => {
      $.OR([
        { ALT: () => $.CONSUME(tokens.IDENTIFIER) },
        { ALT: () => $.SUBRULE($.caseStatement) },
        { ALT: () => $.CONSUME(tokens.DEFAULT) }
      ]);
      $.CONSUME(tokens[":"]);
      $.SUBRULE($.statement);
    });

    // compound_statement
    //   : '{' '}'
    //   | '{' statement_list '}'
    //   | '{' declaration_list '}'
    //   | '{' declaration_list statement_list '}'
    //   ;
    $.RULE("compoundStatement", () => {
      $.CONSUME(tokens["{"]);
      $.OPTION1(() => $.SUBRULE($.declarationList));
      $.OPTION2(() => $.SUBRULE($.statementList));
      $.CONSUME(tokens["}"]);
    });

    // declaration_list
    //   : declaration
    //   | declaration_list declaration
    //   ;
    $.RULE("declarationList", () => {
      $.AT_LEAST_ONE(() => $.SUBRULE($.declaration));
    });

    // statement_list
    //   : statement
    //   | statement_list statement
    //   ;
    $.RULE("statementList", () => {
      $.AT_LEAST_ONE(() => $.SUBRULE($.statement));
    });

    // expression_statement
    //   : ';'
    //   | expression ';'
    //   ;
    $.RULE("expressionStatement", () => {
      $.OPTION(() => $.SUBRULE($.expression));
      $.CONSUME(tokens[";"]);
    });

    $.RULE("ifStatement", () => {
      $.CONSUME(tokens.IF);
      $.CONSUME(tokens["("]);
      $.SUBRULE($.expression);
      $.CONSUME(tokens[")"]);
      $.SUBRULE1($.statement);
      $.OPTION(() => {
        $.CONSUME(tokens.ELSE);
        $.SUBRULE2($.statement);
      });
    });

    $.RULE("switchStatement", () => {
      $.CONSUME(tokens.SWITCH);
      $.CONSUME(tokens["("]);
      $.SUBRULE($.expression);
      $.CONSUME(tokens[")"]);
      $.SUBRULE($.statement);
    });

    // selection_statement
    //   : IF '(' expression ')' statement
    //   | IF '(' expression ')' statement ELSE statement
    //   | SWITCH '(' expression ')' statement
    //   ;
    $.RULE("selectionStatement", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.ifStatement) },
        { ALT: () => $.SUBRULE($.switchStatement) }
      ]);
    });

    $.RULE("whileStatement", () => {
      $.CONSUME(tokens.WHILE);
      $.CONSUME(tokens["("]);
      $.SUBRULE($.expression);
      $.CONSUME(tokens[")"]);
      $.SUBRULE($.statement);
    });

    $.RULE("doWhileStatement", () => {
      $.CONSUME(tokens.DO);
      $.SUBRULE($.statement);
      $.CONSUME(tokens.WHILE);
      $.CONSUME(tokens["("]);
      $.SUBRULE($.expression);
      $.CONSUME(tokens[")"]);
      $.CONSUME(tokens[";"]);
    });

    $.RULE("forStatement", () => {
      $.CONSUME(tokens.FOR);
      $.CONSUME(tokens["("]);
      $.SUBRULE1($.expressionStatement);
      $.SUBRULE2($.expressionStatement);
      $.OPTION(() => $.SUBRULE($.expression));
      $.CONSUME(tokens[")"]);
      $.SUBRULE($.statement);
    });

    // iteration_statement
    //   : WHILE '(' expression ')' statement
    //   | DO statement WHILE '(' expression ')' ';'
    //   | FOR '(' expression_statement expression_statement ')' statement
    //   | FOR '(' expression_statement expression_statement expression ')' statement
    //   ;
    $.RULE("iterationStatement", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.whileStatement) },
        { ALT: () => $.SUBRULE($.doWhileStatement) },
        { ALT: () => $.SUBRULE($.forStatement) }
      ]);
    });

    // jump_statement
    //   : GOTO IDENTIFIER ';'
    //   | CONTINUE ';'
    //   | BREAK ';'
    //   | RETURN ';'
    //   | RETURN expression ';'
    //   ;
    $.RULE("jumpStatement", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(tokens.GOTO);
            $.CONSUME(tokens.IDENTIFIER);
          }
        },
        { ALT: () => $.CONSUME(tokens.CONTINUE) },
        { ALT: () => $.CONSUME(tokens.BREAK) }, 
        {
          ALT: () => {
            $.CONSUME(tokens.RETURN);
            $.OPTION(() => $.SUBRULE($.expression));
          },
        }
      ]);
      $.CONSUME(tokens[";"]);
    });

    // translation_unit
    //   : external_declaration
    //   | translation_unit external_declaration
    //   ;
    $.RULE("translationUnit", () => {
      $.AT_LEAST_ONE(() => $.SUBRULE($.externalDeclaration));
    });

    // external_declaration
    //   : function_definition
    //   | declaration
    //   ;
    $.RULE("externalDeclaration", () => {
      $.OR({
        IGNORE_AMBIGUITIES: true,
        DEF: [
          { ALT: () => $.SUBRULE($.functionDefinition) },
          { ALT: () => $.SUBRULE($.declaration) }
        ]
      });
    });

    // function_definition
    //   : declaration_specifiers declarator declaration_list compound_statement
    //   | declaration_specifiers declarator compound_statement
    //   | declarator declaration_list compound_statement
    //   | declarator compound_statement
    //   ;
    $.RULE("functionDefinition", () => {
      $.OPTION1(() => $.SUBRULE($.declarationSpecifiers));
      $.SUBRULE($.declarator);
      $.OPTION2(() => $.SUBRULE($.declarationList));
      $.SUBRULE($.compoundStatement);
    });

    this.performSelfAnalysis();
  }
}

CParser.parse = (source) => {
  const lexer = new Lexer(Object.values(tokens));
  const result = lexer.tokenize(source);

  const parser = new CParser();
  parser.input = result.tokens;

  const parsed = parser.translationUnit();
  if (parser.errors) {
    return { error: parser.errors };
  }

  return parsed;
};

module.exports = CParser;
