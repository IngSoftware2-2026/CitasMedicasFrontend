# Sistema de Gestión de Citas Médicas - Roles y Permisos

## Resumen de Implementación

Sistema de control de acceso basado en roles (RBAC) para el frontend Angular.

---

## Roles Definidos

| Rol | Código | Descripción |
|-----|--------|-------------|
| Administrador | ADMIN | Acceso completo al sistema |
| Recepción | RECEPCION | Gestión clínica, sin editar/eliminar roles |
| Doctor | DOCTOR | Vista de pacientes, consultas y horarios propios |
| Paciente | PACIENTE | Vista de doctores, horarios y solicitud de citas |

---

## Tabla de Verificación de Rutas

| Ruta | ADMIN | RECEPCION | DOCTOR | PACIENTE |
|------|:-----:|:---------:|:------:|:--------:|
| /dashboard | ✅ | ✅ | ✅ | ✅ |
| /pacientes | ✅ | ✅ | ✅ (ver) | ❌ |
| /doctores | ✅ | ✅ (ver) | ❌ | ✅ (ver) |
| /solicitudes | ✅ | ✅ | ❌ | ✅ (solicitar) |
| /citas | ✅ | ✅ | ✅ | ✅ |
| /consultas | ✅ | ❌ | ✅ | ❌ |
| /horarios | ✅ | ✅ | ✅ | ✅ |
| /usuarios | ✅ | ❌ | ❌ | ❌ |
| /admin (roles) | ✅ | ✅ (ver) | ❌ | ❌ |
| /salas | ✅ | ❌ | ❌ | ❌ |
| /especialidades | ✅ | ✅ | ❌ | ❌ |
| /configuraciones | ✅ | ✅ | ✅ | ✅ |

---

## Permisos por Rol

### ADMIN
- Dashboard completo
- Pacientes (gestión)
- Doctores (gestión)
- Solicitudes (gestión)
- Citas (gestión)
- Usuarios (gestión)
- Roles (gestión, editar, eliminar)
- Permisos
- Salas (gestión)
- Especialidades (gestión)
- Horarios (gestión)
- Configuración

### RECEPCION
- Dashboard
- Pacientes (gestión)
- Doctores (solo ver)
- Solicitudes (gestión)
- Citas (solo ver)
- Roles (solo ver, sin editar/eliminar)
- Salas (ver)
- Especialidades (gestión)
- Horarios (gestión)
- Configuración

### DOCTOR
- Dashboard
- Pacientes (solo ver)
- Citas (solo ver)
- Consultas (gestión)
- Horarios (solo ver)
- Configuración

### PACIENTE
- Dashboard
- Doctores (solo ver)
- Horarios (solo ver)
- Citas (solo ver)
- Solicitar Cita
- Configuración

---

## Archivos Modificados

### Servicios
- `core/services/Accesos/auth.service.ts` - Manejo de autenticación y codigoRol
- `core/services/Accesos/rol-permisos.service.ts` - Verificación de permisos por rol
- `features/Accesos/login/operaciones/login.ts` - Guarda datos de usuario en login

### Constants
- `core/constants/roles.ts` - Definición de roles y permisos (simplificado)

### Componentes
- `layout/layout.component.ts/html` - Menú adaptativo por rol
- `features/dashboard/dashboard.component.ts/html` - Dashboard adaptativo
- `features/Clinica/doctores/doctores.component.ts/html` - Solo lectura para pacientes
- `features/Clinica/horarios/horarios.component.ts/html` - Solo lectura para pacientes
- `features/Accesos/admin/admin-roles.component.ts` - Solo ADMIN puede editar/eliminar

### Rutas
- `app.routes.ts` - Permisos correctos por ruta

### Guards
- `core/guards/permission.guard.ts` - Verificación de permisos en rutas

---

---

## Funcionalidad de Solicitudes

### Admin/Recepción
- Ven tabla de solicitudes con stats
- Pueden confirmar, rechazar, cancelar solicitudes

### Paciente
- Ven botón "Nueva Solicitud"
- Seleccionan doctor y motivo
- Envían solicitud de cita

---

## Flujo de Login

1. Usuario ingresa credenciales
2. Backend retorna: `token`, `usuarioId`, `rolId`, `rol.codigoRol`, `rol.nombreRol`
3. Frontend guarda en localStorage:
   - `token`
   - `usuarioId`
   - `rolId`
   - `codigoRol`
   - `rolNombre`
   - `nombreUsuario`
   - `correo`
4. `RolPermisosService` determina permisos según `codigoRol`

---

## Cómo Agregar un Nuevo Permiso

1. Agregar el permiso en `core/constants/roles.ts` en `PERMISOS_POR_ROL` para cada rol que lo necesite
2. Usar en componentes con `auth.esRol` o `auth.permisosService.tienePermiso('NOMBRE_PERMISO')`

---

## Ejemplo de Uso en Componentes

```typescript
// Verificar rol
if (this.auth.esAdmin) { ... }

// Verificar permiso
if (this.auth.permisosService.tienePermiso('GESTIONAR_PACIENTES')) { ... }
```

```html
<!-- En templates -->
@if (esAdmin) {
  <button>Editar</button>
}
```

---

## Notas

- El código `codigoRol` debe coincidir con la base de datos (`Accesos.tbRoles.CodigoRol`)
- Por defecto, si no hay `codigoRol`, se asigna ADMIN
- Los componentes de gestión ocultan botones de editar/eliminar según el rol
- Las rutas usan permisos `VER_*` para acceso y `GESTIONAR_*` para gestión completa
