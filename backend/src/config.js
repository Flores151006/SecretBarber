import { config } from 'dotenv';

config(); // Leer variables de entorno

export const PORT               = process.env.PORT;
export const URI                = process.env.MONGO_URI;
export const SECRET_KEY         = process.env.JWT_SECRET;
export const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;
export const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_CALLBACK_URL  = process.env.GOOGLE_CALLBACK_URL;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
