
# 💙 MediCitas Pro

Sistema web para la gestión integral de citas médicas desarrollado con **Angular 21** y **PrimeNG 21**.  
Diseño moderno con **modo oscuro**, sistema de **autenticación por roles y permisos**, y UI completamente responsive.

---

## Tecnologías utilizadas

| Tecnología | Versión | Descripción |
|---|---|---|
| Angular | 21.2.0 | Framework frontend con standalone components y signals |
| PrimeNG | 21.1.3 | Librería de componentes UI |
| @primeng/themes | 21.0.4 | Tema Aura con soporte dark mode |
| PrimeIcons | 7.0.0 | Iconografía |
| TypeScript | 5.9.2 | Lenguaje tipado |
| Vitest | 4.0.8 | Framework de pruebas unitarias |
| Google Fonts | Inter | Tipografía principal (400–800 weights) |

---

## Requisitos previos

* Node.js 22+ (LTS recomendado)
* npm 11+

---

## Instalación

```bash
git clone https://github.com/IngSoftware2-2026/CitasMedicasFrontend.git
cd CitasMedicasFrontend
npm install
```

---

## Servidor de desarrollo

```bash
ng serve
```

Abrir en el navegador: **http://localhost:4200/**

### Credenciales de prueba (mock)

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | admin@medicitas.com | admin123 |
| Doctor | martinez@medicitas.com | doctor123 |
| Recepción | recepcion@medicitas.com | recep123 |
| Paciente | lopez@correo.com | paciente123 |

---

## Compilar el proyecto

```bash
ng build
```

El resultado se almacena en `dist/CitasMedicas/` (~1.35 MB, ~254 kB transferidos).

---

## Pruebas unitarias

```bash
ng test
```

---

## Arquitectura del proyecto

El proyecto sigue una arquitectura **modular por features** con rutas protegidas por guards de autenticación y permisos.

```
src/
├── index.html
├── main.ts
├── styles.css                        ← Estilos globales + CSS custom properties + clases .mod-*
└── app/
    ├── app.ts                        ← Componente root (standalone, <router-outlet>)
    ├── app.html
    ├── app.css
    ├── app.config.ts                 ← Aura theme con darkModeSelector: '.dark-mode'
    ├── app.routes.ts                 ← Rutas con authGuard + permissionGuard
    ├── app.spec.ts
    │
    ├── layout/
    │   ├── layout.component.ts       ← Shell principal (sidebar + header + content)
    │   ├── layout.component.html
    │   └── layout.component.css
    │
    ├── core/
    │   ├── constants/
    │   │   └── permissions.ts        ← Constantes de permisos (PERMISSIONS)
    │   ├── guards/
    │   │   ├── auth.guard.ts         ← Verifica autenticación (redirige a /login)
    │   │   └── permission.guard.ts   ← Verifica permisos por ruta
    │   ├── services/
    │   │   ├── auth.service.ts       ← Autenticación con signals + permisos por rol
    │   │   ├── theme.service.ts      ← Modo oscuro con signal + localStorage
    │   │   └── mock-data.service.ts  ← Datos mock + helpers de consulta
    │   ├── models/
    │   │   ├── Accesos/
    │   │   │   ├── rol.model.ts
    │   │   │   ├── permiso.model.ts
    │   │   │   └── usuario.model.ts
    │   │   ├── Catalogos/
    │   │   │   ├── especialidad.model.ts
    │   │   │   ├── estado-cita.model.ts
    │   │   │   ├── estado-solicitud.model.ts
    │   │   │   └── sala.model.ts
    │   │   └── Clinica/
    │   │       ├── Citas/
    │   │       │   ├── cita.model.ts
    │   │       │   ├── consulta.model.ts
    │   │       │   └── solicitud-cita.model.ts
    │   │       ├── Doctores/
    │   │       │   ├── doctor.model.ts
    │   │       │   ├── doctor-especialidad.model.ts
    │   │       │   └── horario-doctor.model.ts
    │   │       └── Pacientes/
    │   │           ├── paciente.model.ts
    │   │           ├── invitacion-paciente.model.ts
    │   │           └── propuesta-reprogramacion.model.ts
    │   └── shared/
    │       ├── components/
    │       ├── directives/
    │       ├── interfaces/
    │       └── pipes/
    │
    └── features/
        ├── login/                    ← Pantalla de inicio de sesión
        ├── dashboard/                ← Panel de estadísticas y resumen
        ├── pacientes/                ← Gestión de pacientes
        ├── doctores/                 ← Tarjetas de doctores
        ├── citas/                    ← Gestión de citas médicas
        ├── solicitudes/              ← Solicitudes de citas
        ├── salas/                    ← Administración de salas
        ├── especialidades/           ← Catálogo de especialidades
        ├── consultas/                ← Historial de consultas
        ├── horarios/                 ← Horarios por doctor
        ├── usuarios/                 ← Gestión de usuarios del sistema
        └── admin/                    ← Roles y permisos (catálogo)
```

