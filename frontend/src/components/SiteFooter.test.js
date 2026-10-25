import { render, screen, within } from '@testing-library/react';
import SiteFooter from './SiteFooter';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

jest.mock('react-router-dom', () => {
    global.TextEncoder = require('util').TextEncoder;
    return jest.requireActual('react-router');
}, { virtual: true });

function renderFooter() {
    return render(<MemoryRouter><SiteFooter /></MemoryRouter>);
}

test('uses the existing brand and only established internal destinations', () => {
    renderFooter();
    const footer = screen.getByRole('contentinfo', { name: 'PhysioCore footer' });
    expect(within(footer).getByRole('link', { name: 'PhysioCore home' })).toHaveAttribute('href', '/');
    const nav = within(footer).getByRole('navigation', { name: 'Footer navigation' });
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: 'Find a Clinic' })).toHaveAttribute('href', '/clinics');
    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(within(footer).getByText(/Helping you find the right physiotherapy care/)).toBeInTheDocument();
});

test('developer profiles have accessible names and safe external links', () => {
    renderFooter();
    for (const [platform, href] of [
        ['GitHub', 'https://github.com/mohamedwaked05'],
        ['LinkedIn', 'https://www.linkedin.com/in/mohamad-waked/'],
    ]) {
        const link = screen.getByRole('link', { name: `Mohamad Khaled Waked on ${platform} (opens in a new tab)` });
        expect(link).toHaveAttribute('href', href);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
        expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.getByText('Mohamad Khaled Waked').closest('a')).toBeNull();
});

test('copyright uses the current year rather than a hard-coded year', () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2031-01-01T12:00:00Z'));
    try {
        renderFooter();
        expect(screen.getByText('© 2031 PhysioCore. All rights reserved.')).toBeInTheDocument();
    } finally {
        jest.useRealTimers();
    }
});

test('all footer links are keyboard reachable in reading order', () => {
    renderFooter();
    for (const link of screen.getAllByRole('link')) {
        userEvent.tab();
        expect(link).toHaveFocus();
    }
});
