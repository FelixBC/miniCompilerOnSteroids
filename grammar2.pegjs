start = Program

// Reglas léxicas básicas
_ "espacios"
  = ( [ \t\n\r] / Comment )*     // cualquier cantidad de espacios, tabulaciones, saltos de línea o comentarios

Comment
  = "//" [^\n]*                 // comentario de una línea que inicia con //

// Identificadores y palabras reservadas
Identifier "identificador"
  = !ReservedKeyword [a-zA-Z_$] [a-zA-Z0-9_$]* {
      return { type: "Identifier", name: text() };
    }

ReservedKeyword
  = "if" / "else" / "for" / "while" / "function" 
  / "let" / "const" / "var" / "return" 
  / "true" / "false" / "null"    // Palabras clave reservadas que no se permiten como identificadores

// Literales
StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "StringLiteral", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "StringLiteral", value: chars.join("") };
    }

DoubleStringCharacter
  = '\\' char:. { return char; } // Escapes como \" o \n
  / !["\\] .                     // Cualquier carácter excepto comilla doble o \

SingleStringCharacter
  = '\\' char:. { return char; } // Escapes como \' o \n
  / !['\\] .                     // Cualquier carácter excepto comilla simple o \

NumberLiteral "número"
  = value:$([0-9]+ ("." [0-9]+)?) {
      return { type: "NumberLiteral", value: parseFloat(value) };
    }

BooleanLiteral
  = "true" { return { type: "BooleanLiteral", value: true }; }
  / "false" { return { type: "BooleanLiteral", value: false }; }

NullLiteral
  = "null" { return { type: "NullLiteral", value: null }; }

// Programa y estructura general
Program
  = _ stmts:StatementList? _ {
      return { type: "Program", body: stmts || [] };
    }

StatementList
  = first:Statement rest:(_ Statement)* {
      return [first, ...rest.map(r => r[1])];
    }
//======================================///
// Sentencias (instrucciones) individuales
//======================================///
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
      return {
        type: "FunctionDeclaration",
        name,
        params: params || [],
        body
      };
    }

ParameterList
  = first:Identifier rest:(_ "," _ Identifier)* {
      return [first, ...rest.map(r => r[3])];
    }

IfStatement
  = "if" _ "(" _ cond:Expression _ ")" _ thenStmt:Statement _ elsePart:("else" _ elseStmt:Statement)? {
      return {
        type: "IfStatement",
        test: cond,
        consequent: thenStmt,
        alternate: elsePart ? elsePart[1] : null
      };
    }

WhileStatement
  = "while" _ "(" _ cond:Expression _ ")" _ body:Statement {
      return { type: "WhileStatement", test: cond, body: body };
    }

ForStatement
  = "for" _ "(" _
    init:(VariableDeclaration / Expression)?  -- e.g., let i = 1
    _ ";" _
    test:Expression?                           -- e.g., i <= hasta
    _ ";" _
    update:Expression?                         -- e.g., i++
    _ ")" _
    body:Statement                             -- the loop body (Block or single statement)
{
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
      return rest.reduce((acc, curr) => (
        { type: "LogicalExpression", operator: "||", left: acc, right: curr[3] }
      ), left);
    }

LogicalAndExpression
  = left:EqualityExpression rest:(_ "&&" _ EqualityExpression)* {
      return rest.reduce((acc, curr) => (
        { type: "LogicalExpression", operator: "&&", left: acc, right: curr[3] }
      ), left);
    }

EqualityExpression
  = left:RelationalExpression rest:(_ ("==" / "!=" / "===" / "!==") _ RelationalExpression)* {
      return rest.reduce((acc, curr) => (
        { type: "BinaryExpression", operator: curr[1], left: acc, right: curr[3] }
      ), left);
    }

RelationalExpression
  = left:AdditiveExpression rest:(_ ("<=" / ">=" / "<" / ">") _ AdditiveExpression)* {
      return rest.reduce((acc, curr) => (
        { type: "BinaryExpression", operator: curr[1], left: acc, right: curr[3] }
      ), left);
    }

AdditiveExpression
  = left:MultiplicativeExpression rest:(_ ("+" / "-") _ MultiplicativeExpression)* {
      return rest.reduce((acc, curr) => (
        { type: "BinaryExpression", operator: curr[1], left: acc, right: curr[3] }
      ), left);
    }

MultiplicativeExpression
  = left:UnaryExpression rest:(_ ("*" / "/" / "%") _ UnaryExpression)* {
      return rest.reduce((acc, curr) => (
        { type: "BinaryExpression", operator: curr[1], left: acc, right: curr[3] }
      ), left);
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
          prefix: false  // postfix usage, e.g. i++
        };
      }
      return expr;
    }

PropertyAccess
  = _ "." _ prop:Identifier {
      return { type: "prop", property: prop };
    }

FunctionCall
  = _ "(" _ args:ArgumentList? _ ")" {
      return { type: "call", arguments: args || [] };
    }

LeftHandSideExpression
  = base:PrimaryExpression suffixes:(PropertyAccess / FunctionCall)* {
      return suffixes.reduce((acc, item) => {
        if (item.type === "call") {
          return { type: "CallExpression", callee: acc, arguments: item.arguments };
        }
        return { type: "MemberExpression", object: acc, property: item.property, computed: false };
      }, base);
    }

MemberExpression
  = object:PrimaryExpression suffixes:PropertyAccess+ {
      return suffixes.reduce((acc, item) => {
        return { type: "MemberExpression", object: acc, property: item.property, computed: false };
      }, object);
    }

ArgumentList
  = first:Expression rest:(_ "," _ Expression)* {
      return [first, ...rest.map(r => r[3])];
    }
ArrayLiteral
  = "[" _ elems:(Expression (_ "," _ Expression)*)? _ "]" {
      var elements = [];
      if (elems) {
          // elems[0] is the first Expression
          elements.push(elems[0]);
          // elems[1] is an array of additional expressions, each wrapped with the comma separator pattern
          for (var i = 0; i < elems[1].length; i++) {
              elements.push(elems[1][i][3]);
          }
      }
      return { type: "ArrayExpression", elements: elements };
  }

PrimaryExpression
  = ArrayLiteral
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / NullLiteral
  / Identifier
  / "(" _ Expression _ ")" { return $3; }


