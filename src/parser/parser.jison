%token	IDENTIFIER I_CONSTANT F_CONSTANT STRING_LITERAL FUNC_NAME SIZEOF
%token	PTR_OP INC_OP DEC_OP LEFT_OP RIGHT_OP LE_OP GE_OP EQ_OP NE_OP
%token	AND_OP OR_OP MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN ADD_ASSIGN
%token	SUB_ASSIGN LEFT_ASSIGN RIGHT_ASSIGN AND_ASSIGN
%token	XOR_ASSIGN OR_ASSIGN

%token	TYPEDEF EXTERN STATIC AUTO REGISTER INLINE
%token	CONST RESTRICT VOLATILE
%token	BOOL CHAR SHORT INT LONG SIGNED UNSIGNED FLOAT DOUBLE VOID
%token	COMPLEX IMAGINARY 
%token	STRUCT UNION ENUM ELLIPSIS

%token	CASE DEFAULT IF ELSE SWITCH WHILE DO FOR GOTO CONTINUE BREAK RETURN

%token	ALIGNAS ALIGNOF ATOMIC GENERIC NORETURN STATIC_ASSERT THREAD_LOCAL

%start start
%%

primary_expression
	: IDENTIFIER
		{ $$ = node({ type: "ident", value: $1 }, @1) }
	| constant
	| string
	| '(' expression ')'
		{ $$ = node({ type: "parens", expr: $2 }, @1, @3) }
	| generic_selection
	;

constant
	: I_CONSTANT
		{ $$ = node({ type: "const", value: $1 }, @1) }
	| F_CONSTANT
		{ $$ = node({ type: "const", value: $1 }, @1) }
	| enumeration_constant
	;

enumeration_constant
	: IDENTIFIER
	;

string
	: STRING_LITERAL
	| FUNC_NAME
	;

generic_selection
	: GENERIC '(' assignment_expression ',' generic_assoc_list ')'
	;

generic_assoc_list
	: generic_association
	| generic_assoc_list ',' generic_association
	;

generic_association
	: type_name ':' assignment_expression
	| DEFAULT ':' assignment_expression
	;

postfix_expression
	: primary_expression
	| postfix_expression '[' expression ']'
	| postfix_expression '(' ')'
		{ $$ = node({ type: "call", recv: $1 }, @1, @3) }
	| postfix_expression '(' argument_expression_list ')'
		{ $$ = node({ type: "call", recv: $1, args: $3 }, @1, @4) }
	| postfix_expression '.' IDENTIFIER
		{ $$ = node({ type: "field", recv: $1, oper: $2, ident: $3 }, @1, @3) }
	| postfix_expression PTR_OP IDENTIFIER
		{ $$ = node({ type: "field", recv: $1, oper: $2, ident: $3 }, @1, @3) }
	| postfix_expression INC_OP
		{ $$ = node({ type: "postUnary", expr: $1, oper: $2 }, @1, @2) }
	| postfix_expression DEC_OP
		{ $$ = node({ type: "postUnary", expr: $1, oper: $2 }, @1, @2) }
	| '(' type_name ')' '{' initializer_list '}'
	| '(' type_name ')' '{' initializer_list ',' '}'
	;

argument_expression_list
	: assignment_expression
		{ $$ = [$1] }
	| argument_expression_list ',' assignment_expression
		{ $$ = $1.concat($3) }
	;

unary_expression
	: postfix_expression
	| INC_OP unary_expression
		{ $$ = node({ type: "unary", oper: $1, expr: $2, parens: false }, @1, @2) }
	| DEC_OP unary_expression
		{ $$ = node({ type: "unary", oper: $1, expr: $2, parens: false }, @1, @2) }
	| unary_operator cast_expression
		{ $$ = node({ type: "unary", oper: $1, expr: $2, parens: false }, @1, @2) }
	| SIZEOF unary_expression
		{ $$ = node({ type: "unary", oper: $1, expr: $2, parens: false }, @1, @2) }
	| SIZEOF '(' type_name ')'
		{ $$ = node({ type: "unary", oper: $1, expr: $3, parens: true }, @1, @2) }
	| ALIGNOF '(' type_name ')'
		{ $$ = node({ type: "unary", oper: $1, expr: $3, parens: true }, @1, @4) }
	;

