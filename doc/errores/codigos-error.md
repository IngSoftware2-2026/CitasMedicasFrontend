# Códigos de Error del Sistema

## Overview
Este documento define todos los códigos de error utilizados en la aplicación frontend y su correspondencia con los códigos HTTP del backend.

---

## Códigos de Error del Frontend (1xxx)

### Errores de Autenticación (1000-1099)

| Código | Clave | Mensaje | Causa Común |
|--------|-------|---------|-------------|
| 1001 | `AUTH_REQUIRED` | Sesión expirada. Por favor, inicie sesión nuevamente. | Token JWT vencido o no presente |
| 1002 | `AUTH_INVALID` | Credenciales inválidas. Verifique su usuario y contraseña. | Login fallido |
| 1003 | `AUTH_BLOCKED` | Cuenta bloqueada. Contacte al administrador. | Usuario inactivo por múltiples intentos |

### Errores de Validación (2000-2099)

| Código | Clave | Mensaje | Causa Común |
|--------|-------|---------|-------------|
| 2001 | `VALIDATION_REQUIRED` | El campo {campo} es requerido. | Campo vacío o nulo |
| 2002 | `VALIDATION_EMAIL` | Correo electrónico inválido. | Formato de email incorrecto |
| 2003 | `VALIDATION_MIN_LENGTH` | Mínimo {min} caracteres requeridos. | Longitud insuficiente |
| 2004 | `VALIDATION_MAX_LENGTH` | Máximo {max} caracteres permitidos. | Longitud excedida |
| 2005 | `VALIDATION_PATTERN` | Formato inválido para {campo}. | No cumple patrón regex |

### Errores de Negocio (3000-3099)

| Código | Clave | Mensaje | Causa Común |
|--------|-------|---------|-------------|
| 3001 | `BUSINESS_DUPLICATE` | El {recurso} ya existe. | Registro duplicado |
| 3002 | `BUSINESS_NOT_FOUND` | {recurso} no encontrado. | ID inválido o eliminado |
| 3003 | `BUSINESS_IN_USE` | No se puede eliminar. {recurso} está en uso. | Dependencias activas |
| 3004 | `BUSINESS_CONSTRAINT` | No cumple las condiciones para esta operación. | Reglas de negocio no satisfechas |

### Errores de Conexión (4000-4099)

| Código | Clave | Mensaje | Causa Común |
|--------|-------|---------|-------------|
| 4001 | `CONN_TIMEOUT` | Tiempo de conexión agotado. Intente nuevamente. | Servidor no responde |
| 4002 | `CONN_OFFLINE` | Sin conexión a internet. Verifique su red. | Navegador offline |
| 4003 | `CONN_SERVER` | Error del servidor. Contacte al administrador. | Error 500 del backend |

---

## Códigos de Error del Backend (HTTP Standard)

| Código HTTP | Clave | Descripción | Acción Recomendada |
|-------------|-------|-------------|-------------------|
| 400 | `BAD_REQUEST` | Solicitud malformada | Verificar datos enviados |
| 401 | `UNAUTHORIZED` | No autenticado | Redirigir a login |
| 403 | `FORBIDDEN` | Sin permisos | Mostrar mensaje de acceso denegado |
| 404 | `NOT_FOUND` | Recurso no existe | Verificar ID o endpoint |
| 405 | `METHOD_NOT_ALLOWED` | Método HTTP no soportado | Usar método correcto |
| 409 | `CONFLICT` | Conflicto de datos | Mostrar mensaje de conflicto |
| 422 | `UNPROCESSABLE` | Entidad no procesable | Validar datos de entrada |
| 500 | `SERVER_ERROR` | Error interno del servidor | Contactar administrador |
| 502 | `BAD_GATEWAY` | Error de gateway | Reintentar más tarde |
| 503 | `SERVICE_UNAVAILABLE` | Servicio no disponible | Reintentar más tarde |

---

## Códigos de Error del Sistema (5000-5099)

| Código | Clave | Mensaje | Causa Común |
|--------|-------|---------|-------------|
| 5001 | `SYS_UNKNOWN` | Error desconocido. Contacte al administrador. | Error no mapeado |
| 5002 | `SYS_CANCELLED` | Operación cancelada por el usuario. | Usuario decidió cancelar |
| 5003 | `SYS_FEATURE` | Funcionalidad no implementada aún. | Feature en desarrollo |

---

## Formato de Respuesta de Error del Backend

```json
{
  "tipo": "Error",
  "codigo": 404,
  "exitoso": false,
  "mensaje": "Usuario no encontrado",
  "datos": null
}
```

---

## Uso en el Frontend

### 1. ErrorHandlerService
Todos los servicios deben usar `ErrorHandlerService` para procesar errores:

```typescript
import { ErrorHandlerService } from '@core/services/error-handler.service';

constructor(private errorHandler: ErrorHandlerService) {}

// En el pipe catchError:
catchError(error => this.errorHandler.handle(error))
```

### 2. Mostrar Errores en UI
Usar `ToastComponent` para mostrar mensajes:

```typescript
this.errorHandler.showError(codigo, mensaje);
this.errorHandler.showSuccess(mensaje);
this.errorHandler.showWarning(mensaje);
```

---

## Reglas para Agregar Nuevos Códigos

1. **Nunca reutilizar códigos existentes** - Asignar nuevo código único
2. **Documentar siempre** - Agregar entrada en esta tabla
3. **Mapeo consistente** - Códigos frontend (1xxx-5xxx) diferentes a HTTP (400-599)
4. **Mensajes user-friendly** - Mensajes entendibles para el usuario final

---

*Última actualización: 2026-03-24*
