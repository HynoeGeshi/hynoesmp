import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageShell } from '@/components/page/page-shell';
import { flagshipPages } from '@/data/flagship-pages';
import { publicBusinessPages } from '@/data/public-businesses';

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
  it('keeps Flicks discoverable without sending visitors to its confirmed unavailable portfolio', () => {
    const { container } = render(<PageShell page={flicks} />);
    expect(screen.getByRole('heading', { name: 'Hynoe Flicks' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Visit official destination/i })).not.toBeInTheDocument();
    expect(container.querySelector('a[href*="hynoeflicks.com"]')).toBeNull();
    expect(screen.getByText(/There is no live portfolio or booking link on this page yet/)).toBeInTheDocument();
  });
  it('does not render an empty modules surface when there are no modules', () => {
    const { container } = render(<PageShell page={{ ...smp, modules: [] }} />);
    expect(container.querySelector('.module-stack')).toBeNull();
  });
  it('does not imply that an unclaimed business receives Hynoe owner inquiries', () => {
    const { container } = render(<PageShell page={publicBusinessPages[0]} inquiryPageId="untrusted-id" />);
    expect(screen.getByText('Unclaimed public-information listing')).toBeInTheDocument();
    expect(screen.getByRole('link', {name:'View the source ↗'})).toHaveAttribute('href','https://www.adobe.com/');
    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryByRole('button',{name:'Follow Page'})).not.toBeInTheDocument();
  });
});
