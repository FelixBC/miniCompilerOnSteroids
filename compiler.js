// Conectar botones
const connectMenuButtons = () => {
    document.getElementById('new').addEventListener('click', newFile);
    document.getElementById('open').addEventListener('click', openFile);
    document.getElementById('save').addEventListener('click', saveFile);
    document.getElementById('saveAs').addEventListener('click', saveAsFile);
    document.getElementById('analyze').addEventListener('click', analyzeCode);
    document.getElementById('runJs').addEventListener('click', runJavaScript);
    document.getElementById('clear').addEventListener('click', clearAll);
    document.getElementById('exit').addEventListener('click', exitApp);
    document.getElementById('translateToRuby').addEventListener('click', translateToRuby);
    document.getElementById('translateToGo').addEventListener('click', translateRubyToGo);
};

connectMenuButtons();

function setStatusBar(message) {
    document.getElementById('statusBar').innerText = message;
}

function logToConsole(message, type = 'log') {
    const consoleDiv = document.getElementById('console');
    const now = new Date();
    const time = now.toLocaleTimeString('es-ES', {hour12: false});
    const prefix = `[${time}] > `;
    const line = document.createElement('div');
    line.textContent = prefix + message;

    switch (type) {
        case 'error':
            line.style.color = 'red';
            break;
        case 'warning':
            line.style.color = 'yellow';
            break;
        default:
            line.style.color = '#00ff00';
    }

    consoleDiv.appendChild(line);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function analyzeCode() {
    clearErrors();
    setStatusBar("Analizando código...");
    logToConsole("Iniciando análisis léxico y sintáctico...");

    const code = document.getElementById('sourceCode').value;

    // Análisis Léxico
    const { tokens, errors: lexicalErrors } = lexicalAnalysis(code);
    displaySymbolTable(tokens);

    // Análisis Sintáctico y Semántico
    let syntaxErrors = [];
    let semanticErrors = [];
    let ast = null;

    try {
        ast = parser.parse(code);
        logToConsole("Análisis sintáctico completado.");

        // Análisis Semántico
        semanticErrors = semanticAnalysis(ast);
        if (semanticErrors.length === 0) {
            logToConsole("Análisis semántico completado.");
        }
    } catch (e) {
        syntaxErrors.push({
            type: "Sintáctico",
            message: e.message,
            line: e.location?.start?.line || null,
            column: e.location?.start?.column || null
        });
    }

    // Mostrar errores
    const allErrors = [...lexicalErrors, ...syntaxErrors, ...semanticErrors];
    displayErrors(allErrors);

    // Extraer y resaltar líneas de error
    const errorLines = allErrors
        .map(err => err.line || (err.location?.start?.line))
        .filter(Boolean);

    highlightErrorLines(errorLines);

    if (allErrors.length === 0) {
        logToConsole("Análisis completado sin errores.");
    } else {
        logToConsole(`Se detectaron ${allErrors.length} error${allErrors.length > 1 ? 'es' : ''}.`);
    }

    setStatusBar("Análisis completado.");
}

function highlightErrorLines(lines) {
    const textarea = document.getElementById("sourceCode");
    const originalLines = textarea.value.split('\n');

    const highlighted = originalLines.map((line, index) => {
        const lineNumber = index + 1;
        return lines.includes(lineNumber)
            ? `⚠️ ${line}` // Prefijo visual; puedes cambiarlo por otro si lo deseas
            : line;
    });

    textarea.value = highlighted.join('\n');
}


function semanticAnalysis(ast) {
    const errors = [];
    const symbolTable = {};

    function reportError(message, node) {
        const loc = node?.location;
        const position = loc ? `en línea ${loc.start.line}, columna ${loc.start.column}` : '';
        errors.push({
            type: "Semántico",
            message: `${message} ${position}`.trim()
        });
    }

    function inferType(expr) {
        if (!expr) return "unknown";

        switch (expr.type) {
            case 'NumberLiteral':
                return 'number';
            case 'StringLiteral':
                return 'string';
            case 'BooleanLiteral':
                return 'boolean';
            case 'NullLiteral':
                return 'null';
            case 'Identifier':
                return symbolTable[expr.name] || 'unknown';
            case 'CallExpression':
                if (expr.callee.type === 'MemberExpression') {
                    const objType = inferType(expr.callee.object);
                    const method = expr.callee.property.name;
                    if (objType === 'number' && method === 'toString') return 'string';
                    if (objType === 'string' && method === 'toInt') return 'number';
                }
                return 'unknown';
            case 'BinaryExpression':
                const leftType = inferType(expr.left);
                const rightType = inferType(expr.right);
                return leftType === rightType ? leftType : 'unknown';
            default:
                return 'unknown';
        }
    }

    function checkNode(node) {
        if (!node) return;

        switch (node.type) {
            case 'Program':
                node.body.forEach(checkNode);
                break;

            case 'VariableDeclaration':
                if (symbolTable[node.name]) {
                    reportError(`Variable '${node.name}' ya declarada.`, node);
                } else {
                    const valueType = inferType(node.value);
                    symbolTable[node.name] = valueType;
                }
                break;

            case 'AssignmentExpression': {
                const varName = node.left.name;
                const assignedType = inferType(node.right);
                const declaredType = symbolTable[varName];

                if (!declaredType) {
                    reportError(`Variable '${varName}' no declarada.`, node);
                } else if (declaredType !== assignedType) {
                    reportError(`Incompatibilidad de tipos: '${declaredType}' y '${assignedType}' para '${varName}'.`, node);
                }
                break;
            }

            case 'BinaryExpression':
                checkNode(node.left);
                checkNode(node.right);
                break;

            case 'ExpressionStatement':
            case 'ReturnStatement':
                checkNode(node.expr || node.argument);
                break;

            case 'IfStatement':
                checkNode(node.test);
                checkNode(node.consequent);
                if (node.alternate) checkNode(node.alternate);
                break;

            case 'WhileStatement':
            case 'ForStatement':
                if (node.init) checkNode(node.init);
                if (node.test) checkNode(node.test);
                if (node.update) checkNode(node.update);
                checkNode(node.body);
                break;

            case 'CallExpression':
                if (node.callee.type === 'MemberExpression') {
                    const objType = inferType(node.callee.object);
                    const method = node.callee.property.name;

                    const isValid =
                        (objType === 'number' && method === 'toString') ||
                        (objType === 'string' && method === 'toInt');

                    if (!isValid) {
                        reportError(`El método '${method}' no es válido para tipo '${objType}'.`, node);
                    }
                }

                node.arguments.forEach(checkNode);
                break;
        }
    }

    checkNode(ast);
    return errors;
}

function lexicalAnalysis(code) {
    const tokenDefs = [
        { type: 'COMMENT', regex: /^\/\/.*/, ignore: true },
        { type: 'STRING', regex: /^"(?:[^"\\]|\\.)*"/ },
        { type: 'STRING', regex: /^'(?:[^'\\]|\\.)*'/ },
        { type: 'NUMBER', regex: /^\d+(\.\d+)?/ },
        { type: 'IDENTIFIER', regex: /^[\p{L}_][\p{L}0-9_]*/u },
        { type: 'OPERATOR', regex: /^(==|!=|<=|>=|\+\+|--|[+\-*/=<>])/ },
        { type: 'DELIMITER', regex: /^[().,;{}[\]]/ },
        { type: 'WHITESPACE', regex: /^\s+/, ignore: true }
    ];

    const lines = code.split('\n');
    const tokens = [];
    const errors = [];

    lines.forEach((line, lineNumber) => {
        let current = line;
        let column = 1;

        while (current.length > 0) {
            let matched = false;

            for (const def of tokenDefs) {
                const match = def.regex.exec(current);
                if (match) {
                    matched = true;
                    if (!def.ignore) {
                        tokens.push({
                            lexeme: match[0],
                            token: def.type,
                            position: `[${lineNumber + 1}, ${column}]`
                        });
                    }
                    column += match[0].length;
                    current = current.slice(match[0].length);
                    break;
                }
            }

            if (!matched) {
                errors.push({
                    type: 'Léxico',
                    message: `Símbolo no reconocido '${current[0]}' en línea ${lineNumber + 1}, columna ${column}`
                });
                current = current.slice(1);
                column++;
            }
        }
    });

    return { tokens, errors };
}

