# GUION VIDEO - TDD Y PRUEBAS UNITARIAS DEL FACTORIAL

## DURACIÓN APROXIMADA: 7-8 minutos

---

## 1. INTRODUCCIÓN (1 minuto)

"Hola, en este video voy a explicar mi trabajo de pruebas unitarias para calcular el factorial de un número, usando TDD - Test Driven Development."

"Vamos a ver:
- La función factorial
- Las pruebas unitarias
- El ciclo Red-Green-Refactor
- El patrón AAA"

---

## 2. ESTRUCTURA DEL PROYECTO (30 segundos)

"Miremos la estructura del proyecto:

- src/factorial.js - La función que calcula factorial
- src/testing/factorial.test.js - Las pruebas unitarias
- main.js - Programa principal con objeto usuario"

(Mostrar estructura de carpetas)

---

## 3. EXPLICAR EL CÓDIGO FUENTE (2 minutos)

"Aquí tenemos la función factorial en src/factorial.js"

(Mostrar código)

"La función recibe un número n y:
- Si es negativo, lanza error
- Si es 0 o 1, retorna 1
- Para demás casos, calcula el producto de 1 hasta n"

---

## 4. EXPLICAR PRUEBAS UNITARIAS - TDD (3 minutos)

### 4.1 Ciclo Red-Green-Refactor

"Ahora explico el ciclo TDD que usamos:

**RED**: Primero escribimos una prueba que FALLA
**GREEN**: Luego implementamos el código mínimo para que pase
**REFACTOR**: Mejoramos el código sin romper las pruebas"

(Mostrar en factorial.test.js líneas 14-19)

### 4.2 Patrón AAA

"Cada prueba sigue el patrón AAA:

**ARRANGE** - Preparar: Inicializar objetos y datos
**ACT** - Actuar: Ejecutar la función a probar
**ASSERT** - Afirmar: Verificar que el resultado sea el esperado"

(Mostrar un ejemplo de test con los comentarios)

### 4.3 Tipos de pruebas

"Mis pruebas cubren:
- Casos base: factorial(0) = 1, factorial(1) = 1
- Casos positivos: factorial(5) = 120, factorial(10) = 3628800
- Casos extremos: factorial(20)
- Casos de error: números negativos"

---

## 5. EJEMPLO CON OBJETO USUARIO (1 minuto)

"Ahora el ejemplo con objeto usuario que requested"

(Mostrar main.js)

"Aquí creamos un objeto usuario con:
- nombre: 'Juan'
- numeroFavorito: 5
- historialCalculos: []

Calculamos el factorial y guardamos en el historial."

(Ejecutar npm start)

"Vemos el resultado: Factorial de 5 es 120"

---

## 6. CIERRE (30 segundos)

"Para terminar:
- Todos los tests pasan ✓
- Usamos TDD con ciclo Red-Green-Refactor
- Aplicamos patrón AAA en cada prueba
- Incluimos ejemplo con objeto usuario

Gracias por ver. links a YouTube"

---

# NOTAS PARA PRESENTAR
- Hablar clear y pausado
- Mostrar código en pantalla
- Ejecutar npm test para demostrar pruebas
- Ejecutar npm start para demostrar programa
- Mantener contacto visual con cámara
