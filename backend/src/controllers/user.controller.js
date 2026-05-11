import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';

// ─── GET todos los usuarios (solo Admin) ──────────────────────────────────────
export const getUsuarios = async (req, res) => {
    try {
        // Nunca devolver el password ni el googleId al frontend
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

        const hashPassword = await bcrypt.hash(password, 10);

        const nuevoUsuario = await User.create({
            name,
            email,
            password: hashPassword,
            role:   role   ?? 'Cliente',
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
        const hashPassword = password && password.trim() !== ''
            ? await bcrypt.hash(password, 10)
            : existe.password;

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

        // Evitar eliminar al último Admin
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
        if (!usuario.password) return res.status(400).json({ message: 'Tu cuenta usa Google. No puedes cambiar la contraseña aquí.' });

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