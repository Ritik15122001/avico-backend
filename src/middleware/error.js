export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err?.name === 'ValidationError') {
    return res.status(422).json({ error: 'Validation failed', fields: err.errors });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'Already exists', fields: err.keyValue });
  }
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
}
