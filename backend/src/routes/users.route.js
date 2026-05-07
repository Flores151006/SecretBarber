import { Router } from 'express';
import {
    getUsuarios,
    getUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} from '../controllers/user.controller.js';
import { validarId, validarUsuario, validarActualizacion } from '../validators/user.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de usuarios requieren estar autenticado y ser Admin
router.get('/',      autenticarToken, autorizarRol('Admin'), getUsuarios);
router.get('/:id',   autenticarToken, autorizarRol('Admin'), validarId, getUsuario);
router.post('/',     autenticarToken, autorizarRol('Admin'), validarUsuario, crearUsuario);
router.put('/:id', autenticarToken, autorizarRol('Admin'), validarId, validarActualizacion, actualizarUsuario);
router.delete('/:id',autenticarToken, autorizarRol('Admin'), validarId, eliminarUsuario);

export { router as userRoutes };