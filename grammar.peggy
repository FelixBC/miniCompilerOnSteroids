{
  // Any initialization code you may want
}

// Optional whitespace
_ = [ \t\n\r]*

//----------------------------
// Program and Statements
//----------------------------
Program
  = _ stmts:StatementList? _ {
      return { type: "Program", body: stmts || [] };
    }

StatementList
  = first:Statement rest:(_ Statement)* {
      return [first, ...rest.map(r => r[1])];
    }

Statement
  = Block
  / VariableDeclaration
  / FunctionDeclaration
  / IfStatement
  / WhileStatement
  / ForStatement
  / ConsoleLog
  / ReturnStatement
  / ExpressionStatement

ExpressionStatement
  = expr:Expression _ ";" {
      return { type: "ExpressionStatement", expression: expr };
    }

Block
  = "{" _ stmts:StatementList? _ "}" {
      return { type: "BlockStatement", body: stmts || [] };
    }

VariableDeclaration
  = kind:("let" / "const" / "var") _ name:Identifier _ "=" _ value:Expression _ ";" {
      return { type: "VariableDeclaration", kind, name, value };
    }

FunctionDeclaration
  = "function" _ name:Identifier _ "(" _ params:ParameterList? _ ")" _ body:Block {
      return { type: "FunctionDeclaration", name, params: params || [], body };
    }

ParameterList
  = first:Identifier rest:(_ "," _ Identifier)* {
      return [first, ...rest.map(r => r[3])];
    }

IfStatement
  = "if" _ "(" _ cond:Expression _ ")" _ thenStmt:Statement _ ("else" _ elseStmt:Statement)? {
      return { type: "IfStatement", test: cond, consequent: thenStmt, alternate: arguments[7] ? arguments[7][1] : null };
    }

WhileStatement
  = "while" _ "(" _ cond:Expression _ ")" _ body:Statement {
      return { type: "WhileStatement", test: cond, body };
    }

ForStatement
  = "for" _ "(" _
      init:(VariableDeclaration / Expression)? _ ";" _
      test:Expression? _ ";" _
      update:Expression? _ ")" _ body:Statement {
      return {
        type: "ForStatement",
        init: init || null,
        test: test || null,
        update: update || null,
        body
      };
    }

ReturnStatement
  = "return" _ expr:Expression? _ ";" {
      return { type: "ReturnStatement", argument: expr || null };
    }

ConsoleLog
  = "console" _ "." _ "log" _ "(" _ arg:Expression _ ")" _ ";" {
      return { type: "ConsoleLog", argument: arg };
    }

//----------------------------
// Expressions
//----------------------------
Expression
  = AssignmentExpression

AssignmentExpression
  = left:Assignable _ "=" _ right:Expression {
      return { type: "AssignmentExpression", operator: "=", left, right };
    }
  / LogicalOrExpression

Assignable
  = Identifier
  / MemberExpression

LogicalOrExpression
  = left:LogicalAndExpression rest:(_ "||" _ LogicalAndExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "LogicalExpression",
        operator: "||",
        left: acc,
        right: curr[3]
      }), left);
    }

LogicalAndExpression
  = left:EqualityExpression rest:(_ "&&" _ EqualityExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "LogicalExpression",
        operator: "&&",
        left: acc,
        right: curr[3]
      }), left);
    }

EqualityExpression
  = left:RelationalExpression rest:(_ ("===" / "==" / "!==" / "!=") _ RelationalExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "BinaryExpression",
        operator: curr[1],
        left: acc,
        right: curr[3]
      }), left);
    }

RelationalExpression
  = left:AdditiveExpression rest:(_ ("<=" / ">=" / "<" / ">") _ AdditiveExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "BinaryExpression",
        operator: curr[1],
        left: acc,
        right: curr[3]
      }), left);
    }

AdditiveExpression
  = left:MultiplicativeExpression rest:(_ ("+" / "-") _ MultiplicativeExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "BinaryExpression",
        operator: curr[1],
        left: acc,
        right: curr[3]
      }), left);
    }

MultiplicativeExpression
  = left:UnaryExpression rest:(_ ("*" / "/" / "%") _ UnaryExpression)* {
      return rest.reduce((acc, curr) => ({
        type: "BinaryExpression",
        operator: curr[1],
        left: acc,
        right: curr[3]
      }), left);
    }

UnaryExpression
  = op:("!" / "-" / "++" / "--") _ expr:UnaryExpression {
      return {
        type: (op === "++" || op === "--") ? "UpdateExpression" : "UnaryExpression",
        operator: op,
        argument: expr,
        prefix: true
      };
    }
  / PostfixExpression

PostfixExpression
  = expr:LeftHandSideExpression op:("++" / "--")? {
      if (op) {
        return {
          type: "UpdateExpression",
          operator: op,
          argument: expr,
          prefix: false
        };
      }
      return expr;
    }

PropertyAccess
  = _ "." _ prop:Identifier {
      return { type: "MemberExpression", object: null, property: prop, computed: false };
    }

FunctionCall
  = _ "(" _ args:ArgumentList? _ ")" {
      return { type: "CallExpression", arguments: args || [] };
    }

LeftHandSideExpression
  = base:PrimaryExpression suffixes:(PropertyAccess / FunctionCall)* {
      return suffixes.reduce((acc, item) => {
        if (item.type === "CallExpression") {
          return { type: "CallExpression", callee: acc, arguments: item.arguments };
        }
        return { type: "MemberExpression", object: acc, property: item.property, computed: false };
      }, base);
    }

MemberExpression
  = object:PrimaryExpression suffixes:PropertyAccess+ {
      return suffixes.reduce((acc, item) => ({
        type: "MemberExpression",
        object: acc,
        property: item.property,
        computed: false
      }), object);
    }

ArgumentList
  = first:Expression rest:(_ "," _ Expression)* {
      return [first, ...rest.map(r => r[3])];
    }

PrimaryExpression
  = ArrayLiteral
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / NullLiteral
  / Identifier
  / "(" _ Expression _ ")" { return $3; }

//----------------------------
// Array Literal
//----------------------------
ArrayLiteral
  = "[" _ elems:(Expression (_ "," _ Expression)*)? _ "]" {
      var elements = [];
      if (elems) {
        elements.push(elems[0]);
        for (var i = 0; i < elems[1].length; i++) {
          elements.push(elems[1][i][3]);
        }
      }
      return { type: "ArrayExpression", elements: elements };
  }

//----------------------------
// Literals and Identifiers
//----------------------------
NumberLiteral
  = digits:[0-9]+ {
      return { type: "NumberLiteral", value: parseInt(digits.join(""), 10) };
    }

StringLiteral
  = "\"" chars:([^"]*) "\"" {
      return { type: "StringLiteral", value: chars.join("") };
    }
  / "'" chars:([^']*) "'" {
      return { type: "StringLiteral", value: chars.join("") };
    }

BooleanLiteral
  = "true" {
      return { type: "BooleanLiteral", value: true };
    }
  / "false" {
      return { type: "BooleanLiteral", value: false };
    }

NullLiteral
  = "null" {
      return { type: "NullLiteral", value: null };
    }

Identifier
  = $([a-zA-Z_][a-zA-Z0-9_]*) {
      return { type: "Identifier", name: text() };
    }
