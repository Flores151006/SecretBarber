// ─────────────────────────────────────────────────────────────────────────────
// user.controller.js
//
// Gestión de usuarios: panel de administración (CRUD completo) y operaciones
// de perfil propio (el cliente gestiona su propia cuenta).
//
// Patrón .select('-password -googleId'):
//   .select() indica a Mongoose qué campos incluir o excluir de la consulta.
//   El prefijo '-' excluye el campo. Nunca se debe devolver el hash de la
//   contraseña ni el googleId al frontend: no los necesita y supondría
//   un riesgo innecesario si la respuesta fuera interceptada.
//
// bcrypt.compare:
//   bcrypt es un algoritmo de hash de una sola dirección (no se puede revertir).
//   Para verificar que la contraseña introducida es correcta, bcrypt la
//   "hashea" de nuevo con la misma sal y compara el resultado con el hash
//   almacenado. Nunca se compara el texto plano directamente.
//
// Protección del último Admin:
//   Si solo queda un Admin y se elimina, nadie podría volver a gestionar el
//   sistema. Por eso se cuenta el total de admins antes de permitir el borrado.
//   Esta regla se aplica tanto al borrado por Admin como a la eliminación de
//   cuenta propia.
//
// Softdelete vs hardDelete en avatar:
//   El avatar se guarda como base64 en el mismo documento del usuario.
//   Enviando avatar:null simplemente se borra ese campo; no hay fichero en
//   disco que preservar, así que no se necesita softdelete aquí.
// ─────────────────────────────────────────────────────────────────────────────
import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';

// ─── GET todos los usuarios (solo Admin) ──────────────────────────────────────
export const getUsuarios = async (req, res) => {
    try {
        // Excluir campos sensibles: el frontend nunca necesita el hash de la contraseña
        const usuarios = await User.find()
            .select('-password -googleId')
            .sort({ name: 1 });

        res.status(200).json({ data: usuarios.length ? usuarios : [] });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

// ─── GET un usuario por ID ────────────────────────────────────────────────────
export const getUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await User.findById(id).select('-password -googleId');
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ data: usuario });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
    }
};