unary_operator
	: '&'
	| '*'
	| '+'
	| '-'
	| '~'
	| '!'
	;

cast_expression
	: unary_expression
	| '(' type_name ')' cast_expression
		{ $$ = node({ type: "cast", value: $2, expr: $4 }, @1, @4) }
	;

multiplicative_expression
	: cast_expression
	| multiplicative_expression '*' cast_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| multiplicative_expression '/' cast_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| multiplicative_expression '%' cast_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

additive_expression
	: multiplicative_expression
	| additive_expression '+' multiplicative_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| additive_expression '-' multiplicative_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

shift_expression
	: additive_expression
	| shift_expression LEFT_OP additive_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| shift_expression RIGHT_OP additive_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

relational_expression
	: shift_expression
	| relational_expression '<' shift_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| relational_expression '>' shift_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| relational_expression LE_OP shift_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| relational_expression GE_OP shift_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

equality_expression
	: relational_expression
	| equality_expression EQ_OP relational_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	| equality_expression NE_OP relational_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

and_expression
	: equality_expression
	| and_expression '&' equality_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

exclusive_or_expression
	: and_expression
	| exclusive_or_expression '^' and_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

inclusive_or_expression
	: exclusive_or_expression
	| inclusive_or_expression '|' exclusive_or_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

