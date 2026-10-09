export function notFoundHandler(request, response) {
  response.status(404).json({ error: `No existe la ruta ${request.method} ${request.path}.` });
}

export function errorHandler(error, request, response, next) {
  console.error(error);
  if (response.headersSent) return next(error);
  response.status(500).json({ error: 'Ocurrió un error inesperado. Probá de nuevo.' });
}
