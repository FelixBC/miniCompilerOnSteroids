// Agregar eventos a los botones cuando el documento esté listo
document.getElementById('analyze').addEventListener('click', analyzeCode);
document.getElementById('translateToPHP').addEventListener('click', translateToPHP);
document.getElementById('translateToC').addEventListener('click', translateToC);
document.getElementById('open').addEventListener('click', openFile);
document.getElementById('save').addEventListener('click', saveFile);
document.getElementById('saveAs').addEventListener('click', saveAsFile);
document.getElementById('clear').addEventListener('click', clearAll);
document.getElementById('exit').addEventListener('click', exitApp);
document.getElementById('new').addEventListener('click', newFile);
document.getElementById('runJs').addEventListener('click', runJavaScript);

// Función para actualizar la barra de estado
function setStatusBar(message) {
    document.getElementById('statusBar').innerText = message;
}

// Función para registrar mensajes en la consola
function logToConsole(message) {
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerText += message + '\n';
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function analyzeCode() {
    setStatusBar("Analizando código...");
    logToConsole("Inicio del análisis léxico...");

    const sourceCode = document.getElementById('sourceCode').value;

    // Análisis léxico
    const { tokens, errors: lexicalErrors } = lexicalAnalysis(sourceCode);
    displayTokens(tokens);

    // Análisis sintáctico
    const { parseTree, errors: syntaxErrors } = syntacticAnalysis(tokens);

    // Análisis semántico
    const { errors: semanticErrors } = semanticAnalysis(parseTree);

    // Unir todos los errores
    const allErrors = [...lexicalErrors, ...syntaxErrors, ...semanticErrors];
    displayErrors(allErrors);

    setStatusBar("Análisis completado");
    logToConsole("Análisis completado.");
}


function lexicalAnalysis(code) {
    const tokens = [];
    const errors = [];

    // Eliminar comentarios tipo línea (// ...)
    const codeWithoutComments = code.replace(/\/\/.*$/gm, '');

    const lines = codeWithoutComments.split('\n');
    const tokenRegex = /\w+|[^\s\w]/g;

    lines.forEach((line, lineNumber) => {
        let match;
        while ((match = tokenRegex.exec(line)) !== null) {
            const lexeme = match[0];
            const tokenType = identifyToken(lexeme);

            if (tokenType === 'UNKNOWN') {
                errors.push({
                    type: 'Léxico',
                    message: `Símbolo desconocido '${lexeme}' en línea ${lineNumber + 1}, columna ${match.index + 1}`
                });
            } else {
                tokens.push({
                    lexeme,
                    token: tokenType,
                    position: `[${lineNumber + 1}, ${match.index + 1}]`
                });
            }
        }
    });

    return { tokens, errors };
}

function identifyToken(lexeme) {
    if (/^\d+$/.test(lexeme)) return 'NUMBER';

    //  Permite letras con acentos y la ñ Ñ ü Ü
    if (/^[a-zA-Z_áéíóúÁÉÍÓÚñÑüÜ]\w*$/.test(lexeme)) return 'IDENTIFIER';

    //  Reconoce símbolos comunes
    if (/^[=+\-*/(){};,.<>&![\]:'"¿?]$/.test(lexeme)) return 'SYMBOL';

    return 'UNKNOWN';
}



// Función para mostrar los tokens en la tabla de símbolos
function displayTokens(tokens) {
    const tableBody = document.getElementById('symbolTable');
    tableBody.innerHTML = '';
    tokens.forEach(token => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${token.lexeme}</td><td>${token.token}</td><td>${token.position}</td>`;
        tableBody.appendChild(row);
    });
}

// Función para mostrar los errores detectados
function displayErrors(errors) {
    const tableBody = document.getElementById('errorTable');
    if (!tableBody) {
        console.warn("No se encontró la tabla de errores.");
        return;
    }

    tableBody.innerHTML = ''; // Limpiar contenido anterior

    if (!errors || errors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="2">Sin errores detectados</td>`;
        tableBody.appendChild(row);
        return;
    }

    errors.forEach(error => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${error.type}</td><td>${error.message}</td>`;
        tableBody.appendChild(row);
    });
}


function syntacticAnalysis(tokens) {
    const parseTree = [];
    const errors = [];

    // Simulación sencilla de error sintáctico
    tokens.forEach((token, index) => {
        if (token.token === 'SYMBOL' && token.lexeme === 'int') {
            errors.push({
                type: 'Sintáctico',
                message: `Uso inesperado del símbolo '${token.lexeme}' en ${token.position}`
            });
        }
    });

    return { parseTree, errors };
}


function semanticAnalysis(parseTree) {
    const errors = [];

    const declaredVariables = ['x', 'i', 'suma', 'rango'];

    parseTree.forEach(node => {
        if (node.token === 'IDENTIFIER' && !declaredVariables.includes(node.lexeme)) {
            errors.push({
                type: 'Semántico',
                message: `Uso de variable no declarada: '${node.lexeme}'`
            });
        }
    });

    return { errors };
}


// Función para traducir el código JavaScript a PHP
function translateToPHP() {
    setStatusBar("Traduciendo a PHP...");
    const sourceCode = document.getElementById('sourceCode').value;
    const translatedCode = jsToPhp(sourceCode);
    document.getElementById('destinationCode').value = translatedCode;
    setStatusBar("Traducción a PHP completada");
    logToConsole("Traducción a PHP completada.");
}

// Función de conversión de JavaScript a PHP
function jsToPhp(code) {
    // Reemplazos básicos directos
    const replacements = [
        [/\b(var|let|const)\s+/g, '$'],
        [/===/g, '=='],
        [/!==/g, '!='],
        [/\.toString\(\)/g, ''],
        [/parseInt\s*\(([^)]+)\)/g, 'intval($1)'],
        [/console\.log\s*\(([^)]+)\)/g, 'echo $1'],
        [/([a-zA-Z0-9_]+)\.push\(([^)]+)\)/g, '$1[] = $2'],
        [/([a-zA-Z0-9_$]+)\.split\(''\)\.reverse\(\)\.join\(''\)/g, 'strrev($1)'],
        [/promptInput\(([^)]+)\)/g, '// promptInput($1) → usar fgets(STDIN)']
    ];
    for (const [pattern, replacement] of replacements) {
        code = code.replace(pattern, replacement);
    }

    // Proteger strings y comentarios
    const strings = {}, comments = {};
    code = code.replace(/"[^"\n]*"|'[^'\n]*'/g, s => {
        const k = `__S${Object.keys(strings).length}__`;
        strings[k] = s;
        return k;
    });
    code = code.replace(/\/\/[^\n]*/g, s => {
        const k = `__C${Object.keys(comments).length}__`;
        comments[k] = s;
        return k;
    });

    // Funciones: asegurar que parámetros tienen $ y NO agregar $ al nombre
    code = code.replace(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g, (_, name, params) => {
        const newParams = params
            .split(',')
            .map(p => p.trim())
            .filter(Boolean)
            .map(p => (p.startsWith('$') ? p : `$${p}`))
            .join(', ');
        return `function ${name}(${newParams})`;
    });

    // Palabras reservadas
    const reserved = new Set([
        'function','return','if','else','for','while','switch','case','break','continue',
        'echo','true','false','null','strrev','intval','implode','array','isset','empty'
    ]);

    // Agregar $ a variables sueltas
    code = code.replace(/\b[a-zA-Z_]\w*\b/g, (word, offset, fullText) => {
        const prevChar = fullText[offset - 1];
        const isFunctionDefinition = fullText.slice(offset - 9, offset) === 'function ';
        if (
            reserved.has(word) ||
            word.startsWith('$') ||
            word.startsWith('__') ||
            /^\d+$/.test(word) ||
            prevChar === '$' ||
            isFunctionDefinition
        ) {
            return word;
        }
        return `$${word}`;
    });

    // Restaurar strings y comentarios
    for (const [k, v] of Object.entries(strings)) code = code.replace(new RegExp(k, 'g'), v);
    for (const [k, v] of Object.entries(comments)) code = code.replace(new RegExp(k, 'g'), v);

    return `<?php\n\n${code.trim()}\n\n?>`;
}




// Función para traducir el código PHP a C
function translateToC() {
    setStatusBar("Traduciendo a C...");
    const phpCode = document.getElementById('destinationCode').value;
    const translatedCode = phpToC(phpCode);
    document.getElementById('destinationCode').value = translatedCode;
    setStatusBar("Traducción a C completada");
    logToConsole("Traducción a C completada.");
}

// Función de conversión de PHP a C
function phpToC(code) {
    let cCode = `#include <stdio.h>\n\n`;
    cCode += code
        .replace(/<\?php/g, '')
        .replace(/\?>/g, '')
        .replace(/echo/g, 'printf')
        .replace(/\$/g, '')
        .replace(/==/g, '==')
        .replace(/!=/g, '!=')
        .replace(/;/g, ';')
        .replace(/function /g, 'void ')
        .replace(/printf\((.*?)\);/g, 'printf("%s", $1);');
    return cCode;
}

// Función para abrir un archivo
function openFile() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.addEventListener('change', function() {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('sourceCode').value = e.target.result;
            setStatusBar("Archivo cargado");
            logToConsole("Archivo cargado correctamente.");
        };
        reader.readAsText(file);
    }, { once: true });
}

// Función para guardar el contenido del área de texto de código fuente
function saveFile() {
    const sourceCode = document.getElementById('sourceCode').value;
    const blob = new Blob([sourceCode], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sourceCode.js';
    a.click();
    setStatusBar("Archivo guardado");
    logToConsole("Archivo guardado correctamente.");
}

// Función para guardar el contenido del área de texto de código destino
function saveAsFile() {
    const destinationCode = document.getElementById('destinationCode').value;
    const blob = new Blob([destinationCode], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'destinationCode.c';
    a.click();
    setStatusBar("Archivo guardado como...");
    logToConsole("Archivo guardado como correctamente.");
}

// Función para limpiar todas las áreas de texto y la consola
function clearAll() {
    // Limpiar las áreas de texto
    document.getElementById('sourceCode').value = '';
    document.getElementById('destinationCode').value = '';

    // Limpiar tabla de errores (errorTable)
    const errorTable = document.getElementById('errorTable');
    if (errorTable) errorTable.innerHTML = '';

    // Limpiar tabla de símbolos
    const symbolTable = document.getElementById('symbolTable');
    if (symbolTable) symbolTable.innerHTML = '';

    // Limpiar consola
    document.getElementById('console').innerText = '';

    // Actualizar barra de estado y log
    setStatusBar("Todo limpio");
    logToConsole("Todas las áreas y tablas han sido limpiadas correctamente.");
}

// Función para salir de la aplicación
function exitApp() {
    if (confirm("¿Estás seguro de que deseas salir?")) {
        window.close();
    }
}

// Función para crear un nuevo archivo
function newFile() {
    if (confirm("¿Deseas crear un nuevo archivo? Se perderán los cambios no guardados.")) {
        clearAll();
        setStatusBar("Nuevo archivo creado");
        logToConsole("Nuevo archivo creado.");
    }
}

 // Función para ejecutar código JavaScript en un entorno controlado
function runJavaScript() {
    setStatusBar("Ejecutando JavaScript...");	
    logToConsole("Ejecutando código JavaScript...");
    const sourceCode = document.getElementById('sourceCode').value;

    try {
        const inputSimulator = `
        function promptInput(question) {
            return prompt(question);
        }
        `;

        const fullCode = inputSimulator + sourceCode;
        const result = eval(fullCode);

        logToConsole("Resultado: " + result);
        displayErrors([]); // Limpiar errores anteriores si todo salió bien
        setStatusBar("Ejecución completada");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        logToConsole("Error: " + errorMessage);
        displayErrors([
            {
                type: "Semántico",
                message: errorMessage
            }
        ]);
        setStatusBar("Ejecución fallida");
    }
}
