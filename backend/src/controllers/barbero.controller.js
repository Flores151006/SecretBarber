import { validationResult } from 'express-validator';
import { Barbero } from '../models/barbero.model.js';

export const getBarberos = async (req, res) => {
    try {
        const barberos = await Barbero.find({ activo: true }).sort({ nombre: 1 });
        res.json({ data: barberos });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener barberos', error: error.message });
    }
};

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
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { nombre, email, diasTrabajo, horaInicio, horaFin } = req.body;
        const barbero = await Barbero.create({ nombre, email, diasTrabajo, horaInicio, horaFin });
        res.status(201).json({ message: 'Barbero creado', data: barbero });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear barbero', error: error.message });
    }
};

export const actualizarBarbero = async (req, res) => {
    try {
        const barbero = await Barbero.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!barbero) return res.status(404).json({ message: 'Barbero no encontrado' });
        res.json({ message: 'Barbero actualizado', data: barbero });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar barbero', error: error.message });
    }
};

export const eliminarBarbero = async (req, res) => {
    try {
        const barbero = await Barbero.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
        if (!barbero) return res.status(404).json({ message: 'Barbero no encontrado' });
        res.json({ message: 'Barbero desactivado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar barbero', error: error.message });
    }
};