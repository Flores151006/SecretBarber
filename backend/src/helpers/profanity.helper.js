// Normaliza texto: minúsculas + sustituye variaciones numéricas/especiales comunes
const normalizar = (texto) =>
    texto
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
        .replace(/[0@]/g, 'o')
        .replace(/[1!|]/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        .replace(/\$/g, 's')
        .replace(/[^a-z\s]/g, ''); // quita caracteres restantes

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

export const contienePalabraMalsonante = (texto) => {
    if (!texto) return false;
    const normalizado = normalizar(texto);
    return PALABRAS.some(palabra => {
        const reg = new RegExp(`\\b${normalizar(palabra)}\\b`, 'i');
        return reg.test(normalizado);
    });
};
