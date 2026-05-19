// ─────────────────────────────────────────────────────────────────────────────
// barbero.route.js
//
// Rutas del recurso Barbero. Separa claramente qué puede ver cualquiera
// (público) y qué solo puede hacer el Admin (privado).
//
// Rutas públicas vs privadas:
//   GET / → No requiere token. Cualquier visitante puede ver la lista de
//            barberos activos para elegir al crear una reserva.
//
//   GET /todos, POST /, PATCH /:id, DELETE /:id → Requieren autenticarToken
//   (comprobar que hay un JWT válido) y además autorizarRol('Admin')
//   (comprobar que ese token pertenece a un Admin).
//   Separar ambos middlewares permite reutilizarlos: autenticarToken se usa
//   también en rutas de cliente sin necesidad de comprobar el rol.
//
// Cadena de middlewares para rutas privadas:
//   petición → [autenticarToken] → [autorizarRol('Admin')] → [validador?] → controlador
//                    ↓                      ↓
//              401 sin token          403 si no es Admin
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { getBarberos, getAllBarberos, crearBarbero, actualizarBarbero, eliminarBarbero } from '../controllers/barbero.controller.js';
import { barberoValidator } from '../validators/barbero.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

export const barberoRoutes = Router();

// Ruta pública: cualquier usuario (incluso sin cuenta) puede ver los barberos activos
barberoRoutes.get('/',        getBarberos);                                              // Público

// Rutas privadas: solo Admin puede gestionar barberos
barberoRoutes.get('/todos',   autenticarToken , autorizarRol ('Admin'), getAllBarberos);    // Admin
barberoRoutes.post('/',       autenticarToken , autorizarRol ('Admin'), barberoValidator, crearBarbero);
barberoRoutes.patch('/:id',   autenticarToken , autorizarRol ('Admin'), actualizarBarbero);

// DELETE hace softdelete (activo:false), no borra el documento
barberoRoutes.delete('/:id',  autenticarToken , autorizarRol ('Admin'), eliminarBarbero);
