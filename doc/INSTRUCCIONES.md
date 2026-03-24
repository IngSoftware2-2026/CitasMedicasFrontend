# Instrucciones del Proyecto - Citas Médicas Frontend

## IMPORTANTE: Antes de trabajar en este proyecto

### Reglas de Desarrollo

1. **Nombres significativos**: Variables y funciones deben tener nombres claros que describan su propósito.
2. **Consistencia en nomenclatura**: Mantener la misma convención en todo el proyecto.
3. **Funciones pequeñas y cohesivas**: Máximo 20-30 líneas por función.
4. **Documentación concisa**: Documentar solo lo que el código no expresa claramente.
5. **Código limpio**: Sin comentarios innecesarios, código auto-explicativo.

### Códigos de Error del Sistema

Todos los códigos de error están documentados en `doc/codigos-error.md`. 
**DEBES leer este archivo antes de implementar nuevo código que maneje errores.**

### Flujo de Manejo de Errores

1. **Capa de Servicios**: Los servicios deben usar `ErrorHandlerService` para procesar errores
2. **Capa de Componentes**: Los componentes deben subscribe a errores y mostrar mensajes apropiados
3. **Interfaz**: Usar el componente `ToastComponent` para mostrar errores en pantalla

---

*Para más detalles sobre reglas de código, ver `doc/reglas.txt`*
*Para códigos de error específicos, ver `doc/codigos-error.md`*
