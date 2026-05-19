// ─────────────────────────────────────────────────────────────────────────────
// environment.prod.ts
//
// Variables de entorno para el entorno de PRODUCCIÓN.
//
// CÓMO FUNCIONA EL INTERCAMBIO AUTOMÁTICO:
// Al ejecutar `ng build` (sin --configuration=development), Angular CLI
// busca en angular.json la sección "fileReplacements" y sustituye
// environment.ts por este archivo en el bundle final.
// El código de tu app siempre importa "environment.ts", pero en producción
// recibe el contenido de este archivo. No tienes que cambiar los imports
// en ningún servicio.
//
// DIFERENCIA CON DEVELOPMENT:
// - production: true  → activa optimizaciones (minificación, tree-shaking,
//   desactivación de mensajes de error detallados de Angular, etc.)
// - En este proyecto la apiUrl apunta al mismo servidor en ambos entornos,
//   pero en proyectos más grandes development podría apuntar a localhost:3000.
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
    // true activa el modo de producción de Angular:
    // - Elimina las comprobaciones extra de desarrollo (doble change detection)
    // - Deshabilita los mensajes de error extensos en consola
    // - El bundler aplica minificación y tree-shaking más agresivos
    production:       true,

    // Misma URL de API que en desarrollo porque el backend ya está en producción.
    // En proyectos con entornos separados aquí iría la URL de producción.
    apiUrl:           'https://secretbarber.onrender.com/api',

    // La misma clave pública de reCAPTCHA sirve en todos los entornos
    // porque está vinculada al dominio, no al entorno.
    recaptchaSiteKey: '6Ldfnd0sAAAAAN9J73arWSPFEJ12qv7ZVvLgpoyy'
};
