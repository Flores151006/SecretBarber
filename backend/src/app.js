import express      from 'express';
import cookieParser from 'cookie-parser';
import cors         from 'cors';
import passport        from './config/passport.js';
import { googleRoutes } from './routes/google.route.js';

import { conexionBD } from './data/db.js';
import { PORT }       from './config.js';

// ─── Rutas ────────────────────────────────────────────────────────────────────
import { authRoutes }    from './routes/auth.route.js';
import { bookingRoutes } from './routes/booking.route.js';
import { userRoutes }   from './routes/users.route.js';
import { reviewRoutes } from './routes/reviews.route.js';
import { servicioRoutes } from './routes/servicio.route.js';
import { barberoRoutes }  from './routes/barbero.route.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const origenesPermitidos = [
    'http://localhost:4200',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origenesPermitidos.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS bloqueado: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// ─── Middlewares globales ─────────────────────────────────────────────────────
// IMPORTANTE: el raw body de Stripe va ANTES del express.json()
app.use('/api/bookings/webhook', express.raw({ type: 'application/json' }));

app.use(cookieParser());
app.use(express.json());

app.use(passport.initialize());


// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/barberos',  barberoRoutes);


// Ruta de comprobación rápida
app.get('/', (req, res) => {
    res.json({ message: 'API Barbería funcionando 💈' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// ─── Arrancar servidor ────────────────────────────────────────────────────────
conexionBD()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('No se pudo iniciar el servidor:', err.message);
        process.exit(1);
    });