logical_and_expression
	: inclusive_or_expression
	| logical_and_expression AND_OP inclusive_or_expression
		{ $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

logical_or_expression
	: logical_and_expression
	| logical_or_expression OR_OP logical_and_expression
	  { $$ = node({ type: "binary", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

conditional_expression
	: logical_or_expression
	| logical_or_expression '?' expression ':' conditional_expression
		{ $$ = node({ type: "ternary", pred: $1, truthy: $3, falsy: $5 }, @1, @5) }
	;

assignment_expression
	: conditional_expression
	| unary_expression assignment_operator assignment_expression
		{ $$ = node({ type: "assign", lhs: $1, oper: $2, rhs: $3 }, @1, @3) }
	;

assignment_operator
	: '='
	| MUL_ASSIGN
	| DIV_ASSIGN
	| MOD_ASSIGN
	| ADD_ASSIGN
	| SUB_ASSIGN
	| LEFT_ASSIGN
	| RIGHT_ASSIGN
	| AND_ASSIGN
	| XOR_ASSIGN
	| OR_ASSIGN
	;

expression
	: assignment_expression
		{ $$ = node({ type: "exprs", exprs: [$1] }, @1) }
	| expression ',' assignment_expression
		{ $$ = node({ type: "exprs", exprs: $1.exprs.concat($3) }, @1, @3) }
	;

constant_expression
	: conditional_expression
	;

declaration
	: declaration_specifiers ';'
		{ $$ = node({ type: "decl", declSpecs: $1 }, @1, @2) }
	| declaration_specifiers init_declarator_list ';'
		{ $$ = node({ type: "decl", declSpecs: $1, initDecls: $2 }, @1, @3) }
	| static_assert_declaration
	;

declaration_specifiers
	: storage_class_specifier declaration_specifiers
		{ $$ = node({ type: "declSpecs", specs: [$1].concat($2) }, @1, @2) }
	| storage_class_specifier
		{ $$ = node({ type: "declSpecs", specs: [$1] }, @1) }
	| type_specifier declaration_specifiers
		{ $$ = node({ type: "declSpecs", specs: [$1].concat($2) }, @1, @2) }
	| type_specifier
		{ $$ = node({ type: "declSpecs", specs: [$1] }, @1) }
	| type_qualifier declaration_specifiers
		{ $$ = node({ type: "declSpecs", specs: [$1].concat($2) }, @1, @2) }
	| type_qualifier
		{ $$ = node({ type: "declSpecs", specs: [$1] }, @1) }
	| function_specifier declaration_specifiers
		{ $$ = node({ type: "declSpecs", specs: [$1].concat($2) }, @1, @2) }
	| function_specifier
		{ $$ = node({ type: "declSpecs", specs: [$1] }, @1) }
	| alignment_specifier declaration_specifiers
		{ $$ = node({ type: "declSpecs", specs: [$1].concat($2) }, @1, @2) }
	| alignment_specifier
		{ $$ = node({ type: "declSpecs", specs: [$1] }, @1) }
	;

init_declarator_list
	: init_declarator
		{ $$ = [$1] }
	| init_declarator_list ',' init_declarator
		{ $$ = $1.concat($3) }
	;

init_declarator
	: declarator '=' initializer
		{ $$ = node({ type: "initDecl", decl: $1, init: $3 }, @1, @3) }
	| declarator
		{ $$ = node({ type: "initDecl", decl: $1 }, @1) }
	;

storage_class_specifier
	: TYPEDEF
	| EXTERN
	| STATIC
	| THREAD_LOCAL
	| AUTO
	| REGISTER
	;

type_specifier
	: VOID                          { $$ = node({ type: $1 }, @1) }
	| CHAR                          { $$ = node({ type: $1 }, @1) }
	| SHORT                         { $$ = node({ type: $1 }, @1) }
	| INT                           { $$ = node({ type: $1 }, @1) }
	| LONG                          { $$ = node({ type: $1 }, @1) }
	| FLOAT                         { $$ = node({ type: $1 }, @1) }
	| DOUBLE                        { $$ = node({ type: $1 }, @1) }
	| SIGNED                        { $$ = node({ type: $1 }, @1) }
	| UNSIGNED                      { $$ = node({ type: $1 }, @1) }
	| BOOL                          { $$ = node({ type: $1 }, @1) }
	| COMPLEX                       { $$ = node({ type: $1 }, @1) }
	| IMAGINARY                     { $$ = node({ type: $1 }, @1) }
	| atomic_type_specifier
	| struct_or_union_specifier
	| enum_specifier
	;

struct_or_union_specifier
	: struct_or_union '{' struct_declaration_list '}'
	| struct_or_union IDENTIFIER '{' struct_declaration_list '}'
	| struct_or_union IDENTIFIER
	;

struct_or_union
	: STRUCT
	| UNION
	;

struct_declaration_list
	: struct_declaration
	| struct_declaration_list struct_declaration
	;

struct_declaration
	: specifier_qualifier_list ';'
	| specifier_qualifier_list struct_declarator_list ';'
	| static_assert_declaration
	;

specifier_qualifier_list
	: type_specifier specifier_qualifier_list
		{ $$ = node({ type: "specQuals", quals: [$1].concat($2.quals) }, @1, @2) }
	| type_specifier
		{ $$ = node({ type: "specQuals", quals: [$1] }, @1) }
	| type_qualifier specifier_qualifier_list
		{ $$ = node({ type: "specQuals", quals: [$1].concat($2.quals) }, @1, @2) }
	| type_qualifier
		{ $$ = node({ type: "specQuals", quals: [$1] }, @1) }
	;

struct_declarator_list
	: struct_declarator
	| struct_declarator_list ',' struct_declarator
	;

struct_declarator
	: ':' constant_expression
	| declarator ':' constant_expression
	| declarator
	;

enum_specifier
	: ENUM '{' enumerator_list '}'
	| ENUM '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER '{' enumerator_list '}'
	| ENUM IDENTIFIER '{' enumerator_list ',' '}'
	| ENUM IDENTIFIER
	;

enumerator_list
	: enumerator
	| enumerator_list ',' enumerator
	;

enumerator
	: enumeration_constant '=' constant_expression
	| enumeration_constant
	;

atomic_type_specifier
	: ATOMIC '(' type_name ')'
	;

type_qualifier
	: CONST
	| RESTRICT
	| VOLATILE
	| ATOMIC
	;

function_specifier
	: INLINE
	| NORETURN
	;

alignment_specifier
	: ALIGNAS '(' type_name ')'
	| ALIGNAS '(' constant_expression ')'
	;

declarator
	: pointer direct_declarator
		{ $$ = node({ type: "declarator", pointer: $1, directDeclarator: $2 }, @1, @2) }
	| direct_declarator
	;

direct_declarator
	: IDENTIFIER
		{ $$ = node({ type: "ident", value: $1 }, @1) }
	| '(' declarator ')'
	| direct_declarator '[' ']'
	| direct_declarator '[' '*' ']'
	| direct_declarator '[' STATIC type_qualifier_list assignment_expression ']'
	| direct_declarator '[' STATIC assignment_expression ']'
	| direct_declarator '[' type_qualifier_list '*' ']'
	| direct_declarator '[' type_qualifier_list STATIC assignment_expression ']'
	| direct_declarator '[' type_qualifier_list assignment_expression ']'
	| direct_declarator '[' type_qualifier_list ']'
	| direct_declarator '[' assignment_expression ']'
	| direct_declarator '(' parameter_type_list ')'
	| direct_declarator '(' ')'
	| direct_declarator '(' identifier_list ')'
	;

pointer
	: '*' type_qualifier_list pointer
		{ $$ = node({ type: "pointer", value: $1, typeQualifiers: $2, pointer: $3 }, @1, @3) }
	| '*' type_qualifier_list
		{ $$ = node({ type: "pointer", value: $1, typeQualifiers: $2 }, @1, @2) }
	| '*' pointer
		{ $$ = node({ type: "pointer", value: $1, pointer: $2 }, @1, @2) }
	| '*'
		{ $$ = node({ type: "pointer", value: $1 }, @1) }
	;

type_qualifier_list
	: type_qualifier
		{ $$ = node({ type: "typeQualifiers", value: [$1] }, @1) }
	| type_qualifier_list type_qualifier
		{ $$ = node({ type: "typeQualifiers", value: $1.value.concat($2) }, @1, @2) }
	;


parameter_type_list
	: parameter_list ',' ELLIPSIS
		{ $$ = node({ type: "params", params: $1, ellipsis: $3 }, @1, @3) }
	| parameter_list
		{ $$ = node({ type: "params", params: $1, ellipsis: null }, @1) }
	;

parameter_list
	: parameter_declaration
		{ $$ = [$1] }
	| parameter_list ',' parameter_declaration
		{ $$ = $1.concat($3) }
	;

parameter_declaration
	: declaration_specifiers declarator
	| declaration_specifiers abstract_declarator
	| declaration_specifiers
	;

identifier_list
	: IDENTIFIER
		{ $$ = node({ type: "identifiers", value: [$1] }, @1) }
	| identifier_list ',' IDENTIFIER
		{ $$ = node({ type: "identifiers", value: $1.value.concat($3) }, @1, @3) }
	;

type_name
	: specifier_qualifier_list abstract_declarator
	| specifier_qualifier_list
	;

abstract_declarator
	: pointer direct_abstract_declarator
	| pointer
	| direct_abstract_declarator
	;

direct_abstract_declarator
	: '(' abstract_declarator ')'
	| '[' ']'
	| '[' '*' ']'
	| '[' STATIC type_qualifier_list assignment_expression ']'
	| '[' STATIC assignment_expression ']'
	| '[' type_qualifier_list STATIC assignment_expression ']'
	| '[' type_qualifier_list assignment_expression ']'
	| '[' type_qualifier_list ']'
	| '[' assignment_expression ']'
	| direct_abstract_declarator '[' ']'
	| direct_abstract_declarator '[' '*' ']'
	| direct_abstract_declarator '[' STATIC type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list STATIC assignment_expression ']'
	| direct_abstract_declarator '[' type_qualifier_list ']'
	| direct_abstract_declarator '[' assignment_expression ']'
	| '(' ')'
	| '(' parameter_type_list ')'
	| direct_abstract_declarator '(' ')'
	| direct_abstract_declarator '(' parameter_type_list ')'
	;

initializer
	: '{' initializer_list '}'
	| '{' initializer_list ',' '}'
	| assignment_expression
	;

initializer_list
	: designation initializer
	| initializer
	| initializer_list ',' designation initializer
	| initializer_list ',' initializer
	;

designation
	: designator_list '='
	;

designator_list
	: designator
		{ $$ = [$1] }
	| designator_list designator
		{ $$ = $1.concat($2) }
	;

designator
	: '[' constant_expression ']'
	| '.' IDENTIFIER
	;

static_assert_declaration
	: STATIC_ASSERT '(' constant_expression ',' STRING_LITERAL ')' ';'
		{ $$ = node({ type: "assert", expr: $3, msg: $5 }, @1, @7) }
	;

statement
	: labeled_statement
	| compound_statement
	| expression_statement
	| selection_statement
	| iteration_statement
	| jump_statement
	;

labeled_statement
	: IDENTIFIER ':' statement
		{ $$ = node({ type: "label", ident: $1, stmt: $3 }, @1, @3) }
	| CASE constant_expression ':' statement
		{ $$ = node({ type: "case", pred: $2, stmt: $4}, @1, @4) }
	| DEFAULT ':' statement
		{ $$ = node({ type: "default", stmt: $3}, @1, @3) }
	;

compound_statement
	: '{' '}'
		{ $$ = node({ type: "compound" }, @1, @2) }
	| '{'  block_item_list '}'
		{ $$ = node({ type: "compound", items: $2 }, @1, @3) }
	;

block_item_list
	: block_item
		{ $$ = [$1] }
	| block_item_list block_item
		{ $$ = $1.concat($2) }
	;

block_item
	: declaration
	| statement
	;

expression_statement
	: ';'
		{ $$ = null }
	| expression ';'
		{ $$ = { type: "stmt", expr: $1 } }
	;

selection_statement
	: IF '(' expression ')' statement ELSE statement
		{ $$ = node({ type: "if", expr: $3, stmt: $5, consequent: $7 }, @1, @7) }
	| IF '(' expression ')' statement
		{ $$ = node({ type: "if", expr: $3, stmt: $5 }, @1, @5) }
	| SWITCH '(' expression ')' statement
		{ $$ = node({ type: "switch", expr: $3, stmt: $5 }, @1, @5) }
	;

iteration_statement
	: WHILE '(' expression ')' statement
		{ $$ = node({ type: "while", pred: $3, stmt: $5 }, @1, @5) }
	| DO statement WHILE '(' expression ')' ';'
		{ $$ = node({ type: "do", stmt: $2, expr: $5 }, @1, @7) }
	| FOR '(' expression_statement expression_statement ')' statement
		{ $$ = node({ type: "for", init: $3, pred: $4, stmt: $6 }, @1, @6) }
	| FOR '(' expression_statement expression_statement expression ')' statement
		{ $$ = node({ type: "for", init: $3, pred: $4, incr: $5, stmt: $7 }, @1, @7) }
	| FOR '(' declaration expression_statement ')' statement
		{ $$ = node({ type: "for", init: $3, pred: $4, stmt: $6 }, @1, @6) }
	| FOR '(' declaration expression_statement expression ')' statement
		{ $$ = node({ type: "for", init: $3, pred: $4, incr: $5, stmt: $7 }, @1, @6) }
	;

jump_statement
	: GOTO IDENTIFIER ';'
		{ $$ = node({ type: "goto", ident: $2 }, @1, @3) }
	| CONTINUE ';'
		{ $$ = node({ type: "continue" }, @1, @2) }
	| BREAK ';'
		{ $$ = node({ type: "break" }, @1, @2) }
	| RETURN ';'
		{ $$ = node({ type: "return" }, @1, @2) }
	| RETURN expression ';'
		{ $$ = node({ type: "return", expr: $2 }, @1, @3) }
	;

translation_unit
	: external_declaration
		{ $$ = node({ type: "root", decls: [$1] }, @1) }
	| translation_unit external_declaration
		{ $$ = node({ type: "root", decls: $1.decls.concat($2) }, @1, @2) }
	;

external_declaration
	: function_definition
	| declaration
	;

function_definition
	: declaration_specifiers declarator declaration_list compound_statement
		{ $$ = node({ type: "func", declSpecs: $1, name: $2, params: $3, body: $4 }, @1, @4) }
	| declaration_specifiers declarator compound_statement
		{ $$ = node({ type: "func", declSpecs: $1, name: $2, body: $3 }, @1, @3) }
	;

declaration_list
	: declaration
		{ $$ = [$1] }
	| declaration_list declaration
		{ $$ = $1.concat($2) }
  ;

start
	: translation_unit { return $1 }
	;

%%

function node(opts, start, ending) {
	ending = ending || start;

	return {
		...opts,
		loc: {
			sl: start.first_line,
			sc: start.first_column,
			el: ending.last_line,
			ec: ending.last_column
		}
	};
}
