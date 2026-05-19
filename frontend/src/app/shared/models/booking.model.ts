// ─────────────────────────────────────────────────────────────────────────────
// booking.model.ts
//
// Interfaces TypeScript que modelan las reservas y los recursos relacionados
// (servicios y barberos) tal como los devuelve la API.
//
// CONCEPTO CLAVE — UNION TYPES (string | TipoObjeto):
// MongoDB puede devolver un campo de dos formas:
//   1. Como ID simple:  "cliente": "64abc123..."
//   2. Populado:        "cliente": { _id: "64abc123", name: "Juan", ... }
// El tipo "string | User" le dice a TypeScript que ambas formas son válidas.
// En el código hay que hacer comprobaciones del tipo:
//   if (typeof booking.cliente === 'string') { ... } else { booking.cliente.name }
// ─────────────────────────────────────────────────────────────────────────────

import { User } from './user.model';

// Representa un servicio de barbería (corte, barba, mechas…) tal como
// lo devuelve el endpoint GET /servicios.
export interface Servicio {
    _id:      string;
    nombre:   string;
    precio:   number;
    duracion: number;  // en minutos; se usa para calcular la duración total de la reserva
    activo:   boolean; // los servicios desactivados no aparecen en el formulario de reserva
}

// Representa un barbero tal como lo devuelve el endpoint GET /barberos.
export interface Barbero {
    _id:         string;
    nombre:      string;
    email:       string;
    diasTrabajo: number[]; // array de números 0-6 (0=domingo, 1=lunes…) con sus días laborables
    horaInicio:  string;   // formato "HH:MM", p.ej. "09:00"
    horaFin:     string;   // formato "HH:MM", p.ej. "20:00"
    activo:      boolean;
}

// Interfaz principal que representa una reserva completa del sistema.
// Refleja el documento MongoDB del modelo Booking del backend.
export interface Booking {
    _id:             string;

    // Union types: estos tres campos pueden venir como ID (string) o populados
    // con el objeto completo, dependiendo del endpoint que se llame.
    cliente:         string | User;
    barbero:         string | Barbero;
    servicios:       string[] | Servicio[];

    cejas:           boolean;          // si se añadió arreglo de cejas (+1€)
    fecha:           string;           // formato "YYYY-MM-DD"
    hora:            string;           // formato "HH:MM"
    duracionTotal:   number;           // minutos, suma de los servicios elegidos
    precio:          number;           // precio total en euros

    // Union type de literales para el método de pago.
    // Limita los valores posibles a solo estos dos strings.
    metodoPago:      'tarjeta' | 'efectivo';

    // Estado del pago, manejado principalmente por el webhook de Stripe.
    estadoPago:      'pendiente' | 'pagado' | 'fallido';

    // Estado de la reserva gestionado por el admin o el sistema.
    estado:          'pendiente' | 'confirmada' | 'cancelada' | 'completada';

    // ID de la sesión de pago de Stripe; null si el método de pago es efectivo.
    stripeSessionId: string | null;

    notas:           string | null;    // observaciones opcionales del cliente
    createdAt:       string;           // fecha ISO 8601 de creación en MongoDB
    updatedAt:       string;           // fecha ISO 8601 de última modificación
}

// DTO para crear o modificar una reserva. Solo contiene los campos que el
// CLIENTE puede enviar; el resto (precio, duracion, estado…) los calcula
// y asigna el backend para evitar manipulación desde el frontend.
export interface CrearBookingDto {
    barbero:    string;    // ID del barbero seleccionado
    servicios:  string[];  // array de IDs de servicios seleccionados
    cejas:      boolean;
    fecha:      string;    // "YYYY-MM-DD"
    hora:       string;    // "HH:MM"
    metodoPago: 'tarjeta' | 'efectivo';
    notas?:     string;    // el ? indica que este campo es OPCIONAL
}
