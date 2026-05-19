// ─────────────────────────────────────────────────────────────────────────────
// review.controller.js
//
// Gestiona las reseñas que los clientes dejan tras completar una reserva.
//
// ¿Qué es .populate()?
//   En MongoDB los documentos se referencian por ID (como una clave foránea en
//   SQL). .populate('cliente', 'name avatar') dice a Mongoose: "donde veas un
//   ID en el campo 'cliente', búscame el documento User correspondiente y
//   devuélveme solo los campos name y avatar". Es el equivalente a un JOIN en
//   bases de datos relacionales.
//
// Índice único por reserva:
//   El modelo Review tiene un índice único en el campo 'reserva'. Esto garantiza
//   que cada reserva solo puede tener UNA reseña. La verificación previa con
//   findOne es la primera barrera; el índice en MongoDB es la segunda barrera
//   (a nivel de base de datos) contra condiciones de carrera.
//
// Verificación de propietario:
//   Antes de crear la reseña se comprueba que la reserva pertenece al cliente
//   autenticado. Sin esta comprobación cualquier usuario podría crear reseñas
//   de reservas ajenas simplemente enviando un ID válido.
//
// Solo reservas 'completada':
//   No tiene sentido reseñar una cita que aún no ha ocurrido. Esta restricción
//   de negocio se valida aquí en lugar de en el modelo porque requiere consultar
//   el estado actual de la reserva.
// ─────────────────────────────────────────────────────────────────────────────
import { Review }   from '../models/review.model.js';
import { Booking }  from '../models/booking.model.js';
import { contienePalabraMalsonante } from '../helpers/profanity.helper.js';

// ─── GET reseñas visibles (público — las ve cualquiera en la web) ──────────────
export const getReviews = async (req, res) => {
    try {
        // .populate() sustituye el ID del cliente por sus datos reales (nombre y avatar)
        // para poder mostrarlos en las tarjetas de la web sin hacer una segunda petición
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
        // El Admin necesita el email del cliente y los datos de la reserva
        // para tomar decisiones de moderación; por eso se populan más campos
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

        // .toString() es necesario porque req.user.id es un string pero
        // reservaExiste.cliente es un ObjectId de MongoDB; sin la conversión,
        // la comparación === siempre devolvería false aunque sean el mismo ID
        if (reservaExiste.cliente.toString() !== req.user.id) {
            return res.status(403).json({ message: 'No puedes mandar una reseña de una reserva que no es tuya' });
        }

        // Solo se puede reseñar una reserva completada
        if (reservaExiste.estado !== 'completada') {
            return res.status(400).json({ message: 'Solo puedes mandar reseñas de reservas completadas' });
        }

        // Verificar que no haya ya una reseña para esta reserva
        // (segunda barrera tras el índice único del modelo Review)
        const yaReseñada = await Review.findOne({ reserva });
        if (yaReseñada) {
            return res.status(409).json({ message: 'Ya has enviado una reseña de esta reserva' });
        }

        // Filtro de lenguaje inapropiado antes de persistir
        if (contienePalabraMalsonante(comentario)) {
            return res.status(400).json({
                message: 'Tu reseña contiene lenguaje inapropiado. Por favor, revísala antes de enviarla.'
            });
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

        // Invertir visibilidad: si estaba visible la ocultamos, y viceversa
        // Es más limpio que recibir un booleano del frontend, que podría ser manipulado
        review.visible = !review.visible;
        await review.save();

        const estado = review.visible ? 'visible' : 'oculta';
        res.status(200).json({ message: `Reseña marcada como ${estado}` });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la visibilidad', error: error.message });
    }
};

// ─── DELETE eliminar reseña (solo Admin) ──────────────────────────────────────
// Las reseñas sí se borran físicamente (a diferencia de barberos y servicios)
// porque no hay otros documentos que las referencien; no dejan huérfanos
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
