import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../../src/app/page';

describe('Hynoe Search homepage', () => {
  it('leads with the HYNOE discovery promise and search without requiring sign in', () => {
    render(<Home />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hynoe home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /find what.*worth discovering/i })).toBeInTheDocument();
    expect(screen.getByText(/independent people, businesses, creators, projects, communities, services, and products/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search Hynoe' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.queryByText(/sign in to search/i)).not.toBeInTheDocument();
  });

  it('shows category shortcuts and flagship Hynoe Originals', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Creators' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Communities' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Games & Apps' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /hynoe originals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hynoe outpost/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hynoe smp/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hynoe flicks/i })).toBeInTheDocument();
  });

  it('features CreatorOps as a Hynoe vertical rather than the whole homepage identity', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /creatorops/i })).toBeInTheDocument();
    expect(screen.getByText(/you create\. hynoe runs the machine/i)).toBeInTheDocument();
  });
});
