import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotifications, markNotificationSeen, markAllNotificationsSeen } from '../api/notifications';
import { getEcho, disconnectEcho } from '../services/echo';
import { useToast } from '../context/ToastContext';

const FALLBACK_POLL    = 30_000;
const TOAST_DEBOUNCE   = 1_500; // group rapid events into one toast

/* ── Criticality helpers ──────────────────────────────────── */
function isCritical(n) {
    return n.type === 'safety_flag' || n.type === 'user_suspended' || n.type === 'clinic_rejected';
}

function toastMsg(type, data) {
    if (type === 'safety_flag') {
        const pre = data?.severity === 'critical' ? '🚨 CRITICAL' : '⚠️ Safety Alert';
        return `${pre}: ${data?.patient_name ?? 'Patient'} — ${data?.flag_reason ?? 'safety concern'}`;
    }
    if (type === 'user_suspended')  return 'Your account has been suspended. Contact support.';
    if (type === 'clinic_rejected') return `Clinic application rejected: ${data?.rejection_reason ?? 'see details'}`;
    return null;
}

function toastKind(n) {
    if (n.type === 'safety_flag' && n.data?.severity === 'critical') return 'error';
    if (n.type === 'user_suspended' || n.type === 'clinic_rejected')  return 'error';
    return 'warning';
}

/* ── Merge: add new items from server without re-adding locally dismissed ones ─ */
function mergeItems(existing, incoming) {
    const existingIds = new Set(existing.map(n => n.id));
    const merged = [...existing];
    for (const n of incoming) {
        if (!existingIds.has(n.id)) merged.push(n);
    }
    return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/* ── Hook ─────────────────────────────────────────────────── */
export function useNotifications(user) {
    const { addToast }            = useToast();
    const [items, setItems]       = useState([]);
    const [unreadCount, setCount] = useState(0);
    const pollRef                 = useRef(null);
    const echoRef                 = useRef(null);

    // Toast debounce: group rapid critical events into one toast per type
    const toastBufRef  = useRef({});   // { type → { count, latest } }
    const toastTimer   = useRef(null);

    // Track initial WS connection so reconnect handler doesn't fire on first connect
    const firstConnectRef = useRef(true);

    /* ── Flush grouped toasts ─────────────────────────────── */
    const flushToasts = useCallback(() => {
        const buf = toastBufRef.current;
        for (const [type, { count, latest }] of Object.entries(buf)) {
            const msg = count > 1
                ? `${count} new ${type === 'safety_flag' ? 'safety alerts' : 'critical notifications'}`
                : toastMsg(type, latest.data);
            if (msg) addToast(msg, toastKind(latest), 8000);
        }
        toastBufRef.current = {};
    }, [addToast]);

    const enqueueToast = useCallback((n) => {
        const buf = toastBufRef.current;
        if (!buf[n.type]) buf[n.type] = { count: 0, latest: n };
        buf[n.type].count++;
        buf[n.type].latest = n;
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(flushToasts, TOAST_DEBOUNCE);
    }, [flushToasts]);

    /* ── Load (poll + reconnect refetch) ──────────────────── */
    const load = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetchNotifications();
            const incoming = res.data.items ?? [];
            // Keep existing items if server returns empty (e.g. backend momentarily down)
            if (incoming.length > 0 || res.data.unread_count === 0) {
                setItems(prev => mergeItems(prev, incoming));
                setCount(res.data.unread_count ?? 0);
            }
        } catch {
            // _skipAuthRedirect prevents logout; keep existing state on failure
        }
    }, [user]);

    /* ── Initial load + fallback polling ─────────────────── */
    useEffect(() => {
        load();
        pollRef.current = setInterval(() => {
            const state = echoRef.current?.connector?.pusher?.connection?.state;
            if (state !== 'connected') load();
        }, FALLBACK_POLL);
        return () => clearInterval(pollRef.current);
    }, [load]);

    /* ── WebSocket subscriptions ──────────────────────────── */
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const echo = getEcho(token);
        echoRef.current = echo;

        // ── Reconnect: fetch missed events ────────────────
        const pusherConn = echo.connector?.pusher?.connection;
        const onConnected = () => {
            if (firstConnectRef.current) {
                firstConnectRef.current = false;
                return; // skip the initial connection
            }
            load(); // WiFi restored / reconnect → catch up
        };
        if (pusherConn) pusherConn.bind('connected', onConnected);

        // ── Personal user channel ─────────────────────────
        const userCh = echo.private(`user.${user.id}`);
        userCh.listen('.NotificationCreated', ({ notification }) => {
            setItems(prev => {
                if (prev.some(n => n.id === notification.id)) return prev; // dedup by id
                return [notification, ...prev];
            });
            setCount(prev => prev + 1);
            if (isCritical(notification)) enqueueToast(notification);
        });

        // ── Admin broadcast channel ───────────────────────
        let adminCh = null;
        if (user.role === 'admin') {
            adminCh = echo.private('admin');
            adminCh.listen('.SafetyFlagBroadcast', () => {
                // Personal channel already handles the persistent record;
                // this broadcast refreshes state so dashboards update immediately
                load();
            });
        }

        // ── Cleanup: leave channels (not just stopListening)
        return () => {
            // Properly unsubscribe so Pusher stops receiving events
            try { echo.leave(`user.${user.id}`); } catch {}
            try { if (adminCh) echo.leave('admin'); } catch {}
            if (pusherConn) pusherConn.unbind('connected', onConnected);
            clearTimeout(toastTimer.current);
        };
    }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

    // Disconnect Echo entirely on logout
    useEffect(() => {
        if (!user && echoRef.current) {
            disconnectEcho();
            echoRef.current     = null;
            firstConnectRef.current = true; // reset for next login
        }
    }, [user]);

    /* ── Actions ─────────────────────────────────────────── */
    const markSeen = useCallback(async (id) => {
        // Remove immediately — seen notifications never reappear
        setItems(prev => prev.filter(n => n.id !== id));
        setCount(prev => Math.max(0, prev - 1));
        try { await markNotificationSeen(id); } catch {}
    }, []);

    const markAllSeen = useCallback(async () => {
        // Clear the list — backend will return empty on next fetch
        setItems([]);
        setCount(0);
        try { await markAllNotificationsSeen(); } catch {}
    }, []);

    return { items, unreadCount, markSeen, markAllSeen, refresh: load };
}
