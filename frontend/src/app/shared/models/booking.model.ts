import { User } from './user.model';

export interface Servicio {
    _id:      string;
    nombre:   string;
    precio:   number;
    duracion: number;
    activo:   boolean;
}

export interface Barbero {
    _id:         string;
    nombre:      string;
    email:       string;
    diasTrabajo: number[];
    horaInicio:  string;
    horaFin:     string;
    activo:      boolean;
}

export interface Booking {
    _id:             string;
    cliente:         string | User;
    barbero:         string | Barbero;
    servicios:       string[] | Servicio[];
    cejas:           boolean;
    fecha:           string;
    hora:            string;
    duracionTotal:   number;
    precio:          number;
    metodoPago:      'tarjeta' | 'efectivo';
    estadoPago:      'pendiente' | 'pagado' | 'fallido';
    estado:          'pendiente' | 'confirmada' | 'cancelada' | 'completada';
    stripeSessionId: string | null;
    notas:           string | null;
    createdAt:       string;
    updatedAt:       string;
}

export interface CrearBookingDto {
    barbero:    string;
    servicios:  string[];
    cejas:      boolean;
    fecha:      string;
    hora:       string;
    metodoPago: 'tarjeta' | 'efectivo';
    notas?:     string;
}