'use client';

// [INTERFAZ: FRASE DEL DÍA] Muestra la frase del hogar y la actualiza al cambiar la fecha argentina.
import { useEffect, useRef, useState, useTransition } from 'react';
import { obtenerFraseDelDia } from '../../../app/actions/frase-del-dia.js';
import styles from './FraseDelDia.module.css';

const FUENTE_FRASES = 'https://github.com/MCeciliaLuna/phrases-API';

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

export default function FraseDelDia({ idHogar = '' }) {
  const [frase, setFrase] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [transicionActiva, iniciarTransicion] = useTransition();
  const fechaSolicitada = useRef('');
  const numeroSolicitud = useRef(0);
  const hogar = idHogar || 'vista-previa';

  useEffect(() => {
    const cargarFrase = () => {
      const fecha = fechaArgentina();
      fechaSolicitada.current = fecha;
      const solicitud = (numeroSolicitud.current += 1);
      setFrase(null);
      setCargando(true);

      iniciarTransicion(() => {
        obtenerFraseDelDia(hogar)
          .then((resultado) => {
            if (numeroSolicitud.current === solicitud) setFrase(resultado);
          })
          .catch(() => {
            if (numeroSolicitud.current === solicitud) {
              setFrase({
                texto: 'No pudimos cargar la frase. Probá de nuevo más tarde.',
                autor: '',
                esRespaldo: true,
              });
            }
          })
          .finally(() => {
            if (numeroSolicitud.current === solicitud) setCargando(false);
          });
      });
    };

    const revisarFecha = () => {
      if (fechaArgentina() !== fechaSolicitada.current) cargarFrase();
    };

    cargarFrase();
    const intervalo = window.setInterval(revisarFecha, 15_000);
    window.addEventListener('focus', revisarFecha);
    document.addEventListener('visibilitychange', revisarFecha);

    return () => {
      numeroSolicitud.current += 1;
      window.clearInterval(intervalo);
      window.removeEventListener('focus', revisarFecha);
      document.removeEventListener('visibilitychange', revisarFecha);
    };
  }, [hogar, iniciarTransicion]);

  return (
    <section className={styles.tarjeta} aria-labelledby="frase-del-dia-titulo">
      <div className={styles.encabezado}>
        <h2 id="frase-del-dia-titulo">Una frase para hoy</h2>
        <span>Compartida en este hogar; cambia a las 00:00 de Argentina.</span>
      </div>
      {cargando || transicionActiva ? (
        <p className={styles.cargando} aria-live="polite">
          Buscando una frase…
        </p>
      ) : (
        <blockquote className={styles.cita} aria-live="polite">
          {frase?.texto}
        </blockquote>
      )}
      <div className={styles.pie}>
        {frase?.autor ? <cite>{frase.autor}</cite> : null}
        {frase?.esRespaldo ? (
          <span className={styles.fuente}>Frase local</span>
        ) : frase ? (
          <a className={styles.fuente} href={FUENTE_FRASES} target="_blank" rel="noreferrer">
            Fuente: API pública de frases
          </a>
        ) : null}
      </div>
    </section>
  );
}
