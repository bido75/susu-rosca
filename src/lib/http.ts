import { NextResponse } from 'next/server';
import { ApiError } from './auth';
import { ZodError } from 'zod';
import { logger } from './logger';

export function failure(err: unknown) {
  if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ZodError) return NextResponse.json({ error: err.issues.map((x) => x.message).join('; ') }, { status: 400 });
  if (err instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  logger.error('Unexpected server error', { message: err instanceof Error ? err.message : String(err) });
  return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
}

export function success(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
