'use client';

import { FormEvent, useState } from 'react';
import { trackEvent } from '@/lib/analytics/track-event';
import styles from './inquiry-form.module.css';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function InquiryForm({
  pageId,
  pageName,
  pageSlug,
  pageType,
}: {
  pageId: string;
  pageName: string;
  pageSlug: string;
  pageType: string;
}) {
  const [status, setStatus] = useState<Status>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('submitting');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pageId,
          senderName: data.get('senderName'),
          senderEmail: data.get('senderEmail'),
          message: data.get('message'),
          requestType: 'general',
          website: data.get('website'),
        }),
      });

      if (!response.ok) throw new Error('inquiry_failed');
      trackEvent('inquiry_submitted', {
        page_slug: pageSlug,
        page_type: pageType,
        source: 'hynoe_page',
      });
      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className={styles.card} aria-labelledby="hynoe-inquiry-heading">
      <div className={styles.copy}>
        <div className="eyebrow">Connect on Hynoe</div>
        <h2 id="hynoe-inquiry-heading">Contact {pageName}</h2>
        <p>Send a direct inquiry without hunting for contact information somewhere else.</p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <label>
          <span>Your name</span>
          <input name="senderName" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input name="senderEmail" type="email" required maxLength={320} autoComplete="email" />
        </label>
        <label className={styles.full}>
          <span>What do you need?</span>
          <textarea name="message" required maxLength={4000} rows={5} />
        </label>
        <label className={styles.honeypot} aria-hidden="true">
          <span>Website</span>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <div className={styles.actions}>
          <button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending…' : 'Send inquiry'}
          </button>
          <p role="status" aria-live="polite">
            {status === 'success' ? 'Sent. The Page owner can now see your inquiry.' : null}
            {status === 'error' ? 'Could not send that yet. Please try again.' : null}
          </p>
        </div>
      </form>
    </section>
  );
}
