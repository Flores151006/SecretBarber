// ─────────────────────────────────────────────────────────────────────────────
// user.model.ts
//
// Interfaz TypeScript que representa un usuario del sistema tal como
// lo devuelve la API (GET /users/:id, GET /users/perfil, etc.).
//
// POR QUÉ UNA INTERFACE Y NO UNA CLASE:
// Una clase en TypeScript genera código JavaScript real (con constructor, métodos, etc.).
// Una interface solo existe durante la compilación para verificar tipos;
// no genera ningún código en el JS final, lo que lo hace más ligero.
// Usamos interfaces para modelar datos que vienen de una API porque no
// necesitamos métodos, solo estructura.
//
// CAMPOS OPCIONALES (?):
// El símbolo ? después del nombre de un campo significa que es opcional,
// es decir, puede estar presente o ser undefined. Se usa cuando la API
// puede no devolver ese campo en todos los endpoints.
// ─────────────────────────────────────────────────────────────────────────────

// Refleja el documento User de MongoDB tal como lo serializa el backend.
// Otros modelos (Booking, Review) referencian esta interfaz cuando el campo
// está populado (en lugar de ser solo un string con el ID).
export interface User {
    _id:       string;
    name:      string;
    email:     string;

    // Union type de literales: el rol solo puede ser uno de estos dos valores.
    // El guard adminGuard comprueba este campo para proteger las rutas de admin.
    role:      'Admin' | 'Cliente';

    // El avatar se almacena como una cadena base64 en la base de datos
    // (data:image/jpeg;base64,...). Es null si el usuario no ha subido foto.
    avatar:    string | null;

    // Si active es false, el usuario está desactivado por el admin y no puede
    // iniciar sesión aunque su cuenta exista.
    active:    boolean;

    createdAt: string;  // fecha ISO 8601 de creación del documento en MongoDB
    updatedAt: string;  // fecha ISO 8601 de última modificación
}
