// ─────────────────────────────────────────────────────────────────────────────
// servicio.controller.js
//
// CRUD de servicios. Estructura idéntica a barbero.controller.js ya que
// ambos recursos siguen el mismo patrón: lista pública de activos, lista
// completa para Admin, y softdelete en lugar de borrado físico.
//
// Ver barbero.controller.js para explicación detallada del patrón
// validationResult y de la estrategia de softdelete.
// ─────────────────────────────────────────────────────────────────────────────
import { validationResult } from 'express-validator';
import { Servicio } from '../models/servicio.model.js';

// ── Rutas públicas ────────────────────────────────────────────────────────────

// Solo servicios activos para el formulario de reserva del cliente
export const getServicios = async (req, res) => {
    try {
        const servicios = await Servicio.find({ activo: true }).sort({ nombre: 1 });
        res.json({ data: servicios });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener servicios', error: error.message });
    }
};

// ── Rutas de administración ───────────────────────────────────────────────────

// Devuelve TODOS los servicios (incluyendo inactivos) para el panel de Admin
export const getAllServicios = async (req, res) => {
    try {
        const servicios = await Servicio.find().sort({ nombre: 1 });
        res.json({ data: servicios });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener servicios', error: error.message });
    }
};

export const crearServicio = async (req, res) => {
    try {
        // Recoger errores acumulados por servicioValidator (ver servicio.validator.js)
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { nombre, precio, duracion } = req.body;
        const servicio = await Servicio.create({ nombre, precio, duracion });
        res.status(201).json({ message: 'Servicio creado', data: servicio });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear servicio', error: error.message });
    }
};

// { new: true } → devuelve el documento tras la actualización, no el anterior
export const actualizarServicio = async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json({ message: 'Servicio actualizado', data: servicio });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar servicio', error: error.message });
    }
};

// Softdelete: activo:false oculta el servicio sin perder las reservas que lo referencian
export const eliminarServicio = async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
        if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json({ message: 'Servicio desactivado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar servicio', error: error.message });
    }
};
