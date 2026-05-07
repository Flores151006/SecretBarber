import { User } from './user.model';
import { Booking } from './booking.model';


export interface Review {
    _id:        string;
    cliente:    string | User;  // puede venir populado o solo el ID
    reserva:    string | Booking;
    puntuacion: 1 | 2 | 3 | 4 | 5;
    comentario: string;
    visible:    boolean;
    createdAt:  string;
    updatedAt:  string;
}

export interface CrearReviewDto {
    reserva:    string;
    puntuacion: number;
    comentario: string;
}