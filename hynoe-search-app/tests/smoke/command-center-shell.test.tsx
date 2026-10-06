import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn(async () => ({ id: 'user-1', email: 'owner@example.com' }));
vi.mock('@/lib/auth/require-user', () => ({ requireUser }));

describe('Command Center shell', () => {
  it('protects the private area and renders the owner navigation', async () => {
    const { default: CommandCenterLayout } = await import('@/app/command-center/layout');
    const view = await CommandCenterLayout({ children: <div>Private dashboard</div> });
    render(view);

    expect(requireUser).toHaveBeenCalledWith('/command-center');
    expect(screen.getByText(/private dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/owner@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /overview/i })).toHaveAttribute('href', '/command-center');
    expect(screen.getByRole('link', { name: /my page/i })).toHaveAttribute('href', '/command-center/my-page');
    expect(screen.getByRole('link', { name: /inquiries/i })).toHaveAttribute('href', '/command-center/inquiries');
    expect(screen.getByRole('link', { name: /search visibility/i })).toHaveAttribute('href', '/command-center/search-visibility');
    expect(screen.getByRole('link', { name: /activity/i })).toHaveAttribute('href', '/command-center/activity');
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/command-center/settings');

    const signOut = screen.getByRole('button', { name: /sign out/i });
    expect(signOut.closest('form')).toHaveAttribute('action', '/auth/sign-out');
  });
});
