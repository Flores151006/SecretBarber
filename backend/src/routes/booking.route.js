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

// Webhook Stripe (sin auth, raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Disponibilidad
router.get('/disponibilidad', autenticarToken, getDisponibilidad);

// Reservas
router.get('/',    autenticarToken, autorizarRol('Admin'), getBookings);
router.get('/mis', autenticarToken,                        getMisBookings);
router.post('/',   autenticarToken, validarBooking,        crearBooking);

router.patch('/:id',          autenticarToken,                        cancelarBooking);
router.patch('/:id/estado',   autenticarToken, autorizarRol('Admin'), actualizarEstado);
router.patch('/:id/pago',     autenticarToken, autorizarRol('Admin'), actualizarPago);
router.patch('/:id/modificar',autenticarToken,                        modificarBooking);


// Estadísticas
router.get('/estadisticas', autenticarToken, autorizarRol('Admin'), getEstadisticas);

export { router as bookingRoutes };