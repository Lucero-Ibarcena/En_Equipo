'use client';

// [INTERFAZ: CLIMA ACTUAL] Permite buscar una ciudad y muestra las condiciones recibidas.
import { useActionState, useState } from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  MapPin,
  RefreshCw,
  Snowflake,
  Sun,
} from 'lucide-react';
import { consultarClima } from '../../../app/actions/weather.js';
import styles from './WeatherCard.module.css';

// [ICONOS: ESTADO DEL TIEMPO] Asigna un icono visual a cada grupo de códigos meteorológicos.
const ICONOS_CLIMA = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

const ESTADO_INICIAL = {
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

export default function WeatherCard() {
  const [ciudad, setCiudad] = useState('');
  const [estado, accionFormulario, pendiente] = useActionState(consultarClima, ESTADO_INICIAL);
  const IconoClima = ICONOS_CLIMA[estado.icono] || CloudSun;

  return (
    <section className={styles.card} aria-labelledby="weather-title">
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true">
          <CloudSun size={18} />
        </span>
        <div className={styles.heading}>
          <h3 id="weather-title">Clima para organizarte</h3>
          <p>Pronóstico y sugerencias para las tareas de hoy.</p>
        </div>
      </header>

      <form className={styles.search} action={accionFormulario}>
        <label htmlFor="weather-city">Ciudad o localidad</label>
        <div className={styles.searchControls}>
          <input
            id="weather-city"
            name="city"
            type="text"
            autoComplete="off"
            maxLength={100}
            minLength={2}
            placeholder="Ej.: Buenos Aires, Argentina"
            value={ciudad}
            onChange={(event) => setCiudad(event.target.value)}
            required
          />
          <button className={styles.button} type="submit" disabled={pendiente || !ciudad.trim()}>
            <RefreshCw size={15} className={pendiente ? styles.spinning : ''} aria-hidden="true" />
            {pendiente ? 'Consultando…' : estado.ubicacion ? 'Actualizar' : 'Consultar'}
          </button>
        </div>
      </form>

      <div className={styles.result} aria-live="polite" aria-busy={pendiente}>
        {pendiente ? (
          <p className={styles.status}>Buscando el clima y el pronóstico de hoy…</p>
        ) : null}

        {estado.ubicacion ? (
          <div className={styles.weather}>
            <p className={styles.location}>
              <MapPin size={14} aria-hidden="true" />
              <span>{estado.ubicacion}</span>
            </p>
            <div className={styles.current}>
              <div>
                <p className={styles.temperature}>{estado.temperatura}°C</p>
                <p className={styles.condition}>{estado.condicion}</p>
              </div>
              <IconoClima className={styles.weatherIcon} size={38} aria-hidden="true" />
            </div>
            <dl className={styles.details}>
              <div>
                <dt>Sensación</dt>
                <dd>{estado.sensacionTermica}°</dd>
              </div>
              <div>
                <dt>Humedad</dt>
                <dd>{estado.humedad}%</dd>
              </div>
              <div>
                <dt>Viento</dt>
                <dd>{estado.viento} km/h</dd>
              </div>
            </dl>
            {estado.pronosticoHoy ? (
              <section className={styles.forecast} aria-label="Pronóstico de hoy">
                <div className={styles.forecastHeading}>
                  <h4>Pronóstico de hoy</h4>
                  <span>{estado.pronosticoHoy.condicion}</span>
                </div>
                <dl className={styles.forecastDetails}>
                  <div>
                    <dt>Mínima</dt>
                    <dd>{estado.pronosticoHoy.minima}°</dd>
                  </div>
                  <div>
                    <dt>Máxima</dt>
                    <dd>{estado.pronosticoHoy.maxima}°</dd>
                  </div>
                  <div>
                    <dt>Prob. de lluvia</dt>
                    <dd>{estado.pronosticoHoy.probabilidadLluvia}%</dd>
                  </div>
                </dl>
                <p className={styles.precipitation}>
                  Precipitación estimada: {estado.pronosticoHoy.precipitacion} mm
                </p>
              </section>
            ) : null}
            {estado.recomendaciones?.length ? (
              <section className={styles.planning} aria-label="Ideas para organizar las tareas">
                <h4>Para organizarte</h4>
                <ul>
                  {estado.recomendaciones.map((recomendacion) => (
                    <li key={recomendacion.tarea}>
                      <span>{recomendacion.tarea}</span>
                      <span
                        className={
                          recomendacion.favorable
                            ? styles.recommendationGood
                            : styles.recommendationCaution
                        }
                      >
                        {recomendacion.consejo}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.adviceNote}>
                  Son sugerencias orientativas; para regar, también revisá la tierra.
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        {!estado.ubicacion && !estado.error && !pendiente ? (
          <p className={styles.status}>Ingresá una ciudad para consultar el clima.</p>
        ) : null}

        {!pendiente && estado.error ? (
          <p className={styles.error} role="alert">
            {estado.error}
          </p>
        ) : null}
      </div>

      <p className={styles.attribution}>
        Datos meteorológicos: <a href="https://open-meteo.com/">Open-Meteo</a> ·{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
      </p>
    </section>
  );
}
