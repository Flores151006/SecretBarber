import { Review }   from '../models/review.model.js';
import { Booking }  from '../models/booking.model.js';

// ─── GET reseñas visibles (público — las ve cualquiera en la web) ──────────────
export const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ visible: true })
            .populate('cliente', 'name avatar')
            .sort({ createdAt: -1 }); // Las más recientes primero

        res.status(200).json({ data: reviews.length ? reviews : [] });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener reseñas', error: error.message });
    }
};

// ─── GET todas las reseñas (solo Admin — ve también las ocultas) ───────────────
export const getReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('cliente', 'name email')
            .populate('reserva', 'servicio fecha')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: reviews.length ? reviews : [] });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener reseñas', error: error.message });
    }
};

// ─── POST crear reseña (solo Clientes con reserva completada) ─────────────────
export const crearReview = async (req, res) => {
    try {
        const { reserva, puntuacion, comentario } = req.body;

        // Verificar que la reserva existe y pertenece al cliente
        const reservaExiste = await Booking.findById(reserva);
        if (!reservaExiste) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        if (reservaExiste.cliente.toString() !== req.user.id) {
            return res.status(403).json({ message: 'No puedes mandar una reseña de una reserva que no es tuya' });
        }

        // Solo se puede reseñar una reserva completada
        if (reservaExiste.estado !== 'completada') {
            return res.status(400).json({ message: 'Solo puedes mandar reseñas de reservas completadas' });
        }

        // Verificar que no haya ya una reseña para esta reserva
        const yaReseñada = await Review.findOne({ reserva });
        if (yaReseñada) {
            return res.status(409).json({ message: 'Ya has enviado una reseña de esta reserva' });
        }

        const nuevaReview = await Review.create({
            cliente: req.user.id,
            reserva,
            puntuacion,
            comentario
        });

        res.status(201).json({ id: nuevaReview._id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la reseña', error: error.message });
    }
};

// ─── PATCH ocultar/mostrar reseña (solo Admin) ────────────────────────────────
export const toggleVisibilidad = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        // Invertir visibilidad
        review.visible = !review.visible;
        await review.save();

        const estado = review.visible ? 'visible' : 'oculta';
        res.status(200).json({ message: `Reseña marcada como ${estado}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la visibilidad', error: error.message });
    }
};

// ─── DELETE eliminar reseña (solo Admin) ──────────────────────────────────────
export const eliminarReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Reseña no encontrada' });
        }

        await Review.findByIdAndDelete(id);

        res.status(200).json({ message: 'Reseña eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la reseña', error: error.message });
    }
};