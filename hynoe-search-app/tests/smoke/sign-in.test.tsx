import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SignInPage from '../../src/app/sign-in/page';

describe('Hynoe sign-in', () => {
  it('presents a branded passwordless entry into the Command Center', async () => {
    const ui = await SignInPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByRole('link', { name: /hynoe home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: /sign in to hynoe/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email me a sign-in link/i })).toBeInTheDocument();
    expect(screen.getByText(/no password/i)).toBeInTheDocument();
    expect(screen.getByText(/command center/i)).toBeInTheDocument();
  });
});
