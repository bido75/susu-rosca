// Client-safe payout-method constants. Keep this module free of server-only
// imports (next/headers, db, auth) so it can be imported by client components.

export type PayoutKind = 'ZELLE' | 'CASHAPP' | 'VENMO' | 'ACH' | 'CASH';

/** Human label for a payout method kind. */
export const PAYOUT_KIND_LABEL: Record<PayoutKind, string> = {
  ZELLE: 'Zelle',
  CASHAPP: 'Cash App',
  VENMO: 'Venmo',
  ACH: 'ACH Bank Transfer',
  CASH: 'Cash (exception only)',
};

/** Placeholder text for each self-serve method's identifier input. */
export const PAYOUT_KIND_PLACEHOLDER: Record<string, string> = {
  ZELLE: 'Enrolled email, U.S. phone, or eligible tag',
  CASHAPP: '$Cashtag (e.g. $janedoe)',
  VENMO: '@username',
};

/** Which method kinds a member can self-serve this release. */
export const SELF_SERVE_KINDS: readonly PayoutKind[] = ['ZELLE', 'CASHAPP', 'VENMO'];
