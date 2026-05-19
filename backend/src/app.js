// ─────────────────────────────────────────────────────────────────────────────
// app.js
//
// Punto de entrada del servidor backend. Configura Express, los middlewares
// globales, las rutas de la API y arranca el servidor.
//
// ¿Qué es Express?
//   Es un framework minimalista para crear APIs REST en Node.js.
//   Funciona con un sistema de middlewares: funciones que se ejecutan en cadena
//   para procesar cada petición HTTP antes de llegar al controlador final.
//
// Arquitectura del backend:
//   app.js (entrada) → rutas → middlewares → controladores → modelos → MongoDB
// ─────────────────────────────────────────────────────────────────────────────

import express      from 'express';
import cookieParser from 'cookie-parser';
import cors         from 'cors';
import helmet       from 'helmet';  // Cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS…)
import passport     from './config/passport.js';
import { googleRoutes } from './routes/google.route.js';

import { conexionBD } from './data/db.js';
import { PORT }       from './config.js';

// ─── Importar rutas de la API ──────────────────────────────────────────────────
import { authRoutes }     from './routes/auth.route.js';
import { bookingRoutes }  from './routes/booking.route.js';
import { userRoutes }     from './routes/users.route.js';
import { reviewRoutes }   from './routes/reviews.route.js';
import { servicioRoutes } from './routes/servicio.route.js';
import { barberoRoutes }  from './routes/barbero.route.js';

const app = express();

// Helmet añade automáticamente ~15 cabeceras HTTP de seguridad que el navegador
// usa para protegerse: Content-Security-Policy (evita XSS), X-Frame-Options
// (evita clickjacking), X-Content-Type-Options (evita MIME sniffing), HSTS
// (fuerza HTTPS), etc. Una sola línea activa todas.
app.use(helmet());

// ─── Configuración CORS ────────────────────────────────────────────────────────
// CORS (Cross-Origin Resource Sharing) es un mecanismo de seguridad del navegador
// que bloquea las peticiones HTTP a dominios distintos al del frontend.
// Como Angular (Vercel) y Express (Render) están en dominios diferentes,
// debemos permitir explícitamente las peticiones desde el frontend.
const origenesPermitidos = [
    'http://localhost:4200',        // Angular en desarrollo local
    process.env.FRONTEND_URL        // URL del frontend desplegado en Vercel
].filter(Boolean); // .filter(Boolean) elimina valores undefined/null del array

const corsOptions = {
    origin: (origin, callback) => {
        // origin es undefined en peticiones del mismo servidor (Postman, curl, etc.)
        if (!origin || origenesPermitidos.includes(origin)) {
            callback(null, true);  // Permitir la petición
        } else {
            callback(new Error(`CORS bloqueado: ${origin}`)); // Bloquear
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // NECESARIO para que las cookies de refresh token funcionen
};
app.use(cors(corsOptions));

// ─── Middlewares globales ──────────────────────────────────────────────────────
// CRÍTICO: el webhook de Stripe DEBE recibir el body como Buffer (bytes en bruto)
// para poder verificar la firma digital del webhook.
// Si express.json() procesara este endpoint primero, la verificación fallaría.
// POR ESO esta línea debe ir ANTES de express.json()
app.use('/api/bookings/webhook', express.raw({ type: 'application/json' }));

// cookieParser permite leer las cookies de la petición (ej: el refresh token)
app.use(cookieParser());

// express.json() parsea el body JSON de las peticiones (POST, PATCH, etc.)
// limit:'5mb' permite subir imágenes en base64 (avatares de usuario)
app.use(express.json({ limit: '5mb' }));

// Inicializar Passport para la autenticación con Google OAuth
app.use(passport.initialize());


// ─── Rutas de la API ────────────────────────────────────────────────────────────
// Cada ruta agrupa los endpoints de una entidad:
//   /api/auth     → registro, login, logout, refresh token, verificación email
//   /api/bookings → crear/cancelar/modificar reservas, disponibilidad, Stripe webhook
//   /api/users    → perfil, avatar, cambiar contraseña/nombre
//   /api/reviews  → crear reseñas, listar, moderar (admin)
//   /api/auth/google → flujo OAuth con Google
//   /api/servicios → lista de servicios del barbero
//   /api/barberos  → lista de barberos activos
app.use('/api/auth',      authRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/barberos',  barberoRoutes);


// Ruta de comprobación rápida (health check) — útil para saber si el servidor responde
app.get('/', (req, res) => {
    res.json({ message: 'API Barbería funcionando 💈' });
});

// ─── Manejador de rutas no encontradas (404) ────────────────────────────────────
// Si ninguna ruta anterior coincidió, devolvemos 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// ─── Arrancar el servidor ────────────────────────────────────────────────────────
// Primero conectamos a MongoDB y LUEGO arrancamos Express.
// Si la BD falla, el servidor no arranca (process.exit(1) termina el proceso).
// Esto evita tener un servidor respondiendo peticiones sin base de datos.
conexionBD()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('No se pudo iniciar el servidor:', err.message);
        process.exit(1); // Código de salida 1 = error — importante para Render/Docker
    });
