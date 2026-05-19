// ─────────────────────────────────────────────────────────────────────────────
// db.js
//
// Gestiona la conexión a MongoDB usando Mongoose.
//
// ¿Qué es Mongoose?
//   Es un ODM (Object Document Mapper) para MongoDB. Permite definir "esquemas"
//   (como una plantilla de cómo deben ser los datos) y trabajar con la base de datos
//   usando objetos JavaScript en vez de queries manuales.
//
// ¿Por qué MongoDB y no SQL?
//   MongoDB guarda datos como documentos JSON (flexible, sin estructura fija).
//   Es muy adecuado para este proyecto porque las reservas, usuarios y reseñas
//   tienen estructuras que pueden evolucionar sin migraciones complejas.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { URI } from '../config.js';

// Variable para guardar la referencia a la conexión activa
// Patrón "singleton": una sola conexión compartida por toda la aplicación
let conexion = null;

export const conexionBD = async () => {
    try {
        console.log('URI:', URI);

        // Si ya hay una conexión activa (readyState 1 = conectado), la reutilizamos
        // Esto evita abrir múltiples conexiones si se llama a esta función varias veces
        if (conexion && mongoose.connection.readyState === 1) {
            console.log('Ya existe una conexión activa a MongoDB');
            return conexion;
        }

        // Conectar a MongoDB Atlas (la URI viene del .env)
        // serverSelectionTimeoutMS: si MongoDB no responde en 30s, lanza error
        conexion = await mongoose.connect(URI, {
            dbName: 'barberia_db',
            serverSelectionTimeoutMS: 30000
        });

        console.log('Conexión exitosa a MongoDB con Mongoose');

        // ── Migración de índice en caliente ────────────────────────────────────
        // Problema encontrado durante el desarrollo: cuando añadimos Google OAuth,
        // el campo googleId se marcó como unique:true SIN sparse:true.
        // Un índice unique normal en MongoDB trata el valor "null" como un valor
        // único, por lo que solo permitía UN usuario sin googleId.
        // Todos los usuarios registrados con email/contraseña fallaban al intentar
        // crear su cuenta porque ya había un "null" en el índice.
        //
        // Solución: al arrancar el servidor, comprobamos si el índice existe y no es
        // sparse, y si es así lo borramos y recreamos correctamente.
        // sparse:true = el índice ignora documentos donde el campo no existe (null).
        try {
            const usersCol = mongoose.connection.db.collection('users');
            const indexes  = await usersCol.indexes(); // Obtener todos los índices de la colección

            const idx = indexes.find(i => i.name === 'googleId_1'); // Buscar el índice problemático
            if (idx && !idx.sparse) {
                // El índice existe pero no es sparse → necesita corrección
                await usersCol.dropIndex('googleId_1');
                await usersCol.createIndex({ googleId: 1 }, { unique: true, sparse: true });
                console.log('[DB] Índice googleId recreado como sparse');
            }
        } catch (idxErr) {
            // Si falla la corrección del índice, advertimos pero no paramos el servidor
            console.warn('[DB] No se pudo corregir índice googleId:', idxErr.message);
        }

        return conexion.connection;

    } catch (error) {
        console.error(`Error al conectar a MongoDB: ${error.message}`);
        // Intentar cerrar la conexión si quedó a medias
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        // Lanzar el error hacia arriba para que app.js pueda terminar el proceso
        throw new Error('No se pudo conectar a la base de datos');
    }
};
