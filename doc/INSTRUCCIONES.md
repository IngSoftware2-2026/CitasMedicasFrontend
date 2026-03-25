# Antes de Trabajar

## Leer
- `doc/reglas/codigo-limpio.md` - Reglas de código
- `doc/errores/codigos-error.md` - Códigos de error

## Reglas
1. Nombres claros que expliquen qué hace el código
2. Funciones pequeñas (máx 20-30 líneas)
3. Máximo 50 líneas por archivo
4. Si crece mucho, separar en archivos

## Estructura
```
doc/
├── reglas/
├── errores/
└── contexto/
```

## Servicios
- `ErrorHandlerService` - Manejo de errores
- `RefreshManager` - Refresh de datos
- `NotificationComponent` - Mostrar notificaciones
- `ThemeService` - Tema claro/oscuro
