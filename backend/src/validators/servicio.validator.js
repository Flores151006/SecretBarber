// ─────────────────────────────────────────────────────────────────────────────
// servicio.validator.js
//
// Validaciones para la creación y actualización de servicios.
//
// .isFloat({ min: 0 }) para precio:
//   Un precio puede tener decimales (ej: 12.50 €), por eso se usa isFloat
//   en lugar de isInt. El mínimo 0 rechaza precios negativos, que no
//   tienen sentido en este contexto. isFloat también acepta enteros.
//
// .isInt({ min: 15 }) para duración:
//   La duración se expresa en minutos enteros (no 22.5 minutos).
//   El mínimo de 15 minutos es una restricción de negocio: es la franja
//   mínima que tiene sentido gestionar en el sistema de reservas.
// ─────────────────────────────────────────────────────────────────────────────
import { body } from 'express-validator';

export const servicioValidator = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),

    // isFloat acepta decimales (12.50 €); min:0 rechaza precios negativos
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),

    // isInt solo acepta enteros; min:15 es la duración mínima permitida en minutos
    body('duracion').isInt({ min: 15 }).withMessage('Duración mínima 15 minutos'),

    // activo es opcional: si no se envía, el modelo usa el valor por defecto (true)
    body('activo').optional().isBoolean()
];
