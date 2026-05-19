// ─────────────────────────────────────────────────────────────────────────────
// reviews.route.js
//
// Rutas del sistema de reseñas. Tres niveles de acceso:
//   público, cliente autenticado y admin.
//
// autorizarRol con múltiples roles:
//   autorizarRol('Admin', 'Cliente') acepta una lista de roles.
//   El middleware comprueba si el rol del token está incluido en esa lista.
//   Esto permite que tanto clientes como admins puedan crear reseñas, sin
//   necesitar dos rutas separadas para la misma acción.
//
// ¿Por qué GET '/' es público?
//   Las reseñas visibles forman parte del escaparate público de la barbería.
//   Cualquier visitante debe poder verlas sin necesidad de registrarse para
//   que influyan en la decisión de reservar.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import {
    getReviews,
    getReviewsAdmin,
    crearReview,
    toggleVisibilidad,
    eliminarReview
} from '../controllers/review.controller.js';
import { validarId, validarReview } from '../validators/review.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

const router = Router();

// Público: cualquier visitante puede ver las reseñas visibles
router.get('/',       getReviews);

// Admin: ve todas las reseñas incluyendo las ocultas, para moderación
router.get('/admin',  autenticarToken, autorizarRol('Admin'),           getReviewsAdmin);

// Admin y Cliente: ambos roles pueden crear reseñas (el controlador verifica
// que la reserva pertenece al cliente que la envía)
router.post('/',      autenticarToken, autorizarRol('Admin', 'Cliente'), validarReview, crearReview);

// Solo Admin: gestión de moderación (ocultar/mostrar y eliminar)
router.patch('/:id',  autenticarToken, autorizarRol('Admin'), validarId, toggleVisibilidad);
router.delete('/:id', autenticarToken, autorizarRol('Admin'), validarId, eliminarReview);

export { router as reviewRoutes };
