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
  = '"' chars:([^"\\] / '\\"')* '"' {
      return { type: "StringLiteral", value: chars.join("") };
    }

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
  = Block                            // Bloque de múltiples sentencias encerradas en "{ }"
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

// Declaraciones y estructuras de control
Block
  = "{" _ stmts:StatementList? _ "}" {
      return { type: "BlockStatement", body: stmts || [] };
    }


VariableDeclaration
  = decl:VarDeclNoSemicolon _ ";" {
      return decl;
    }

VarDeclNoSemicolon
  = kind:("let" / "const" / "var") _ name:Identifier _ "=" _ value:Expression {
      return { type: "VariableDeclaration", kind, name, value };
    }

FunctionDeclaration
  = "function" _ name:Identifier _ "(" _ params:ParameterList? _ ")" _ Block {
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

ParamList
  = first:Identifier rest:(_ "," _ Identifier)* {
      return [first, ...rest.map(r => r[3])];
    }

IfStatement
  = "if" _ "(" _ cond:Expression _ ")" _ thenStmt:Statement _ elsePart:("else" _ elseStmt:Statement)? {
      return {
        type: "IfStatement",
        test: cond,
        consequent: thenStmt,
        alternate: elsePart ? elsePart.elseStmt : null
      };
    }

WhileStatement
  = "while" _ "(" _ cond:Expression _ ")" _ body:Statement {
      return { type: "WhileStatement", test: cond, body: body };
    }

ForStatement
  = "for" _ "(" _ init:(VarDeclNoSemicolon / Expression)? _ ";" _ test:Expression? _ ";" _ update:Expression? _ ")" _ body:Statement {
      return {
        type: "ForStatement",
        init: init || null,
        test: test || null,
        update: update || null,
        body: body
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

// Expresiones (con precedencia de operadores)
Expression
  = AssignmentExpression

AssignmentExpression
  = left:LeftHandSideExpression _ "=" _ right:Expression {
      return { type: "AssignmentExpression", operator: "=", left, right };
    }
  / LogicalOrExpression

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
  = op:("!" / "-") _ expr:UnaryExpression {
      return { type: "UnaryExpression", operator: op, argument: expr };
    }
  / PostfixExpression

PostfixExpression
  = expr:LeftHandSideExpression op:("++" / "--")? {
      if (op) {
        return { type: "UpdateExpression", operator: op, argument: expr, prefix: false };
      }
      return expr;
    }

// Sufijos para acceso a propiedades y llamadas a funciones (encadenamiento)
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
CallExpression
  = callee:PrimaryExpression _ "(" _ args:ArgumentList? _ ")" {
      return { type: "CallExpression", callee, arguments: args || [] };
    }

ArgumentList
  = first:Expression rest:(_ "," _ Expression)* {
      return [first, ...rest.map(r => r[3])];
    }

PrimaryExpression
  = CallExpression
  / NumberLiteral
  / StringLiteral
  / BooleanLiteral
  / NullLiteral
  / Identifier
  / "(" _ Expression _ ")" { return $3; }


