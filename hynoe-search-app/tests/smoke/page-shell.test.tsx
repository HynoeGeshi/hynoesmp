import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageShell } from '@/components/page/page-shell';
import { flagshipPages } from '@/data/flagship-pages';

const smp = flagshipPages.find((page) => page.slug === 'hynoe-smp')!;
const flicks = flagshipPages.find((page) => page.slug === 'hynoe-flicks')!;

describe('PageShell', () => {
  it('presents the real identity, summary, description, and official destination', () => {
    const { container } = render(<PageShell page={smp} />);

    expect(screen.getByText('Hynoe Page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hynoe SMP' })).toBeInTheDocument();
    expect(screen.getByText(smp.summary)).toBeInTheDocument();
    expect(screen.getByText(smp.description)).toBeInTheDocument();
    expect(screen.getByText('Gaming Communities · Minecraft')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoesmp.com');
    expect(container).not.toHaveTextContent(/rating|verified|reviews/i);
  });

  it('preserves Hynoe Flicks as an independent canonical destination', () => {
    render(<PageShell page={flicks} />);
    expect(screen.getByRole('link', { name: /Visit official destination/i })).toHaveAttribute('href', 'https://hynoeflicks.com');
  });

  it('does not render an empty modules surface when there are no modules', () => {
    const { container } = render(<PageShell page={{ ...smp, modules: [] }} />);
    expect(container.querySelector('.module-stack')).toBeNull();
  });
});
