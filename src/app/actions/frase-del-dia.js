'use server';

// [ACCIÓN DE SERVIDOR: FRASE DEL DÍA] Elige una frase estable por hogar y fecha argentina.
const API_FRASES = 'https://phrasesapi.onrender.com/getAllPhrases';
const FRASES_DE_RESPALDO = [
  'Cuando cada persona aporta, el hogar funciona mejor.',
  'Una tarea compartida pesa menos y acerca más.',
  'Organizarnos en equipo convierte pendientes en logros.',
  'Los pequeños acuerdos hacen más fácil convivir.',
  'Compartir responsabilidades también es cuidarnos.',
];

function fechaArgentina() {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function hashEstable(texto) {
  let valor = 2166136261;
  for (let indice = 0; indice < texto.length; indice += 1) {
    valor = Math.imul(valor ^ texto.charCodeAt(indice), 16777619);
  }
  return valor >>> 0;
}

function indiceDeHogarYDia(identificadorHogar, fecha, cantidad) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const numeroDia = Math.floor(Date.UTC(anio, mes - 1, dia) / 86_400_000);
  return (hashEstable(identificadorHogar) + numeroDia) % cantidad;
}

function prepararFrases(datos) {
  const recibidas = Array.isArray(datos)
    ? datos
    : Array.isArray(datos?.frases)
      ? datos.frases
      : [datos];
  const validas = recibidas.filter(
    (elemento) =>
      elemento &&
      typeof elemento.phrase === 'string' &&
      elemento.phrase.trim().length > 0 &&
      elemento.phrase.trim().length <= 180
  );
  const frasesDeTrabajo = validas.filter((elemento) => {
    const tema = String(elemento.type || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es-AR');
    return tema.includes('trabajo') || tema.includes('work');
  });

  return (frasesDeTrabajo.length ? frasesDeTrabajo : validas)
    .sort((primera, segunda) =>
      String(primera._id || primera.phrase).localeCompare(String(segunda._id || segunda.phrase))
    )
    .slice(0, 1000);
}

export async function obtenerFraseDelDia(identificadorHogar) {
  const hogar =
    typeof identificadorHogar === 'string' && identificadorHogar.trim().length <= 100
      ? identificadorHogar.trim()
      : '';
  const fecha = fechaArgentina();

  try {
    if (!hogar) throw new Error('No se pudo identificar el hogar.');

    // [CONSULTA EXTERNA] La lista se almacena en caché; la selección diaria se calcula aparte.
    const respuesta = await fetch(API_FRASES, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(5_000),
    });

    if (!respuesta.ok) {
      throw new Error('La API de frases respondió con el estado ' + respuesta.status + '.');
    }

    const frases = prepararFrases(await respuesta.json());
    if (!frases.length) throw new Error('La API no devolvió frases válidas.');

    const frase = frases[indiceDeHogarYDia(hogar, fecha, frases.length)];
    return {
      texto: frase.phrase.trim(),
      autor: typeof frase.author === 'string' ? frase.author.trim() : '',
      esRespaldo: false,
    };
  } catch {
    // [RESPALDO LOCAL] La elección también depende del hogar y cambia al comenzar otro día.
    const indice = indiceDeHogarYDia(
      hogar || 'vista-previa',
      fecha,
      FRASES_DE_RESPALDO.length
    );

    return {
      texto: FRASES_DE_RESPALDO[indice],
      autor: '',
      esRespaldo: true,
    };
  }
}
