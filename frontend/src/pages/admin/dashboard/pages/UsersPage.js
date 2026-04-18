import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, toggleUserStatus } from '../../../../api/admin';
import { useToast } from '../../../../context/ToastContext';
import Skeleton from '../../../../components/ui/Skeleton';

const ROLE_FILTERS   = ['all', 'client', 'clinic', 'admin'];
const STATUS_FILTERS = ['all', 'active', 'suspended'];

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UsersPage() {
    const { addToast }  = useToast();
    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter,   setRoleFilter]   = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search,       setSearch]       = useState('');
    const [page,         setPage]         = useState(1);
    const [meta,         setMeta]         = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = { page };
        if (roleFilter   !== 'all') params.role   = roleFilter;
        if (statusFilter !== 'all') params.status  = statusFilter;
        if (search.trim())          params.search  = search.trim();

        getAdminUsers(params)
            .then(res => { setUsers(res.data.data); setMeta(res.data); })
            .catch(() => addToast('Failed to load users.', 'error'))
            .finally(() => setLoading(false));
    }, [roleFilter, statusFilter, search, page]); // eslint-disable-line

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { setPage(1); }, [roleFilter, statusFilter, search]);

    const handleToggle = async (user) => {
        const next = user.status === 'active' ? 'suspended' : 'active';
        setActionLoading(p => ({ ...p, [user.id]: true }));
        try {
            await toggleUserStatus(user.id, { status: next });
            addToast(`User ${next === 'suspended' ? 'suspended' : 'activated'}.`, 'success');
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: next } : u));
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Action failed.', 'error');
        } finally {
            setActionLoading(p => ({ ...p, [user.id]: false }));
        }
    };

    return (
        <div className="adm-page">
            <div className="adm-section">
                <div className="adm-section-header">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="adm-filter-bar" style={{ marginBottom: 0 }}>
                            {ROLE_FILTERS.map(r => (
                                <button
                                    key={r}
                                    className={`adm-filter-btn${roleFilter === r ? ' active' : ''}`}
                                    onClick={() => setRoleFilter(r)}
                                >
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="adm-filter-bar" style={{ marginBottom: 0 }}>
                            {STATUS_FILTERS.map(s => (
                                <button
                                    key={s}
                                    className={`adm-filter-btn${statusFilter === s ? ' active' : ''}`}
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="adm-search">
                        <span className="adm-search-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search users…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[1,2,3,4,5].map(i => <Skeleton key={i} height="58px" radius="8px" />)}
                    </div>
                ) : users.length === 0 ? (
                    <div className="adm-table-wrap">
                        <div className="adm-empty">
                            <div className="adm-empty-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                </svg>
                            </div>
                            <p className="adm-empty-text">No users found.</p>
                        </div>
                    </div>
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Verified</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const name     = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—';
                                    const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?';
                                    const busy     = actionLoading[u.id];

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <div className="adm-list-avatar" style={{ width: 32, height: 32, fontSize: '0.72rem' }}>
                                                        {initials}
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{name}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</td>
                                            <td><span className={`adm-badge adm-badge--${u.role}`}>{u.role}</span></td>
                                            <td><span className={`adm-badge adm-badge--${u.status}`}>{u.status}</span></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                                {u.created_at ? formatDate(u.created_at) : '—'}
                                            </td>
                                            <td style={{ fontSize: '0.78rem' }}>
                                                {u.email_verified_at ? (
                                                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Yes</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>No</span>
                                                )}
                                            </td>
                                            <td>
                                                {u.role !== 'admin' && (
                                                    <button
                                                        className={`adm-btn ${u.status === 'active' ? 'adm-btn--suspend' : 'adm-btn--activate'}`}
                                                        disabled={!!busy}
                                                        onClick={() => handleToggle(u)}
                                                    >
                                                        {busy ? '…' : u.status === 'active' ? 'Suspend' : 'Activate'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {meta && meta.last_page > 1 && (
                            <div className="adm-pagination">
                                <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, i, arr) => {
                                        if (i > 0 && p - arr[i-1] > 1) acc.push('…');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) => p === '…'
                                        ? <span key={`e${i}`} style={{ padding: '0 0.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>…</span>
                                        : <button key={p} className={`adm-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                                    )
                                }
                                <button className="adm-page-btn" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>›</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
