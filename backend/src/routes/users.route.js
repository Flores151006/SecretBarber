// ─────────────────────────────────────────────────────────────────────────────
// users.route.js
//
// Rutas de usuarios con dos responsabilidades bien separadas:
//
//   1. Perfil propio (/perfil):
//      Cualquier usuario autenticado gestiona su propia cuenta.
//      No requiere ser Admin. El ID del usuario se lee de req.user (del JWT),
//      nunca de un parámetro de URL, lo que impide que un usuario acceda
//      a los datos de otro manipulando la URL.
//
//   2. CRUD de usuarios (/  y  /:id):
//      Solo Admin puede listar, crear, modificar o eliminar otros usuarios.
//      Estas rutas reciben el ID como parámetro de URL y validan que sea
//      un ObjectId válido de MongoDB antes de llegar al controlador.
//
// ¿Por qué separar perfil propio de la gestión de Admin?
//   Principio de mínimo privilegio: un cliente no debe poder ver ni editar
//   los datos de otros usuarios. Al tener rutas separadas con middlewares
//   distintos, si en el futuro se cambia la lógica de roles no hay riesgo
//   de mezclar accidentalmente los dos contextos.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import {
    getUsuarios,
    getUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    getPerfil,
    updatePerfil,
    cambiarPassword,
    eliminarCuenta,
    updateAvatar
} from '../controllers/user.controller.js';
import { validarId, validarUsuario, validarActualizacion } from '../validators/user.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

const router = Router();

// ── Perfil propio (requieren login, sin rol específico) ───────────────────────
// El controlador usa req.user.id (del JWT) para identificar al usuario;
// no hay parámetro :id en la URL, por lo que nadie puede acceder al perfil ajeno
router.get('/perfil',               autenticarToken, getPerfil);
router.patch('/perfil',             autenticarToken, updatePerfil);
router.patch('/perfil/password',    autenticarToken, cambiarPassword);
router.patch('/perfil/avatar',      autenticarToken, updateAvatar);
router.delete('/perfil',            autenticarToken, eliminarCuenta);

// ── Gestión de usuarios (solo Admin) ─────────────────────────────────────────
// Todas las rutas de usuarios requieren estar autenticado y ser Admin
router.get('/',      autenticarToken, autorizarRol('Admin'), getUsuarios);

// validarId comprueba que :id tiene formato de ObjectId antes de ir a la BD
router.get('/:id',   autenticarToken, autorizarRol('Admin'), validarId, getUsuario);
router.post('/',     autenticarToken, autorizarRol('Admin'), validarUsuario, crearUsuario);

// PUT en lugar de PATCH porque el Admin puede actualizar todos los campos a la vez
router.put('/:id', autenticarToken, autorizarRol('Admin'), validarId, validarActualizacion, actualizarUsuario);
router.delete('/:id',autenticarToken, autorizarRol('Admin'), validarId, eliminarUsuario);

export { router as userRoutes };
