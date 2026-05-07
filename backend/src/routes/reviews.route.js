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

router.get('/',       getReviews);
router.get('/admin',  autenticarToken, autorizarRol('Admin'),           getReviewsAdmin);
router.post('/',      autenticarToken, autorizarRol('Admin', 'Cliente'), validarReview, crearReview);
router.patch('/:id',  autenticarToken, autorizarRol('Admin'), validarId, toggleVisibilidad);
router.delete('/:id', autenticarToken, autorizarRol('Admin'), validarId, eliminarReview);

export { router as reviewRoutes };