import { Injectable, signal, inject } from '@angular/core';
import { TranslateService }           from '@ngx-translate/core';

const ES = {
    NAV: {
        INICIO: 'Inicio', RESERVAR: 'Reservar', MIS_RESERVAS: 'Mis reservas',
        RESENAS: 'Reseñas', CORTES: 'Cortes', ADMIN: 'Admin', AYUDA: 'Ayuda',
        INICIAR_SESION: 'Iniciar sesión', REGISTRARSE: 'Registrarse', CERRAR_SESION: 'Cerrar sesión'
    },
    HOME: {
        BADGE: 'Barbería Premium', SUBTITULO: 'Donde la tradición se encuentra con el estilo moderno. Reserva tu cita y vive la experiencia.',
        BTN_RESERVAR: 'Reservar cita', BTN_RESENAS: 'Ver reseñas',
        SERVICIOS_BADGE: 'Lo que ofrecemos', SERVICIOS_TITULO: 'Nuestros Servicios',
        POR_QUE_BADGE: 'Nuestra diferencia', POR_QUE_TITULO: '¿Por qué elegirnos?',
        PROFESIONALES: 'Profesionales', PROFESIONALES_DESC: 'Barberos con años de experiencia y formación continua.',
        RESERVA_ONLINE: 'Reserva online', RESERVA_ONLINE_DESC: 'Reserva tu cita en cualquier momento, desde cualquier lugar.',
        PAGO_FLEXIBLE: 'Pago flexible', PAGO_FLEXIBLE_DESC: 'Paga con tarjeta por adelantado o en efectivo en local.',
        CTA_TITULO: '¿Listo para tu próxima cita?', CTA_SUBTITULO: 'Reserva ahora y asegura tu hueco en Secret Barber.',
        CTA_BTN: 'Reservar ahora', RESENAS_BADGE: 'Lo que dicen nuestros clientes', VER_RESENAS: 'Ver todas las reseñas'
    },
    RESERVAS: {
        TITULO: 'Reservar cita', BADGE: 'Nueva cita', BARBERO: 'Barbero',
        SERVICIOS: 'Servicios', SERVICIOS_HINT: 'puedes elegir varios',
        ANIADIDOS: 'Añadidos', CEJAS: 'Arreglo de cejas', FECHA: 'Fecha',
        HORA: 'Hora disponible', METODO_PAGO: 'Método de pago',
        EFECTIVO: 'Efectivo', EFECTIVO_DESC: 'Paga en local',
        TARJETA: 'Tarjeta', TARJETA_DESC: 'Paga ahora con Stripe',
        NOTAS: 'Notas', NOTAS_HINT: 'opcional', TOTAL: 'Total',
        DURACION: 'Duración estimada', CONFIRMAR: 'Confirmar reserva', PROCESANDO: 'Procesando...',
        SIN_HORAS: 'No hay horas disponibles para ese día.',
        SELECCIONA_PARA_HORAS: 'Selecciona barbero, servicios y fecha para ver las horas disponibles.',
        SOLO_MARTES_VIERNES: 'Solo abrimos de martes a viernes.',
        NOTAS_PLACEHOLDER: 'Alguna preferencia o indicación...',
        ERROR_BARBERO: 'Selecciona un barbero', ERROR_SERVICIO: 'Selecciona al menos un servicio',
        ERROR_FECHA: 'Selecciona una fecha', ERROR_HORA: 'Selecciona una hora'
    },
    MIS_RESERVAS: {
        TITULO: 'Mis reservas', BADGE: 'Tu historial', SIN_RESERVAS: 'Aún no tienes ninguna reserva',
        RESERVAR_AHORA: 'Reservar ahora', NUEVA_RESERVA: 'Nueva reserva',
        MODIFICAR: 'Modificar reserva', CANCELAR: 'Cancelar reserva',
        GUARDAR: 'Guardar cambios', GUARDANDO: 'Guardando...',
        DEJAR_RESENA: 'Dejar reseña', ENVIAR_RESENA: 'Enviar reseña', ENVIANDO: 'Enviando...', MINUTOS: 'min',
        CARGANDO: 'Cargando reservas...', A_LAS: 'a las',
        PUNTUACION: 'Puntuación', COMENTARIO: 'Comentario',
        PLACEHOLDER_COMENTARIO: 'Cuéntanos tu experiencia...',
        ERROR_COMENTARIO: 'Mínimo 10 caracteres'
    },
    ESTADOS: {
        pendiente:  'Pendiente',
        confirmada: 'Confirmada',
        completada: 'Completada',
        cancelada:  'Cancelada',
        PAGO: {
            pagado:   'Pagado',
            pendiente:'Pendiente',
            fallido:  'Fallido'
        }
    },
    COMUN: {
        CANCELAR: 'Cancelar', GUARDAR: 'Guardar', CERRAR: 'Cerrar',
        CARGANDO: 'Cargando...', ERROR: 'Ha ocurrido un error',
        VER_TODOS: 'Ver todos', VOLVER: 'Volver'
    },
    LOGIN: {
        SUBTITULO: 'Inicia sesión en tu cuenta',
        ERROR_EMAIL: 'Email no válido', ERROR_PASSWORD: 'La contraseña es requerida',
        BTN: 'Iniciar sesión', BTN_CARGANDO: 'Iniciando sesión...',
        NO_CUENTA: '¿No tienes cuenta?', REGISTRATE: 'Regístrate',
        O_CONTINUA: 'o continúa con', GOOGLE: 'Continuar con Google'
    },
    REGISTER: {
        TITULO: 'Crea tu cuenta', BADGE: 'Bienvenido',
        NOMBRE: 'Nombre completo', PLACEHOLDER_NOMBRE: 'Juan García',
        EMAIL: 'Email', CONTRASENA: 'Contraseña', CONFIRMAR: 'Confirmar contraseña',
        ERROR_NOMBRE: 'Mínimo 3 caracteres', ERROR_EMAIL: 'Email no válido',
        ERROR_CONTRASENA: 'Mínimo 8 caracteres, una mayúscula y un número',
        ERROR_COINCIDEN: 'Las contraseñas no coinciden',
        BTN: 'Crear cuenta', BTN_CARGANDO: 'Creando cuenta...',
        YA_TIENES: '¿Ya tienes cuenta?', INICIAR: 'Inicia sesión'
    },
    RESENAS_PAGE: {
        TITULO: 'Reseñas', BADGE: 'Opiniones',
        CARGANDO: 'Cargando reseñas...',
        SIN_RESENAS: 'Aún no hay reseñas. ¡Sé el primero!',
        BASADO_EN: 'Basado en', RESENA_S: 'reseña', RESENAS_P: 'reseñas',
        MEDIA_LABEL: 'puntuación media'
    },
    GALERIA: {
        TITULO: 'Galería de cortes', BADGE: 'Nuestro trabajo',
        SUBTITULO: 'Cada corte es una obra de arte. Descubre nuestros trabajos y encuentra el estilo que buscas.',
        CTA_TEXTO: '¿Te gusta lo que ves?', CTA_BTN: 'Reservar cita',
        CARGANDO: 'Cargando galería...',
        CAT_TODOS: 'Todos', CAT_CORTES: 'Cortes', CAT_MECHAS: 'Mechas', CAT_TINTES: 'Tintes'
    },
    ERROR_404: {
        TITULO: '404', SUBTITULO: 'Página no encontrada',
        TEXTO: 'Esta página no existe o fue eliminada.',
        BTN: 'Volver al inicio'
    },
    AYUDA: {
        TITULO: 'Centro de ayuda', BADGE: 'Soporte', SUBTITULO: 'Resolvemos tus dudas más frecuentes',
        CONTACTAR: '¿Necesitas más ayuda?', CONTACTAR_DESC: 'Contacta con nosotros directamente',
        CONTACTAR_BTN: 'Contactar por WhatsApp',
        VIDEOS_TITULO: 'Tutoriales en vídeo',
        VIDEOS_PERFIL: 'Contenido personalizado para tu perfil de',
        VIDEOS_DISPONIBLES: 'tutoriales',
        ROL_PUBLICO: 'visitante', ROL_CLIENTE: 'cliente', ROL_ADMIN: 'administrador',
        FAQ_TITULO: 'Preguntas frecuentes',
        VIDEOS: {
            REGISTRO_TITULO: 'Cómo crear tu cuenta',
            REGISTRO_DESC: 'Aprende a registrarte en Secret Barber paso a paso y verifica tu correo para activar la cuenta.',
            RESERVAR_TITULO: 'Cómo reservar una cita',
            RESERVAR_DESC: 'Selecciona servicio, barbero, fecha y método de pago de forma rápida y sencilla.',
            GESTIONAR_TITULO: 'Gestionar tus reservas',
            GESTIONAR_DESC: 'Cómo modificar o cancelar una cita pendiente o confirmada desde \'Mis reservas\'.',
            RESENA_TITULO: 'Dejar una reseña',
            RESENA_DESC: 'Una vez completada tu cita, valora la experiencia y ayuda a otros clientes.',
            GOOGLE_TITULO: 'Iniciar sesión con Google',
            GOOGLE_DESC: 'Accede de forma rápida y segura vinculando tu cuenta de Google.',
            ADMIN_RESERVAS_TITULO: 'Gestión de reservas (Admin)',
            ADMIN_RESERVAS_DESC: 'Consulta, confirma, completa o cancela citas desde el panel de administración.',
            ADMIN_STATS_TITULO: 'Estadísticas y analíticas (Admin)',
            ADMIN_STATS_DESC: 'Analiza ingresos, reservas por periodo, servicios populares y define intervalos personalizados.',
            ADMIN_USUARIOS_TITULO: 'Gestión de usuarios y reseñas (Admin)',
            ADMIN_USUARIOS_DESC: 'Administra cuentas de clientes, activa o desactiva accesos y modera las reseñas públicas.'
        },
        FAQ: {
            Q1: '¿Cómo puedo reservar una cita?',
            A1: 'Ve a la sección "Reservar cita" en el menú superior, selecciona el servicio, fecha, hora y método de pago. Si pagas con tarjeta serás redirigido a Stripe para completar el pago de forma segura.',
            Q2: '¿Puedo cancelar o modificar mi reserva?',
            A2: 'Sí. Desde "Mis reservas" puedes cancelar o modificar cualquier cita que esté en estado pendiente o confirmada. Si la modificas, el barbero deberá volver a confirmarla.',
            Q3: '¿Qué métodos de pago están disponibles?',
            A3: 'Puedes pagar con tarjeta de crédito/débito a través de Stripe de forma segura, o elegir pagar en efectivo directamente en la barbería el día de tu cita.',
            Q4: '¿Cómo inicio sesión con Google?',
            A4: 'En la página de inicio de sesión encontrarás el botón "Continuar con Google". Al pulsarlo serás redirigido a Google para autenticarte y volverás automáticamente a la aplicación.',
            Q5: '¿Cuándo puedo dejar una reseña?',
            A5: 'Solo puedes dejar una reseña una vez que tu cita haya sido marcada como completada por el barbero. Desde "Mis reservas" verás el botón para dejar tu valoración.',
            Q6: '¿Puedo añadir arreglo de cejas a mi cita?',
            A6: 'Sí. Al crear o modificar una reserva encontrarás la opción de añadir arreglo de cejas por 1€ adicional.',
            Q7: '¿Recibiré confirmación de mi reserva?',
            A7: 'Sí, recibirás un correo electrónico con todos los detalles de tu reserva: servicio, fecha, hora, precio y método de pago.',
            Q8: '¿La barbería abre todos los días?',
            A8: 'La barbería abre de lunes a sábado de 09:00 a 20:00. No se pueden reservar citas en domingo.'
        }
    },
    ACERCA: {
        TITULO: 'Acerca de', BADGE: 'El proyecto',
        APP_DESC: 'Aplicación web completa para la gestión de una barbería profesional.',
        AUTOR: 'Alumno', CICLO: 'Ciclo', CENTRO: 'Centro', VERSION: 'Versión', CURSO: 'Curso',
        PROYECTO: 'Proyecto Final de Grado'
    },
    SERVICIOS_LISTA: {
        CORTE:             { nombre: 'Corte',                       descripcion: 'Corte clásico o moderno a tu estilo' },
        CORTE_BARBA:       { nombre: 'Corte y barba',               descripcion: 'Pack completo con descuento' },
        MECHAS:            { nombre: 'Mechas',                      descripcion: 'Mechas con color a elegir' },
        MECHAS_BLANCAS:    { nombre: 'Mechas blancas',              descripcion: 'Mechas blancas con color a elegir' },
        TINTE_BLANCO:      { nombre: 'Tinte blanco entero',         descripcion: 'Decoloración total del cabello' },
        TINTE_BLANCO_COLOR:{ nombre: 'Tinte blanco entero + color', descripcion: 'Decoloración total con color a elegir' },
        CEJAS:             { nombre: 'Cejas',                       descripcion: 'Perfilado y arreglo de cejas' },
    },
    FOOTER: {
        DESC: 'Tu barbería de confianza. Cortes modernos y clásicos con la mejor atención personalizada.',
        ENLACES: 'Enlaces', CONTACTO: 'Contacto',
        INICIO: 'Inicio', CORTES: 'Cortes', RESENAS: 'Reseñas',
        RESERVAR: 'Reservar cita', AYUDA: 'Ayuda', ACERCA: 'Acerca de',
        DERECHOS: 'Todos los derechos reservados.'
    },
    ADMIN: {
        LAYOUT: {
            PANEL: 'Panel Admin', BREADCRUMB: 'Panel de administración',
            NAV_RESERVAS: 'Reservas', NAV_USUARIOS: 'Usuarios',
            NAV_RESENAS: 'Reseñas', NAV_ESTADISTICAS: 'Estadísticas',
            CERRAR_SESION: 'Cerrar sesión'
        },
        RESERVAS: {
            TITULO: 'Gestión de reservas',
            SUBTITULO: 'Confirma, completa o cancela las citas del negocio',
            BUSCAR_PH: 'Buscar por nombre o email del cliente...',
            FILTRO_HOY: 'Hoy', FILTRO_MANANA: 'Mañana', FILTRO_SEMANA: 'Esta semana', FILTRO_TODAS: 'Último mes',
            ESTADO_TODAS: 'Todas', ESTADO_PENDIENTE: 'Pendiente', ESTADO_CONFIRMADA: 'Confirmada',
            ESTADO_COMPLETADA: 'Completada', ESTADO_CANCELADA: 'Cancelada',
            CARGANDO: 'Cargando reservas...', SIN_RESERVAS: 'No hay reservas para este filtro',
            BTN_CONFIRMAR: 'Confirmar', BTN_COMPLETADA: 'Completada',
            BTN_MARCAR_PAGADO: 'Marcar pagado', BTN_CANCELAR: 'Cancelar', CEJAS: '+ Cejas',
            SWAL_CONF_TITULO: '¿Confirmar esta reserva?', SWAL_CONF_TEXTO: 'La reserva pasará a estado confirmada',
            SWAL_COMP_TITULO: '¿Marcar como completada?', SWAL_COMP_TEXTO: 'El cliente podrá dejar una reseña tras esto',
            SWAL_CANC_TITULO: '¿Cancelar esta reserva?', SWAL_CANC_TEXTO: 'Esta acción no se puede deshacer',
            SWAL_PAGO_TITULO: '¿Marcar como pagada?', SWAL_PAGO_TEXTO: 'Confirma que el cliente ha pagado',
            SWAL_SI: 'Sí, confirmar', SWAL_SI_PAGADO: 'Sí, pagado', SWAL_PAGADA_OK: 'Reserva marcada como pagada',
            SWAL_RESERVA: 'Reserva'
        },
        USUARIOS: {
            TITULO: 'Gestión de usuarios',
            SUBTITULO: 'Administra los clientes registrados en la plataforma',
            BUSCAR_PH: 'Buscar por nombre o email...',
            FILTRO_TODOS: 'Todos', FILTRO_CLIENTES: 'Clientes', FILTRO_ADMINS: 'Admins',
            CARGANDO: 'Cargando usuarios...', SIN_USUARIOS: 'No hay usuarios para este filtro',
            ACTIVO: 'Activo', INACTIVO: 'Inactivo',
            BTN_DESACTIVAR: 'Desactivar', BTN_ACTIVAR: 'Activar',
            BTN_HACER_CLIENTE: 'Hacer Cliente', BTN_HACER_ADMIN: 'Hacer Admin', BTN_ELIMINAR: 'Eliminar',
            SWAL_DESACTIVAR: '¿Desactivar a {{ nombre }}?', SWAL_DESACTIVAR_TEXTO: 'El usuario no podrá iniciar sesión',
            SWAL_ACTIVAR: '¿Activar a {{ nombre }}?', SWAL_ACTIVAR_TEXTO: 'El usuario podrá volver a iniciar sesión',
            SWAL_HACER_ROL: '¿Hacer {{ rol }} a {{ nombre }}?',
            SWAL_ROL_ADMIN_TEXTO: 'Tendrá acceso total al panel de administración',
            SWAL_ROL_CLIENTE_TEXTO: 'Perderá el acceso al panel de administración',
            SWAL_ROL_OK: '¡Rol actualizado!', SWAL_ROL_OK_TEXTO: '{{ nombre }} ahora es {{ rol }}',
            SWAL_ELIMINAR: '¿Eliminar a {{ nombre }}?', SWAL_ELIMINAR_TEXTO: 'Esta acción no se puede deshacer',
            SWAL_ELIMINADO: 'Usuario eliminado', SWAL_ACTIVADO: 'activado', SWAL_DESACTIVADO: 'desactivado',
            SWAL_SI_DESACTIVAR: 'Sí, desactivar', SWAL_SI_ACTIVAR: 'Sí, activar',
            SWAL_SI_ELIMINAR: 'Sí, eliminar', SWAL_SI_CAMBIAR_ROL: 'Sí, confirmar',
            SWAL_NO_ROL: 'Acción no permitida', SWAL_NO_ROL_TEXTO: 'No puedes cambiar tu propio rol',
            SWAL_USUARIO_ACTIVADO: 'Usuario activado', SWAL_USUARIO_DESACTIVADO: 'Usuario desactivado'
        },
        RESENAS: {
            TITULO: 'Gestión de reseñas',
            SUBTITULO: 'Modera las valoraciones de los clientes',
            FILTRO_TODAS: 'Todas',
            CARGANDO: 'Cargando reseñas...', SIN_RESENAS: 'No hay reseñas para este filtro',
            VISIBLE: 'Visible', OCULTA: 'Oculta',
            BTN_OCULTAR: 'Ocultar', BTN_MOSTRAR: 'Mostrar', BTN_ELIMINAR: 'Eliminar',
            SWAL_OCULTAR: '¿Ocultar esta reseña?', SWAL_OCULTAR_TEXTO: 'La reseña dejará de ser visible',
            SWAL_MOSTRAR: '¿Mostrar esta reseña?', SWAL_MOSTRAR_TEXTO: 'La reseña volverá a ser visible',
            SWAL_SI_OCULTAR: 'Sí, ocultar', SWAL_SI_MOSTRAR: 'Sí, mostrar',
            SWAL_VISIBLE: 'Reseña visible', SWAL_OCULTA_OK: 'Reseña oculta',
            SWAL_ELIMINAR: '¿Eliminar esta reseña?', SWAL_ELIMINAR_TEXTO: 'Esta acción no se puede deshacer',
            SWAL_SI_ELIMINAR: 'Sí, eliminar', SWAL_ELIMINADA: 'Reseña eliminada'
        },
        ESTADISTICAS: {
            TITULO: 'Estadísticas',
            SUBTITULO: 'Resumen de ingresos y rendimiento del negocio',
            CARGANDO: 'Cargando estadísticas...',
            FILTRO_HOY: 'Hoy', FILTRO_SEMANA: 'Esta semana', FILTRO_MES: 'Este mes', FILTRO_ANIO: 'Este año',
            FILTRO_RANGO: 'Seleccionar fechas',
            RANGO_TITULO: 'Selecciona un intervalo de fechas',
            RANGO_DESDE: 'Desde', RANGO_HASTA: 'Hasta',
            RANGO_APLICAR: 'Aplicar', RANGO_APLICANDO: 'Cargando...',
            KPI_INGRESOS: 'Ingresos', KPI_RESERVAS: 'Reservas pagadas', KPI_TICKET: 'Ticket medio',
            KPI_TICKET_DESC: 'Precio medio anual por reserva',
            GRAFICO_BARRAS: 'Ingresos últimos 12 meses', GRAFICO_ANIO: 'año completo',
            GRAFICO_DONUT: 'Servicios populares'
        }
    }
};