// ─── POST crear usuario (solo Admin) ─────────────────────────────────────────
export const crearUsuario = async (req, res) => {
    try {
        const { name, email, password, role, active } = req.body;

        const existe = await User.findOne({ email });
        if (existe) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }

        // El factor 10 es el "cost factor" de bcrypt: cuántas rondas de hash se aplican.
        // A mayor número, más seguro pero más lento. 10 es el estándar recomendado.
        const hashPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = await User.create({
            name,
            email,
            password: hashPassword,
            role:   role   ?? 'Cliente',  // Operador nullish: si role es null/undefined, asigna 'Cliente'
            active: active ?? true
        });

        res.status(201).json({ id: nuevoUsuario._id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
};

// ─── PUT actualizar usuario (solo Admin) ──────────────────────────────────────
export const actualizarUsuario = async (req, res) => {
    try {
        const { id }                       = req.params;
        const { name, email, password, role, active } = req.body;

        const existe = await User.findById(id);
        if (!existe) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Solo hashear si mandan password nuevo, si no dejarlo como está
        // Esto permite actualizar nombre o rol sin tocar la contraseña
        const hashPassword = password && password.trim() !== ''
            ? await bcrypt.hash(password, 10)
            : existe.password;

        // runValidators: true aplica las validaciones del Schema de Mongoose
        // también en updates (por defecto Mongoose las omite en findByIdAndUpdate)
        const actualizado = await User.findByIdAndUpdate(
            id,
            { name, email, password: hashPassword, role, active },
            { new: true, runValidators: true }
        ).select('-password -googleId');

        res.status(200).json({ message: 'Usuario actualizado', data: actualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
};

// ─── DELETE eliminar usuario (solo Admin) ─────────────────────────────────────
export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Evitar que el Admin se elimine a sí mismo
        if (usuario._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
        }

        // Evitar eliminar al último Admin: si no queda ningún admin, el sistema
        // queda sin posibilidad de gestión. Se cuenta antes de borrar.
        if (usuario.role === 'Admin') {
            const totalAdmins = await User.countDocuments({ role: 'Admin' });
            if (totalAdmins <= 1) {
                return res.status(400).json({ message: 'No se puede eliminar al último administrador' });
            }
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
};

// ─── GET perfil propio (Cliente autenticado) ──────────────────────────────────
export const getPerfil = async (req, res) => {
    try {
        // Se excluyen además los tokens de verificación y reset: son datos internos
        // del sistema que el frontend nunca debe conocer ni mostrar
        const usuario = await User.findById(req.user.id).select('-password -googleId -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires');
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.status(200).json({ data: usuario });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil', error: error.message });
    }
};

// ─── PATCH actualizar perfil propio ──────────────────────────────────────────
export const updatePerfil = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 3) return res.status(400).json({ message: 'El nombre debe tener al menos 3 caracteres' });

        const actualizado = await User.findByIdAndUpdate(
            req.user.id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select('-password -googleId -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires');

        res.status(200).json({ message: 'Perfil actualizado correctamente', data: actualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el perfil', error: error.message });
    }
};

// ─── PATCH cambiar contraseña propia ─────────────────────────────────────────
export const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        if (!passwordActual || !passwordNueva) return res.status(400).json({ message: 'Todos los campos son requeridos' });
        if (passwordNueva.length < 8) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });

        const usuario = await User.findById(req.user.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Los usuarios que se registraron con Google no tienen campo password
        // en la base de datos, por lo que no pueden cambiarla aquí
        if (!usuario.password) return res.status(400).json({ message: 'Tu cuenta usa Google. No puedes cambiar la contraseña aquí.' });

        // bcrypt.compare compara la contraseña en texto plano con el hash almacenado
        // sin necesidad de conocer la contraseña original (es un hash unidireccional)
        const correcta = await bcrypt.compare(passwordActual, usuario.password);
        if (!correcta) return res.status(401).json({ message: 'La contraseña actual no es correcta' });

        usuario.password = await bcrypt.hash(passwordNueva, 10);
        await usuario.save();

        res.status(200).json({ message: 'Contraseña cambiada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar la contraseña', error: error.message });
    }
};

// ─── DELETE eliminar cuenta propia ───────────────────────────────────────────
export const eliminarCuenta = async (req, res) => {
    try {
        const usuario = await User.findById(req.user.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Misma protección que en eliminarUsuario: el último Admin no puede borrarse
        if (usuario.role === 'Admin') {
            const totalAdmins = await User.countDocuments({ role: 'Admin' });
            if (totalAdmins <= 1) return res.status(400).json({ message: 'No puedes eliminar la única cuenta de administrador' });
        }

        await User.findByIdAndDelete(req.user.id);
        res.status(200).json({ message: 'Cuenta eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cuenta', error: error.message });
    }
};

// ─── PATCH actualizar avatar propio ──────────────────────────────────────────
export const updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;

        // El avatar se almacena como string base64 directamente en el documento.
        // Al enviar null se borra el avatar (el campo queda en null en MongoDB).
        // No es un softdelete porque no hay entidad separada que preservar.
        if (avatar !== null && avatar !== undefined) {
            // Verificar que el string tiene la cabecera de un data URL de imagen
            if (typeof avatar !== 'string' || !avatar.startsWith('data:image/')) {
                return res.status(400).json({ message: 'Formato de imagen no válido' });
            }
            // Un base64 de 2MB en texto equivale a ~1.5MB de imagen real.
            // MongoDB tiene un límite de 16MB por documento, pero limitamos antes
            // para evitar documentos innecesariamente grandes.
            if (avatar.length > 2_000_000) {
                return res.status(400).json({ message: 'La imagen es demasiado grande. Máximo ~1.5 MB.' });
            }
        }

        const actualizado = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatar ?? null },  // ?? null: si avatar es undefined, guardar null explícitamente
            { new: true }
        ).select('-password -googleId -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires');

        res.status(200).json({ message: 'Avatar actualizado', data: actualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el avatar', error: error.message });
    }
};
