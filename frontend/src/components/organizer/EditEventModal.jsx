import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, CheckCircle2, Calendar, MapPin, Users } from 'lucide-react';
import eventService from '../../services/eventService';
import { CATEGORY_OPTIONS } from '../../utils/eventMapper';

/**
 * EditEventModal
 * 
 * A self-contained modal that renders a pre-filled edit form for a single event.
 * Wired to PUT /api/events/{id} — the JWT is injected automatically by apiClient.
 * 
 * Props:
 *   event      — the EventDto object being edited (from GET /api/events response)
 *   onClose()  — called when the user cancels or closes
 *   onSaved()  — called after a successful PUT so the parent can refresh its list
 */
export default function EditEventModal({ event, onClose, onSaved }) {
  // Seed all fields from the current event values
  const toDateInputValue = (iso) => {
    try { return iso ? iso.split('T')[0] : ''; }
    catch { return ''; }
  };

  const [title, setTitle]             = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate]               = useState(toDateInputValue(event.date));
  const [location, setLocation]       = useState(event.location || '');
  const [totalCapacity, setCapacity]  = useState(event.totalCapacity || 100);
  const [category, setCategory]       = useState(event.category || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setFieldErrors({});

    // Client-side validation matching backend [Required] annotations
    const errors = {};
    if (!title.trim())       errors.title       = 'Title is required.';
    if (!description.trim()) errors.description = 'Description is required.';
    if (!date)               errors.date        = 'Date is required.';
    if (!location.trim())    errors.location    = 'Location is required.';
    if (totalCapacity < 1)   errors.capacity    = 'Capacity must be at least 1.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Build form data matching CreateEventDto (PUT binds the body with [FromForm])
    const payload = new FormData();
    payload.append('Title', title.trim());
    payload.append('Description', description.trim());
    payload.append('Date', new Date(date).toISOString());
    payload.append('Location', location.trim());
    payload.append('TotalCapacity', Number(totalCapacity));
    if (category) payload.append('Category', category);

    setSaving(true);
    try {
      // PUT /api/events/{id} — apiClient auto-attaches Authorization: Bearer <JWT>
      await eventService.updateEvent(event.id, payload);
      setSaved(true);
      // Brief success flash before closing and triggering parent refresh
      setTimeout(() => {
        onSaved();   // triggers refreshKey increment in parent → refetch
        onClose();
      }, 1000);
    } catch (err) {
      if (err.status === 400 && err.data?.errors) {
        const serverErrors = {};
        Object.entries(err.data.errors).forEach(([field, msgs]) => {
          serverErrors[field.toLowerCase()] = msgs[0];
        });
        setFieldErrors(serverErrors);
        setApiError('Please correct the highlighted fields.');
      } else if (err.status === 403) {
        setApiError('You can only edit events you own.');
      } else if (err.status === 401) {
        setApiError('Session expired. Please log in again.');
      } else {
        setApiError(err.message || 'Failed to update event. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '0.7rem 0.9rem',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '0.5rem',
    color: '#fff',
    outline: 'none',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '0.4rem',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    letterSpacing: '0.03em',
  };

  const fieldErrStyle = {
    color: '#f87171',
    fontSize: '0.78rem',
    marginTop: '0.25rem',
    display: 'block',
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="edit-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        {/* Modal Card — stop click propagation so backdrop click doesn't fire */}
        <motion.div
          key="edit-modal"
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(17, 22, 38, 0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Edit Event</h2>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                ID #{event.id} · Changes are saved via PUT /api/events/{event.id}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>

          {/* API Error banner */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                  color: '#f87171', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  marginBottom: '1.25rem', fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={16} /> {apiError}
              </motion.div>
            )}
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)',
                  color: '#34d399', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  marginBottom: '1.25rem', fontSize: '0.875rem',
                }}
              >
                <CheckCircle2 size={16} /> Event updated successfully!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFieldErrors(p => ({...p, title: ''})); }}
                style={inputStyle(fieldErrors.title)}
                placeholder="e.g. Sunburn Beach Festival"
                required
              />
              {fieldErrors.title && <span style={fieldErrStyle}>{fieldErrors.title}</span>}
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFieldErrors(p => ({...p, description: ''})); }}
                style={{ ...inputStyle(fieldErrors.description), resize: 'vertical' }}
                placeholder="Describe your event..."
                required
              />
              {fieldErrors.description && <span style={fieldErrStyle}>{fieldErrors.description}</span>}
            </div>

            {/* Date + Location row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}><Calendar size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setFieldErrors(p => ({...p, date: ''})); }}
                  style={inputStyle(fieldErrors.date)}
                  required
                />
                {fieldErrors.date && <span style={fieldErrStyle}>{fieldErrors.date}</span>}
              </div>
              <div>
                <label style={labelStyle}><MapPin size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setFieldErrors(p => ({...p, location: ''})); }}
                  style={inputStyle(fieldErrors.location)}
                  placeholder="e.g. Mumbai"
                  required
                />
                {fieldErrors.location && <span style={fieldErrStyle}>{fieldErrors.location}</span>}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label style={labelStyle}><Users size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Total Capacity *</label>
              <input
                type="number"
                min={1}
                value={totalCapacity}
                onChange={(e) => { setCapacity(parseInt(e.target.value) || 1); setFieldErrors(p => ({...p, capacity: ''})); }}
                style={inputStyle(fieldErrors.capacity)}
                required
              />
              {fieldErrors.capacity && <span style={fieldErrStyle}>{fieldErrors.capacity}</span>}
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle(false)}
              >
                {!category && <option value="" style={{ background: '#131A2E' }}>General (not set)</option>}
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: '#131A2E' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem', color: 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2, padding: '0.75rem',
                  background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)',
                  border: 'none', borderRadius: '0.5rem',
                  color: '#fff', fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', fontSize: '0.95rem',
                }}
              >
                {saving
                  ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : 'Save Changes'
                }
              </button>
            </div>
          </form>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