//  I'm letting this commented, in case you wanna do it in the future without the pegjs parser just hardcoding it to understand more of the process.

// function syntacticAnalysis(tokens) {
//     const errors = [];
//
//     for (let i = 0; i < tokens.length; i++) {
//         const token = tokens[i];
//         const next = tokens[i + 1];
//         const after = tokens[i + 2];
//
//         // Solo si es asignación IDENTIFIER = algo
//         if (
//             token.token === 'IDENTIFIER' &&
//             next?.lexeme === '=' &&
//             after
//         ) {
//             let foundEnd = false;
//
//             // Buscar el siguiente ;
//             for (let j = i + 2; j < tokens.length; j++) {
//                 const check = tokens[j];
//                 if (check.lexeme === ';') {
//                     foundEnd = true;
//                     break;
//                 }
//
//                 // Si cambia de línea o empieza bloque, termina análisis
//                 if (check.lexeme === '}' || check.lexeme === '{' || check.token === 'Palabra Reservada') break;
//             }
//
//             if (!foundEnd) {
//                 errors.push({
//                     type: 'Sintáctico',
//                     message: `Asignación sin punto y coma en ${token.position}`
//                 });
//             }
//         }
//     }
//
//     return {parseTree: tokens, errors};
// }

// function semanticAnalysis(parseTree) {
//     const errors = [];
//     const symbolTable = {};
//
//     for (let i = 0; i < parseTree.length; i++) {
//         const token = parseTree[i];
//         if (token.token === 'IDENTIFIER' && parseTree[i + 1]?.lexeme === '=') {
//             const valueToken = parseTree[i + 2];
//             const id = token.lexeme;
//             const value = valueToken?.lexeme || '';
//             const valueType = /^[0-9]+$/.test(value) ? 'number' :
//                 /^["'].*["']$/.test(value) ? 'string' : 'unknown';
//
//             if (symbolTable[id]) {
//                 if (symbolTable[id] !== valueType) {
//                     errors.push({
//                         type: 'Semántico',
//                         message: `Incompatibilidad de tipo: '${id}' ya es ${symbolTable[id]}, no puede asignarse ${valueType} en ${valueToken.position}`
//                     });
//                 }
//             } else {
//                 symbolTable[id] = valueType;
//             }
//         }
//     }
//
//     return {errors};
// }

