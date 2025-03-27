{
  // You can put helper JS code here if needed
}

// Whitespace rule (zero or more spaces, tabs, or newlines)
_ = [ \t\n\r]*

//=====================================
// Program and Statement Handling
//=====================================
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

//=====================================
// Variable Declarations
//=====================================

// 1) Normal variable declaration with trailing semicolon (for standalone statements)
VariableDeclaration
  = kind:("let" / "const" / "var") _ id:Identifier _ "=" _ val:Expression _ ";" {
      return { type: "VariableDeclaration", kind, name: id, value: val };
    }

// 2) Special variable declaration for for-loops (NO trailing semicolon)
ForVariableDeclaration
  = kind:("let" / "const" / "var") _ id:Identifier _ "=" _ val:Expression {
      return { type: "VariableDeclaration", kind, name: id, value: val };
    }

//=====================================
// Function Declaration
//=====================================
FunctionDeclaration
  = "function" _ id:Identifier _ "(" _ params:ParameterList? _ ")" _ body:Block {
      return { type: "FunctionDeclaration", name: id, params: params || [], body };
    }

ParameterList
  = first:Identifier rest:(_ "," _ Identifier)* {
      return [first, ...rest.map(r => r[3])];
    }

//=====================================
// Control Flow
//=====================================
IfStatement
  = "if" _ "(" _ cond:Expression _ ")" _ thenStmt:Statement elsePart:(_ "else" _ elseStmt:Statement)? {
      return {
        type: "IfStatement",
        test: cond,
        consequent: thenStmt,
        alternate: elsePart ? elsePart[2] : null
      };
    }

WhileStatement
  = "while" _ "(" _ cond:Expression _ ")" _ body:Statement {
      return { type: "WhileStatement", test: cond, body };
    }

// The for-loop rule references ForVariableDeclaration for init
ForStatement
  = "for" _ "(" _
      init:(ForVariableDeclaration / Expression)? _ ";" _
      test:Expression? _ ";" _
      update:Expression? _ ")" _
      body:Statement {
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

// Simple console.log(...) statement
ConsoleLog
  = "console" _ "." _ "log" _ "(" _ arg:Expression _ ")" _ ";" {
      return { type: "ConsoleLog", argument: arg };
    }

//=====================================
// Expressions
//=====================================
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
      // Handles prefix !, -, ++, or --
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
      // Handles postfix i++, i--
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

LeftHandSideExpression
  = base:PrimaryExpression suffixes:(PropertyAccess / FunctionCall)* {
      return suffixes.reduce((acc, item) => {
        if (item.type === "CallExpression") {
          // chain calls
          return { type: "CallExpression", callee: acc, arguments: item.arguments };
        }
        // property access
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

PropertyAccess
  = _ "." _ prop:Identifier {
      return { type: "MemberExpression", object: null, property: prop, computed: false };
    }

FunctionCall
  = _ "(" _ args:ArgumentList? _ ")" {
      return { type: "CallExpression", arguments: args || [] };
    }

ArgumentList
  = first:Expression rest:(_ "," _ Expression)* {
      return [first, ...rest.map(r => r[3])];
    }

//=====================================
// Primary Expressions
//=====================================
PrimaryExpression
  = ArrayLiteral
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / NullLiteral
  / Identifier
  / "(" _ Expression _ ")" { return $3; }

// Array literal support
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

//=====================================
// Literals
//=====================================
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
  = "true"  { return { type: "BooleanLiteral", value: true  }; }
  / "false" { return { type: "BooleanLiteral", value: false }; }

NullLiteral
  = "null" { return { type: "NullLiteral", value: null }; }

Identifier
  = $([a-zA-Z_][a-zA-Z0-9_]*) {
      return { type: "Identifier", name: text() };
    }
