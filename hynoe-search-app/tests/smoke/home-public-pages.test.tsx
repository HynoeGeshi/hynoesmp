import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '@/app/page';

describe('homepage public discovery', () => {
  it('gives visitors a direct route to public Pages without signing in', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Public pages' })).toHaveAttribute('href', '#public-pages');
  });
});
