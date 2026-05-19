// ─────────────────────────────────────────────────────────────────────────────
// config.js
//
// Punto central de configuración de la aplicación.
//
// ¿Qué es dotenv?
//   Las variables de entorno son valores que el sistema operativo (o el servidor)
//   pone a disposición del proceso Node. La librería 'dotenv' lee el archivo
//   '.env' del proyecto y carga esas claves como si el sistema las hubiera
//   definido él mismo. Así el código nunca contiene credenciales en texto plano
//   y el archivo .env se excluye del repositorio mediante .gitignore.
//
// Decisión de diseño:
//   Exportar cada variable con un nombre semántico en lugar de usar
//   process.env.XXX directamente en cada módulo tiene dos ventajas:
//   1. Si el nombre de la variable de entorno cambia, solo hay que
//      actualizarlo aquí, no en cada archivo que la use.
//   2. El autocompletado del editor funciona mejor con exports nombrados.
// ─────────────────────────────────────────────────────────────────────────────
import { config } from 'dotenv';

// Carga el archivo .env en process.env — debe llamarse antes de leer cualquier variable
config(); // Leer variables de entorno

// Puerto en el que escucha el servidor HTTP (normalmente 3000 en local)
export const PORT               = process.env.PORT;

// Cadena de conexión a MongoDB (ej: mongodb://localhost:27017/secret-barber)
export const URI                = process.env.MONGO_URI;

// Secreto para firmar los Access Tokens JWT (corta duración, ~15 min)
export const SECRET_KEY         = process.env.JWT_SECRET;

// Secreto para firmar los Refresh Tokens JWT (larga duración, ~7 días)
// Se usa un secreto distinto para poder invalidar cada tipo de token por separado
export const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;

// Credenciales de la aplicación OAuth registrada en Google Cloud Console
export const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// URL a la que Google redirige tras la autenticación (debe coincidir exactamente
// con la URL autorizada en el panel de Google Cloud Console)
export const GOOGLE_CALLBACK_URL  = process.env.GOOGLE_CALLBACK_URL;

// Clave secreta de Stripe para operaciones server-side (cobros, webhooks…)
// NUNCA debe exponerse en el frontend; solo vive en el servidor
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
