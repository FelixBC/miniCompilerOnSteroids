# Mini Compilador Web – Documentación

Este proyecto implementa un **mini compilador educativo** desarrollado por **Félix José Blanco Cabrera (1-17-1693)** como parte de la asignatura *Compiladores*.

---

## 🛠️ Lenguaje y Herramientas

- **Lenguaje principal:** JavaScript (con soporte para HTML y CSS).
- **Entorno:** Aplicación web, ejecutable en cualquier navegador.
- **No se requiere instalación**. Funciona offline con solo abrir `index.html`.

---

## ✨ Funcionalidades Principales

- ✅ **Análisis Léxico:** identifica tokens válidos y detecta errores como símbolos desconocidos.
- ✅ **Análisis Sintáctico:** simula la detección de errores estructurales del código.
- ✅ **Tabla de Símbolos:** muestra identificadores encontrados, su tipo y ubicación.
- ✅ **Clasificación de errores:** organiza errores por tipo (léxico, sintáctico, semántico).
- ✅ **Consola integrada:** similar a una terminal para mensajes y resultados.
- ✅ **Traducción de código:** convierte código JavaScript a PHP (básico).
- ✅ **Interfaz moderna:** estilo oscuro, cuadros organizados, menú desplegable.

---

## 🧠 Estructura de Archivos

- `index.html` — Interfaz gráfica principal del compilador.
- `compiler.js` — Lógica del compilador (análisis, generación de código, consola).
- `style.css` — (opcional) puede usarse para separar y organizar los estilos.
- `README.md` — Documentación técnica y resumen del proyecto.

---

## 🧪 Pruebas y Validación

El compilador fue probado con funciones que:
- Verifican si un número es capicúa.
- Generan listas de números perfectos.
- Ejecutan JavaScript directamente desde la interfaz.
- Detectan errores léxicos al introducir símbolos inválidos.

También se probó la traducción a PHP, validando que:
- Las variables se convirtieran correctamente con `$`.
- Se evitaran errores como dobles `$` o cambios en strings.
- Se respetara la estructura básica del lenguaje destino.

---

## 📋 Cómo Usar

1. Abre `index.html` en tu navegador.
2. Escribe código JavaScript en el área de código fuente.
3. Desde el menú ☰ puedes:
   - Ejecutar código.
   - Analizar errores.
   - Limpiar la interfaz.
   - Traducir a PHP.
4. Revisa los resultados en la consola y en las tablas de errores/símbolos.

---

⚠️ Limitaciones del Mini Compilador
Como este es un compilador mini desarrollado con fines educativos, existen ciertas limitaciones que pueden causar que algunos errores reales no sean detectados, o que ciertos comportamientos no se manejen como lo haría un compilador profesional. A continuación, algunas de estas limitaciones:

❌ No hay verificación de tipos entre variables (por ejemplo, sumar texto y número no lanza error).

❌ No detecta variables duplicadas ni errores de ámbito (scope).

❌ El análisis sintáctico es limitado, no usa una gramática formal completa.

❌ No existe un análisis semántico profundo (solo validaciones mínimas).

❌ No hay control de flujo detallado, como manejo de break, continue, return en distintos contextos.

❌ No soporta estructuras complejas como objetos, clases o funciones flecha.

⚠️ La traducción a PHP o C es básica, usando reemplazos simples que no garantizan código ejecutable.

⚠️ La ejecución de JavaScript usa eval, lo cual no aísla ni valida la seguridad del código.

❌ Los errores léxicos solo detectan símbolos ilegales, no todos los errores posibles del lenguaje.

❌ No hay gestión de memoria, optimización de código, ni generación real de binarios.

A pesar de estas limitaciones, este mini compilador cumple con los objetivos académicos y sirve como una excelente base para seguir aprendiendo y desarrollando funcionalidades más avanzadas.

## 👨‍💻 Autor

- **Nombre:** Félix José Blanco Cabrera  
- **Matrícula:** 1-17-1693  
- **Materia:** Compiladores  
- **Profesor:** Ivan Mendoza  
- **Universidad:** UTESA

---

## ⚠️ Nota Final

Este compilador es con fines educativos. No reemplaza a un compilador real, pero simula correctamente los pasos básicos del análisis de código fuente y es una excelente base para expandir funcionalidades en el futuro.
