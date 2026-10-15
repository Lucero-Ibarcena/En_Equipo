'use client';

// [FRONTEND: DATOS EXTERNOS] Muestra una curiosidad variada y el enlace a su fuente en español.
import { useActionState } from 'react';
import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { loadRandomFact } from '../../../app/actions/random-facts.js';
import styles from './RandomFactCard.module.css';

const initialState = { kind: '', subject: '', fact: '', articleUrl: '', error: '' };

export default function RandomFactCard() {
  const [state, formAction, pending] = useActionState(loadRandomFact, initialState);

  return (
    <section className={styles.card} aria-labelledby="random-fact-title">
      <div className={styles.header}>
        <span className={styles.icon}><Sparkles size={17} /></span>
        <div className={styles.heading}>
          <h3 id="random-fact-title">Un dato curioso al azar</h3>
        </div>
      </div>

      <div className={styles.result} aria-live="polite" aria-busy={pending}>
        {pending ? <p className={styles.status}>Buscando un dato…</p> : null}
        {!pending && state.fact ? (
          <>
            <p className={styles.subject}>
              <span className={styles.kind}>{state.kind === 'animal' ? 'Animal' : 'Tema al azar'}</span>
              {state.subject}
            </p>
            <blockquote>{state.fact}</blockquote>
          </>
        ) : null}
        {!pending && !state.fact && !state.error ? <p className={styles.status}>Animales y temas variados, en español.</p> : null}
        {!pending && state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      </div>

      <div className={styles.actions}>
        <form action={formAction}>
          <button className={styles.button} type="submit" disabled={pending}>
            <RefreshCw size={15} className={pending ? styles.spinning : ''} />
            {pending ? 'Buscando…' : state.fact ? 'Otro dato' : 'Descubrir un dato'}
          </button>
        </form>
        {state.articleUrl && !pending ? (
          <a className={styles.source} href={state.articleUrl} target="_blank" rel="noreferrer">
            Fuente: Wikipedia en español <ExternalLink size={12} />
          </a>
        ) : null}
      </div>
    </section>
  );
}
