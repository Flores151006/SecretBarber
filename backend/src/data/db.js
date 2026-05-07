import mongoose from 'mongoose';
import { URI } from '../config.js';

let conexion = null;

/**
 * Conecta a MongoDB usando Mongoose.
 * La conexión se hace una sola vez y se reutiliza (patrón singleton).
 */
export const conexionBD = async () => {
    try {
        console.log('URI:', URI);
        if (conexion && mongoose.connection.readyState === 1) {
            console.log('Ya existe una conexión activa a MongoDB');
            return conexion;
        }

        conexion = await mongoose.connect(URI, {
            dbName: 'barberia_db',
            serverSelectionTimeoutMS: 30000
        });

        console.log('Conexión exitosa a MongoDB con Mongoose');

        // Asegurar que el índice googleId sea sparse (permite múltiples null)
        try {
            const usersCol = mongoose.connection.db.collection('users');
            const indexes  = await usersCol.indexes();
            const idx      = indexes.find(i => i.name === 'googleId_1');
            if (idx && !idx.sparse) {
                await usersCol.dropIndex('googleId_1');
                await usersCol.createIndex({ googleId: 1 }, { unique: true, sparse: true });
                console.log('[DB] Índice googleId recreado como sparse');
            }
        } catch (idxErr) {
            console.warn('[DB] No se pudo corregir índice googleId:', idxErr.message);
        }

        return conexion.connection;

    } catch (error) {
        console.error(`Error al conectar a MongoDB: ${error.message}`);
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        throw new Error('No se pudo conectar a la base de datos');
    }
};