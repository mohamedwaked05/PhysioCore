import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, toggleUserStatus, deleteUser } from '../../../../api/admin';
import { useToast } from '../../../../context/ToastContext';
import Skeleton from '../../../../components/ui/Skeleton';
import GenderAvatar from '../../../../components/ui/GenderAvatar';

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
    const [deleteTarget,  setDeleteTarget]  = useState(null); // { id, name }
    const [deleteConfirm, setDeleteConfirm] = useState('');

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

    const handleDelete = async () => {
        if (!deleteTarget || deleteConfirm !== 'DELETE') return;
        setActionLoading(p => ({ ...p, [deleteTarget.id]: true }));
        try {
            await deleteUser(deleteTarget.id);
            addToast('User permanently deleted.', 'success');
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            setDeleteTarget(null);
            setDeleteConfirm('');
        } catch (err) {
            addToast(err.response?.data?.message ?? 'Delete failed.', 'error');
        } finally {
            setActionLoading(p => ({ ...p, [deleteTarget.id]: false }));
        }
    };

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
        <>
        {deleteTarget && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}>
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Delete Account Permanently</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                This will permanently remove <strong>{deleteTarget.name}</strong> and all associated data (plans, messages, access requests). This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                            Type <strong>DELETE</strong> to confirm
                        </label>
                        <input
                            className="ui-input"
                            placeholder="DELETE"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="adm-btn adm-btn--activate"
                            style={{ flex: 1 }}
                            onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}>
                            Cancel
                        </button>
                        <button
                            style={{
                                flex: 1, padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)',
                                fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                                background: deleteConfirm === 'DELETE' ? '#dc2626' : '#fca5a5',
                                color: '#fff', transition: 'background 0.15s',
                            }}
                            disabled={deleteConfirm !== 'DELETE' || actionLoading[deleteTarget.id]}
                            onClick={handleDelete}>
                            {actionLoading[deleteTarget.id] ? 'Deleting…' : 'Delete Permanently'}
                        </button>
                    </div>
                </div>
            </div>
        )}
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
                                    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—';
                                    const busy = actionLoading[u.id];

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <GenderAvatar gender={u.gender} size={32} />
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
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        <button
                                                            className={`adm-btn ${u.status === 'active' ? 'adm-btn--suspend' : 'adm-btn--activate'}`}
                                                            disabled={!!busy}
                                                            onClick={() => handleToggle(u)}
                                                        >
                                                            {busy ? '…' : u.status === 'active' ? 'Suspend' : 'Activate'}
                                                        </button>
                                                        <button
                                                            style={{
                                                                padding: '0.3rem 0.55rem', borderRadius: 'var(--radius-md)',
                                                                fontSize: '0.75rem', fontWeight: 600, border: '0.5px solid #fca5a5',
                                                                background: 'none', color: '#dc2626', cursor: 'pointer',
                                                                transition: 'background 0.15s',
                                                            }}
                                                            disabled={!!busy}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                            onClick={() => { setDeleteTarget({ id: u.id, name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email }); setDeleteConfirm(''); }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
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
        </>
    );
}