---

## Sistema de autenticación y permisos

### Roles del sistema

| ID | Código | Nombre | Permisos |
|---|---|---|---|
| 1 | ADMIN | Administrador | Todos (10/10) |
| 2 | DOCTOR | Doctor | Dashboard, Ver Citas, Consultas |
| 3 | RECEP | Recepción | Dashboard, Pacientes, Citas, Solicitudes |
| 4 | PACIENTE | Paciente | Ver Citas |

### Guards de protección

* **`authGuard`** — Verifica que el usuario esté autenticado; redirige a `/login` si no.
* **`permissionGuard`** — Verifica que el usuario tenga el permiso requerido por la ruta; redirige a `/dashboard` si no.

### Permisos disponibles

| Código | Descripción |
|---|---|
| `GESTIONAR_USUARIOS` | Crear, editar y eliminar usuarios |
| `GESTIONAR_ROLES` | Crear y asignar roles y permisos |
| `VER_DASHBOARD` | Acceso al panel de estadísticas |
| `GESTIONAR_PACIENTES` | CRUD completo de pacientes |
| `GESTIONAR_DOCTORES` | CRUD completo de doctores |
| `GESTIONAR_CITAS` | Crear, editar y cancelar citas |
| `VER_CITAS` | Consultar citas asignadas |
| `GESTIONAR_SOLICITUDES` | Aprobar o rechazar solicitudes |
| `GESTIONAR_CATALOGOS` | Especialidades, salas, horarios |
| `VER_CONSULTAS` | Historial de consultas médicas |

---

## Módulos del sistema

### Login

Pantalla de inicio de sesión con diseño split-screen:

* **Panel izquierdo:** Branding con logo SVG, descripción del sistema y features animadas con backdrop-blur
* **Tarjeta de login:** Logo + título, campos de correo y contraseña con íconos, checkbox "Recordar sesión" (localStorage), enlace "¿Olvidaste tu contraseña?" (diálogo de recuperación), botón "Iniciar Sesión", enlace "Contacta al administrador" (diálogo con datos de contacto)
* Fondo con gradiente azul-púrpura, diseño responsive

### Dashboard

Panel de resumen con:

* Tarjetas de estadísticas (pacientes, doctores, citas, salas)
* Tabla de citas recientes con avatares y tags de estado
* Distribución de citas por estado
* Títulos de features con gradiente decorativo

### Módulos de gestión (tabla modernizada)

Todos los módulos de tabla comparten el sistema de clases CSS `.mod-*`:

| Módulo | Ruta | Características |
|---|---|---|
| **Pacientes** | `/pacientes` | Stats bar, búsqueda, avatares con iniciales, acciones (ver/editar/eliminar) |
| **Citas** | `/citas` | Stats por estado, avatares doctor/paciente, datetime, duración, transición de estados |
| **Solicitudes** | `/solicitudes` | Stats bar, avatares, acciones aprobar/rechazar, estado vacío |
| **Usuarios** | `/usuarios` | Stats por rol, avatares color por rol, gestión de contraseña |
| **Especialidades** | `/especialidades` | Stats, íconos de avatar, CRUD con dialog |
| **Horarios** | `/horarios` | Agrupado por doctor, chips de días |
| **Consultas** | `/consultas` | Tarjetas con motivo, notas y tratamiento |
| **Admin (Permisos)** | `/admin` | Stats, búsqueda, chips de rol coloreados, íconos de avatar |

### Doctores (tarjetas)

Ruta: `/doctores` — Diseño de tarjetas modernas:

* Barra de filtros: búsqueda por nombre/especialidad + filtro por especialidad + contador
* Tarjetas con banner degradado (6 variantes de color), avatar circular con iniciales superpuesto
* Nombre centrado, etiqueta de especialidad, estadísticas (pacientes + rating)
* Barra de horario (hora + sala), botones "Ver" y "Editar"
* Diálogo de detalle completo con horarios por día
* Estado vacío cuando no hay resultados

### Salas (tarjetas)

Ruta: `/salas` — Tarjetas con búsqueda por nombre, código o ubicación.

---

## Sistema de diseño

### Modo oscuro

* **ThemeService** con signal (`isDark`) y persistencia en `localStorage` (key: `medicitas-theme`)
* Respeta `prefers-color-scheme` del sistema operativo
* Toggle en el header del layout
* PrimeNG Aura con `darkModeSelector: '.dark-mode'`

### CSS Custom Properties

40+ variables CSS definidas en `:root` (modo claro) y `.dark-mode`:

```css
/* Ejemplos */
--bg-color, --surface-card, --surface-ground
--text-color, --text-color-secondary
--accent (indigo/blue)
--border-color, --card-radius, --card-shadow
--sidebar-bg, --sidebar-hover, --sidebar-shadow
--login-gradient
```

