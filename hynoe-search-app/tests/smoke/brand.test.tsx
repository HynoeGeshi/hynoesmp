import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HynoeMark } from '../../src/components/brand/hynoe-mark';
import { HynoeWordmark } from '../../src/components/brand/hynoe-wordmark';

describe('HYNOE brand components', () => {
  it('renders the core mark with an accessible HYNOE label', () => {
    render(<HynoeMark variant="core" size="sm" />);
    expect(screen.getByRole('img', { name: /hynoe/i })).toBeInTheDocument();
  });

  it('renders the compact mark without decorative wordmark text', () => {
    const { container } = render(<HynoeMark variant="core" size="sm" />);
    expect(container.textContent).toBe('');
  });

  it('renders the protected HYNOE name in the wordmark', () => {
    render(<HynoeWordmark />);
    expect(screen.getByText('HYNOE')).toBeInTheDocument();
  });
});
