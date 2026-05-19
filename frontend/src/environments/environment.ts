// ─────────────────────────────────────────────────────────────────────────────
// environment.ts
//
// Variables de entorno para el entorno de DESARROLLO (local).
// Centraliza aquí todas las constantes que cambian entre entornos para no
// tener "magic strings" dispersos por el código.
//
// CÓMO FUNCIONA:
// Cuando ejecutas `ng serve`, Angular usa este archivo.
// Cuando ejecutas `ng build` (producción), Angular sustituye automáticamente
// este archivo por environment.prod.ts gracias a la configuración de
// fileReplacements en angular.json.
//
// USO EN SERVICIOS:
//   import { environment } from '../../../environments/environment';
//   this.http.get(environment.apiUrl + '/bookings');
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
    // false indica que estamos en desarrollo.
    // Se usa en algunos servicios para activar logs extra o deshabilitar
    // características solo disponibles en producción.
    production:       false,

    // URL base de la API REST del backend (Express + MongoDB en Render).
    // Todos los servicios Angular construyen sus endpoints concatenando
    // esta URL con el recurso: `${environment.apiUrl}/bookings`, etc.
    apiUrl:           'https://secretbarber.onrender.com/api',

    // Clave pública de Google reCAPTCHA v3.
    // Esta clave es pública y puede estar en el código fuente (a diferencia de
    // la clave SECRETA, que solo debe existir en el backend).
    // reCAPTCHA v3 es invisible: no muestra el checkbox "No soy un robot";
    // en su lugar analiza el comportamiento del usuario y devuelve una puntuación.
    recaptchaSiteKey: '6Ldfnd0sAAAAAN9J73arWSPFEJ12qv7ZVvLgpoyy'
};
