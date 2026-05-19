// ─────────────────────────────────────────────────────────────────────────────
// servicio.route.js
//
// Rutas del recurso Servicio. Estructura idéntica a barbero.route.js:
// lista pública de servicios activos para el formulario de reserva, y
// gestión completa solo para Admin.
//
// Ver barbero.route.js para la explicación detallada del patrón
// de rutas públicas vs privadas y la cadena de middlewares.
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { getServicios, getAllServicios, crearServicio, actualizarServicio, eliminarServicio } from '../controllers/servicio.controller.js';
import { servicioValidator } from '../validators/servicio.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

export const servicioRoutes = Router();

// Ruta pública: el cliente necesita ver los servicios disponibles al crear una reserva
servicioRoutes.get('/',        getServicios);                                              // Público

// Rutas privadas: solo Admin puede gestionar el catálogo de servicios
servicioRoutes.get('/todos',   autenticarToken , autorizarRol ('Admin'), getAllServicios);    // Admin: incluye inactivos
servicioRoutes.post('/',       autenticarToken , autorizarRol ('Admin'), servicioValidator, crearServicio);
servicioRoutes.patch('/:id',   autenticarToken , autorizarRol ('Admin'), actualizarServicio);

// DELETE hace softdelete (activo:false), preservando el historial de reservas
servicioRoutes.delete('/:id',  autenticarToken , autorizarRol ('Admin'), eliminarServicio);
