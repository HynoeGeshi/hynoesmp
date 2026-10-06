import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Hynoe sign-in page', () => {
  it('offers email-first passwordless sign-in and preserves the internal return path', async () => {
    const { default: SignInPage } = await import('@/app/sign-in/page');
    const view = await SignInPage({
      searchParams: Promise.resolve({ next: '/command-center/my-page' }),
    });
    const { container } = render(view);

    expect(screen.getByRole('heading', { name: /sign in to hynoe/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email me a sign-in link/i })).toBeInTheDocument();

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action', '/auth/request-link');
    expect(container.querySelector('input[name="next"]')).toHaveAttribute('value', '/command-center/my-page');
  });

  it('shows a non-sensitive success state after a sign-in link is requested', async () => {
    const { default: SignInPage } = await import('@/app/sign-in/page');
    const view = await SignInPage({ searchParams: Promise.resolve({ sent: '1' }) });
    render(view);

    expect(screen.getByText(/check your email for your secure hynoe sign-in link/i)).toBeInTheDocument();
  });

  it('shows a generic invalid-link message without leaking provider details', async () => {
    const { default: SignInPage } = await import('@/app/sign-in/page');
    const view = await SignInPage({ searchParams: Promise.resolve({ error: 'invalid-link' }) });
    render(view);

    expect(screen.getByText(/that sign-in link is invalid or expired/i)).toBeInTheDocument();
  });
});
