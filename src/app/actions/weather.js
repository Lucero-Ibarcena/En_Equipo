'use server';

// [ACCIÓN DE SERVIDOR: CLIMA] Busca una ciudad y consulta sus condiciones actuales en Open-Meteo.
const ESTADO_INICIAL_CLIMA = {
  consulta: '',
  ubicacion: '',
  temperatura: null,
  sensacionTermica: null,
  humedad: null,
  viento: null,
  condicion: '',
  icono: 'cloud-sun',
  pronosticoHoy: null,
  recomendaciones: [],
  error: '',
};

// [TRADUCCIÓN: CÓDIGOS METEOROLÓGICOS] Convierte los códigos WMO en textos e iconos.
function describirCondicion(codigo) {
  if (codigo === 0) return { texto: 'Despejado', icono: 'sun' };
  if (codigo === 1) return { texto: 'Mayormente despejado', icono: 'cloud-sun' };
  if (codigo === 2) return { texto: 'Parcialmente nublado', icono: 'cloud-sun' };
  if (codigo === 3) return { texto: 'Nublado', icono: 'cloud' };
  if ([45, 48].includes(codigo)) return { texto: 'Niebla', icono: 'cloud' };
  if ([51, 53, 55, 56, 57].includes(codigo)) return { texto: 'Llovizna', icono: 'rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) {
    return { texto: 'Lluvia', icono: 'rain' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(codigo)) return { texto: 'Nieve', icono: 'snow' };
  if ([95, 96, 97, 99].includes(codigo)) return { texto: 'Tormenta', icono: 'storm' };
  return { texto: 'Condición variable', icono: 'cloud' };
}

// [CONSULTA EXTERNA] Solicita JSON con tiempo máximo y comprueba el estado HTTP.
async function solicitarJson(url, nombreServicio) {
  const respuesta = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });

  if (!respuesta.ok) {
    throw new Error(nombreServicio + ' respondió con el estado ' + respuesta.status + '.');
  }

  return respuesta.json();
}

