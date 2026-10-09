# En Equipo

Aplicación web responsive para organizar responsabilidades del hogar entre varias personas. El proyecto separa la interfaz React de una API REST Express y persiste los datos en un archivo JSON local.

## Requisitos

- Node.js 20.19 o superior.
- npm.

## Desarrollo

```bash
npm install
npm run dev
```

La interfaz queda en `http://localhost:5173` y la API en `http://localhost:3001`. Sin una sesión iniciada, la app abre directamente el organizador con datos de prueba y permite probar las tareas y los integrantes. Esos cambios viven solo en memoria y vuelven a los datos iniciales al recargar. Al iniciar sesión, se carga el hogar de la cuenta y los cambios se guardan en el servidor.

Cada persona crea una cuenta con correo y contraseña, nombre y apellido/s, y puede elegir un apodo. De forma predeterminada, los demás ven solo el nombre de pila; el apellido se muestra únicamente si la persona selecciona el nombre completo. También puede elegir el apodo como nombre visible. Para sumar a alguien, quien administra el hogar puede invitar una cuenta por correo. La persona acepta desde su propia sesión. También puede unirse por su cuenta con el código aleatorio corto de 10 caracteres o el QR; buscar por nombre envía una solicitud que debe aprobarse. Una cuenta puede pertenecer a varios hogares. El perfil admite foto o iniciales, color, tema claro u oscuro y un código de recuperación de 16 caracteres, de un solo uso. No se envían correos: las invitaciones aparecen dentro de la app y el código de recuperación se muestra al crear la cuenta o cuando se rota desde el perfil.

## Producción local

```bash
npm run build
npm start
```

Express sirve la compilación del frontend y la API desde `http://localhost:3001`.

El servidor local escucha solo en esta computadora y guarda los datos en un archivo JSON. La contraseña se guarda como hash scrypt y la sesión usa una cookie HttpOnly. Para que varias personas entren desde otros dispositivos, hace falta desplegar el backend en una dirección accesible y usar una base de datos compartida.

## Estructura

```text
src/
  app/                 Aplicación raíz y estilos de pantalla
  components/          Acceso, hogares, navegación, tareas y formularios
  features/household/  Categorías y lógica de presentación del hogar
  services/            Cliente HTTP de la API
  styles/              Estilos globales
server/
  data/                Persistencia local en JSON
  src/
    config/            Categorías y estados válidos
    controllers/       Validación de entradas y respuestas HTTP
    middleware/        Sesiones, acceso a hogares y manejo de errores
    repositories/      Lectura y escritura persistente
    routes/            Rutas REST
    services/          Cuentas, hogares, integrantes y tareas
    utils/             Utilidades del servidor
```

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del servidor |
| `POST` | `/api/auth/register` | Crear una cuenta e iniciar sesión |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET` | `/api/auth/me` | Obtener la cuenta y sus hogares |
| `POST` | `/api/auth/recover` | Recuperar el acceso con el código de recuperación y cambiar la contraseña |
| `POST` | `/api/auth/invitations/:invitationId` | Aceptar o rechazar una invitación a un hogar |
| `PATCH` | `/api/auth/profile` | Cambiar nombre visible, apodo, foto, color o tema |
| `POST` | `/api/auth/recovery-code` | Rotar el código de recuperación con la contraseña actual |
| `GET` | `/api/demo` | Obtener datos públicos aislados para la vista de muestra |
| `GET` | `/api/households` | Listar los hogares de la cuenta |
| `POST` | `/api/households` | Crear un hogar y su código de invitación |
| `POST` | `/api/households/join` | Unirse a un hogar con su código |
| `GET` | `/api/households/discover?q=...` | Buscar hogares por nombre sin revelar códigos de invitación |
| `POST` | `/api/households/:householdId/join-requests` | Pedir acceso a un hogar |
| `PATCH` | `/api/households/:householdId/join-requests/:requestId` | Aprobar o rechazar una solicitud (administrador) |
| `GET` | `/api/households/:householdId` | Ver integrantes y tareas del hogar |
| `POST` | `/api/households/:householdId/members` | Invitar una cuenta por correo (administrador) |
| `PATCH` | `/api/households/:householdId/members/:memberId` | Editar un integrante temporal de prueba |
| `DELETE` | `/api/households/:householdId/members/:memberId` | Quitar o salir de un hogar |
| `POST` | `/api/households/:householdId/tasks` | Crear una tarea |
| `PATCH` | `/api/households/:householdId/tasks/:id` | Editar estado, responsable o datos de una tarea |
| `DELETE` | `/api/households/:householdId/tasks/:id` | Eliminar una tarea |

Las tareas aceptan categorías `chores`, `shopping`, `payments` y `repairs`; sus estados son `pending`, `in_progress` y `done`.