//
// function displayTokens(tokens) {
//     const tableBody = document.getElementById('symbolTable');
//     tableBody.innerHTML = '';
//     tokens.forEach(token => {
//         const row = document.createElement('tr');
//         row.innerHTML = `<td>${token.lexeme}</td><td>${token.token}</td><td>${token.position}</td>`;
//         tableBody.appendChild(row);
//     });
// }
//
function displayErrors(errors) {
    const tableBody = document.getElementById('errorTable');
    tableBody.innerHTML = '';

    if (!errors || errors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="2">Sin errores detectados</td>`;
        tableBody.appendChild(row);
        logToConsole("Sin errores detectados.");
        return;
    }

    errors.forEach(error => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${error.type}</td><td>${error.message}</td>`;
        tableBody.appendChild(row);
        logToConsole(`${error.type}: ${error.message}`, error.type === 'Sintáctico' ? 'error' : 'warning');
    });
}

function displaySymbolTable(tokens) {
    const tableBody = document.getElementById('symbolTable');
    tableBody.innerHTML = '';

    if (!tokens || tokens.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3">No se encontraron símbolos.</td>`;
        tableBody.appendChild(row);
        return;
    }

    tokens.forEach(token => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${token.lexeme || token.lexema}</td>
            <td>${token.token}</td>
            <td>${token.position || token.posicion}</td>
        `;
        tableBody.appendChild(row);
    });
}

function translateToRuby() {
    setStatusBar("Traduciendo a Ruby...");
    logToConsole("Iniciando traducción a Ruby...");

    const sourceCode = document.getElementById('sourceCode').value;
    const {errors} = lexicalAnalysis(sourceCode);
    if (errors.length > 0) return displayErrors(errors);

    const rubyCode = jsToRuby(sourceCode);
    document.getElementById('destinationCode').value = rubyCode;

    logToConsole("Traducción a Ruby completada.", 'log');
    setStatusBar("Traducción a Ruby completada.");
}
function clearErrors() {
    const tableBody = document.getElementById('errorTable');
    if (tableBody) {
        tableBody.innerHTML = '';
    }
}

function jsToRuby(code) {
    return code
        // Comentarios JS → Ruby
        .replace(/\/\/\s?(.*)/g, '# $1')

        // Funciones
        .replace(/function\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*{/g, 'def $1($2)')

        // Cierre de bloques
        .replace(/}/g, 'end')

        // Variables: const, let, var → nada
        .replace(/\b(const|let|var)\s+/g, '')

        // Igualdad estricta
        .replace(/===/g, '==')

        // toString → to_s
        .replace(/\.toString\(\)/g, '.to_s')

        // parseInt → to_i
        .replace(/parseInt\(([^,]+),\s*10\)/g, '$1.to_i')

        // promptInput con const
        .replace(/const\s+(\w+)\s*=\s*promptInput\((.*?)\)/g, 'print $2\n$1 = gets.chomp')

        // promptInput sin const
        .replace(/(\w+)\s*=\s*promptInput\((.*?)\)/g, 'print $2\n$1 = gets.chomp')

        // push → <<
        .replace(/([\w\]]+)\.push\((.*?)\)/g, '$1 << $2')

        // for con let
        .replace(/for\s*\(\s*let\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*(\w+);\s*\1\+\+\s*\)/g, 'for $1 in $2..$3')

        // for sin let
        .replace(/for\s*\(\s*(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*(\w+);\s*\1\+\+\s*\)/g, 'for $1 in $2..$3')

        // if simple
        .replace(/if\s*\((.*?)\)\s*{/g, 'if $1')

        // ✅ console.log("texto", variable) → interpolación
        .replace(/console\.log\(\s*"([^"]+)"\s*,\s*([^)]+?)\s*\)/g, (_, text, variable) => {
            return `puts "${text} #{${variable.trim()}}"`;
        })

        // ✅ console.log("texto " + variable)
        .replace(/console\.log\(\s*"([^"]+)"\s*\+\s*([^)]+?)\s*\)/g, (_, text, variable) => {
            return `puts "${text}" + ${variable.trim()}.to_s`;
        })

        // ✅ console.log(`texto ${variable}`)
        .replace(/console\.log\(\s*`([^`]*?)\$\{(.*?)\}`\s*\)/g, (_, text, variable) => {
            return `puts "${text}#{${variable.trim()}}"`;
        })

        // console.log(variable) simple
        .replace(/console\.log\((.*?)\)/g, 'puts $1')

        // Eliminar ;
        .replace(/;/g, '')

        // Eliminar {
        .replace(/{/g, '')

        // Limpiar saltos de línea innecesarios
        .replace(/\n{2,}/g, '\n')

        .trim();
}

function translateRubyToGo() {
    setStatusBar("Traduciendo Ruby a Go...");
    logToConsole("Iniciando traducción Ruby -> Go...");

    const rubyCode = document.getElementById('destinationCode').value;
    if (!rubyCode.trim()) {
        logToConsole("No hay código Ruby para traducir.", 'warning');
        return;
    }

    const goCode = rubyToGo(rubyCode);
    document.getElementById('destinationCode').value = goCode;
    logToConsole("Traducción a Go completada.", 'log');
    setStatusBar("Traducción a Go completada.");
}

function rubyToGo(code) {
    return code
        .replace(/#(.*)/g, '// $1')
        .replace(/puts\s+"(.*?)\s*\#\{(.*?)\}"/g, 'fmt.Printf("$1%s\\n", $2)')
        .replace(/puts\s+(.*)/g, 'fmt.Println($1)')
        .replace(/def\s+(\w+)\((.*?)\)/g, 'func $1($2) {')
        .replace(/end/g, '}')
        .replace(/true/g, 'true')
        .replace(/false/g, 'false')
        .replace(/nil/g, 'nil');
}

function openFile() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('sourceCode').value = e.target.result;
            setStatusBar("Archivo cargado");
            logToConsole("Archivo cargado correctamente.");
        };
        reader.readAsText(file);
    }, {once: true});
}

