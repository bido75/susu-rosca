import { ApiError } from './auth';
import type { PayoutKind } from './payoutKinds';

export { PAYOUT_KIND_LABEL, PAYOUT_KIND_PLACEHOLDER, SELF_SERVE_KINDS } from './payoutKinds';
export type { PayoutKind } from './payoutKinds';

/**
 * Normalization + validation for member payout receiving identifiers.
 * These are *receiving* identifiers (how a member wants to be paid), distinct
 * from the contribution PaymentMethod (how they pay in).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// U.S. phone: optional +1, 10 digits, separators normalized away.
const US_PHONE_RE = /^(\+?1)?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/;
// Zelle tag: up to 32 alphanumeric/underscore, may be prefixed.
const ZELLE_TAG_RE = /^[A-Za-z0-9_]{2,32}$/;

export interface NormalizedIdentifier {
  value: string; // stored value (the receiving identifier or provider token)
  masked: string; // safe display form for other members / history
  kind: PayoutKind;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '•••' + email;
  const head = local.slice(0, Math.max(1, Math.min(2, local.length - 1)));
  return `${head}•••@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const trimmed = digits.length > 10 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (trimmed.length !== 10) return '•••' + phone;
  return `(•••) •••-${trimmed.slice(6)}`;
}

/**
 * Normalize and validate a receiving identifier for the given kind.
 * Throws ApiError(400) on an invalid value. Never accepts raw bank details.
 */
export function normalizeIdentifier(kind: PayoutKind, raw: string): NormalizedIdentifier {
  const input = raw.trim();

  if (kind === 'ACH') {
    // ACH is provider-tokenized only; raw routing/account numbers are never
    // collected through profile forms this release.
    throw new ApiError(400, 'ACH is not yet available without an approved banking provider');
  }

  if (kind === 'CASH') {
    throw new ApiError(400, 'Cash is exception-only and requires organizer approval');
  }

  if (kind === 'ZELLE') {
    // Accept an enrolled email, a U.S. phone number, or an eligible tag.
    if (EMAIL_RE.test(input)) {
      return { value: input.toLowerCase(), masked: maskEmail(input.toLowerCase()), kind };
    }
    const phone = input.replace(/[\s.-]/g, '');
    if (US_PHONE_RE.test(input)) {
      const digits = input.replace(/\D/g, '');
      const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
      const display = `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
      return { value: input.replace(/\D/g, '').slice(-10), masked: maskPhone(phone ? input : normalized), kind };
    }
    if (ZELLE_TAG_RE.test(input.replace(/^@/, '')) && /^[A-Za-z0-9_]{2,32}$/.test(input)) {
      return { value: input, masked: maskEmail(input) || `•••${input.slice(-2)}`, kind };
    }
    throw new ApiError(400, 'Enter a valid Zelle email, U.S. phone, or tag');
  }

  if (kind === 'CASHAPP') {
    const tag = input.replace(/^\$/, '').trim();
    if (!/^[A-Za-z0-9_]{2,64}$/.test(tag)) {
      throw new ApiError(400, 'Enter a valid $Cashtag (letters, numbers, underscore)');
    }
    return { value: `$${tag}`, masked: `$${tag.slice(0, 2)}•••`, kind };
  }

  if (kind === 'VENMO') {
    const user = input.replace(/^@/, '').trim();
    if (!/^[A-Za-z0-9_.-]{2,32}$/.test(user)) {
      throw new ApiError(400, 'Enter a valid Venmo username');
    }
    return { value: `@${user}`, masked: `@${user.slice(0, 2)}•••`, kind };
  }

  throw new ApiError(400, 'Unsupported payout method');
}