### Clases utilitarias compartidas (`.mod-*`)

Sistema de clases CSS reutilizables en `styles.css` para todos los módulos de tabla:

| Clase | Uso |
|---|---|
| `.mod-stats` | Grid de estadísticas (4 columnas) |
| `.mod-stat-item` | Tarjeta individual de estadística |
| `.mod-stat-icon` | Ícono con 7 variantes de color |
| `.mod-table-card` | Contenedor de tabla con bordes y sombra |
| `.mod-caption` | Encabezado de tabla con búsqueda y contador |
| `.mod-search` | Campo de búsqueda con ícono |
| `.mod-person` | Avatar + nombre + subtítulo |
| `.mod-avatar` | Avatar circular con 6 variantes de gradiente |
| `.mod-datetime` | Formato fecha + hora separados |
| `.mod-duration` | Badge de duración en minutos |
| `.mod-actions` | Contenedor de botones de acción |
| `.mod-action-btn` | Botón de acción con 7 variantes de color |
| `.mod-empty` | Estado vacío centrado |

### Tipografía

Google Fonts **Inter** (weights 400, 500, 600, 700, 800) importada globalmente.

---

## Base de datos

El frontend está diseñado para consumir una API REST conectada a **SQL Server** con la base de datos `dbCitasMedicas`.

### Esquemas

| Esquema | Tablas |
|---|---|
| `Accesos` | Roles, Permisos, RolPermisos, Usuarios |
| `Catalogos` | Especialidades, Salas, EstadosCita, EstadosSolicitud |
| `Clinica` | Pacientes, Doctores, DoctorEspecialidades, HorariosDoctores, SolicitudesCitas, Citas, Consultas, InvitacionesPacientes, PropuestasReprogramacion |

### Datos mock actuales

> El frontend utiliza un **MockDataService** con datos de prueba precargados:

| Entidad | Cantidad |
|---|---|
| Roles | 4 |
| Permisos | 10 |
| Usuarios | 6 |
| Pacientes | 10 |
| Doctores | 6 |
| Especialidades | 8 |
| Salas | 8 |
| Citas | 10 |
| Solicitudes | 8 |
| Consultas | 4 |
| Horarios | 18 |

---

## Componentes PrimeNG utilizados

* **Layout:** Toast, ConfirmDialog, Toolbar, Divider
* **Datos:** Table (sort, paginator), Tag, Avatar, MeterGroup
* **Formularios:** Dialog, InputText, Textarea, IconField, InputIcon
* **Acciones:** Button (rounded, text, severity), Tooltip
* **Tema:** Aura con modo oscuro via `.dark-mode` selector

---

## Rutas de la aplicación

| Ruta | Componente | Guard | Permiso requerido |
|---|---|---|---|
| `/login` | LoginComponent | — | — |
| `/dashboard` | DashboardComponent | auth + permission | `VER_DASHBOARD` |
| `/pacientes` | PacientesComponent | auth + permission | `GESTIONAR_PACIENTES` |
| `/doctores` | DoctoresComponent | auth + permission | `GESTIONAR_DOCTORES` |
| `/citas` | CitasComponent | auth + permission | `VER_CITAS` |
| `/solicitudes` | SolicitudesComponent | auth + permission | `GESTIONAR_SOLICITUDES` |
| `/salas` | SalasComponent | auth + permission | `GESTIONAR_CATALOGOS` |
| `/especialidades` | EspecialidadesComponent | auth + permission | `GESTIONAR_CATALOGOS` |
| `/consultas` | ConsultasComponent | auth + permission | `VER_CONSULTAS` |
| `/horarios` | HorariosComponent | auth + permission | `GESTIONAR_CATALOGOS` |
| `/usuarios` | UsuariosComponent | auth + permission | `GESTIONAR_USUARIOS` |
| `/admin` | AdminComponent | auth + permission | `GESTIONAR_ROLES` |

---

## Notas técnicas

* **Standalone components** — Cada feature es un componente standalone independiente.
* **Arquitectura por features** — Separación clara entre layout, core (services/guards/models) y features.
* **Signals** — AuthService y ThemeService usan `signal()` y `computed()` de Angular.
* **Control flow moderno** — `@if` / `@for` / `@empty` (sin `*ngIf` / `*ngFor`).
* **Modelos organizados por dominio** — Accesos, Catálogos, Clínica (Citas, Doctores, Pacientes).
* **MockDataService** — Singleton con `providedIn: 'root'`, helpers de consulta y contadores de ID.
* **Sidebar dinámico** — Menú filtrado por permisos del usuario autenticado con `AuthService.hasPermission()`.
* **Dark mode** — Toggle persistente con CSS custom properties y tema Aura.
* **Rama activa:** `modelos-organizacion-carpetas`.
* Asistencia de inteligencia artificial para desarrollo, diseño y documentación.

