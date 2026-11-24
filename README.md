# InventarioPro

**Sistema SaaS de gestión de inventarios y pedidos para MicroPyMEs.**

Proyecto académico desarrollado para la asignatura Buenas Prácticas de Desarrollo de Software (BPDS), Universidad de la Costa.

## 1. Descripción

InventarioPro es una aplicación web orientada a facilitar la administración de productos e inventarios de pequeñas y medianas empresas.

El proyecto utiliza una arquitectura cliente-servidor:

- **Frontend:** Next.js, React y TypeScript.
- **Backend:** Node.js, Express y TypeScript.
- **Comunicación:** API REST mediante solicitudes HTTP.
- **Estilos:** Tailwind CSS.

## 2. Tecnologías y herramientas

| Tecnología | Versión |
|---|---|
| Node.js | 26.13.1 (entorno utilizado) |
| npm | 11.20.0 (entorno utilizado) |
| pnpm | 12.23.0 (entorno utilizado) |
| Next.js | 16.4.6 |
| React | 19.3.0 |
| React DOM | 19.3.0 |
| TypeScript (frontend) | ^5 |
| TypeScript (backend) | ^7.0.2 |
| Express | ^5.3.0 |
| Tailwind CSS | 4.3.3 |
| Git | 2.55.0 (entorno utilizado) |

## 3. Dependencias del frontend

Ubicación: `frontend/`

### Dependencias principales

| Paquete | Versión | Función |
|---|---|---|
| next | 16.4.6 | Framework para desarrollar la aplicación web. |
| react | 19.3.0 | Biblioteca para construir interfaces de usuario. |
| react-dom | 19.3.0 | Renderizado de componentes React. |

### Dependencias de desarrollo

| Paquete | Versión | Función |
|---|---|---|
| @tailwindcss/turbopack | 4.3.3 | Integración de Tailwind CSS con Turbopack. |
| @types/node | ^20 | Tipos de Node.js para TypeScript. |
| @types/react | ^19 | Definiciones de tipos para React. |
| @types/react-dom | ^19 | Definiciones de tipos para React DOM. |
| eslint | ^9 | Análisis estático y detección de problemas en el código. |
| eslint-config-next | 16.4.6 | Reglas de ESLint para Next.js. |
| tailwindcss | 4.3.3 | Framework de estilos CSS. |
| typescript | ^5 | Lenguaje tipado utilizado en el frontend. |

### Scripts disponibles

Ejecutar desde `frontend/`:

```bash
pnpm dev
```
Inicia el servidor de desarrollo.

```bash
pnpm build
```
Genera la compilación de producción.

```bash
pnpm start
```
Inicia la aplicación compilada.

```bash
pnpm lint
```
Ejecuta ESLint para revisar el código.

## 4. Dependencias del backend

Ubicación: `backend/`

### Dependencias principales

| Paquete | Versión | Función |
|---|---|---|
| express | ^5.3.0 | Framework para crear el servidor y la API REST. |
| cors | ^2.8.5 | Permite configurar solicitudes entre diferentes orígenes. |

### Dependencias de desarrollo

| Paquete | Versión | Función |
|---|---|---|
| @types/express | ^5.0.6 | Definiciones de tipos de Express. |
| @types/node | ^26.6.6 | Definiciones de tipos de Node.js. |
| @types/cors | Según package-lock.json | Definiciones de tipos para CORS. |
| tsx | ^4.23.15 | Ejecución de TypeScript durante el desarrollo. |
| typescript | ^7.0.2 | Compilación y verificación de TypeScript. |

### Scripts disponibles

Ejecutar desde `backend/`:

```bash
npm run dev
```
Inicia el servidor en modo desarrollo.

```bash
npm run typecheck
```
Verifica los tipos de TypeScript sin generar archivos.

```bash
npm run build
```
Compila el backend.

```bash
npm start
```
Inicia el servidor compilado.

## 5. Requisitos previos

Antes de instalar el proyecto, se necesita:

- Git.
- Node.js.
- npm.
- pnpm.
- Visual Studio Code (recomendado).

## 6. Instalación del proyecto

### 6.1. Clonar el repositorio

```bash
git clone https://github.com/alvarojosegome/bpds-gestion-inventarios.git
```

Ingresar al proyecto:

```bash
cd bpds-gestion-inventarios
```

### 6.2. Instalar dependencias del frontend

```bash
cd frontend
pnpm install
```

### 6.3. Configurar variables de entorno

Crear el archivo `.env.local` dentro de `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 6.4. Instalar dependencias del backend

Desde la raíz del proyecto:

```bash
cd ../backend
npm install
```

## 7. Ejecución del proyecto

Se deben abrir dos terminales.

**Terminal 1: Backend**

```bash
cd backend
npm run dev
```

El servidor estará disponible en:

`http://localhost:4000`

Comprobar el estado de la API:

`http://localhost:4000/api/health`

**Terminal 2: Frontend**

```bash
cd frontend
pnpm dev
```

La aplicación estará disponible en:

`http://localhost:3000`

## 8. Funcionalidades implementadas

- Visualización de productos.
- Consulta de productos mediante la API REST.
- Registro de productos.
- Edición de productos existentes.
- Validación de información en el backend.
- Comunicación entre frontend y backend.

**Nota:** Actualmente los productos se almacenan en memoria en el backend. Por lo tanto, los registros se reinician cuando se reinicia el servidor. La persistencia en una base de datos se abordará en una etapa posterior.

## 9. Estructura del proyecto

```text
bpds-gestion-inventarios/
│
├── backend/
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts
│   ├── public/
│   ├── .env.local
│   ├── next.config.ts
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## 10. Control de versiones

El proyecto utiliza Git y GitHub para el trabajo colaborativo.

Repositorio:

https://github.com/alvarojosegome/bpds-gestion-inventarios

Cada integrante trabaja en su propia rama y utiliza Pull Requests para proponer cambios, recibir revisiones y fusionar código en la rama principal.

## 11. Equipo de desarrollo

Proyecto desarrollado por estudiantes de Ingeniería de Sistemas de la Universidad de la Costa.

