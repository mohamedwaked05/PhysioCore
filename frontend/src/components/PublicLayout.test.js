import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PublicLayout from './PublicLayout';

jest.mock('react-router-dom', () => {
    global.TextEncoder = require('util').TextEncoder;
    return jest.requireActual('react-router');
}, { virtual: true });
jest.mock('../api/axios', () => ({ __esModule: true, default: { post: jest.fn().mockResolvedValue({}) } }));

function PageWithSessionControls() {
    const { login, logout } = useAuth();
    const [value, setValue] = useState('');
    return (
        <main>
            <input aria-label="Page state" value={value} onChange={e => setValue(e.target.value)} />
            <button onClick={() => login({ id: 1, role: 'client' }, 'test-only-token')}>Test sign in</button>
            <button onClick={logout}>Test sign out</button>
        </main>
    );
}

function renderRoute(path, user = null) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<PageWithSessionControls />} />
                        <Route path="/clinics" element={<PageWithSessionControls />} />
                        <Route path="/clinics/:id" element={<PageWithSessionControls />} />
                    </Route>
                    <Route element={<PublicLayout authPage />}>
                        {['/login', '/register', '/forgot-password', '/reset-password', '/verify-email/:id/:hash', '/email-verified', '/auth/google/callback', '/auth/google/complete'].map(path =>
                            <Route key={path} path={path} element={<PageWithSessionControls />} />
                        )}
                    </Route>
                    <Route path="/client/dashboard/*" element={<main>Client dashboard</main>} />
                    <Route path="/clinic/dashboard/*" element={<main>Clinic dashboard</main>} />
                    <Route path="/admin/dashboard/*" element={<main>Admin dashboard</main>} />
                    <Route path="/client/profile" element={<main>Client profile</main>} />
                    <Route path="/clinic/profile" element={<main>Clinic profile</main>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>
    );
}

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    api.post.mockResolvedValue({});
});

test.each(['/', '/clinics', '/clinics/3'])('guests see one footer on %s', path => {
    renderRoute(path);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
});

test.each(['client', 'clinic', 'admin'])('%s sessions immediately hide the footer on public clinic pages', role => {
    renderRoute('/clinics/3', { id: 1, role });
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
});

test.each(['/login', '/register', '/forgot-password', '/reset-password?token=test', '/verify-email/1/test', '/email-verified', '/auth/google/callback', '/auth/google/complete'])('auth page %s retains its footer even with a session', path => {
    renderRoute(path, { id: 1, role: 'client' });
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
});

test.each(['/client/dashboard/status', '/client/dashboard/messages', '/clinic/dashboard', '/admin/dashboard/users', '/client/profile', '/clinic/profile'])('protected page %s is outside the footer layout', path => {
    renderRoute(path, { id: 1, role: 'client' });
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
});

test('signing in hides the footer without remounting the public page', () => {
    renderRoute('/clinics');
    fireEvent.change(screen.getByRole('textbox', { name: 'Page state' }), { target: { value: 'Keep clinic filters' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test sign in' }));
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Page state' })).toHaveValue('Keep clinic filters');
});

test('the existing sign-out reload restores the guest footer', () => {
    const view = renderRoute('/clinics', { id: 1, role: 'client' });
    localStorage.setItem('token', 'test-only-token');
    // jsdom cannot navigate. Verify real logout storage/API behavior, then
    // recreate the provider as the existing full-page redirect does in a browser.
    const navigationError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        fireEvent.click(screen.getByRole('button', { name: 'Test sign out' }));
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
        expect(api.post).toHaveBeenCalledWith('/auth/logout');
        view.unmount();
        renderRoute('/');
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    } finally {
        navigationError.mockRestore();
    }
});
