'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { getFeedback } from '@sentry/react';

/**
 * A button that opens the Sentry User Feedback widget ("Report a bug").
 *
 * The Sentry integration is configured with `autoInject: false` (so no floating
 * button is injected on top of the UI); we attach the widget to this button
 * instead via the integration's `attachTo` API. Using our own button lets us
 * place the trigger somewhere non-intrusive (mobile "More" sheet, desktop
 * sidebar footer) and ensures it is a real, clearly-clickable control.
 */
export default function ReportBugButton({
  className,
  children,
  onOpen,
}: {
  className?: string;
  children: ReactNode;
  /**
   * Called once the Sentry feedback dialog actually opens. Use this (rather than
   * a click handler) to close any surrounding UI — e.g. the mobile "More" sheet —
   * because closing on `click` would unmount this button mid-click and race the
   * dialog's async open, which prevents the form from appearing on mobile.
   */
  onOpen?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const feedback = getFeedback();
    if (!feedback) return;
    return feedback.attachTo(el, {
      onFormOpen: () => onOpenRef.current?.(),
    });
  }, []);

  return (
    <button type="button" ref={ref} className={className}>
      {children}
    </button>
  );
}
