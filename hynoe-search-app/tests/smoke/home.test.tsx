import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Home from '../../src/app/page';

vi.mock('@/components/home/public-discovery', () => ({ PublicDiscovery: () => <div data-testid="public-discovery-slot" /> }));

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
  it('gives owners and returning users obvious routes into the platform', () => {
    render(<Home />);
    const createLinks = screen.getAllByRole('link', { name: /create a page/i });
    expect(createLinks.length).toBeGreaterThan(0);
    expect(createLinks.every((link) => link.getAttribute('href') === '/command-center/pages/new')).toBe(true);
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks.every((link) => link.getAttribute('href') === '/sign-in')).toBe(true);
  });
  it('shows category shortcuts and flagship Hynoe Originals', () => {
    render(<Home />);
    for (const name of ['Services','Creators','Communities','Games & Apps']) expect(screen.getByRole('link', { name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Local businesses' })).toHaveAttribute('href', '/search?type=local_business');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/search?type=project_brand');
    expect(screen.getByRole('heading', { name: /hynoe originals/i })).toBeInTheDocument();
    for (const name of ['Hynoe Outpost','Hynoe SMP','Hynoe Flicks','Hynoe CreatorOps','Hynoe']) expect(screen.getByRole('link', { name })).toBeInTheDocument();
  });
  it('explains the Hynoe discovery loop in plain language', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /how hynoe works/i })).toBeInTheDocument();
    for (const name of ['Discover','Evaluate','Connect','Grow']) expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  });
  it('features CreatorOps as a vertical and an Original without replacing the discovery hero', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: 'CreatorOps', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hynoe CreatorOps', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/find what.*worth discovering/i);
    expect(screen.getByText(/you create\. hynoe runs the machine/i)).toBeInTheDocument();
  });
});
