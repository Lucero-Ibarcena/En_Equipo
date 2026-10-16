// [INTERFAZ: MENSAJES] Errores de carga y avisos de acciones que requieren atención.
export default function ApplicationMessages({
  loadError,
  actionError,
  onRetry,
  onDismissActionError,
}) {
  return (
    <>
      {loadError && (
        <section className="error-banner" role="alert">
          <span>{loadError}</span>
          <button className="text-link" onClick={onRetry}>
            Reintentar
          </button>
        </section>
      )}
      {actionError && (
        <section className="error-banner error-banner--action" role="alert">
          <span>{actionError}</span>
          <button aria-label="Cerrar mensaje" onClick={onDismissActionError}>
            ×
          </button>
        </section>
      )}
    </>
  );
}
