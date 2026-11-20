import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ApiError } from './auth';

/** Maximum accepted evidence file size (bytes). */
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024; // 5 MiB

/** Allowed MIME types. Common image formats + PDF screenshots/receipts. */
export const ALLOWED_EVIDENCE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

/** Root directory for stored evidence files. Private — never served statically. */
export function evidenceDir(): string {
  const configured = process.env.EVIDENCE_DIR || 'data/evidence';
  return resolve(process.cwd(), configured);
}

/** Filesystem path for a stored object; storageKey is generated server-side, so it's safe. */
export function evidencePath(storageKey: string): string {
  // Guard against any traversal regardless of call-site mistakes.
  if (!/^[0-9a-f]{32}$/.test(storageKey)) throw new ApiError(400, 'Invalid storage key');
  return join(evidenceDir(), storageKey);
}

export function newStorageKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Validate an uploaded file and persist it to private storage, returning the
 * randomized storage key. Throws ApiError on any violation.
 */
export async function storeEvidence(file: File): Promise<{ storageKey: string; mimeType: string; sizeBytes: number }> {
  if (!(file instanceof File)) throw new ApiError(400, 'A file is required');
  if (file.size === 0) throw new ApiError(400, 'Empty file');
  if (file.size > MAX_EVIDENCE_BYTES) throw new ApiError(400, 'File exceeds the 5 MB limit');
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) throw new ApiError(400, 'File type not allowed');

  const storageKey = newStorageKey();
  const dir = evidenceDir();
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, storageKey), buf);
  return { storageKey, mimeType: file.type, sizeBytes: buf.length };
}

export async function readEvidence(storageKey: string): Promise<Buffer> {
  return readFile(evidencePath(storageKey));
}

export async function deleteEvidence(storageKey: string): Promise<void> {
  await rm(evidencePath(storageKey), { force: true });
}