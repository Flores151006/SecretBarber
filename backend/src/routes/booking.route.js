// ─────────────────────────────────────────────────────────────────────────────
// booking.route.js
//
// Rutas de reservas y del webhook de Stripe.
//
// ¿Por qué el webhook no tiene autenticación y necesita raw body?
//   Stripe llama a /webhook desde sus servidores para notificarnos que un
//   pago se ha completado (u otros eventos). No puede mandarnos un JWT porque
//   no es un usuario de nuestra app. En su lugar, firma la petición con una
//   clave secreta (STRIPE_WEBHOOK_SECRET) y nosotros verificamos esa firma.
//   Para verificarla, necesitamos el cuerpo de la petición en formato RAW
//   (bytes sin parsear). Si Express lo parsea a JSON antes, la firma no
//   coincide y Stripe rechaza el evento. Por eso esta ruta usa
//   express.raw({ type: 'application/json' }) en lugar del bodyParser global.
//
// Patrón de rutas PATCH con subrutas:
//   PATCH /:id          → cancelar reserva (cualquier usuario autenticado)
//   PATCH /:id/estado   → cambiar estado (Admin)
//   PATCH /:id/pago     → marcar como pagado (Admin)
//   PATCH /:id/modificar→ modificar fecha/hora (cliente dueño)
//
//   Usar subrutas en lugar de un solo PATCH con flags en el body es más
//   RESTful: cada URL describe una acción específica, lo que facilita el
//   control de acceso y la depuración.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import express from 'express';
import {
    getBookings, getMisBookings, crearBooking, cancelarBooking,
    stripeWebhook, actualizarEstado, actualizarPago, modificarBooking,
    getDisponibilidad, getEstadisticas
} from '../controllers/booking.controller.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';
import { validarBooking, validarId } from '../validators/booking.validator.js';

const router = Router();

// ── Webhook de Stripe ─────────────────────────────────────────────────────────
// IMPORTANTE: esta ruta debe ir ANTES del bodyParser global de la app.
// express.raw() entrega el body sin parsear para poder verificar la firma de Stripe.
// No lleva autenticarToken porque Stripe no puede mandarnos un JWT.
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ── Disponibilidad (requiere login para evitar scraping de horarios) ──────────
router.get('/disponibilidad', autenticarToken, getDisponibilidad);

// ── CRUD de reservas ──────────────────────────────────────────────────────────
router.get('/',    autenticarToken, autorizarRol('Admin'), getBookings);   // Admin: todas las reservas
router.get('/mis', autenticarToken,                        getMisBookings); // Cliente: solo sus reservas
router.post('/',   autenticarToken, validarBooking,        crearBooking);   // Cualquier usuario autenticado

// ── Acciones sobre una reserva concreta ──────────────────────────────────────
// Cancelar (cliente puede cancelar la suya; el Admin puede cancelar cualquiera)
router.patch('/:id',          autenticarToken,                        cancelarBooking);

// Cambiar estado de la reserva (pendiente → confirmada → completada…)
router.patch('/:id/estado',   autenticarToken, autorizarRol('Admin'), actualizarEstado);

// Marcar pago como recibido en efectivo en el local
router.patch('/:id/pago',     autenticarToken, autorizarRol('Admin'), actualizarPago);

// El cliente puede mover su cita a otro día/hora antes de que se confirme
router.patch('/:id/modificar',autenticarToken,                        modificarBooking);

// ── Estadísticas (solo Admin) ─────────────────────────────────────────────────
router.get('/estadisticas', autenticarToken, autorizarRol('Admin'), getEstadisticas);

export { router as bookingRoutes };
