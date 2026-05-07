import { Router } from 'express';
import { getBarberos, getAllBarberos, crearBarbero, actualizarBarbero, eliminarBarbero } from '../controllers/barbero.controller.js';
import { barberoValidator } from '../validators/barbero.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

export const barberoRoutes = Router();

barberoRoutes.get('/',        getBarberos);                                              // Público
barberoRoutes.get('/todos',   autenticarToken , autorizarRol ('Admin'), getAllBarberos);    // Admin
barberoRoutes.post('/',       autenticarToken , autorizarRol ('Admin'), barberoValidator, crearBarbero);
barberoRoutes.patch('/:id',   autenticarToken , autorizarRol ('Admin'), actualizarBarbero);
barberoRoutes.delete('/:id',  autenticarToken , autorizarRol ('Admin'), eliminarBarbero);