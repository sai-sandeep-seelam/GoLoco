import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ScanLine, Camera, CameraOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseJwt } from '../utils/jwtHelper';
import eventService from '../services/eventService';
import bookingService from '../services/bookingService';

// The scanner library and its decoder load only when this page is opened
const QrScanner = lazy(() => import('../components/organizer/QrScanner'));

/**
 * Organizer check-in page (Organizer-only route).
 * The organizer types or pastes the code from an attendee's ticket QR and the backend
 * (POST /api/bookings/check-in) answers: admitted, already used, invalid, wrong event, cancelled.
 * The organizer can also scan the QR with the device camera; the manual box always works as a fallback.
 */

const OUTCOMES = {
  Admitted:    { color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', Icon: CheckCircle2,  title: 'VALID' },
  AlreadyUsed: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', Icon: AlertTriangle, title: 'ALREADY USED' },
  WrongEvent:  { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)',  Icon: XCircle,       title: 'WRONG EVENT' },
  Cancelled:   { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)',  Icon: XCircle,       title: 'CANCELLED' },
  Invalid:     { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)',  Icon: XCircle,       title: 'INVALID' },
};

// Clear, non-technical messages for each way the camera can fail
const CAMERA_MESSAGES = {
  'permission-denied': 'Camera access was blocked. Allow the camera for this site in your browser settings, then try again. You can still type the ticket code below.',
  'no-camera': 'No camera was found on this device. Type the ticket code below instead.',
  'insecure-context': 'The camera only works on secure (HTTPS) pages, and this page is not secure. Open the site over HTTPS, or type the ticket code below.',
  'in-use': 'The camera is being used by another app or tab. Close it and try again, or type the ticket code below.',
  'unsupported': 'This browser cannot scan with the camera. Type the ticket code below instead.',
};
const cameraMessage = (kind) =>
  CAMERA_MESSAGES[kind] || 'The camera could not be started. Type the ticket code below instead.';

// Same code scanned again within this window is ignored (the camera sees one QR many times)
const RESCAN_BLOCK_MS = 3000;

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
};

