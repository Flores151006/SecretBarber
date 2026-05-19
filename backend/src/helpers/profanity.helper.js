// ─────────────────────────────────────────────────────────────────────────────
// profanity.helper.js
//
// Filtro de palabras malsonantes para las reseñas públicas.
// Detecta insultos y palabrotas en español e inglés, incluso cuando se escriben
// con sustituciones típicas de internet (p3rr0, @ss, m13rda...).
//
// ¿Por qué necesitamos esto?
//   Las reseñas son públicas y visibles para todos los visitantes. Sin filtro,
//   cualquier usuario podría publicar contenido inapropiado. La solución ideal
//   sería un modelo de ML, pero para un proyecto de este tamaño un filtro basado
//   en regex con normalización es suficiente y no requiere infraestructura extra.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Función de normalización ─────────────────────────────────────────────────
// Convierte el texto a una forma "canónica" antes de buscar palabras prohibidas.
// Esto evita que alguien evada el filtro escribiendo "m13rda" en lugar de "mierda".
const normalizar = (texto) =>
    texto
        .toLowerCase()                               // todo en minúsculas
        .normalize('NFD').replace(/[̀-ͯ]/g, '')  // quita tildes: "miérdà" → "mierda"
        .replace(/[0@]/g, 'o')   // el 0 y la @ se usan como "o": "p0lla" → "polla"
        .replace(/[1!|]/g, 'i')  // 1, ! y | se usan como "i": "1d10ta" → "idiota"
        .replace(/3/g, 'e')      // 3 como "e": "m3rda" → "merda"
        .replace(/4/g, 'a')      // 4 como "a": "p4ja" → "paja"
        .replace(/5/g, 's')      // 5 como "s"
        .replace(/8/g, 'b')      // 8 como "b"
        .replace(/\$/g, 's')     // $ como "s": "$hit" → "shit"
        .replace(/[^a-z\s]/g, ''); // elimina cualquier otro carácter especial restante

// ─── Lista de palabras prohibidas ─────────────────────────────────────────────
// Lista manual en español e inglés. No está en una base de datos para no
// añadir dependencias externas ni requerir conexión en el momento de validar.
const PALABRAS = [
    // Español
    'puta','puto','putos','putas','putita','putito',
    'mierda','mierdas','mierdo',
    'joder','jodido','jodida','jodidos','jodidas',
    'coño','cono','coños',
    'hostia','hostias','hostio',
    'gilipollas','gilipolla','gilipollez',
    'cabron','cabrona','cabrones','cabronas',
    'imbecil','imbeciles',
    'idiota','idiotas',
    'estupido','estupida','estupidos','estupidas',
    'capullo','capulla','capullos',
    'maricón','maricon','maricones',
    'zorra','zorras','zorron',
    'polla','pollas',
    'follar','folla','follon',
    'pendejo','pendeja','pendejos','pendejas',
    'chingada','chingado','chingar',
    'verga','vergon',
    'culero','culera',
    'mamada','mamadas',
    'hijoputa','hijosdeputa','hijosdeperra',
    'subnormal','subnormales',
    'retrasado','retrasada',
    'mongolo','mongola','mongolos',
    'leche','lechazo',
    'me cago','mecago',
    // Inglés
    'fuck','fucking','fucker','fucked','fucks',
    'shit','shits','bullshit',
    'bitch','bitches','bitchy',
    'asshole','assholes','ass',
    'cunt','cunts',
    'cock','cocks','dickhead',
    'pussy','pussies',
    'bastard','bastards',
    'whore','whores',
    'nigger','niggers','nigga',
    'faggot','fag',
    'retard','retarded',
    'motherfucker','motherfucking',
    'damn','damnit',
    'crap','crappy',
];

// ─── Función principal ─────────────────────────────────────────────────────────
// Devuelve true si el texto contiene alguna palabra prohibida, false si está limpio.
// Se usa en el controlador de reseñas antes de guardar en la base de datos.
export const contienePalabraMalsonante = (texto) => {
    if (!texto) return false;

    // Normalizar el texto del usuario para compararlo en igualdad de condiciones
    const normalizado = normalizar(texto);

    // Comprobar si ALGUNA palabra de la lista aparece en el texto normalizado
    return PALABRAS.some(palabra => {
        // \b es un "word boundary" (límite de palabra) en regex
        // Asegura que "puta" no detecte falso positivo en "disputa" o "computadora"
        const reg = new RegExp(`\\b${normalizar(palabra)}\\b`, 'i');
        return reg.test(normalizado);
    });
};
