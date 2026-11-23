import { db } from '@/lib/db';
import { requireUser, ApiError } from '@/lib/auth';
import { failure, success } from '@/lib/http';
import { phoneNumberSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

// Normalize a U.S. phone number to E.164 (+1XXXXXXXXXX). Accepts 10-digit or
// 11-digit (leading 1) input with any separators.
function normalizeUsPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  throw new ApiError(400, 'Enter a valid U.S. phone number (10 digits)');
}

// Set (or clear) the caller's phone number, used for SMS notifications.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { phoneNumber } = phoneNumberSchema.parse(await req.json());

    // Empty clears the number (opt out of SMS).
    if (phoneNumber.trim() === '') {
      await db.user.update({ where: { id: user.id }, data: { phoneNumber: null } });
      return success({ phoneNumber: null });
    }

    const normalized = normalizeUsPhone(phoneNumber);
    const existing = await db.user.findUnique({ where: { phoneNumber: normalized } });
    if (existing && existing.id !== user.id) {
      throw new ApiError(409, 'That phone number is already in use');
    }
    await db.user.update({ where: { id: user.id }, data: { phoneNumber: normalized } });
    return success({ phoneNumber: normalized });
  } catch (e) {
    return failure(e);
  }
}