// ─────────────────────────────────────────────────────────────────────────────
// review.model.ts
//
// Interfaces TypeScript para las reseñas que los clientes dejan tras
// una cita completada.
//
// CONCEPTO CLAVE — LITERAL UNION TYPE NUMÉRICO (1 | 2 | 3 | 4 | 5):
// En lugar de usar "number" (que permitiría cualquier número, incluso 0 o 100),
// se define un tipo que solo acepta exactamente los valores 1, 2, 3, 4 o 5.
// Si alguien intenta asignar puntuacion = 6, TypeScript dará error en
// tiempo de compilación, antes de que la app llegue al navegador.
// ─────────────────────────────────────────────────────────────────────────────

import { User } from './user.model';
import { Booking } from './booking.model';


// Representa una reseña completa tal como la devuelve la API del backend.
export interface Review {
    _id:        string;

    // Union type: puede venir como string (ID de MongoDB) o como objeto User completo
    // si el endpoint hace populate(). Ver booking.model.ts para explicación detallada.
    cliente:    string | User;  // puede venir populado o solo el ID

    // La reseña está vinculada a una reserva concreta (solo se puede reseñar
    // reservas con estado 'completada'). Mismo patrón string | objeto populado.
    reserva:    string | Booking;

    // Literal union type: TypeScript verifica en compilación que el valor sea 1, 2, 3, 4 o 5.
    // Esto evita datos inválidos tanto en frontend como al tipar respuestas del backend.
    puntuacion: 1 | 2 | 3 | 4 | 5;

    comentario: string;
    visible:    boolean;  // el admin puede ocultar reseñas inapropiadas sin eliminarlas
    createdAt:  string;   // fecha ISO 8601
    updatedAt:  string;
}

// DTO para crear una nueva reseña. El cliente envía estos tres campos;
// el backend asigna el campo "cliente" automáticamente desde el JWT.
export interface CrearReviewDto {
    reserva:    string;  // ID de la reserva que se está reseñando
    puntuacion: number;  // aquí se usa number (no el literal type) porque viene de un input de formulario
    comentario: string;
}
