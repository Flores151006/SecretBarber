// ─────────────────────────────────────────────────────────────────────────────
// auth.model.ts
//
// Interfaces TypeScript para el flujo de autenticación (login, registro
// y respuesta del servidor con el JWT).
//
// QUÉ ES UNA INTERFACE EN TYPESCRIPT:
// Una interface define la "forma" que debe tener un objeto. NO existe en
// JavaScript en tiempo de ejecución (se borra al compilar); es solo una
// herramienta de TypeScript para que el editor nos avise si usamos
// propiedades que no existen o del tipo incorrecto.
//
// QUÉ ES UN DTO (Data Transfer Object):
// Es un objeto cuya única función es transportar datos entre capas.
// LoginDto = lo que enviamos al backend; AuthResponse = lo que recibimos.
// Separarlo en interfaces evita que accidentalmente enviemos campos de más
// (como el avatar o el rol) al hacer login.
// ─────────────────────────────────────────────────────────────────────────────

// Datos que el formulario de login envía al endpoint POST /auth/login.
// Solo necesitamos email y contraseña; nada más debe viajar en esa petición.
export interface LoginDto {
    email:    string;
    password: string;
}

// Datos que el formulario de registro envía al endpoint POST /auth/register.
// El backend se encargará de hashear la contraseña y asignar el rol por defecto.
export interface RegisterDto {
    name:     string;
    email:    string;
    password: string;
}

// Estructura exacta que devuelve el backend tras un login/registro exitoso.
// AuthService guarda esta respuesta: el accessToken en localStorage y
// el objeto user en el estado de la app.
export interface AuthResponse {
    // JWT (JSON Web Token) que el frontend incluirá en cada petición privada
    // mediante el AuthInterceptor en la cabecera: Authorization: Bearer <token>
    accessToken: string;
    user: {
        id:    string;
        name:  string;
        email: string;
        // Union type de literales: TypeScript solo permitirá los valores 'Admin' o 'Cliente'.
        // Si el backend devolviera 'admin' (minúscula) o 'user', TypeScript lo detectaría
        // como error de tipo en tiempo de compilación.
        role:  'Admin' | 'Cliente';
    };
}
