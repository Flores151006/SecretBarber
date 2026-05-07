# Secret Barber — Documentación Técnica

**Proyecto de Fin de Grado · Alejandro Flores Méndez**

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Tecnologías utilizadas](#3-tecnologías-utilizadas)
4. [Estructura de directorios](#4-estructura-de-directorios)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Instalación y arranque](#6-instalación-y-arranque)
7. [Base de datos — Modelos](#7-base-de-datos--modelos)
8. [API REST — Endpoints](#8-api-rest--endpoints)
9. [Autenticación y seguridad](#9-autenticación-y-seguridad)
10. [Integración con Stripe](#10-integración-con-stripe)
11. [Integración con Google OAuth](#11-integración-con-google-oauth)
12. [Servicio de email (Nodemailer)](#12-servicio-de-email-nodemailer)
13. [Frontend — Rutas y componentes](#13-frontend--rutas-y-componentes)
14. [Frontend — Servicios Angular](#14-frontend--servicios-angular)
15. [Internacionalización (i18n)](#15-internacionalización-i18n)
16. [Panel de administración](#16-panel-de-administración)
17. [Lógica de negocio destacada](#17-lógica-de-negocio-destacada)
18. [Diagrama de flujo de reserva](#18-diagrama-de-flujo-de-reserva)

---

## 1. Descripción general

**Secret Barber** es una aplicación web full-stack para la gestión de reservas de una barbería. Permite a los clientes reservar citas online eligiendo barbero, servicios, fecha, hora y método de pago (efectivo o tarjeta bancaria vía Stripe). Los administradores disponen de un panel de control completo para gestionar reservas, usuarios, reseñas y consultar estadísticas de ingresos.

| Característica | Detalle |
|---|---|
| Tipo | SPA + REST API |
| Backend | Node.js + Express 5 |
| Frontend | Angular 21 (standalone components) |
| Base de datos | MongoDB Atlas (replica set) |
| Autenticación | JWT (access + refresh token) + Google OAuth 2.0 |
| Pagos | Stripe Checkout |
| Idiomas | Español / Inglés |
| Puerto backend | 4000 |
| Puerto frontend | 4200 |

---

## 2. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                  │
│            Angular 21 SPA  ·  localhost:4200            │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / REST (JSON)
                            │ Cookie (refresh token)
┌───────────────────────────▼─────────────────────────────┐
│                  BACKEND (Express 5)                    │
│                    localhost:4000                       │
│                                                         │
│  ┌─────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │ Routes  │→ │Controllers │→ │  Mongoose Models     │ │
│  └─────────┘  └────────────┘  └──────────┬───────────┘ │
│                                           │             │
└───────────────────────────────────────────┼─────────────┘
                                            │ Mongoose ODM
┌───────────────────────────────────────────▼─────────────┐
│                   MongoDB Atlas                         │
│           Base de datos: barberia_db                    │
│   Collections: users · barberos · servicios ·          │
│                bookings · reviews                       │
└─────────────────────────────────────────────────────────┘

Servicios externos:
  ┌─────────┐   ┌──────────────┐   ┌──────────────────┐
  │ Stripe  │   │ Google OAuth │   │ Gmail (SMTP)     │
  │Checkout │   │    2.0       │   │  Nodemailer      │
  └─────────┘   └──────────────┘   └──────────────────┘
```

---

## 3. Tecnologías utilizadas

### Backend

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^5.2.1 | Framework web principal |
| `mongoose` | ^9.4.1 | ODM para MongoDB |
| `jsonwebtoken` | ^9.0.3 | Generación y verificación de JWT |
| `bcrypt` | ^6.0.0 | Hash de contraseñas (10 salt rounds) |
| `passport` | ^0.7.0 | Middleware de autenticación |
| `passport-google-oauth20` | ^2.0.0 | Estrategia OAuth2 con Google |
| `stripe` | ^20.4.0 | Procesamiento de pagos con tarjeta |
| `nodemailer` | ^8.0.1 | Envío de emails de confirmación |
| `express-validator` | ^7.3.1 | Validación y sanitización de entradas |
| `helmet` | ^8.1.0 | Cabeceras de seguridad HTTP |
| `cors` | ^2.8.6 | Control de CORS |
| `cookie-parser` | ^1.4.7 | Parseo de cookies (refresh token) |
| `morgan` | ^1.10.1 | Logger de peticiones HTTP |
| `dotenv` | ^17.3.1 | Variables de entorno |
| `nodemon` | ^3.1.14 | Auto-reinicio en desarrollo |

### Frontend

| Paquete | Versión | Uso |
|---|---|---|
| `@angular/core` | ^21.1.0 | Framework frontend principal |
| `@angular/router` | ^21.1.0 | Enrutamiento SPA con lazy loading |
| `@angular/forms` | ^21.1.0 | Formularios reactivos |
| `@ngx-translate/core` | ^17.0.0 | Internacionalización (i18n) |
| `@ngx-translate/http-loader` | ^17.0.0 | Carga de traducciones |
| `@ng-icons/core` | ^33.1.0 | Sistema de iconos |
| `@ng-icons/lucide` | ^33.2.2 | Iconos Lucide |
| `tailwindcss` | ^3.4.19 | Framework CSS utility-first |
| `chart.js` | ^4.5.1 | Renderizado de gráficos |
| `ng2-charts` | ^10.0.0 | Wrapper Angular para Chart.js |
| `sweetalert2` | ^11.26.21 | Diálogos de confirmación/alerta |
| `aos` | ^2.3.4 | Animaciones al hacer scroll |
| `rxjs` | ~7.8.0 | Programación reactiva |
| `typescript` | ~5.9.2 | Tipado estático |
| `vitest` | ^4.0.8 | Tests unitarios |

---

## 4. Estructura de directorios

```
PROYECTO-FIN-DE-GRADO/
├── backend/
│   ├── src/
│   │   ├── app.js                    ← Entrada principal Express
│   │   ├── config.js                 ← Exporta variables de entorno
│   │   ├── config/
│   │   │   ├── passport.js           ← Estrategia Google OAuth
│   │   │   └── mailer.js             ← Transporter Nodemailer
│   │   ├── data/
│   │   │   └── db.js                 ← Conexión MongoDB (singleton)
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── barbero.model.js
│   │   │   ├── servicio.model.js
│   │   │   ├── booking.model.js
│   │   │   └── review.model.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── review.controller.js
│   │   │   ├── barbero.controller.js
│   │   │   └── servicio.controller.js
│   │   ├── routes/
│   │   │   ├── auth.route.js
│   │   │   ├── google.route.js
│   │   │   ├── users.route.js
│   │   │   ├── booking.route.js
│   │   │   ├── reviews.route.js
│   │   │   ├── barbero.route.js
│   │   │   └── servicio.route.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js    ← autenticarToken, autorizarRol
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── booking.validator.js
│   │   │   ├── user.validator.js
│   │   │   ├── review.validator.js
│   │   │   ├── barbero.validator.js
│   │   │   └── servicio.validator.js
│   │   └── helpers/
│   │       └── email.helper.js       ← Template HTML email confirmación
│   ├── package.json
│   └── .env
│
└── frontend/
    └── src/
        └── app/
            ├── app.ts                ← Componente raíz
            ├── app.routes.ts         ← Definición de rutas
            ├── app.config.ts         ← Providers, interceptors, icons
            ├── core/
            │   ├── services/
            │   │   ├── auth.service.ts
            │   │   ├── booking.service.ts
            │   │   ├── user.service.ts
            │   │   ├── review.service.ts
            │   │   └── languaje.service.ts
            │   ├── guards/
            │   │   ├── auth.guard.ts
            │   │   └── admin.guard.ts
            │   └── interceptors/
            │       └── auth.interceptor.ts
            ├── shared/
            │   ├── models/
            │   │   ├── auth.model.ts
            │   │   ├── user.model.ts
            │   │   ├── booking.model.ts
            │   │   └── review.model.ts
            │   └── components/
            │       └── navbar/
            └── features/
                ├── home/
                ├── about/
                ├── help/
                ├── gallery/
                ├── reviews/
                ├── auth/
                │   ├── login/
                │   ├── register/
                │   └── google-callback/
                ├── bookings/
                │   ├── bookings.ts          ← Crear reserva
                │   ├── booking-confirmation/
                │   ├── booking-success/
                │   ├── booking-cancel/
                │   └── mis-bookings/        ← Mis reservas
                ├── admin/
                │   ├── admin-layout/        ← Sidebar + header
                │   ├── bookings/            ← Gestión reservas
                │   ├── users/               ← Gestión usuarios
                │   ├── reviews/             ← Gestión reseñas
                │   └── estadisticas/        ← Dashboard estadísticas
                └── not-found/
```

---

## 5. Variables de entorno

Archivo: `backend/.env`

```env
# Servidor
PORT=4000
FRONTEND_URL=http://localhost:4200

# Base de datos
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/barberia_db

# JWT
JWT_SECRET=<clave_access_token>          # Expira en 15 minutos
JWT_REFRESH_SECRET=<clave_refresh_token> # Expira en 7 días

# Google OAuth 2.0
GOOGLE_CLIENT_ID=<id_de_app_google>
GOOGLE_CLIENT_SECRET=<secreto_app_google>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Gmail SMTP)
EMAIL_USER=alejandrofloresmendez2006@gmail.com
EMAIL_PASS=<contraseña_de_aplicación_gmail>
```

> **Nota:** El archivo `.env` nunca debe subirse a un repositorio público. Añadirlo a `.gitignore`.

---

## 6. Instalación y arranque

### Requisitos previos
- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas o instancia local de MongoDB

### Backend

```bash
cd backend
npm install
npm run dev      # Desarrollo (nodemon, puerto 4000)
npm start        # Producción
```

### Frontend

```bash
cd frontend
npm install
ng serve         # Desarrollo (puerto 4200)
ng build         # Build de producción → dist/frontend/
```

### Limpiar caché de Vite (si hay errores 504)

```bash
cd frontend
Remove-Item -Recurse -Force ".angular"
ng serve
```

---

## 7. Base de datos — Modelos

### User

```
Collection: users

Campo        Tipo       Restricciones
─────────────────────────────────────
name         String     required, trim
email        String     required, unique, lowercase
password     String     seleccionado explícitamente (excluido por defecto)
googleId     String     unique, sparse
avatar       String     URL foto de perfil (Google)
role         String     enum: ['Admin', 'Cliente'], default: 'Cliente'
active       Boolean    default: true
createdAt    Date       automático (timestamps)
updatedAt    Date       automático (timestamps)
```

### Barbero

```
Collection: barberos

Campo         Tipo       Restricciones
──────────────────────────────────────
nombre        String     required, trim
email         String     unique
diasTrabajo   [Number]   array con días (0=Dom … 6=Sáb)
horaInicio    String     HH:MM (ej. "16:00")
horaFin       String     HH:MM (ej. "21:00")
activo        Boolean    default: true (soft delete)
timestamps    Date       automático
```

### Servicio

```
Collection: servicios

Campo       Tipo      Restricciones
────────────────────────────────────
nombre      String    required, unique
precio      Number    required, EUR
duracion    Number    required, minutos
activo      Boolean   default: true (soft delete)
timestamps  Date      automático
```

**Servicios del catálogo:**

| Servicio | Precio | Duración |
|---|---|---|
| Corte | 15 € | 30 min |
| Barba | 10 € | 20 min |
| Corte y barba | 20 € | 45 min |
| Tinte completo | 35 € | 90 min |
| Mechas | 40 € | 120 min |
| Mechas blancas | 45 € | 120 min |
| Tinte blanco entero | 50 € | 120 min |
| Tinte blanco entero + color | 60 € | 150 min |

> **Extra:** Depilación de cejas +1 € (checkbox opcional en el formulario)

### Booking

```
Collection: bookings

Campo            Tipo       Restricciones
─────────────────────────────────────────
cliente          ObjectId   ref: User, required
barbero          ObjectId   ref: Barbero, required
servicios        [ObjectId] ref: Servicio
fecha            Date       required
hora             String     HH:MM, required
duracionTotal    Number     minutos
precio           Number     EUR
cejas            Boolean    +1€, default: false
metodoPago       String     enum: ['tarjeta', 'efectivo']
estadoPago       String     enum: ['pendiente', 'pagado', 'fallido'], default: 'pendiente'
estado           String     enum: ['pendiente', 'confirmada', 'cancelada', 'completada']
stripeSessionId  String     ID sesión Stripe (nullable)
notas            String     max 300 caracteres
timestamps       Date       automático
```

### Review

```
Collection: reviews

Campo       Tipo       Restricciones
─────────────────────────────────────
cliente     ObjectId   ref: User, required
reserva     ObjectId   ref: Booking, required, unique (1 reseña/reserva)
puntuacion  Number     1–5, required
comentario  String     10–500 caracteres
visible     Boolean    default: true (control de moderación)
timestamps  Date       automático
```

---

## 8. API REST — Endpoints

**Base URL:** `http://localhost:4000/api`

**Leyenda de permisos:**
- `🔓 Público` — Sin autenticación
- `🔑 Auth` — Requiere JWT válido
- `🛡️ Admin` — Requiere rol Admin

---

### Autenticación `/api/auth`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/register` | 🔓 Público | Registro de usuario nuevo |
| POST | `/login` | 🔓 Público | Login con email y contraseña |
| POST | `/refresh-token` | 🔓 Público | Renueva access token usando refresh cookie |
| POST | `/logout` | 🔑 Auth | Invalida la sesión (borra cookie) |

**Validaciones en `/register`:**
- `name`: requerido, mínimo 2 caracteres
- `email`: formato válido, único en BD
- `password`: mínimo 8 caracteres, 1 mayúscula, 1 número

**Respuesta `/login`:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": { "_id": "...", "name": "...", "email": "...", "role": "Cliente" }
}
```
El `refreshToken` se devuelve en una **cookie httpOnly** (`refreshToken`).

---

### Google OAuth `/api/auth/google`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/` | 🔓 Público | Redirige a pantalla de Google |
| GET | `/callback` | 🔓 Público | Callback tras autenticación Google |

Tras el callback exitoso, redirige al frontend con el access token en la URL:
```
http://localhost:4200/auth/google?token=eyJhbGc...
```

---

### Reservas `/api/bookings`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/disponibilidad` | 🔑 Auth | Horarios disponibles para fecha/barbero/duración |
| GET | `/` | 🛡️ Admin | Todas las reservas (populadas) |
| GET | `/mis` | 🔑 Auth | Reservas del usuario autenticado |
| POST | `/` | 🔑 Auth | Crear nueva reserva |
| POST | `/webhook` | 🔓 Público* | Webhook de Stripe (firma verificada) |
| PATCH | `/:id` | 🔑 Auth | Cancelar reserva propia |
| PATCH | `/:id/estado` | 🛡️ Admin | Cambiar estado (confirmada/completada/cancelada) |
| PATCH | `/:id/pago` | 🛡️ Admin | Marcar como pagado (efectivo) |
| PATCH | `/:id/modificar` | 🔑 Auth | Modificar reserva (barbero/servicios/fecha/hora) |
| GET | `/estadisticas` | 🛡️ Admin | Resumen de ingresos y estadísticas |

**Parámetros de `/disponibilidad`:**
```
GET /api/bookings/disponibilidad?barberoId=...&fecha=2024-03-15&duracion=45
```

**Body de `POST /`:**
```json
{
  "barbero":    "64a1b2c3d4e5f6789abc0001",
  "servicios":  ["64a1b2c3d4e5f6789abc0010", "64a1b2c3d4e5f6789abc0011"],
  "fecha":      "2024-03-15",
  "hora":       "17:00",
  "metodoPago": "tarjeta",
  "cejas":      false,
  "notas":      "Opcional"
}
```

**Respuesta cuando `metodoPago = "tarjeta"`:**
```json
{ "url": "https://checkout.stripe.com/pay/cs_test_..." }
```

**Respuesta `GET /estadisticas`:**
```json
{
  "resumen": {
    "totalHoy": 45, "totalSemana": 210, "totalMes": 890, "totalAnio": 10450,
    "reservasHoy": 3, "reservasSemana": 14, "reservasMes": 59, "reservasAnio": 695,
    "ticketMedio": 18.5
  },
  "ingresosPorMes": [{ "mes": "Ene", "total": 820 }, ...],
  "serviciosRanking": [{ "nombre": "Corte", "count": 245 }, ...]
}
```

---

### Usuarios `/api/users`

Todos los endpoints requieren 🛡️ Admin.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista todos los usuarios (sin password ni googleId) |
| GET | `/:id` | Obtiene un usuario por ID |
| POST | `/` | Crea un usuario |
| PUT | `/:id` | Actualiza nombre, email, rol o estado activo |
| DELETE | `/:id` | Elimina usuario (protegido: no auto-eliminación, mínimo 1 admin) |

---

### Reseñas `/api/reviews`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/` | 🔓 Público | Reseñas visibles (ordenadas por fecha desc) |
| GET | `/admin` | 🛡️ Admin | Todas las reseñas incluyendo ocultas |
| POST | `/` | 🔑 Auth | Crear reseña (1 por reserva completada) |
| PATCH | `/:id` | 🛡️ Admin | Alternar visibilidad (visible/oculta) |
| DELETE | `/:id` | 🛡️ Admin | Eliminar reseña |

**Body de `POST /`:**
```json
{
  "reserva":    "64a1b2c3d4e5f6789abc0020",
  "puntuacion": 5,
  "comentario": "Excelente servicio, muy profesional."
}
```

---

### Barberos `/api/barberos`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/` | 🔓 Público | Barberos activos (para formulario de reserva) |
| GET | `/todos` | 🛡️ Admin | Todos los barberos |
| POST | `/` | 🛡️ Admin | Crear barbero |
| PATCH | `/:id` | 🛡️ Admin | Actualizar barbero |
| DELETE | `/:id` | 🛡️ Admin | Soft delete (activo: false) |

---

### Servicios `/api/servicios`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/` | 🔓 Público | Servicios activos (para formulario de reserva) |
| GET | `/todos` | 🛡️ Admin | Todos los servicios |
| POST | `/` | 🛡️ Admin | Crear servicio |
| PATCH | `/:id` | 🛡️ Admin | Actualizar servicio |
| DELETE | `/:id` | 🛡️ Admin | Soft delete (activo: false) |

---

## 9. Autenticación y seguridad

### Flujo JWT

```
1. Cliente → POST /api/auth/login
2. Servidor genera:
     accessToken  (JWT, exp: 15 min, firmado con JWT_SECRET)
     refreshToken (JWT, exp: 7 días, firmado con JWT_REFRESH_SECRET)
3. accessToken → body JSON de la respuesta
   refreshToken → cookie httpOnly (no accesible desde JS)

4. En cada petición protegida:
     Authorization: Bearer <accessToken>

5. Cuando el accessToken expira:
     POST /api/auth/refresh-token  (con la cookie automáticamente)
     → nuevo accessToken en la respuesta

6. El interceptor Angular (auth.interceptor.ts) gestiona el refresco
   automáticamente con retry + BehaviorSubject para evitar múltiples
   peticiones concurrentes de refresco.
```

### Middleware de autenticación (`auth.middleware.js`)

```javascript
autenticarToken   // Verifica JWT en header Authorization
autorizarRol(...roles)  // Comprueba que user.role esté en la lista
generarAccessToken(user)   // Genera JWT de 15 min
generarRefreshToken(user)  // Genera JWT de 7 días
verificarRefreshToken(token) // Decodifica y valida refresh token
```

### Guards Angular

| Guard | Archivo | Protege |
|---|---|---|
| `authGuard` | `core/guards/auth.guard.ts` | Rutas que requieren login |
| `adminGuard` | `core/guards/admin.guard.ts` | Panel de administración |

Si `authGuard` bloquea el acceso, redirige a `/login?returnUrl=<ruta>` y, tras el login exitoso, navega automáticamente a la ruta original.

### Interceptor HTTP (`auth.interceptor.ts`)

- Añade automáticamente el `Authorization: Bearer <token>` a todas las peticiones al backend.
- Si la respuesta es `401`, intenta refrescar el token y reintenta la petición original.
- Evita bucles de refresco infinitos en las propias rutas de auth.

### Seguridad adicional

| Medida | Implementación |
|---|---|
| Hash de contraseñas | bcrypt, 10 salt rounds |
| Cabeceras seguras | helmet |
| CORS restringido | Solo `localhost:4200`, `credentials: true` |
| Validación de entradas | express-validator en todos los endpoints |
| Mensaje genérico en login | "Credenciales incorrectas" (evita enumeración de emails) |
| Campos excluidos | `password` y `googleId` no se devuelven en las consultas de usuario |
| Webhook Stripe | Firma verificada con `STRIPE_WEBHOOK_SECRET` |

---

## 10. Integración con Stripe

### Flujo completo de pago con tarjeta

```
1. Usuario selecciona "Tarjeta" en el formulario de reserva
2. Frontend → POST /api/bookings
3. Backend crea la reserva con estado "pendiente" y estadoPago "pendiente"
4. Backend crea sesión Stripe Checkout:
     - line_items: descripción del servicio y precio
     - success_url: http://localhost:4200/reserva-exitosa
     - cancel_url:  http://localhost:4200/reserva-cancelada
     - metadata: { bookingId: "<id>" }
5. Backend guarda stripeSessionId en la reserva
6. Backend devuelve { url: "https://checkout.stripe.com/pay/..." }
7. Frontend redirige window.location.href = url

── Usuario completa el pago en Stripe ──

8. Stripe envía evento "checkout.session.completed" a:
   POST /api/bookings/webhook
9. Backend verifica la firma del webhook con STRIPE_WEBHOOK_SECRET
10. Extrae bookingId de session.metadata
11. Actualiza la reserva:
      estado    → "confirmada"
      estadoPago → "pagado"
12. Envía email de confirmación al cliente (Nodemailer)
13. Stripe redirige al usuario a success_url
```

### Configuración Stripe en backend

```javascript
// Crear sesión de pago
const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'eur', ... }, quantity: 1 }],
    mode: 'payment',
    success_url: `${FRONTEND_URL}/reserva-exitosa`,
    cancel_url: `${FRONTEND_URL}/reserva-cancelada`,
    metadata: { bookingId: booking._id.toString() }
});
```

> **Nota de desarrollo:** El webhook requiere que Stripe pueda alcanzar el backend. En local se usa [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:4000/api/bookings/webhook`

---

## 11. Integración con Google OAuth

### Flujo OAuth 2.0

```
1. Usuario pulsa "Continuar con Google"
2. Frontend navega a GET /api/auth/google
3. Passport redirige a accounts.google.com con scopes: profile, email
4. Usuario autoriza la aplicación
5. Google redirige a /api/auth/google/callback?code=...
6. Passport intercambia el código por tokens de Google
7. Backend busca usuario por googleId o email:
     - Si existe → vincula googleId si no estaba, genera JWT
     - Si no existe → crea usuario nuevo con role: 'Cliente'
8. Backend redirige a:
   http://localhost:4200/auth/google?token=<accessToken>
9. Componente google-callback.ts lee el token de la URL,
   lo guarda en AuthService y redirige al home
```

### Configuración Passport (`config/passport.js`)

```javascript
passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL:  GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    // Lógica de búsqueda/creación de usuario
}));
```

---

## 12. Servicio de email (Nodemailer)

El email de confirmación de reserva se envía automáticamente cuando:
- El webhook de Stripe confirma el pago, **o**
- El administrador marca una reserva como "confirmada" manualmente

### Configuración (`config/mailer.js`)

```javascript
// Transporter Gmail SMTP con App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});
```

### Contenido del email (`helpers/email.helper.js`)

El email HTML incluye:
- Nombre del cliente
- Servicio(s) contratado(s) y precio total
- Barbero asignado
- Fecha y hora de la cita
- Método de pago
- Notas adicionales (si las hay)

---

## 13. Frontend — Rutas y componentes

### Tabla de rutas

| Ruta | Componente | Guard | Carga |
|---|---|---|---|
| `/` | `HomeComponent` | — | Lazy |
| `/login` | `LoginComponent` | — | Lazy |
| `/register` | `RegisterComponent` | — | Lazy |
| `/auth/google` | `GoogleCallbackComponent` | — | Lazy |
| `/reviews` | `ReviewsComponent` | — | Lazy |
| `/acerca-de` | `AboutComponent` | — | Lazy |
| `/ayuda` | `HelpComponent` | — | Lazy |
| `/cortes` | `GalleryComponent` | — | Lazy |
| `/reservas` | `BookingsComponent` | `authGuard` | Lazy |
| `/mis-reservas` | `MisBookingsComponent` | `authGuard` | Lazy |
| `/reserva/confirmada` | `BookingConfirmationComponent` | `authGuard` | Lazy |
| `/reserva/cancelada` | `BookingCancelComponent` | — | Lazy |
| `/reserva-confirmada` | `BookingSuccessComponent` | — | Lazy |
| `/admin` | `AdminLayoutComponent` | `adminGuard` | Lazy |
| `/admin/reservas` | `AdminBookingsComponent` | `adminGuard` | Lazy |
| `/admin/usuarios` | `AdminUsersComponent` | `adminGuard` | Lazy |
| `/admin/reviews` | `AdminReviewsComponent` | `adminGuard` | Lazy |
| `/admin/estadisticas` | `EstadisticasComponent` | `adminGuard` | Lazy |
| `**` | `NotFoundComponent` | — | Lazy |

### Componentes públicos

| Componente | Descripción |
|---|---|
| `HomeComponent` | Página principal con secciones hero, servicios, galería preview, reseñas destacadas y CTA |
| `ReviewsComponent` | Grid de reseñas públicas con puntuación media y valoraciones de clientes |
| `GalleryComponent` | Galería de fotos filtrable por categoría (Todos / Cortes / Mechas / Tintes) |
| `AboutComponent` | Historia de la barbería, equipo y valores |
| `HelpComponent` | Preguntas frecuentes (FAQ) |

### Componentes de autenticación

| Componente | Descripción |
|---|---|
| `LoginComponent` | Formulario de login + botón Google OAuth; lee `returnUrl` tras autenticarse |
| `RegisterComponent` | Formulario de registro con validación reactiva |
| `GoogleCallbackComponent` | Recibe el token de la URL, lo almacena y redirige |

### Componentes de reserva

| Componente | Descripción |
|---|---|
| `BookingsComponent` | Formulario multi-paso: selección de barbero → servicios → fecha/hora → pago |
| `MisBookingsComponent` | Lista de reservas del usuario con acciones: editar, cancelar, añadir reseña |
| `BookingConfirmationComponent` | Detalle de una reserva específica |
| `BookingSuccessComponent` | Pantalla de éxito tras pago con Stripe |
| `BookingCancelComponent` | Pantalla de cancelación de pago Stripe |

---

## 14. Frontend — Servicios Angular

### `AuthService` (`core/services/auth.service.ts`)

```typescript
login(email, password): Observable<AuthResponse>
register(name, email, password): Observable<AuthResponse>
logout(): void
refreshToken(): Observable<{ accessToken: string }>
isLoggedIn(): boolean          // signal
currentUser(): User | null     // signal
isAdmin(): boolean             // computed
```

Almacena el `accessToken` en memoria (no en localStorage por seguridad). El `refreshToken` se gestiona automáticamente via cookie httpOnly.

### `BookingService` (`core/services/booking.service.ts`)

```typescript
getBarberos(): Observable<{ data: Barbero[] }>
getServicios(): Observable<{ data: Servicio[] }>
getDisponibilidad(barberoId, fecha, duracion): Observable<{ data: string[] }>
crearBooking(dto: CrearBookingDto): Observable<any>
getMisBookings(): Observable<{ data: Booking[] }>
getBookings(): Observable<{ data: Booking[] }>          // Admin
cancelarBooking(id): Observable<any>
modificarBooking(id, dto): Observable<any>
cambiarEstado(id, estado): Observable<any>              // Admin
marcarPagado(id): Observable<any>                       // Admin
getEstadisticas(): Observable<any>                      // Admin
```

### `UserService` (`core/services/user.service.ts`)

```typescript
getUsuarios(): Observable<{ data: User[] }>             // Admin
actualizarUsuario(id, data): Observable<any>            // Admin
eliminarUsuario(id): Observable<any>                    // Admin
```

### `ReviewService` (`core/services/review.service.ts`)

```typescript
getReviews(): Observable<{ data: Review[] }>            // Público
getReviewsAdmin(): Observable<{ data: Review[] }>       // Admin
crearReview(dto: CrearReviewDto): Observable<any>
toggleVisibilidad(id): Observable<any>                  // Admin
eliminarReview(id): Observable<any>                     // Admin
```

### `LanguageService` (`core/services/languaje.service.ts`)

```typescript
idioma(): 'es' | 'en'    // signal reactivo
cambiarIdioma(lang)      // actualiza TranslateService + signal
```

Contiene el objeto completo de traducciones para ambos idiomas (ES/EN) con los namespaces: `NAV`, `HOME`, `RESERVAS`, `MIS_RESERVAS`, `RESENAS`, `GALERIA`, `FOOTER`, `ADMIN`, `ESTADOS`.

---

## 15. Internacionalización (i18n)

La aplicación soporta **español** e **inglés** de forma completa usando `@ngx-translate/core`.

### Namespaces de traducción

| Namespace | Cubre |
|---|---|
| `NAV` | Navbar: enlaces, login, registro, cerrar sesión |
| `HOME` | Hero, secciones de la homepage |
| `RESERVAS` | Formulario de reserva completo |
| `MIS_RESERVAS` | Lista de reservas, edición, reseñas |
| `RESENAS` | Página pública de reseñas |
| `GALERIA` | Página de galería y categorías |
| `FOOTER` | Pie de página con enlaces |
| `ESTADOS` | Estados de reserva y pago (compartidos) |
| `ADMIN.LAYOUT` | Sidebar del panel de administración |
| `ADMIN.RESERVAS` | Gestión de reservas (admin) |
| `ADMIN.USUARIOS` | Gestión de usuarios (admin) |
| `ADMIN.RESENAS` | Gestión de reseñas (admin) |
| `ADMIN.ESTADISTICAS` | Dashboard de estadísticas (admin) |

### Uso en plantillas

```html
<!-- Pipe translate -->
{{ 'RESERVAS.TITULO' | translate }}

<!-- Con parámetros -->
{{ 'ADMIN.USUARIOS.SWAL_DESACTIVAR' | translate: { nombre: usuario.name } }}

<!-- Condicional -->
{{ (usuario.active ? 'ADMIN.USUARIOS.BTN_DESACTIVAR' : 'ADMIN.USUARIOS.BTN_ACTIVAR') | translate }}
```

### Uso en TypeScript (para SweetAlert2)

```typescript
const t = (k: string, p?: object) => this.translate.instant(k, p);
Swal.fire({ title: t('ADMIN.RESERVAS.SWAL_CONFIRMAR_TITULO'), ... });
```

---

## 16. Panel de administración

Accesible en `/admin` únicamente para usuarios con `role: 'Admin'`.

### Sección: Reservas (`/admin/reservas`)

- Buscador en tiempo real (cliente, barbero, servicio)
- Filtros de fecha: Hoy / Mañana / Esta semana / Todas
- Filtros de estado: Todas / Pendiente / Confirmada / Completada / Cancelada
- Acciones por reserva:
  - Confirmar (pendiente → confirmada)
  - Completar (confirmada → completada)
  - Marcar como pagado (estadoPago pendiente → pagado)
  - Cancelar

### Sección: Usuarios (`/admin/usuarios`)

- Buscador por nombre o email
- Filtro por rol: Todos / Clientes / Administradores
- Acciones por usuario:
  - Activar / Desactivar cuenta
  - Cambiar rol (Cliente ↔ Admin)
  - Eliminar (sólo clientes; protegido contra auto-eliminación y borrado del último admin)

### Sección: Reseñas (`/admin/reviews`)

- Filtro por puntuación (1–5 estrellas o todas)
- Vista de comentario, autor, fecha y estado de visibilidad
- Acciones: Ocultar / Mostrar / Eliminar

### Sección: Estadísticas (`/admin/estadisticas`)

- **KPIs con filtro temporal** (Hoy / Esta semana / Este mes / Este año):
  - Total de ingresos (€)
  - Número de reservas
  - Ticket medio (€)
- **Gráfico de barras:** Ingresos mensuales del año en curso
- **Gráfico doughnut:** Ranking de servicios más reservados con leyenda de colores

---

## 17. Lógica de negocio destacada

### Algoritmo de disponibilidad horaria

```
Parámetros: barberoId, fecha, duracionTotal (min)

1. Verificar que la fecha sea día de trabajo del barbero (diasTrabajo)
2. Cargar todas las reservas NO canceladas del barbero en esa fecha
3. Generar slots de 30 minutos entre horaInicio y horaFin del barbero
4. Para cada slot, comprobar si hay solapamiento con reservas existentes:
     ocupado si: slot_inicio < reserva_fin Y slot_fin > reserva_inicio
5. Devolver sólo los slots libres
```

**Restricciones de negocio:**
- Días disponibles: martes a viernes (días 2–5 en ISO)
- Horario: 16:00–21:00
- Intervalo de slots: 30 minutos (:00 y :30)

### Incompatibilidades de servicios

En el formulario de reserva (nuevo y edición), seleccionar ciertos servicios deselecciona automáticamente los incompatibles:

| Si seleccionas | Se deseleccionan |
|---|---|
| Corte y barba | Corte, Barba |
| Corte o Barba | Corte y barba |
| Cualquier tinte | Todos los demás tintes y mechas |
| Cualquier mecha | Todos los demás tintes y mechas |

### Protecciones de integridad

| Regla | Implementación |
|---|---|
| 1 reseña por reserva | Campo `reserva` unique en el modelo Review |
| No eliminar propio admin | Comprobación `req.user._id !== id` en controller |
| Mínimo 1 admin | Cuenta admins antes de eliminar |
| Soft delete en barberos/servicios | `activo: false` en lugar de borrar el documento |
| Reservas sólo de días/horas válidos | Validación en `booking.validator.js` |

---

## 18. Diagrama de flujo de reserva

```
Usuario autenticado accede a /reservas
         │
         ▼
  Selecciona barbero
         │
         ▼
  Selecciona servicios (con control de incompatibilidades)
         │
         ▼
  Elige fecha (martes–viernes) + hora disponible
         │
         ▼
  Selecciona método de pago
         │
    ┌────┴────┐
    │         │
Efectivo   Tarjeta
    │         │
    ▼         ▼
Reserva    Stripe
creada     Checkout
"pendiente"    │
    │      Usuario
    │      paga en
    │      Stripe
    │         │
    │    Webhook →
    │    estado: "confirmada"
    │    estadoPago: "pagado"
    │    Email de confirmación
    │         │
    └────┬────┘
         │
         ▼
  Reserva visible en
  /mis-reservas
         │
   (tras el servicio)
         │
         ▼
  Admin marca "completada"
         │
         ▼
  Usuario puede dejar reseña
```

---

*Documentación generada para el Trabajo de Fin de Grado — Secret Barber*
*Alejandro Flores Méndez · 2025*
