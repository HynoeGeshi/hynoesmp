import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../../src/app/page';

describe('Hynoe Search homepage', () => {
  it('renders the Hynoe brand and primary search controls', () => {
    render(<Home />);
    expect(screen.getByLabelText('HYNOE')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search Hynoe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });
});
