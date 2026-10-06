import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Command Center Overview', () => {
  it('shows actionable owner metrics without fabricating activity', async () => {
    const { default: CommandCenterOverview } = await import('@/app/command-center/page');
    render(<CommandCenterOverview />);

    expect(screen.getByRole('heading', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByText('Page Views')).toBeInTheDocument();
    expect(screen.getByText('Search Clicks')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Page Health')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recommended actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /set up my page/i })).toHaveAttribute('href', '/command-center/my-page');

    expect(screen.queryByText('1,248')).not.toBeInTheDocument();
    expect(screen.getAllByText(/available after your page is published/i).length).toBeGreaterThan(0);
  });
});
