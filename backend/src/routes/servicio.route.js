import { Router } from 'express';
import { getServicios, getAllServicios, crearServicio, actualizarServicio, eliminarServicio } from '../controllers/servicio.controller.js';
import { servicioValidator } from '../validators/servicio.validator.js';
import { autenticarToken, autorizarRol } from '../middlewares/auth.middleware.js';

export const servicioRoutes = Router();

servicioRoutes.get('/',        getServicios);                                              // Público
servicioRoutes.get('/todos',   autenticarToken , autorizarRol ('Admin'), getAllServicios);    // Admin
servicioRoutes.post('/',       autenticarToken , autorizarRol ('Admin'), servicioValidator, crearServicio);
servicioRoutes.patch('/:id',   autenticarToken , autorizarRol ('Admin'), actualizarServicio);
servicioRoutes.delete('/:id',  autenticarToken , autorizarRol ('Admin'), eliminarServicio);