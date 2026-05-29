# Guía de Despliegue - Orqelis

Esta guía detalla los pasos necesarios para desplegar el proyecto Orqelis tanto de forma local como utilizando Docker.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: Versión 22 o superior.
- **pnpm**: Gestor de paquetes (Instalar con `npm install -g pnpm`).
- **Docker y Docker Compose**: (Solo para el despliegue con Docker).
- **Git**: Para clonar el repositorio.

---

## ⚙️ 1. Configuración de Variables de Entorno

El proyecto utiliza variables de entorno para configurar la seguridad y la base de datos.

1.  **En la raíz del proyecto**, crea un archivo llamado `.env` y genera los secretos automáticamente:
    ```bash
    pnpm gen:secrets
    ```
    *Este comando copiará `.env.template` a `.env` y generará claves seguras automáticamente.*

2.  **Alternativa manual**:
    -   Copia el archivo: `cp .env.template .env`
    -   Edita el archivo `.env` y configura manualmente los valores.
    -   `JWT_SECRET`: Una cadena larga y aleatoria.
    -   `REFRESH_TOKEN_SECRET`: Otra cadena larga y aleatoria.
    -   `CREDENTIAL_ENCRYPTION_KEY`: Una clave de 32 caracteres (para encriptar contraseñas de bases de datos externas).
    -   `SETUP_TOKEN`: Un token que elegirás tú (ej: `mi-token-secreto-123`). Lo necesitarás al entrar por primera vez a la web.

> **Importante**: No compartas este archivo `.env` ni lo subas al control de versiones.

---

## 💻 2. Despliegue Local (Entorno de Desarrollo)

Sigue estos pasos para ejecutar el proyecto directamente en tu sistema operativo.

### Paso 2.1: Instalación
Instala todas las dependencias del monorepo:
```bash
pnpm install
```

### Paso 2.2: Preparación del Código Compartido
Como es un monorepo, el frontend y el backend dependen de un paquete común. Debes compilarlo primero:
```bash
pnpm build:shared
```

### Paso 2.3: Inicializar Base de Datos
Orqelis usa Prisma con SQLite por defecto. Ejecuta los siguientes comandos para preparar la base de datos local:
```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### Paso 2.4: Arrancar el proyecto
Ejecuta el comando de desarrollo que inicia tanto el backend como el frontend:
```bash
pnpm dev
```

-   **Frontend**: Accede a `http://localhost:3000`
-   **Backend**: Accede a `http://localhost:3001`

---

## 🐳 3. Despliegue con Docker (Recomendado para Producción)

Docker simplifica el despliegue al empaquetar todo lo necesario (Node, Nginx, dependencias) en contenedores.

### Paso 3.1: Preparar el archivo .env
Asegúrate de haber realizado el **Punto 1** de esta guía. Docker Compose leerá ese archivo automáticamente.

### Paso 3.2: Construir e Iniciar
Desde la raíz del proyecto, ejecuta:
```bash
docker-compose up -d --build
```

-   **-d**: Ejecuta en segundo plano (detached mode).
-   **--build**: Asegura que se construyan las imágenes con los últimos cambios.

### Paso 3.3: Acceso y Configuración Inicial (Wizard)
1.  Abre tu navegador en `http://localhost:3000`.
2.  Serás redirigido al **Wizard de Configuración**.
3.  Introduce el `SETUP_TOKEN` que definiste en tu archivo `.env`.
4.  Sigue los pasos en pantalla para crear tu cuenta de administrador.

---

## 🔍 4. Verificación y Solución de Problemas

### En Docker:
-   **Ver logs en tiempo real**: `docker-compose logs -f`
-   **Ver estado de contenedores**: `docker-compose ps`
-   **Verificar API**: Accede a `http://localhost:3001/health`. Debería devolver `{"status":"ok"}`.
-   **Error de Variables**: Si el backend no arranca y muestra errores de "Missing required variable", asegúrate de haber generado o configurado todos los secretos en el archivo `.env`. En producción, el sistema no arrancará sin estos valores por seguridad.
-   **Error de permisos**: Si el contenedor de backend falla al escribir la base de datos, asegúrate de que el directorio `./data` (creado por docker) tenga permisos de escritura.

### En Local:
-   **Puertos ocupados**: Asegúrate de que los puertos `3000` y `3001` estén libres.
-   **Error de Shared Package**: Si ves errores de importación de `@orqelis/shared`, asegúrate de haber ejecutado `pnpm build:shared`.
-   **Prisma Client**: Si recibes errores de Prisma, ejecuta `pnpm prisma:generate`.

---

## 🏁 Notas Finales
- Para despliegues en la nube, asegúrate de cambiar `FRONTEND_ORIGIN` y las variables de base de datos si no usas SQLite.
- Mantén tus secretos seguros y nunca los subas a repositorios públicos.
