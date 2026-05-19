// ─────────────────────────────────────────────────────────────────────────────
// review.validator.js
//
// Validaciones para las reseñas de clientes.
//
// .isMongoId():
//   Un ObjectId de MongoDB es un string hexadecimal de 24 caracteres.
//   Validarlo aquí sirve como primera barrera: si el ID no tiene el formato
//   correcto, ni siquiera se hace la consulta a la base de datos. Esto evita
//   errores de MongoDB ("Cast to ObjectId failed") que expondrían información
//   del stack en la respuesta de error.
//
// Validar longitud del comentario:
//   - min: 10 garantiza que el cliente escriba algo significativo y no solo
//     un espacio o un carácter. Una reseña de menos de 10 caracteres no aporta
//     información útil.
//   - max: 500 evita que se envíen textos enormes que saturen la base de datos
//     o el frontend que los muestra.
// ─────────────────────────────────────────────────────────────────────────────
import { body, param, validationResult } from 'express-validator';

const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

// ── Validar que el :id de la URL es un ObjectId válido de MongoDB ─────────────
export const validarId = [
    param('id')
        .notEmpty().withMessage('El ID es requerido')
        // isMongoId() = verifica formato de 24 caracteres hexadecimales
        .isMongoId().withMessage('El ID debe ser un ObjectId válido de MongoDB'),

    validationErrors
];

// ── Validar el cuerpo de una nueva reseña ─────────────────────────────────────
export const validarReview = [
    body('reserva')
        .notEmpty().withMessage('La reserva es requerida')
        // Verificamos el formato antes de buscar en BD para evitar errores de cast
        .isMongoId().withMessage('El ID de reserva no es válido'),

    body('puntuacion')
        .notEmpty().withMessage('La puntuación es requerida')
        // Las estrellas van de 1 a 5; isInt descarta decimales como 3.7
        .isInt({ min: 1, max: 5 }).withMessage('La puntuación debe ser un número entre 1 y 5'),

    body('comentario')
        .trim()
        .notEmpty().withMessage('El comentario es requerido')
        // Mínimo 10 para comentarios útiles; máximo 500 para evitar abuso
        .isLength({ min: 10, max: 500 }).withMessage('El comentario debe tener entre 10 y 500 caracteres'),

    validationErrors
];
