// ─────────────────────────────────────────────────────────────────────────────
// booking.validator.js
//
// Validaciones para la creación de reservas. Combina validaciones de formato
// (¿es una fecha válida?) con validaciones de lógica de negocio (¿está la
// barbería abierta ese día? ¿está la hora dentro del horario?).
//
// .isISO8601():
//   Verifica que la fecha tenga el formato estándar internacional YYYY-MM-DD
//   (o con tiempo: YYYY-MM-DDTHH:mm:ssZ). Usar este estándar evita ambigüedades
//   como 05/06/2025 que podría ser 5 de junio o 6 de mayo según el país.
//
// .custom() para lógica de negocio:
//   Cuando una validación requiere más que un simple formato (comparar con hoy,
//   comprobar el día de la semana, rango de horas…), se usa .custom() con una
//   función que lanza un Error si la condición no se cumple, o devuelve true
//   si todo está bien. Es la forma de express-validator de hacer validaciones
//   complejas sin salir del flujo de middlewares.
//
// ¿Por qué .getUTCDay() y no .getDay()?
//   La fecha llega como string "2025-05-20". Al convertirla con new Date(),
//   JavaScript la interpreta en UTC (medianoche UTC). Si usásemos .getDay()
//   (hora local), en zonas con UTC- la fecha podría retroceder un día y dar
//   un día de la semana incorrecto. .getUTCDay() es consistente independientemente
//   de la zona horaria del servidor.
// ─────────────────────────────────────────────────────────────────────────────
import { body, param, validationResult } from 'express-validator';

const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }
    next();
};

// ─── Validar ID de MongoDB ────────────────────────────────────────────────────
// Un ObjectId de MongoDB tiene 24 caracteres hexadecimales. Validarlo aquí
// evita consultas innecesarias a la BD con IDs que nunca podrían existir.
export const validarId = [
    param('id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID debe ser un ObjectId válido de MongoDB'),
    validationErrors
];

// ─── Validar creación de reserva ──────────────────────────────────────────────
export const validarBooking = [
    body('barbero')
        .notEmpty().withMessage('El barbero es requerido')
        .isMongoId().withMessage('El barbero debe ser un ID válido'),

    body('servicios')
        .isArray({ min: 1 }).withMessage('Selecciona al menos un servicio')
        // Validación custom sobre el array completo: cada elemento debe ser un ObjectId
        .custom(servicios => servicios.every(s => /^[a-f\d]{24}$/i.test(s)))
        .withMessage('Algún servicio tiene un ID inválido'),

    body('cejas')
        .optional()   // El cliente puede no incluir este campo; si lo incluye, debe ser booleano
        .isBoolean().withMessage('El campo cejas debe ser verdadero o falso'),

    body('fecha')
        .notEmpty().withMessage('La fecha es requerida')
        // isISO8601 garantiza el formato YYYY-MM-DD antes de intentar parsearla
        .isISO8601().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
        // Validación de negocio: no reservar en pasado ni en días de cierre
        .custom(value => {
            const fecha = new Date(value);
            const hoy   = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fecha < hoy)
                throw new Error('No puedes reservar en una fecha pasada');

            // getUTCDay() se usa para evitar desfases de zona horaria en el servidor
            const dia = fecha.getUTCDay();
            // 0=domingo, 1=lunes — solo martes(2) a viernes(5)
            if (dia < 2 || dia > 5)
                throw new Error('La barbería solo abre de martes a viernes');

            return true;
        }),

    body('hora')
        .notEmpty().withMessage('La hora es requerida')
        .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage('Formato de hora inválido (HH:MM)')
        // Validación de negocio: horario de apertura y franjas de cita
        .custom(value => {
            const [horas, minutos] = value.split(':').map(Number);

            // La barbería solo atiende de 16:00 a 20:30 (la última cita a las 20:30)
            if (horas < 16 || horas >= 21)
                throw new Error('El horario de la barbería es de 16:00 a 21:00');

            // Las citas se ofrecen en franjas de 30 minutos: :00 o :30
            // Esto simplifica la lógica de disponibilidad
            if (minutos !== 0 && minutos !== 30)
                throw new Error('Las citas son solo a en punto (:00) o y media (:30)');

            return true;
        }),

    body('metodoPago')
        .notEmpty().withMessage('El método de pago es requerido')
        .isIn(['tarjeta', 'efectivo']).withMessage('El método de pago debe ser tarjeta o efectivo'),

    body('notas')
        .optional()
        .isLength({ max: 300 }).withMessage('Las notas no pueden superar los 300 caracteres')
        .trim(),

    validationErrors
];
