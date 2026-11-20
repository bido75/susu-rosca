type Level = 'info' | 'warn' | 'error';

function emit(level: Level, message: string, meta?: unknown) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta } : {}),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

/**
 * Minimal structured (JSON-lines) logger. Swap the emit() sink for a real
 * aggregator (e.g. pino + a transport, or a monitoring SDK) in production.
 */
export const logger = {
  info: (message: string, meta?: unknown) => emit('info', message, meta),
  warn: (message: string, meta?: unknown) => emit('warn', message, meta),
  error: (message: string, meta?: unknown) => emit('error', message, meta),
};