// [SERVER ACTION] Recibe la ciudad del formulario y devuelve solo los datos usados por la tarjeta.
export async function consultarClima(estadoAnterior = ESTADO_INICIAL_CLIMA, formulario) {
  const estadoPrevio = estadoAnterior || ESTADO_INICIAL_CLIMA;
  const valorConsulta = formulario?.get('city');
  const consulta = typeof valorConsulta === 'string' ? valorConsulta.trim() : '';

  try {
    if (consulta.length < 2) {
      throw new Error('Escribí una ciudad de al menos dos letras.');
    }

    if (consulta.length > 100) {
      throw new Error('La búsqueda es demasiado larga. Escribí una ciudad más corta.');
    }

    // [PETICIÓN 1: GEOCODIFICACIÓN] Convierte el nombre de la ciudad en coordenadas.
    const parametrosUbicacion = new URLSearchParams({
      name: consulta,
      count: '1',
      language: 'es',
      format: 'json',
    });
    const datosUbicacion = await solicitarJson(
      'https://geocoding-api.open-meteo.com/v1/search?' + parametrosUbicacion,
      'La búsqueda de ciudades'
    );
    const ubicacion = datosUbicacion?.results?.[0];

    if (
      !ubicacion ||
      typeof ubicacion.name !== 'string' ||
      !Number.isFinite(ubicacion.latitude) ||
      !Number.isFinite(ubicacion.longitude)
    ) {
      throw new Error('No encontramos esa ciudad. Probá agregar la provincia o el país.');
    }

    // [PETICIÓN 2: PRONÓSTICO] Consulta condiciones actuales y resumen meteorológico de hoy.
    const parametrosClima = new URLSearchParams({
      latitude: String(ubicacion.latitude),
      longitude: String(ubicacion.longitude),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
      forecast_days: '1',
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'precipitation_sum',
      ].join(','),
    });
    const datosClima = await solicitarJson(
      'https://api.open-meteo.com/v1/forecast?' + parametrosClima,
      'El servicio meteorológico'
    );
    const actual = datosClima?.current;
    const dia = datosClima?.daily;
    const valores = [
      actual?.temperature_2m,
      actual?.apparent_temperature,
      actual?.relative_humidity_2m,
      actual?.weather_code,
      actual?.wind_speed_10m,
      dia?.temperature_2m_max?.[0],
      dia?.temperature_2m_min?.[0],
      dia?.precipitation_probability_max?.[0],
      dia?.precipitation_sum?.[0],
      dia?.weather_code?.[0],
    ];

    if (!actual || !dia || valores.some((valor) => !Number.isFinite(valor))) {
      throw new Error('El servicio meteorológico devolvió datos incompletos.');
    }

    const nombresUbicacion = [
      ubicacion.name,
      ubicacion.admin1 !== ubicacion.name ? ubicacion.admin1 : '',
      ubicacion.country,
    ].filter((nombre, indice, nombres) => nombre && nombres.indexOf(nombre) === indice);
    const condicion = describirCondicion(actual.weather_code);
    const condicionHoy = describirCondicion(dia.weather_code[0]);
    const maximaProbabilidadLluvia = Math.round(dia.precipitation_probability_max[0]);
    const precipitacionPrevista = Math.round(dia.precipitation_sum[0] * 10) / 10;
    const lluviaProbable = maximaProbabilidadLluvia >= 50 || precipitacionPrevista >= 1;
    const lluviaImportante = maximaProbabilidadLluvia >= 65 || precipitacionPrevista >= 3;
    const climaAdverso =
      [
        45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95,
        96, 97, 99,
      ].includes(dia.weather_code[0]) || lluviaImportante;
    const temperaturaExtrema = dia.temperature_2m_max[0] >= 34 || dia.temperature_2m_min[0] <= 5;

    return {
      consulta,
      ubicacion: nombresUbicacion.join(', '),
      temperatura: Math.round(actual.temperature_2m),
      sensacionTermica: Math.round(actual.apparent_temperature),
      humedad: Math.round(actual.relative_humidity_2m),
      viento: Math.round(actual.wind_speed_10m),
      condicion: condicion.texto,
      icono: condicion.icono,
      pronosticoHoy: {
        maxima: Math.round(dia.temperature_2m_max[0]),
        minima: Math.round(dia.temperature_2m_min[0]),
        probabilidadLluvia: maximaProbabilidadLluvia,
        precipitacion: precipitacionPrevista,
        condicion: condicionHoy.texto,
      },
      recomendaciones: [
        {
          tarea: 'Tender la ropa',
          consejo: lluviaProbable
            ? 'Mejor esperar: puede llover.'
            : 'El pronóstico acompaña para tender.',
          favorable: !lluviaProbable,
        },
        {
          tarea: 'Regar las plantas',
          consejo: lluviaImportante
            ? 'Revisá la tierra; quizás puedas esperar.'
            : 'Si la tierra está seca, podría convenir regar.',
          favorable: !lluviaImportante,
        },
        {
          tarea: 'Hacer tareas al aire libre',
          consejo: climaAdverso
            ? 'Conviene elegir tareas bajo techo.'
            : temperaturaExtrema
              ? 'Se puede, con cuidado por la temperatura.'
              : 'El pronóstico acompaña para salir.',
          favorable: !climaAdverso && !temperaturaExtrema,
        },
      ],
      error: '',
    };
  } catch (error) {
    // [MANEJO DE ERRORES] Conserva el último clima recibido y explica por qué falló la consulta.
    let mensaje = 'No pudimos consultar el clima. Intentá de nuevo.';
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      mensaje = 'La consulta tardó demasiado. Revisá tu conexión e intentá de nuevo.';
    } else if (error instanceof TypeError) {
      mensaje = 'No pudimos conectar con el servicio meteorológico. Revisá tu conexión.';
    } else if (error instanceof SyntaxError) {
      mensaje = 'El servicio meteorológico envió una respuesta que no pudimos leer.';
    } else if (error instanceof Error) {
      mensaje = error.message;
    }

    if (estadoPrevio.ubicacion) {
      mensaje += ' Se conserva el último resultado de ' + estadoPrevio.ubicacion + '.';
    }

    return {
      ...estadoPrevio,
      consulta,
      error: mensaje,
    };
  }
}
