# Documentación de Videos - Manuel Zapata

## Video 1: API REST - 6 Consejos para diseñar bien una API

---

### Capítulo 1: Representa recursos y no acciones

**Problema:**
- Malas prácticas comunes: `GET /borrar-producto/1234` o `POST /eliminar-producto`
- Estas implementaciones muestran acciones en lugar de recursos

**Solución - Definir recursos correctamente:**
- **Colecciones:** Conjuntos de datos (plural) - `/products` (lista de productos)
- **Documentos:** Instancias específicas (singular) - `/products/1234` (producto específico)
- **Stores:** Recursos adicionales controlados desde el cliente - `/users/20/favorites`
- **Controladores:** Funciones ejecutables (verbos al final) - `/users/20/reset-password` (usa POST)

**Convenciones:**
- Colecciones: plural (`/products`)
- Documentos: singular con identificador (`/products/1234`)
- Stores: plural
- Controladores: siempre usar POST

---

### Capítulo 2: No devuelvas siempre 200 OK

**Problema:**
- Devolver siempre 200 OK genera incoherencia
- El cuerpo dice "error" pero el código dice 200

**Solución - Usar códigos HTTP correctos:**
- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `202 Accepted` - Solicitud recibida, procesamiento asíncrono
- `204 No Content` - Éxito sin contenido (ej: DELETE)
- `401 Unauthorized` - Usuario no autenticado
- `403 Forbidden` - Usuario autenticado sin permiso
- `404 Not Found` - Recurso no encontrado
- `405 Method Not Allowed` - Recurso no soporta la acción
- `500 Internal Server Error` - Error en el servidor

---

### Capítulo 3: No hagas todo con POST

**Problema:**
- Usar POST para todo (eliminar, actualizar, etc.)

**Solución - Utilizar métodos HTTP según intención:**
- `GET` - Extraer datos (colección o documento)
- `POST` - Crear nuevos recursos
- `PUT` - Actualizar recurso completo
- `PATCH` - Actualizar campos específicos
- `DELETE` - Eliminar recursos
- `OPTIONS` - Verificar qué acciones permite un recurso

---

### Capítulo 4: Asegura tu API

**Problema:**
- Dejar APIs abiertas es muy riesgoso

**Solución:**
- Implementar autenticación (OAuth, tokens, API Keys)
- Nunca dejar una API pública sin seguridad

---

### Capítulo 5: Versiona tu API

**Problema:**
- Los APIs cambian más rápido que los clientes

**Solución:**
- Siempre versionar los APIs (`/v1/...`, `/v2/...`)
- Mantener versión anterior mientras clientes migran
- Luego de transición, remover versión vieja

---

### Capítulo 6: Usa JSON, pero úsalo bien

**Problema:**
- Devolver respuestas que no son JSON válido

**Solución:**
- API debe soportar y devolver JSON válido
- Usar validador JSON para verificar respuestas
- Soporte de XML es opcional pero no requerido
- JSON debe ser bien estructurado

---

### Aclaración importante sobre REST

- **No existe un estándar oficial de REST** (a diferencia de HTTP)
- REST tiene restricciones definidas por Roy Fielding
- Las "buenas prácticas" vienen de la experiencia
- Algunos APIs son "REST-like" pero no 100% REST
- Las excepciones son permitidas si hay razón válida

---

## Video 2: Introducción a las pruebas unitarias

---

### Capítulo 1: Pirámide de pruebas

**Estructura (de arriba hacia abajo):**
1. **Pruebas E2E (End-to-End)** - Lentas, costosas, verifican flujo completo
2. **Pruebas de integración** - Verifican que componentes funcionen juntos
3. **Pruebas unitarias** - Rápidas, económicas, verifican piezas específicas

**Principio:** Entre más cerca de la base, más rápido y barato

---

### Capítulo 2: ¿Qué son las pruebas unitarias?

**Definición:**
- Prueban partes muy específicas: un método, una clase
- Se ejecutan casi instantáneamente
- Son las más rápidas y económicas

**Características de una buena prueba unitaria:**
1. **Ejecución rápida** - No debe tardar más de unos segundos
2. **Programación rápida** - Si toma días, el código es demasiado amplio
3. **Sin dependencias externas** - No debe depender de base de datos o sistemas externos
4. **Independientes** - No deben depender de otras pruebas

---

### Capítulo 3: TDD (Test Driven Development)

**Definición:**
- Desarrollo guiado por pruebas
- Escribir la prueba ANTES del código

**Ciclo (Red-Green-Refactor):**
1. **Red** - Escribir prueba que falla (rojo)
2. **Green** - Implementar código mínimo para que pase (verde)
3. **Refactor** - Mejorar código manteniendo las pruebas pasando

**Beneficios:**
- Pensar en casos de prueba antes de programar
- Evitar reprocesos
- Código más limpio y testeable

**Técnica AAA (Arrange-Act-Assert):**
- **Arrange:** Inicializar objetos y setup
- **Act:** Ejecutar código a probar
- **Assert:** Verificar resultados

---

### Capítulo 4: Ejemplo práctico (C#)

**Escenarios probados:**
- Factorial de 0 = 1 (caso especial)
- Factorial de 5 = 120

**Implementación paso a paso:**
1. Crear prueba primero
2. Ejecutar y verificar que falle (Red)
3. Implementar código mínimo (Green)
4. Refactorizar de recursivo a iterativo (Refactor)
5. Verificar que pruebas sigan pasando

---

### Conclusiones

- Nunca es tarde para empezar a probar
- Comenzar con cosas sencillas
- TDD mejora la calidad del código
- Las pruebas dan confianza al hacer cambios

---

## Principios de Código Limpio Aplicados

### De APIs REST:
1. **Nombres significativos** - Recursos con nombres claros (`/products`, no `/getAllProducts`)
2. **Consistencia** - Usar convenciones establecidas (plural para colecciones)
3. **Semántica correcta** - Códigos HTTP con significado (no 200 para errores)
4. **Separación de responsabilidades** - Cada método HTTP tiene propósito específico
5. **Control de versiones** - Mantener compatibilidad hacia atrás

### De Pruebas Unitarias:
1. **Código probable** - Funciones pequeñas y enfocadas (Single Responsibility)
2. **Testing como documentación** - Las pruebas explican el comportamiento esperado
3. **Independencia** - Pruebas no deben depender entre sí
4. **Automatización** - Pruebas que se ejecutan rápidamente
5. **Primero el qué, luego el cómo** - TDD obliga a pensar en requisitos primero
6. **Refactorización segura** - Pruebas dan confianza para mejorar código

---

*Fuente: Canal de Manuel Zapata - Arquitectura de Software y Buenas Prácticas*