
# CitasMedicas

Sistema web para la gestión de citas médicas desarrollado con Angular 21 y arquitectura modular por dominios.

---

## Tecnologías utilizadas

* Angular 21  
* TypeScript  
* Bootstrap 5  
* Font Awesome 6  
* Arquitectura modular (core / features / models)  
* Consumo de API REST  

---

## Estructura del proyecto

* src  
  * app  
    * core  
      * models → entidades y contratos de datos (ej. Usuario, Paciente, Doctor).  
      * services → servicios globales singleton (ej. AuthService, ApiService).  
      * guards → protección de rutas y control de acceso.  
      * interceptors → interceptores HTTP para añadir cabeceras, manejar errores, etc.  
    * shared  
      * components → componentes reutilizables (botones, tablas, modales).  
      * directives → directivas personalizadas para extender HTML (validaciones, permisos).  
      * interfaces → contratos de datos reutilizables en distintos módulos.  
      * pipes → transformadores de datos para la vista (formateo de fechas, texto).  
    * features  
      * accesos → módulo de gestión de usuarios y roles.  
      * clinica → módulo de pacientes, doctores, citas y consultas.  
      * catalogos → módulo de especialidades, salas y estados.  

Organización basada en separación por dominios funcionales para facilitar escalabilidad y mantenimiento.

---

## Base de datos

Los scripts de creación y consulta de la base de datos se encuentran en la carpeta `Database/`.  
No se debe alterar la lógica SQL existente; las interfaces en `src/app/core/models` reflejan las tablas y columnas definidas en los archivos SQL.

Los principales archivos son:

* `QueryCitas.sql` – esquema completo con tablas, relaciones y restricciones.  
* `SQLQuery1.sql`, `SQLQuery2.sql` – consultas o scripts de ejemplo.  

Al modificar la base de datos, asegúrate primero de actualizar estos archivos y luego sincronizar cualquier cambio en los modelos TypeScript.

---

## Servidor de desarrollo

```bash
ng serve
```

Abrir en el navegador:  
```
http://localhost:4200/
```

La aplicación se recarga automáticamente al detectar cambios.

---

## Generar componentes

```bash
ng generate component nombre-componente
```

Para ver todas las opciones:  
```bash
ng generate --help
```

---

## Compilar el proyecto

```bash
ng build
```

El resultado se almacena en la carpeta `dist/`.

---

## Pruebas unitarias

```bash
ng test
```

---

## Pruebas end-to-end

```bash
ng e2e
```

---

## Características principales del sistema

* Gestión de usuarios y roles  
* Registro de pacientes  
* Gestión de doctores y especialidades  
* Configuración de horarios médicos  
* Solicitudes de citas  
* Reprogramación de citas  
* Control de estados de citas  
* Registro de consultas médicas  

---

## Notas técnicas

* Separación de modelos por dominio.  
* Rutas organizadas por módulo funcional.  
* Bootstrap para estilos globales.  
* Font Awesome para iconografía.  
* Arquitectura modular siguiendo buenas prácticas empresariales.  
* Asistencia de inteligencia artificial para optimización de estructura y documentación.  

