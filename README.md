# Orqelis 🚀

**Orqelis** es una plataforma avanzada de gestión de conocimiento técnico diseñada específicamente para desarrolladores. Combina la toma de notas inteligente con visualización de arquitectura, gestión de fragmentos de código (snippets) y una interfaz de consola amigable para optimizar el flujo de trabajo técnico.

Desarrollado con una arquitectura moderna de monorepo, Orqelis ofrece una experiencia robusta, segura y escalable para organizar y conectar ideas complejas.

---

## ✨ Funcionalidades Principales

### 🧠 Gestión de Conocimiento
- **Notas Técnicas Inteligentes**: Escritura enriquecida con soporte para Markdown, resaltado de sintaxis de código (Monaco Editor) y diagramas dinámicos (Mermaid).
- **Diagramas a Mano Alzada**: Notas de tipo diagrama con [Excalidraw](https://excalidraw.com/) integrado y adaptado al estilo de Orqelis (tema claro/oscuro, color de acento, menú y pantalla de bienvenida propios). Se guardan automáticamente y admiten imágenes.
- **Vínculos entre Notas y Diagramas**: `[[Título]]` funciona en textos y enlaces de elementos del lienzo. Los vínculos a diagramas muestran una vista previa al pasar el ratón y una sección de *Diagramas vinculados*; `![[Título]]` incrusta el diagrama dentro de una nota.
- **Grafo de Conocimiento**: Visualización interactiva de las conexiones entre notas y conceptos mediante grafos bidireccionales basados en D3.js.
- **Biblioteca de Snippets**: Organiza y reutiliza fragmentos de código con soporte para múltiples lenguajes y etiquetas personalizadas.

### ⚡ Productividad y Experiencia
- **Consola de Desarrollador**: Interfaz de comandos integrada para navegación rápida y gestión eficiente de notas, diagramas y fragmentos (ver la sección *Consola de Desarrollador*).
- **Atajos de Teclado**: Creación rápida de notas (`Ctrl+Alt+N`) y diagramas (`Ctrl+Alt+D`), paleta de comandos (`Ctrl+K`) y más (ver la sección *Atajos de Teclado*).
- **Búsqueda Global**: Motor de búsqueda de alto rendimiento (FlexSearch) para acceso instantáneo a cualquier información.
- **Visualización de Flujos**: Integración con React Flow para modelado de procesos y arquitecturas.

### 🖼️ Almacenamiento de Archivos
- **Imágenes de Diagramas en Disco**: Las imágenes pegadas en un diagrama se guardan como archivos en `UPLOADS_DIR` (organizados por usuario, workspace y nota). La base de datos solo guarda la ruta, el tipo y el tamaño (modelo `NoteFile`).
- **Limpieza Automática**: Al eliminar una imagen del lienzo se borran también su archivo y su registro.

### 🔒 Seguridad y Control
- **Autenticación Robusta**: Gestión de sesiones segura con JWT, rotación de tokens y cifrado de contraseñas con Argon2.
- **Auditoría de Sistema**: Registro detallado de acciones críticas para mantener la integridad y trazabilidad de los datos.
- **Control de Acceso**: Sistema de roles (Usuario/Admin) para la gestión de permisos y administración de la plataforma.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Ctrl + K` | Abrir la paleta de comandos |
| `Ctrl + Alt + N` | Crear una nueva nota |
| `Ctrl + Alt + D` | Crear un nuevo diagrama |
| `Ctrl + B` | Mostrar u ocultar la barra lateral |
| `Ctrl + Alt + 1…9` | Cambiar al espacio de trabajo 1–9 (fila superior o teclado numérico) |
| `Esc` | Cerrar modales y paletas |
| `Ctrl + S` | Guardar la nota o el diagrama actual |
| `Ctrl + P` | Alternar la vista previa de la nota |
| `Tab` / `↑` `↓` | Autocompletar y recorrer el historial en la consola |

> Dentro del lienzo de un diagrama, `Ctrl + K` (enlace de elemento), `Ctrl + B` y `Esc` pertenecen al editor de dibujo. Pulsa `?` en el lienzo para ver sus atajos. Los atajos con `Ctrl + Alt` funcionan con teclado español e inglés; la tecla `AltGr` sigue escribiendo símbolos como `@` o `#`. La lista completa también está en **Configuración → Atajos de Teclado**.

---

## 🖥️ Consola de Desarrollador

La vista **Consola** acepta comandos con autocompletado (`Tab`). Algunos de los más usados:

| Comando | Descripción |
| :--- | :--- |
| `help` | Lista todos los comandos disponibles |
| `list [notes\|diagrams\|snippets\|groups\|workspaces\|connections\|<categoría>]` | Lista elementos |
| `search <consulta>` | Busca en notas, diagramas (por su texto) y fragmentos |
| `new <título>` | Crea una nota |
| `new-diagram <título>` | Crea un diagrama y lo abre |
| `diagrams` | Lista los diagramas con nº de elementos, imágenes y vínculos |
| `embed <diagrama>` | Copia `![[Título]]` al portapapeles para incrustarlo en una nota |
| `open`, `inspect`, `links`, `favorite`, `delete` `<título>` | Operan sobre notas y diagramas |
| `stats` / `status` | Estadísticas y estado del sistema |
| `tutorial [notes\|diagrams\|snippets\|graph\|console\|styles]` | Guías integradas |

---

## 🛠️ Stack Tecnológico

### 🌐 Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Estado**: [Zustand](https://github.com/pmndrs/zustand)
- **Visualización**: [React Flow](https://reactflow.dev/), [D3.js](https://d3js.org/), [Mermaid](https://mermaid.js.org/), [Excalidraw](https://github.com/excalidraw/excalidraw) (MIT)
- **Utilidades**: Lucide React, Motion (Framer Motion), React Markdown, Monaco Editor, FlexSearch.

### 🖥️ Backend
- **Runtime**: [Node.js](https://nodejs.org/) (Express)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Base de Datos**: [SQLite](https://www.sqlite.org/) / [libSQL](https://turso.tech/libsql)
- **Seguridad**: JWT, Argon2, Helmet, CORS, express-rate-limit, google-auth-library.
- **Validación**: Zod.

### 📦 Monorepo
- **Gestor de Paquetes**: [pnpm](https://pnpm.io/) (Workspaces)
- **Paquete compartido**: `@orqelis/shared` (tipos, esquemas y constantes).

---

## 📂 Estructura del Proyecto

El proyecto está organizado como un monorepo utilizando `pnpm workspaces`:

```text
orqelis/
├── apps/
│   ├── web/                # Aplicación Frontend (React)
│   │   ├── src/
│   │   │   ├── app/        # Lógica central y proveedores
│   │   │   ├── features/   # Módulos funcionales de la UI (notes/diagram: editor Excalidraw)
│   │   │   ├── shared/     # Componentes y hooks reutilizables
│   │   │   └── styles/     # Configuraciones globales de CSS
│   │   └── package.json
│   └── api/                # Aplicación Backend (Express)
│       ├── src/
│       │   ├── modules/    # Lógica de negocio por dominio
│       │   ├── shared/     # Servicios y utilidades globales
│       │   └── tests/      # Pruebas unitarias y de integración
│       ├── prisma/         # Esquema de base de datos y migraciones
│       ├── uploads/        # Imágenes de diagramas en local (ignorado por git)
│       └── package.json
├── packages/
│   └── shared/             # Código compartido entre apps
│       ├── src/            # Tipos, esquemas Zod y constantes
│       └── package.json
├── Dockerfile              # Configuración de construcción multi-etapa
├── docker-compose.yml      # Orquestación de servicios Docker
├── pnpm-workspace.yaml     # Configuración del workspace
├── package.json            # Scripts globales del monorepo
├── tsconfig.base.json      # Configuración base de TypeScript
├── GUIA_DESPLIEGUE.md      # Documentación detallada de despliegue
├── GUIA_ESTILOS_NOTAS.md   # Estándares de estilo para notas y diagramas
├── GUIA_COMMITS.md         # Convenciones de mensajes de commit
├── LICENSE                 # Licencia del proyecto
└── README.md               # Documentación general
```

---

## 💻 Instalación para Desarrollo

### Requisitos Previos
- Node.js (v20 o superior recomendado)
- pnpm instalada globalmente (`npm install -g pnpm`)

### Pasos de Configuración

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno**:
   Orqelis utiliza variables de entorno para la seguridad, base de datos y comunicación entre servicios.
   
   ```bash
   # En la raíz, generar el archivo .env con secretos automáticos
   pnpm gen:secrets
   ```
   
   Este comando crea un archivo `.env` basado en la plantilla y genera claves de seguridad aleatorias. Consulta la sección de [Configuración de Entorno](#configuracion-de-entorno) para más detalles.

3. **Preparar la Base de Datos**:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

4. **Iniciar en modo desarrollo**:
   ```bash
   pnpm dev
   ```
   *Esto iniciará simultáneamente el frontend (puerto 3000) y el backend (puerto 3001).*

---

## 📜 Scripts Disponibles

Desde la raíz del proyecto, puedes ejecutar los siguientes comandos:

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia web y api en paralelo |
| `pnpm dev:web` | Inicia solo el frontend |
| `pnpm dev:api` | Inicia solo el backend |
| `pnpm build` | Compila todos los paquetes (shared -> api -> web) |
| `pnpm build:shared` | Compila el paquete `@orqelis/shared` |
| `pnpm build:api` | Compila la aplicación API |
| `pnpm build:web` | Compila la aplicación Web |
| `pnpm typecheck` | Ejecuta comprobación de tipos en todo el monorepo |
| `pnpm typecheck:shared` | Comprobación de tipos en `@orqelis/shared` |
| `pnpm typecheck:api` | Comprobación de tipos en la API |
| `pnpm typecheck:web` | Comprobación de tipos en la Web |
| `pnpm prisma:generate` | Genera el cliente de Prisma para el backend |
| `pnpm prisma:migrate` | Ejecuta las migraciones de base de datos |

---

## ⚙️ Configuración de Entorno

Orqelis utiliza variables de entorno para gestionar su configuración. El archivo `.env.template` en la raíz contiene todas las variables necesarias.

### Variables del Servidor (Backend)
- `NODE_ENV`: Modo de ejecución (`development` o `production`).
- `PORT`: Puerto en el que corre la API (por defecto `3001`).
- `FRONTEND_ORIGIN`: URL del frontend para configurar CORS (ej: `http://localhost:3000`).
- `DATABASE_URL`: Cadena de conexión a la base de datos (ej: `file:./dev.db`).
- `DB_PROVIDER`: Proveedor de base de datos (`sqlite` por defecto).
- `JWT_SECRET`: Clave secreta para firmar tokens de acceso (Access Tokens).
- `REFRESH_TOKEN_SECRET`: Clave secreta para firmar tokens de refresco (Refresh Tokens).
- `CREDENTIAL_ENCRYPTION_KEY`: Clave de 32 caracteres para encriptar credenciales sensibles.
- `SETUP_TOKEN`: Token de seguridad requerido para acceder al asistente de configuración inicial (Wizard).
- `UPLOADS_DIR` *(opcional)*: Carpeta donde se guardan las imágenes de los diagramas. Por defecto `apps/api/uploads` en local; en Docker se usa `/app/data/uploads` (dentro del volumen persistente).

### Variables del Cliente (Frontend)
- `VITE_API_BASE_URL`: Prefijo para las peticiones a la API (por defecto `/api`).

### Autenticación Social (Opcional)
- `GOOGLE_CLIENT_ID`: ID de cliente para autenticación con Google.
- `ALLOWED_GOOGLE_DOMAINS`: Dominios de correo permitidos (separados por comas).

---

## 🔐 Seguridad

Orqelis implementa múltiples capas de seguridad:
- **Protección de API**: Rate limiting para prevenir abusos y Helmet para cabeceras de seguridad.
- **Autenticación**: JWT con rotación de Refresh Tokens almacenados en cookies `HttpOnly`.
- **Cifrado**: Contraseñas procesadas con Argon2 y datos sensibles en reposo mediante claves de encriptación configurables.
- **Validación**: Estricta validación de entrada en todos los endpoints mediante esquemas de Zod.
- **Subida de Archivos**: Las imágenes de diagramas se validan por tipo (PNG, JPEG, GIF, WebP, SVG) y tamaño (máx. 10 MB), con protección contra *path traversal* y verificación de propiedad. Se sirven con `nosniff` y una CSP en *sandbox*.

---

## 📊 Base de Datos

El sistema utiliza **SQLite** (vía libSQL) por defecto para facilitar el desarrollo local y el despliegue ligero.
- La configuración de la conexión se gestiona en `apps/api/prisma.config.ts`.
- Las migraciones y el esquema se encuentran en `apps/api/prisma/`.
- En entornos Docker, la base de datos se almacena en un volumen persistente para evitar pérdida de datos.
- Las notas tienen un campo `type` (`markdown` o `diagram`). Los diagramas guardan su escena en `diagramData` y su texto en `content` (para búsqueda y vínculos).
- Las imágenes de los diagramas **no** se guardan en la base de datos: el modelo `NoteFile` solo registra la ruta relativa a `UPLOADS_DIR`. Haz copia de seguridad de la base de datos **y** de esa carpeta.

---

## ✅ Calidad y Verificación

Para asegurar la estabilidad del proyecto:
- **TypeScript**: Tipado estricto en todo el codebase.
- **Typecheck**: Verificación periódica con `pnpm typecheck`.
- **Filtros de pnpm**: Gestión eficiente de compilación respetando el orden de dependencias internas.

---

## 🚀 Despliegue

La información detallada sobre cómo desplegar Orqelis en entornos de producción, incluyendo el uso de Docker y configuraciones avanzadas, se encuentra en la guía específica:

👉 [**Ver GUIA_DESPLIEGUE.md**](./GUIA_DESPLIEGUE.md)
👉 [**Ver GUIA_ESTILOS_NOTAS.md**](./GUIA_ESTILOS_NOTAS.md)

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, asegúrate de:
1. Seguir el estilo de código existente.
2. Ejecutar `pnpm typecheck` antes de enviar cambios.
3. Documentar nuevas funcionalidades o cambios importantes.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---

Desarrollado con ❤️ por el equipo de **Orqelis**.