const EN = {
    NAV: {
        INICIO: 'Home', RESERVAR: 'Book', MIS_RESERVAS: 'My bookings',
        RESENAS: 'Reviews', CORTES: 'Haircuts', ADMIN: 'Admin', AYUDA: 'Help',
        INICIAR_SESION: 'Log in', REGISTRARSE: 'Sign up', CERRAR_SESION: 'Log out'
    },
    HOME: {
        BADGE: 'Premium Barbershop', SUBTITULO: 'Where tradition meets modern style. Book your appointment and live the experience.',
        BTN_RESERVAR: 'Book appointment', BTN_RESENAS: 'See reviews',
        SERVICIOS_BADGE: 'What we offer', SERVICIOS_TITULO: 'Our Services',
        POR_QUE_BADGE: 'Our difference', POR_QUE_TITULO: 'Why choose us?',
        PROFESIONALES: 'Professionals', PROFESIONALES_DESC: 'Barbers with years of experience and ongoing training.',
        RESERVA_ONLINE: 'Online booking', RESERVA_ONLINE_DESC: 'Book your appointment anytime, from anywhere.',
        PAGO_FLEXIBLE: 'Flexible payment', PAGO_FLEXIBLE_DESC: 'Pay by card in advance or cash in store.',
        CTA_TITULO: 'Ready for your next appointment?', CTA_SUBTITULO: 'Book now and secure your spot at Secret Barber.',
        CTA_BTN: 'Book now', RESENAS_BADGE: 'What our clients say', VER_RESENAS: 'See all reviews'
    },
    RESERVAS: {
        TITULO: 'Book appointment', BADGE: 'New appointment', BARBERO: 'Barber',
        SERVICIOS: 'Services', SERVICIOS_HINT: 'you can choose several',
        ANIADIDOS: 'Add-ons', CEJAS: 'Eyebrow grooming', FECHA: 'Date',
        HORA: 'Available time', METODO_PAGO: 'Payment method',
        EFECTIVO: 'Cash', EFECTIVO_DESC: 'Pay in store',
        TARJETA: 'Card', TARJETA_DESC: 'Pay now with Stripe',
        NOTAS: 'Notes', NOTAS_HINT: 'optional', TOTAL: 'Total',
        DURACION: 'Estimated duration', CONFIRMAR: 'Confirm booking', PROCESANDO: 'Processing...',
        SIN_HORAS: 'No available times for that day.',
        SELECCIONA_PARA_HORAS: 'Select barber, services and date to see available times.',
        SOLO_MARTES_VIERNES: 'We only open Tuesday to Friday.',
        NOTAS_PLACEHOLDER: 'Any preference or indication...',
        ERROR_BARBERO: 'Select a barber', ERROR_SERVICIO: 'Select at least one service',
        ERROR_FECHA: 'Select a date', ERROR_HORA: 'Select a time'
    },
    MIS_RESERVAS: {
        TITULO: 'My bookings', BADGE: 'Your history', SIN_RESERVAS: 'You have no bookings yet',
        RESERVAR_AHORA: 'Book now', NUEVA_RESERVA: 'New booking',
        MODIFICAR: 'Modify booking', CANCELAR: 'Cancel booking',
        GUARDAR: 'Save changes', GUARDANDO: 'Saving...',
        DEJAR_RESENA: 'Leave a review', ENVIAR_RESENA: 'Submit review', ENVIANDO: 'Sending...', MINUTOS: 'min',
        CARGANDO: 'Loading bookings...', A_LAS: 'at',
        PUNTUACION: 'Rating', COMENTARIO: 'Comment',
        PLACEHOLDER_COMENTARIO: 'Tell us about your experience...',
        ERROR_COMENTARIO: 'Minimum 10 characters'
    },
    ESTADOS: {
        pendiente:  'Pending',
        confirmada: 'Confirmed',
        completada: 'Completed',
        cancelada:  'Cancelled',
        PAGO: {
            pagado:   'Paid',
            pendiente:'Pending',
            fallido:  'Failed'
        }
    },
    COMUN: {
        CANCELAR: 'Cancel', GUARDAR: 'Save', CERRAR: 'Close',
        CARGANDO: 'Loading...', ERROR: 'An error occurred',
        VER_TODOS: 'See all', VOLVER: 'Go back'
    },
    LOGIN: {
        SUBTITULO: 'Sign in to your account',
        ERROR_EMAIL: 'Invalid email', ERROR_PASSWORD: 'Password is required',
        BTN: 'Sign in', BTN_CARGANDO: 'Signing in...',
        NO_CUENTA: "Don't have an account?", REGISTRATE: 'Sign up',
        O_CONTINUA: 'or continue with', GOOGLE: 'Continue with Google'
    },
    REGISTER: {
        TITULO: 'Create your account', BADGE: 'Welcome',
        NOMBRE: 'Full name', PLACEHOLDER_NOMBRE: 'John Smith',
        EMAIL: 'Email', CONTRASENA: 'Password', CONFIRMAR: 'Confirm password',
        ERROR_NOMBRE: 'Minimum 3 characters', ERROR_EMAIL: 'Invalid email',
        ERROR_CONTRASENA: 'Minimum 8 characters, one uppercase and one number',
        ERROR_COINCIDEN: 'Passwords do not match',
        BTN: 'Create account', BTN_CARGANDO: 'Creating account...',
        YA_TIENES: 'Already have an account?', INICIAR: 'Log in'
    },
    RESENAS_PAGE: {
        TITULO: 'Reviews', BADGE: 'Opinions',
        CARGANDO: 'Loading reviews...',
        SIN_RESENAS: 'No reviews yet. Be the first!',
        BASADO_EN: 'Based on', RESENA_S: 'review', RESENAS_P: 'reviews',
        MEDIA_LABEL: 'average rating'
    },
    GALERIA: {
        TITULO: 'Haircut gallery', BADGE: 'Our work',
        SUBTITULO: 'Every cut is a work of art. Discover our work and find the style you are looking for.',
        CTA_TEXTO: 'Like what you see?', CTA_BTN: 'Book appointment',
        CARGANDO: 'Loading gallery...',
        CAT_TODOS: 'All', CAT_CORTES: 'Haircuts', CAT_MECHAS: 'Highlights', CAT_TINTES: 'Dyes'
    },
    ERROR_404: {
        TITULO: '404', SUBTITULO: 'Page not found',
        TEXTO: 'This page does not exist or was removed.',
        BTN: 'Back to home'
    },
    AYUDA: {
        TITULO: 'Help centre', BADGE: 'Support', SUBTITULO: 'We answer your most common questions',
        CONTACTAR: 'Need more help?', CONTACTAR_DESC: 'Contact us directly',
        CONTACTAR_BTN: 'Contact via WhatsApp',
        VIDEOS_TITULO: 'Video tutorials',
        VIDEOS_PERFIL: 'Personalised content for your',
        VIDEOS_DISPONIBLES: 'tutorials',
        ROL_PUBLICO: 'visitor', ROL_CLIENTE: 'client', ROL_ADMIN: 'administrator',
        FAQ_TITULO: 'Frequently asked questions',
        VIDEOS: {
            REGISTRO_TITULO: 'How to create your account',
            REGISTRO_DESC: 'Learn how to sign up on Secret Barber step by step and verify your email to activate the account.',
            RESERVAR_TITULO: 'How to book an appointment',
            RESERVAR_DESC: 'Select service, barber, date and payment method quickly and easily.',
            GESTIONAR_TITULO: 'Managing your bookings',
            GESTIONAR_DESC: 'How to modify or cancel a pending or confirmed appointment from \'My bookings\'.',
            RESENA_TITULO: 'Leaving a review',
            RESENA_DESC: 'Once your appointment is completed, rate the experience and help other clients.',
            GOOGLE_TITULO: 'Sign in with Google',
            GOOGLE_DESC: 'Access quickly and securely by linking your Google account.',
            ADMIN_RESERVAS_TITULO: 'Booking management (Admin)',
            ADMIN_RESERVAS_DESC: 'View, confirm, complete or cancel appointments from the admin panel.',
            ADMIN_STATS_TITULO: 'Statistics & analytics (Admin)',
            ADMIN_STATS_DESC: 'Analyse revenue, bookings by period, popular services and define custom date ranges.',
            ADMIN_USUARIOS_TITULO: 'Users & reviews management (Admin)',
            ADMIN_USUARIOS_DESC: 'Manage client accounts, activate or deactivate access and moderate public reviews.'
        },
        FAQ: {
            Q1: 'How can I book an appointment?',
            A1: 'Go to the "Book appointment" section in the top menu, select the service, date, time and payment method. If you pay by card you will be redirected to Stripe to complete the payment securely.',
            Q2: 'Can I cancel or modify my booking?',
            A2: 'Yes. From "My bookings" you can cancel or modify any appointment in pending or confirmed status. If you modify it, the barber will need to confirm it again.',
            Q3: 'What payment methods are available?',
            A3: 'You can pay by credit/debit card through Stripe securely, or choose to pay in cash directly at the barbershop on the day of your appointment.',
            Q4: 'How do I sign in with Google?',
            A4: 'On the sign-in page you will find the "Continue with Google" button. Clicking it will redirect you to Google to authenticate and you will return to the app automatically.',
            Q5: 'When can I leave a review?',
            A5: 'You can only leave a review once your appointment has been marked as completed by the barber. From "My bookings" you will see the button to leave your rating.',
            Q6: 'Can I add an eyebrow trim to my appointment?',
            A6: 'Yes. When creating or modifying a booking you will find the option to add an eyebrow trim for an additional €1.',
            Q7: 'Will I receive confirmation of my booking?',
            A7: 'Yes, you will receive an email with all the details of your booking: service, date, time, price and payment method.',
            Q8: 'Is the barbershop open every day?',
            A8: 'The barbershop is open Monday to Saturday from 09:00 to 20:00. Appointments cannot be booked on Sundays.'
        }
    },
    ACERCA: {
        TITULO: 'About', BADGE: 'The project',
        APP_DESC: 'Complete web application for professional barbershop management.',
        AUTOR: 'Student', CICLO: 'Programme', CENTRO: 'School', VERSION: 'Version', CURSO: 'Year',
        PROYECTO: 'Final Degree Project'
    },
    SERVICIOS_LISTA: {
        CORTE:             { nombre: 'Haircut',             descripcion: 'Classic or modern cut to your style' },
        CORTE_BARBA:       { nombre: 'Haircut & beard',     descripcion: 'Complete pack with discount' },
        MECHAS:            { nombre: 'Highlights',          descripcion: 'Highlights with color of your choice' },
        MECHAS_BLANCAS:    { nombre: 'White highlights',    descripcion: 'White highlights with color of your choice' },
        TINTE_BLANCO:      { nombre: 'Full bleach',         descripcion: 'Full hair bleaching' },
        TINTE_BLANCO_COLOR:{ nombre: 'Full bleach + color', descripcion: 'Full bleach with color of your choice' },
        CEJAS:             { nombre: 'Eyebrows',            descripcion: 'Eyebrow shaping and grooming' },
    },
    FOOTER: {
        DESC: 'Your trusted barbershop. Modern and classic cuts with the best personalised service.',
        ENLACES: 'Links', CONTACTO: 'Contact',
        INICIO: 'Home', CORTES: 'Haircuts', RESENAS: 'Reviews',
        RESERVAR: 'Book appointment', AYUDA: 'Help', ACERCA: 'About',
        DERECHOS: 'All rights reserved.'
    },
    ADMIN: {
        LAYOUT: {
            PANEL: 'Admin Panel', BREADCRUMB: 'Administration panel',
            NAV_RESERVAS: 'Bookings', NAV_USUARIOS: 'Users',
            NAV_RESENAS: 'Reviews', NAV_ESTADISTICAS: 'Statistics',
            CERRAR_SESION: 'Log out'
        },
        RESERVAS: {
            TITULO: 'Booking management',
            SUBTITULO: 'Confirm, complete or cancel business appointments',
            BUSCAR_PH: 'Search by client name or email...',
            FILTRO_HOY: 'Today', FILTRO_MANANA: 'Tomorrow', FILTRO_SEMANA: 'This week', FILTRO_TODAS: 'Last month',
            ESTADO_TODAS: 'All', ESTADO_PENDIENTE: 'Pending', ESTADO_CONFIRMADA: 'Confirmed',
            ESTADO_COMPLETADA: 'Completed', ESTADO_CANCELADA: 'Cancelled',
            CARGANDO: 'Loading bookings...', SIN_RESERVAS: 'No bookings for this filter',
            BTN_CONFIRMAR: 'Confirm', BTN_COMPLETADA: 'Complete',
            BTN_MARCAR_PAGADO: 'Mark paid', BTN_CANCELAR: 'Cancel', CEJAS: '+ Eyebrows',
            SWAL_CONF_TITULO: 'Confirm this booking?', SWAL_CONF_TEXTO: 'The booking will be set to confirmed',
            SWAL_COMP_TITULO: 'Mark as completed?', SWAL_COMP_TEXTO: 'The client will be able to leave a review',
            SWAL_CANC_TITULO: 'Cancel this booking?', SWAL_CANC_TEXTO: 'This action cannot be undone',
            SWAL_PAGO_TITULO: 'Mark as paid?', SWAL_PAGO_TEXTO: 'Confirm that the client has paid',
            SWAL_SI: 'Yes, confirm', SWAL_SI_PAGADO: 'Yes, paid', SWAL_PAGADA_OK: 'Booking marked as paid',
            SWAL_RESERVA: 'Booking'
        },
        USUARIOS: {
            TITULO: 'User management',
            SUBTITULO: 'Manage registered clients on the platform',
            BUSCAR_PH: 'Search by name or email...',
            FILTRO_TODOS: 'All', FILTRO_CLIENTES: 'Clients', FILTRO_ADMINS: 'Admins',
            CARGANDO: 'Loading users...', SIN_USUARIOS: 'No users for this filter',
            ACTIVO: 'Active', INACTIVO: 'Inactive',
            BTN_DESACTIVAR: 'Deactivate', BTN_ACTIVAR: 'Activate',
            BTN_HACER_CLIENTE: 'Make Client', BTN_HACER_ADMIN: 'Make Admin', BTN_ELIMINAR: 'Delete',
            SWAL_DESACTIVAR: 'Deactivate {{ nombre }}?', SWAL_DESACTIVAR_TEXTO: 'The user will not be able to log in',
            SWAL_ACTIVAR: 'Activate {{ nombre }}?', SWAL_ACTIVAR_TEXTO: 'The user will be able to log in again',
            SWAL_HACER_ROL: 'Make {{ nombre }} a {{ rol }}?',
            SWAL_ROL_ADMIN_TEXTO: 'They will have full access to the admin panel',
            SWAL_ROL_CLIENTE_TEXTO: 'They will lose access to the admin panel',
            SWAL_ROL_OK: 'Role updated!', SWAL_ROL_OK_TEXTO: '{{ nombre }} is now {{ rol }}',
            SWAL_ELIMINAR: 'Delete {{ nombre }}?', SWAL_ELIMINAR_TEXTO: 'This action cannot be undone',
            SWAL_ELIMINADO: 'User deleted', SWAL_ACTIVADO: 'activated', SWAL_DESACTIVADO: 'deactivated',
            SWAL_SI_DESACTIVAR: 'Yes, deactivate', SWAL_SI_ACTIVAR: 'Yes, activate',
            SWAL_SI_ELIMINAR: 'Yes, delete', SWAL_SI_CAMBIAR_ROL: 'Yes, confirm',
            SWAL_NO_ROL: 'Action not allowed', SWAL_NO_ROL_TEXTO: 'You cannot change your own role',
            SWAL_USUARIO_ACTIVADO: 'User activated', SWAL_USUARIO_DESACTIVADO: 'User deactivated'
        },
        RESENAS: {
            TITULO: 'Review management',
            SUBTITULO: 'Moderate customer ratings',
            FILTRO_TODAS: 'All',
            CARGANDO: 'Loading reviews...', SIN_RESENAS: 'No reviews for this filter',
            VISIBLE: 'Visible', OCULTA: 'Hidden',
            BTN_OCULTAR: 'Hide', BTN_MOSTRAR: 'Show', BTN_ELIMINAR: 'Delete',
            SWAL_OCULTAR: 'Hide this review?', SWAL_OCULTAR_TEXTO: 'The review will no longer be visible',
            SWAL_MOSTRAR: 'Show this review?', SWAL_MOSTRAR_TEXTO: 'The review will become visible again',
            SWAL_SI_OCULTAR: 'Yes, hide', SWAL_SI_MOSTRAR: 'Yes, show',
            SWAL_VISIBLE: 'Review visible', SWAL_OCULTA_OK: 'Review hidden',
            SWAL_ELIMINAR: 'Delete this review?', SWAL_ELIMINAR_TEXTO: 'This action cannot be undone',
            SWAL_SI_ELIMINAR: 'Yes, delete', SWAL_ELIMINADA: 'Review deleted'
        },
        ESTADISTICAS: {
            TITULO: 'Statistics',
            SUBTITULO: 'Revenue and business performance summary',
            CARGANDO: 'Loading statistics...',
            FILTRO_HOY: 'Today', FILTRO_SEMANA: 'This week', FILTRO_MES: 'This month', FILTRO_ANIO: 'This year',
            FILTRO_RANGO: 'Select dates',
            RANGO_TITULO: 'Select a date range',
            RANGO_DESDE: 'From', RANGO_HASTA: 'To',
            RANGO_APLICAR: 'Apply', RANGO_APLICANDO: 'Loading...',
            KPI_INGRESOS: 'Revenue', KPI_RESERVAS: 'Paid bookings', KPI_TICKET: 'Average ticket',
            KPI_TICKET_DESC: 'Annual average price per booking',
            GRAFICO_BARRAS: 'Revenue last 12 months', GRAFICO_ANIO: 'full year',
            GRAFICO_DONUT: 'Popular services'
        }
    }
};
@Injectable({ providedIn: 'root' })
export class LanguageService {
    private translate = inject(TranslateService);

    readonly idioma = signal<'es' | 'en'>('es');

    constructor() {
        this.translate.setTranslation('es', ES);
        this.translate.setTranslation('en', EN);
        this.translate.addLangs(['es', 'en']);
        this.translate.setDefaultLang('es');

        const guardado = localStorage.getItem('idioma') as 'es' | 'en' | null;
        const inicial  = guardado || 'es';
        this.translate.use(inicial);
        this.idioma.set(inicial);
    }

    cambiarIdioma(): void {
        const nuevo = this.idioma() === 'es' ? 'en' : 'es';
        this.translate.use(nuevo);
        this.idioma.set(nuevo);
        localStorage.setItem('idioma', nuevo);
    }
}