export default function CheckIn() {
  const { token } = useAuth();
  const inputRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(''); // '' = any of my events
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  // Camera scanning state
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const lastScanRef = useRef({ code: '', at: 0 });

  // The camera needs a secure page (HTTPS or localhost) and a browser that supports it
  const cameraUnavailableKind = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (!window.isSecureContext) return 'insecure-context';
    if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
    return null;
  }, []);

  const organizerId = useMemo(() => {
    if (!token) return null;
    const claims = parseJwt(token);
    const id = claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
             || claims?.sub
             || claims?.nameid
             || null;
    return id ? Number(id) : null;
  }, [token]);

  // Load this organizer's events for the event picker
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = organizerId ? await eventService.getMyEvents(organizerId) : [];
        if (!cancelled) setEvents(list);
      } catch {
        if (!cancelled) setEvents([]);
      }
    })();
    return () => { cancelled = true; };
  }, [organizerId]);

  // Shared by the manual box and the camera scanner
  const submitCode = useCallback(async (rawCode) => {
    const trimmed = (rawCode || '').trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await bookingService.checkIn(trimmed, eventId ? Number(eventId) : null);
      setOutcome(res);
      setHistory(prev => [{ ...res, at: new Date().toISOString() }, ...prev].slice(0, 8));
      setCode('');
    } catch (err) {
      setOutcome(null);
      if (err.status === 401) setError('Session expired. Please log in again.');
      else if (err.status === 403) setError('Only organizers can check tickets in.');
      else setError(err.message || 'Could not check the ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [eventId, submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitCode(code);
    inputRef.current?.focus();
  };

  const handleScannedCode = useCallback((scanned) => {
    const now = Date.now();
    const last = lastScanRef.current;
    if (scanned === last.code && now - last.at < RESCAN_BLOCK_MS) return;
    lastScanRef.current = { code: scanned, at: now };
    submitCode(scanned);
  }, [submitCode]);

  const handleCameraError = useCallback(({ kind }) => {
    setScanning(false);
    setCameraError(cameraMessage(kind));
  }, []);

  const startCamera = () => {
    setCameraError(cameraUnavailableKind ? cameraMessage(cameraUnavailableKind) : '');
    if (!cameraUnavailableKind) setScanning(true);
  };

  const view = outcome ? (OUTCOMES[outcome.result] || OUTCOMES.Invalid) : null;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '7rem 1.25rem 3rem' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <ScanLine size={26} style={{ color: 'var(--accent-purple)' }} /> Ticket Check-in
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Enter the code from the attendee's ticket QR. Each ticket admits everyone on the booking, once.
      </p>

      {/* Camera scanner (the manual box below always works too) */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {scanning ? (
          <>
            <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Starting camera...</div>}>
              <QrScanner onCode={handleScannedCode} onCameraError={handleCameraError} paused={submitting} />
            </Suspense>
            <button
              type="button"
              onClick={() => setScanning(false)}
              style={{ padding: '0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '0.6rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <CameraOff size={18} /> Stop camera
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            style={{ padding: '0.85rem', border: 'none', cursor: 'pointer', background: 'var(--accent-purple)', color: '#fff', borderRadius: '0.6rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Camera size={18} /> Scan with camera
          </button>
        )}
        {cameraError && (
          <div role="alert" style={{ padding: '0.8rem 1rem', borderRadius: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', fontSize: '0.9rem' }}>
            {cameraError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Event
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem' }}
          >
            <option value="" style={{ background: '#131A2E' }}>Any of my events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id} style={{ background: '#131A2E' }}>{ev.title}</option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Ticket code
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste or type the ticket code"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            style={{ width: '100%', marginTop: '0.35rem', padding: '0.8rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', color: '#fff', fontSize: '1rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !code.trim()}
          style={{ padding: '0.85rem', border: 'none', cursor: 'pointer', background: 'var(--accent-purple)', color: '#fff', borderRadius: '0.6rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: submitting || !code.trim() ? 0.6 : 1 }}
        >
          {submitting ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</> : 'Check in'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {view && outcome && (
        <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: '0.9rem', background: view.bg, border: `1px solid ${view.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: view.color, fontWeight: 800, fontSize: '1.3rem' }}>
            <view.Icon size={28} /> {view.title}
          </div>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-primary)' }}>{outcome.message}</p>

          {outcome.result === 'Admitted' && (
            <div style={{ marginTop: '0.75rem', fontSize: '2rem', fontWeight: 800, color: view.color }}>
              Admit {outcome.admitCount}
            </div>
          )}

          {(outcome.result === 'Admitted' || outcome.result === 'AlreadyUsed' || outcome.result === 'Cancelled') && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {outcome.attendeeName && <span>Attendee: <strong style={{ color: 'var(--text-primary)' }}>{outcome.attendeeName}</strong></span>}
              {outcome.eventTitle && <span>Event: <strong style={{ color: 'var(--text-primary)' }}>{outcome.eventTitle}</strong></span>}
              {outcome.ticketTypeName && <span>Ticket: <strong style={{ color: 'var(--text-primary)' }}>{outcome.ticketTypeName}</strong></span>}
              {outcome.seats?.length > 0 && <span>Seats: <strong style={{ color: 'var(--text-primary)' }}>{outcome.seats.join(', ')}</strong></span>}
              {outcome.result === 'AlreadyUsed' && outcome.checkedInAt && (
                <span>Used at: <strong style={{ color: view.color }}>{formatDateTime(outcome.checkedInAt)}</strong></span>
              )}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>This session</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.map((h, i) => {
              const v = OUTCOMES[h.result] || OUTCOMES.Invalid;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)' }}>
                  <span style={{ color: v.color, fontWeight: 700 }}>{v.title}</span>
                  <span style={{ color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
                    {h.attendeeName ? `${h.attendeeName}${h.result === 'Admitted' ? ` (+${h.admitCount})` : ''}` : h.message}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{new Date(h.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
