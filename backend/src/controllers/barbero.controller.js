// ─────────────────────────────────────────────────────────────────────────────
// barbero.controller.js
//
// CRUD de barberos. Gestiona las operaciones que puede realizar el Admin
// sobre los barberos del salón.
//
// Patrón validationResult:
//   Las reglas de validación se definen en barbero.validator.js y se ejecutan
//   como middleware antes de llegar aquí. validationResult(req) recoge los
//   errores que esos middlewares acumularon en la petición. Si hay errores,
//   se responde con 400 y el primer mensaje. Esto separa la lógica de
//   validación de la lógica de negocio.
//
// Softdelete vs borrado físico:
//   eliminarBarbero no borra el documento; pone activo:false.
//   Esto permite que las reservas antiguas sigan mostrando el nombre del
//   barbero aunque ya no trabaje. Si borrásemos el documento, esas reservas
//   tendrían una referencia rota (null) al hacer .populate('barbero').
// ─────────────────────────────────────────────────────────────────────────────
import { validationResult } from 'express-validator';
import { Barbero } from '../models/barbero.model.js';

// ── Rutas públicas ────────────────────────────────────────────────────────────

// Devuelve solo los barberos activos (para el selector de reservas del cliente)
export const getBarberos = async (req, res) => {
    try {
        const barberos = await Barbero.find({ activo: true }).sort({ nombre: 1 });
        res.json({ data: barberos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener barberos', error: error.message });
    }
};

// ── Rutas de administración ───────────────────────────────────────────────────

// Devuelve TODOS los barberos (activos e inactivos) para el panel de Admin
export const getAllBarberos = async (req, res) => {
    try {
        const barberos = await Barbero.find().sort({ nombre: 1 });
        res.json({ data: barberos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener barberos', error: error.message });
    }
};

export const crearBarbero = async (req, res) => {
    try {
        // Recoger los errores de validación acumulados por barberoValidator
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { nombre, email, diasTrabajo, horaInicio, horaFin } = req.body;
        const barbero = await Barbero.create({ nombre, email, diasTrabajo, horaInicio, horaFin });
        res.status(201).json({ message: 'Barbero creado', data: barbero });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear barbero', error: error.message });
    }
};

// { new: true } hace que findByIdAndUpdate devuelva el documento YA actualizado
// en lugar del estado anterior, que es el comportamiento por defecto de MongoDB
export const actualizarBarbero = async (req, res) => {
    try {
        const barbero = await Barbero.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!barbero) return res.status(404).json({ message: 'Barbero no encontrado' });
        res.json({ message: 'Barbero actualizado', data: barbero });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar barbero', error: error.message });
    }
};

// Softdelete: marca como inactivo en lugar de borrar para preservar historial
export const eliminarBarbero = async (req, res) => {
    try {
        const barbero = await Barbero.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
        if (!barbero) return res.status(404).json({ message: 'Barbero no encontrado' });
        res.json({ message: 'Barbero desactivado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar barbero', error: error.message });
    }
};
