# Documentación del Proyecto

## Estructura

```
doc/
├── INSTRUCCIONES.md      # Instrucciones generales (LEER PRIMERO)
├── README.md             # Este archivo
├── reglas/               # Reglas de desarrollo
│   ├── codigo-limpio.md
│   └── codigo-limpio.txt
├── errores/              # Códigos de error
│   └── codigos-error.md
└── contexto/             # Contexto técnico
    └── contexto.md
```

## Antes de Trabajar

1. **LEER OBLIGATORIO**: `INSTRUCCIONES.md`
2. **Reglas de código**: `reglas/codigo-limpio.md`
3. **Códigos de error**: `errores/codigos-error.md`

## Servicios del Core

| Servicio | Ubicación | Descripción |
|----------|-----------|-------------|
| `ConexionService` | `core/services/Http/` | Peticiones HTTP base |
| `ErrorHandlerService` | `core/services/Http/` | Manejo de errores |
| `RefreshManager` | `core/shared/` | Refresco de datos |
| `ToastComponent` | `core/shared/components/` | Mostrar errores en UI |