function saveFile() {
    const sourceCode = document.getElementById('sourceCode').value;
    const blob = new Blob([sourceCode], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sourceCode.js';
    a.click();
    setStatusBar("Archivo guardado");
    logToConsole("Archivo guardado correctamente.");
}

function saveAsFile() {
    const destinationCode = document.getElementById('destinationCode').value;
    const blob = new Blob([destinationCode], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'destinationCode.rb';
    a.click();
    setStatusBar("Archivo guardado como...");
    logToConsole("Archivo guardado como correctamente.");
}

function clearAll() {
    document.getElementById('sourceCode').value = '';
    document.getElementById('destinationCode').value = '';
    document.getElementById('errorTable').innerHTML = '';
    document.getElementById('symbolTable').innerHTML = '';
    document.getElementById('console').innerText = '';
    setStatusBar("Todo limpio");
    logToConsole("Todas las áreas y tablas han sido limpiadas correctamente.", 'log');
}

function exitApp() {
    if (confirm("¿Estás seguro de que deseas salir?")) {
        window.close();
    }
}

function newFile() {
    if (confirm("¿Deseas crear un nuevo archivo? Se perderán los cambios no guardados.")) {
        clearAll();
        setStatusBar("Nuevo archivo creado");
        logToConsole("Nuevo archivo creado.", 'log');
    }
}

function runJavaScript() {
    setStatusBar("Ejecutando código...");
    logToConsole("Ejecutando...");

    // Primero analiza el código
    analyzeCode();

    // Luego verifica si hay errores críticos
    const errorTable = document.getElementById('errorTable');
    const hasErrors = [...errorTable.querySelectorAll('tr')].some(row =>
        row.innerText.includes('Léxico') ||
        row.innerText.includes('Sintáctico') ||
        row.innerText.includes('Semántico')
    );

    if (hasErrors) {
        logToConsole("Ejecución detenida por errores críticos.", 'error');
        setStatusBar("Errores detectados. No se ejecutó.");
        return;
    }

    // Ejecutar si todo está bien
    try {
        const code = document.getElementById('sourceCode').value;
        const result = eval(code);
        if (result !== undefined) {
            logToConsole(`Resultado: ${result}`);
        }
        setStatusBar("Ejecución completada.");
    } catch (e) {
        logToConsole(`Error de ejecución: ${e.message}`, 'error');
        setStatusBar("Error al ejecutar.");
    }
}
