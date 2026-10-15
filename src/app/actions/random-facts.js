'use server';

// [SERVER ACTION: DATOS EXTERNOS] Mezcla animales conocidos con artículos aleatorios de Wikipedia en español.
const ANIMAL_PAGES = [
  'Ajolote',
  'Abeja',
  'Ballena azul',
  'Búho',
  'Caballito de mar',
  'Canguro',
  'Colibrí',
  'Delfín',
  'Elefante',
  'Erizo',
  'Jirafa',
  'Koala',
  'Lobo',
  'Murciélago',
  'Ornitorrinco',
  'Panda gigante',
  'Pingüino',
  'Pulpo',
  'Suricata',
  'Tiburón blanco',
  'Tortuga marina',
  'Zorro',
];

const INITIAL_STATE = { kind: '', subject: '', fact: '', articleUrl: '', error: '' };

function chooseAnimal(previousSubject) {
  const alternatives = ANIMAL_PAGES.filter((animal) => animal !== previousSubject);
  return alternatives[Math.floor(Math.random() * alternatives.length)];
}

async function getSpanishSummary(path) {
  const response = await fetch(`https://es.wikipedia.org/api/rest_v1/${path}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'EnEquipo/1.0 (server action de datos curiosos)' },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`La API respondió ${response.status}.`);

  const payload = await response.json();
  if (payload.lang !== 'es' || payload.type !== 'standard' || typeof payload.title !== 'string' || typeof payload.extract !== 'string' || !payload.extract.trim()) {
    throw new Error('La respuesta no contiene un resumen válido en español.');
  }

  return payload;
}

function shorten(text, maxLength = 460) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;

  const excerpt = cleanText.slice(0, maxLength);
  const lastSpace = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

function formatResult(payload, kind, subject) {
  return {
    kind,
    subject,
    fact: shorten(payload.extract),
    articleUrl: payload.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(payload.title)}`,
    error: '',
  };
}

export async function loadRandomFact(previousState = INITIAL_STATE) {
  try {
    const showAnimal = Math.random() < 0.5;

    try {
      if (showAnimal) {
        const animal = chooseAnimal(previousState.subject);
        const payload = await getSpanishSummary(`page/summary/${encodeURIComponent(animal)}`);
        return formatResult(payload, 'animal', animal);
      }

      const payload = await getSpanishSummary('page/random/summary');
      return formatResult(payload, 'general', payload.title);
    } catch {
      // Si falla la selección, ofrece la otra vía y conserva un dato útil para la tarjeta.
      if (showAnimal) {
        const payload = await getSpanishSummary('page/random/summary');
        return formatResult(payload, 'general', payload.title);
      }

      const animal = chooseAnimal(previousState.subject);
      const payload = await getSpanishSummary(`page/summary/${encodeURIComponent(animal)}`);
      return formatResult(payload, 'animal', animal);
    }
  } catch {
    return {
      ...previousState,
      error: 'No pudimos consultar un dato ahora. Revisá tu conexión e intentá otra vez.',
    };
  }
}
