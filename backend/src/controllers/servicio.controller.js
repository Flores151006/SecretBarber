import { validationResult } from 'express-validator';
import { Servicio } from '../models/servicio.model.js';

export const getServicios = async (req, res) => {
    try {
        const servicios = await Servicio.find({ activo: true }).sort({ nombre: 1 });
        res.json({ data: servicios });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener servicios', error: error.message });
    }
};

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
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { nombre, precio, duracion } = req.body;
        const servicio = await Servicio.create({ nombre, precio, duracion });
        res.status(201).json({ message: 'Servicio creado', data: servicio });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear servicio', error: error.message });
    }
};

export const actualizarServicio = async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json({ message: 'Servicio actualizado', data: servicio });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar servicio', error: error.message });
    }
};

export const eliminarServicio = async (req, res) => {
    try {
        const servicio = await Servicio.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
        if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json({ message: 'Servicio desactivado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desactivar servicio', error: error.message });
    }
};