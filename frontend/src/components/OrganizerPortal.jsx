import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, BarChart3, Users, DollarSign, Star, Calendar, MapPin, 
  Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2, RefreshCw, Ticket
} from 'lucide-react';
import styles from './OrganizerPortal.module.css';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { parseJwt } from '../utils/jwtHelper';
import OrganizerEventRow from './organizer/OrganizerEventRow';
import EditEventModal from './organizer/EditEventModal';
import bookingService from '../services/bookingService';
import { mapEventDtos } from '../utils/eventMapper';

const LOCATION_OPTIONS = [
  { value: 'Mumbai',    label: 'Mumbai' },
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Delhi',     label: 'Delhi' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Pune',      label: 'Pune' },
  { value: 'Chennai',   label: 'Chennai' },
  { value: 'Remote',    label: 'Online (Remote)' },
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${state.isFocused ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 'var(--radius-sm)',
    boxShadow: state.isFocused ? '0 0 10px rgba(124,58,237,0.15)' : 'none',
    padding: '0.05rem 0.25rem',
    minHeight: 'unset',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--accent-purple)' : 'rgba(255,255,255,0.2)',
    },
  }),
  valueContainer: (base) => ({ ...base, padding: '0.55rem 0.75rem' }),
  singleValue: (base) => ({ ...base, color: '#FFFFFF', fontSize: '0.95rem', fontFamily: 'inherit', margin: 0 }),
  placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem' }),
  input: (base) => ({ ...base, color: '#FFFFFF', margin: 0, padding: 0 }),
  dropdownIndicator: (base) => ({ ...base, color: '#FFFFFF', padding: '0 0.5rem', '&:hover': { color: '#FFFFFF' } }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({
    ...base,
    background: '#13172a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 9999,
  }),
  menuList: (base) => ({ ...base, padding: '0.25rem' }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(124,58,237,0.25)' : 'transparent',
    color: state.isFocused ? '#C084FC' : '#FFFFFF',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '0.55rem 0.9rem',
    transition: 'background 0.15s ease',
  }),
};

export default function OrganizerPortal({ eventList: initialEventList, setEventList: setParentEventList, bookedTickets }) {
  const { token } = useAuth();

  // ─── Own event list fetched from backend ──────────────────────────────────
  // We maintain local state here (not relying on App.jsx's shared eventList)
  // so that CRUD operations trigger a precise, scoped re-fetch.
  const [myEvents, setMyEvents]       = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError]   = useState('');
  // Incrementing refreshKey causes useEffect to re-fire and re-fetch from backend
  const [refreshKey, setRefreshKey]   = useState(0);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // ─── Organizer Bookings ───────────────────────────────────────────────────
  const [organizerBookings, setOrganizerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  // ─── Edit modal state ─────────────────────────────────────────────────────
  const [editingEvent, setEditingEvent] = useState(null); // null = modal closed

  // ─── Derive current organizer ID from JWT for filtering ──────────────────
  const organizerId = React.useMemo(() => {
    if (!token) return null;
    const claims = parseJwt(token);
    // ASP.NET Core sets the NameIdentifier claim for the user ID
    const id = claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
             || claims?.sub
             || claims?.nameid
             || null;
    return id ? Number(id) : null;
  }, [token]);

  // ─── Fetch this organizer's events from GET /api/events ──────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFetchLoading(true);
      setFetchError('');
      try {
        const events = organizerId
          ? await eventService.getMyEvents(organizerId)
          : await eventService.getAllEvents(); // fallback: show all if ID missing
        if (!cancelled) {
          setMyEvents(events);
          // Keep the shared App.jsx eventList in sync so AttendeePortal reflects changes
          setParentEventList(mapEventDtos(events));
        }
      } catch (err) {
        if (!cancelled) setFetchError('Could not load your events. Please refresh.');
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, organizerId]);

  // ─── Fetch Bookings for Organizer's Events ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const allBookings = await bookingService.getUserBookings();
        if (!cancelled && myEvents.length > 0) {
          // Filter to only include bookings for THIS organizer's events
          const myEventIds = new Set(myEvents.map(e => e.id));
          const filtered = allBookings.filter(b => myEventIds.has(b.eventId));
          setOrganizerBookings(filtered);
        } else if (!cancelled && myEvents.length === 0) {
          setOrganizerBookings([]);
        }
      } catch (err) {
        if (!cancelled) setBookingsError('Could not load bookings.');
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    };

    if (!fetchLoading) { // Wait until myEvents are fetched
      fetchBookings();
    }

    return () => { cancelled = false; };
  }, [refreshKey, myEvents, fetchLoading]);

  // Form states
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('GoLoco Live');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00 - 22:00');
  const [location, setLocation] = useState('Mumbai');
  const [category, setCategory] = useState('Music');
  const [ticketTypesForm, setTicketTypesForm] = useState([
    { id: 1, name: 'General Admission', price: '1000', capacity: 150 }
  ]);
  const [description, setDescription] = useState('');
  const [imagePreset, setImagePreset] = useState('music');
  const [customImage, setCustomImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Image Presets mapping
  const presets = {
    music: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    tech: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
    sports: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
    comedy: "https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&q=80&w=800",
    workshop: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800"
  };

  // Analytics driven from the live myEvents list
  const metrics = React.useMemo(() => {
    let revenue = 0;
    let ticketsCount = 0;
    
    bookedTickets.forEach(booking => {
      ticketsCount += booking.quantity;
      if (booking.amount !== 'Free') {
        revenue += parseFloat(booking.amount.replace(/[^0-9.]/g, ''));
      }
    });

    const totalListedEvents = myEvents.length;
    const initialTicketsSold = 3450;
    const initialRevenue = 2850000;
    const totalRating = totalListedEvents * 4.8;
    const avgRating = totalListedEvents > 0 ? (totalRating / totalListedEvents).toFixed(1) : '0.0';

    return {
      listedEvents: totalListedEvents,
      ticketsSold: initialTicketsSold + ticketsCount,
      revenue: initialRevenue + revenue,
      avgRating,
    };
  }, [myEvents, bookedTickets]);

  // ─── Create Event: wired to POST /api/events ────────────────────────────
  // The JWT is automatically attached by apiClient.js (reads from localStorage).
  // The backend expects multipart/form-data.
  // On success: the new EventDto is prepended to the local eventList so the
  // right-panel listing refreshes immediately without a full page reload.
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    // ── Client-side pre-validation (matches backend [Required] annotations) ──
    const errors = {};
    if (!title.trim())       errors.title       = 'Event title is required.';
    if (!description.trim()) errors.description = 'Event description is required.';
    if (!date.trim())        errors.date        = 'Event date is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // ── Build the payload that matches CreateEventDto exactly ──
    const parsedTicketTypes = ticketTypesForm.map(tt => {
      const p = parseFloat(tt.price.toString().replace(/[^0-9.]/g, '')) || 0;
      return {
        name: tt.name.trim() || 'General Admission',
        price: p,
        capacity: parseInt(tt.capacity) || 0
      };
    });
    const totalCapacity = parsedTicketTypes.reduce((acc, tt) => acc + tt.capacity, 0);
    const minPrice = parsedTicketTypes.length > 0 ? Math.min(...parsedTicketTypes.map(t => t.price)) : 0;
    const priceVal = minPrice === 0 ? 'Free' : `₹${minPrice}`;

    const formData = new FormData();
    formData.append('Title', title.trim());
    formData.append('Description', description.trim());
    formData.append('Date', new Date(date).toISOString());
    formData.append('Location', location);
    formData.append('TotalCapacity', totalCapacity);
    
    parsedTicketTypes.forEach((tt, index) => {
      formData.append(`TicketTypes[${index}].Name`, tt.name);
      formData.append(`TicketTypes[${index}].Price`, tt.price);
      formData.append(`TicketTypes[${index}].Capacity`, tt.capacity);
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    const finalImage = imageFile ? URL.createObjectURL(imageFile) : (customImage.trim() !== '' ? customImage : presets[imagePreset]);

    setSubmitting(true);
    setUploadProgress(0);
    
    // Simulate upload progress since fetch doesn't support it natively
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      // ── POST /api/events — apiClient auto-attaches Authorization: Bearer <JWT> ──
      const createdEvent = await eventService.createEvent(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // ── Map the backend EventDto back to the frontend event shape ──
      // The backend returns { id, title, description, date, location,
      // totalCapacity, organizerId, organizerName }.
      // We enrich it with frontend-only display fields that the backend
      // doesn't store (image, category, price, etc.).
      const newEvent = {
        id:          createdEvent.id,
        title:       createdEvent.title,
        description: createdEvent.description,
        image:       createdEvent.imageUrl || finalImage,
        date:        new Date(createdEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        time:        time,
        location:    createdEvent.location,
        category:    category,
        price:       priceVal,
        seatsLeft:   createdEvent.totalCapacity,
        totalSeats:  createdEvent.totalCapacity,
        rating:      5.0,
        organizer:   createdEvent.organizerName || organizer,
        type:        location === 'Remote' ? 'Online' : 'In-Person',
        trending:    false,
        startsInDays: Math.max(2, Math.floor(Math.random() * 25) + 3),
      };

      // ── Refresh from backend — ensures UI reflects exact DB state ──
      refresh();
      setFormSuccess(true);

      // Reset only the creative fields; keep defaults for re-use
      setTitle('');
      setDescription('');
      setDate('');
      setTicketTypesForm([{ id: Date.now(), name: 'General Admission', price: '1000', capacity: 150 }]);
      setImageFile(null);
      setCustomImage('');
      
      setTimeout(() => {
        setFormSuccess(false);
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      clearInterval(progressInterval);
      // ── Handle backend validation errors (400 Bad Request from ModelState) ──
      if (err.status === 400 && err.data?.errors) {
        // ASP.NET Core ModelState sends { errors: { FieldName: ["message"] } }
        const serverErrors = {};
        Object.entries(err.data.errors).forEach(([field, messages]) => {
          serverErrors[field.toLowerCase()] = messages[0];
        });
        setFieldErrors(serverErrors);
        setFormError('Please correct the highlighted fields below.');
      } else if (err.status === 401) {
        setFormError('Your session has expired. Please log in again.');
      } else if (err.status === 403) {
        setFormError('Access denied. Only Organizer accounts can create events.');
      } else {
        setFormError(err.message || 'Failed to create event. Please try again.');
      }
    } finally {
      clearInterval(progressInterval);
      setSubmitting(false);
    }
  };

  // handleDeleteEvent is now handled inside OrganizerEventRow directly.
  // After deletion succeeds, OrganizerEventRow calls onDeleted() which calls refresh().

  return (
    <div className={styles.dashboardContainer}>
      {/* Edit modal — rendered in a portal-like overlay above all content */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={() => { setEditingEvent(null); refresh(); }}
        />
      )}

      {/* Dashboard Top Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <span className={styles.badge}><BarChart3 size={12} /> HOST CONTROL CENTER</span>
          <h1>Organizer Dashboard</h1>
          <p>Monitor event performance, oversee attendee registration lists, and publish new experiences to the platform.</p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className={styles.analyticsGrid}>
        <div className={`${styles.metricCard} glass-card`}>
          <div className={styles.metricHeader}>
            <span>Listed Events</span>
            <PlusCircle className={styles.metricIconPurple} size={20} />
          </div>
          <div className={styles.metricValue}>{metrics.listedEvents}</div>
          <div className={styles.metricSubtext}>Currently active events</div>
        </div>

        <div className={`${styles.metricCard} glass-card`}>
          <div className={styles.metricHeader}>
            <span>Total Tickets Sold</span>
            <Users className={styles.metricIconBlue} size={20} />
          </div>
          <div className={styles.metricValue}>{metrics.ticketsSold.toLocaleString()}</div>
          <div className={styles.metricSubtext}>+ {bookedTickets.reduce((a,c)=>a+c.quantity, 0)} sold this session</div>
        </div>

        <div className={`${styles.metricCard} glass-card`}>
          <div className={styles.metricHeader}>
            <span>Estimated Revenue</span>
            <DollarSign className={styles.metricIconGreen} size={20} />
          </div>
          <div className={styles.metricValue}>₹{metrics.revenue.toLocaleString()}</div>
          <div className={styles.metricSubtext}>Base ticket sales (platform fees excl.)</div>
        </div>

        <div className={`${styles.metricCard} glass-card`}>
          <div className={styles.metricHeader}>
            <span>Average Rating</span>
            <Star className={styles.metricIconGold} size={20} fill="#FBBF24" stroke="#FBBF24" />
          </div>
          <div className={styles.metricValue}>{metrics.avgRating} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>/ 5.0</span></div>
          <div className={styles.metricSubtext}>Based on user feedback logs</div>
        </div>
      </div>

      <div className={styles.panelGrid}>
        {/* Left Panel: Event Creation Form — unchanged */}
        <div className={`${styles.formPanel} glass-card`}>
          <div className={styles.panelHeader}>
            <PlusCircle className={styles.panelHeaderIcon} size={22} />
            <h2>Publish New Event</h2>
          </div>

          <form onSubmit={handleCreateEvent} className={styles.eventForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="title">Event Title <span className={styles.required}>*</span></label>
              <input 
                id="title"
                type="text" 
                placeholder="e.g. Sunburn Beach Festival" 
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFieldErrors(p => ({...p, title: ''})); }}
                required
                style={fieldErrors.title ? { borderColor: '#ef4444' } : {}}
              />
              {fieldErrors.title && <span style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.title}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="organizer">Organizer Name</label>
                <input 
                  id="organizer"
                  type="text" 
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="category">Category</label>
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Music">Music</option>
                  <option value="Tech">Tech</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Festival">Festival</option>
                  <option value="Education">Education</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="date">Date <span className={styles.required}>*</span></label>
                <input 
                  id="date"
                  type="date" 
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setFieldErrors(p => ({...p, date: ''})); }}
                  required
                  style={fieldErrors.date ? { borderColor: '#ef4444' } : {}}
                />
                {fieldErrors.date && <span style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.date}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="time">Time Slot</label>
                <input 
                  id="time"
                  type="text" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 18:00 - 21:30"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="location">Location / City</label>
                <Select
                  inputId="location"
                  options={LOCATION_OPTIONS}
                  value={LOCATION_OPTIONS.find(opt => opt.value === location) ?? null}
                  onChange={(selected) => setLocation(selected?.value ?? '')}
                  isSearchable={false}
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Total Capacity</label>
                <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {ticketTypesForm.reduce((acc, tt) => acc + (parseInt(tt.capacity) || 0), 0)} seats
                </div>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup} style={{flex: 1}}>
                <label>Ticket Types</label>
                
                {submitting && uploadProgress > 0 && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, color: '#A78BFA' }}>
                      <span>Uploading & Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#A78BFA', transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ticketTypesForm.map((tt, index) => (
                    <div key={tt.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={tt.name}
                        onChange={(e) => {
                          const newTts = [...ticketTypesForm];
                          newTts[index].name = e.target.value;
                          setTicketTypesForm(newTts);
                        }}
                        placeholder="Tier Name (e.g. VIP)"
                        style={{ flex: 2 }}
                        required
                      />
                      <input 
                        type="text" 
                        value={tt.price}
                        onChange={(e) => {
                          const newTts = [...ticketTypesForm];
                          newTts[index].price = e.target.value;
                          setTicketTypesForm(newTts);
                        }}
                        placeholder="Price (₹)"
                        style={{ flex: 1 }}
                        required
                      />
                      <input 
                        type="number" 
                        value={tt.capacity}
                        onChange={(e) => {
                          const newTts = [...ticketTypesForm];
                          newTts[index].capacity = e.target.value;
                          setTicketTypesForm(newTts);
                        }}
                        placeholder="Qty"
                        min="1"
                        style={{ flex: 1 }}
                        required
                      />
                      {ticketTypesForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTicketTypesForm(ticketTypesForm.filter(t => t.id !== tt.id));
                          }}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', padding: '0.65rem', borderRadius: '0.4rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTicketTypesForm([...ticketTypesForm, { id: Date.now(), name: '', price: '', capacity: 100 }]);
                    }}
                    style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px dashed rgba(124,58,237,0.3)', padding: '0.75rem', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                  >
                    <PlusCircle size={14} /> Add Ticket Tier
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Event Cover Image</label>
              <div className={styles.presetContainer}>
                {Object.keys(presets).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.presetBtn} ${imagePreset === key && !customImage ? styles.presetActive : ''}`}
                    onClick={() => {
                      setImagePreset(key);
                      setCustomImage('');
                    }}
                  >
                    <span className={styles.presetText}>{key.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              <div className={styles.customUrlInput}>
                <ImageIcon size={16} className={styles.urlIcon} />
                <input 
                  type="text" 
                  placeholder="Or paste custom image Unsplash URL..." 
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                />
              </div>
              <div className={styles.customUrlInput} style={{ marginTop: '0.5rem' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    setImageFile(e.target.files[0]);
                    setCustomImage('');
                  }}
                  style={{ padding: '0.5rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-primary)', width: '100%', borderRadius: '0.5rem' }}
                />
                {imageFile && (
                  <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Image Preview:</span>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description">Event Description <span className={styles.required}>*</span></label>
              <textarea 
                id="description"
                rows="4" 
                placeholder="Give a summary of your event features, VIP upgrades, special attendees, etc."
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFieldErrors(p => ({...p, description: ''})); }}
                required
                style={fieldErrors.description ? { borderColor: '#ef4444' } : {}}
              />
              {fieldErrors.description && <span style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.description}</span>}
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div 
                  className={styles.errorBanner}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </motion.div>
              )}

              {formSuccess && (
                <motion.div 
                  className={styles.successBanner}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CheckCircle2 size={18} />
                  <span>Event created and listed successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span>Publishing...</span></>
                : <><PlusCircle size={20} /><span>List Event Live</span></>}
            </button>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </form>
        </div>

        {/* Right Panel: Listings Manager — now driven by backend data */}
        <div className={`${styles.listingsPanel} glass-card`}>
          <div className={styles.panelHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users className={styles.panelHeaderIcon} size={22} />
              <h2 style={{ margin: 0 }}>Your Listed Events ({myEvents.length})</h2>
            </div>
            {/* Manual refresh button */}
            <button
              onClick={refresh}
              disabled={fetchLoading}
              title="Refresh event list"
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.4rem', padding: '0.35rem 0.6rem',
                color: 'var(--text-secondary)', cursor: fetchLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem',
              }}
            >
              <RefreshCw size={14} style={fetchLoading ? { animation: 'spin 1s linear infinite' } : {}} />
              {fetchLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className={styles.listingsTableWrapper}>
            {fetchError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: '#f87171', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '0.5rem', padding: '0.75rem 1rem',
                fontSize: '0.875rem', marginBottom: '1rem',
              }}>
                <AlertCircle size={16} /> {fetchError}
              </div>
            )}

            {fetchLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Fetching your events...</span>
              </div>
            ) : myEvents.length > 0 ? (
              <div className={styles.listingsList} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myEvents.map((event) => {
                  const ticketsSold = organizerBookings
                    .filter(b => b.eventId === event.id)
                    .reduce((sum, b) => sum + b.numberOfTickets, 0);
                  const capacity = event.totalCapacity ?? event.totalSeats ?? 0;
                  const updatedEvent = { ...event, seatsLeft: capacity - ticketsSold };

                  return (
                    <OrganizerEventRow
                      key={event.id}
                      event={updatedEvent}
                      onEdit={(ev) => setEditingEvent(event)} // pass original event for editing
                      onDeleted={refresh}
                    />
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyListings}>
                <AlertCircle size={32} />
                <p>No active event listings found.</p>
                <span>Use the form on the left to publish your first event!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organizer Booking Dashboard */}
      <div className={`${styles.bookingsPanel} glass-card`} style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className={styles.panelHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ticket className={styles.panelHeaderIcon} size={22} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0 }}>Booking Dashboard</h2>
          </div>
          <button
            onClick={refresh}
            disabled={bookingsLoading}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.4rem', padding: '0.35rem 0.6rem',
              color: 'var(--text-secondary)', cursor: bookingsLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem',
            }}
          >
            <RefreshCw size={14} style={bookingsLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            {bookingsLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {bookingsError && (
          <div style={{ color: '#f87171', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {bookingsError}
          </div>
        )}

        {bookingsLoading ? (
           <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
             <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
             <p>Loading booking statistics...</p>
           </div>
        ) : organizerBookings.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
             <p>No bookings have been made for your events yet.</p>
           </div>
        ) : (
           <div style={{ overflowX: 'auto' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                   <th style={{ padding: '1rem' }}>Event Name</th>
                   <th style={{ padding: '1rem' }}>Total Bookings</th>
                   <th style={{ padding: '1rem' }}>Tickets Sold</th>
                   <th style={{ padding: '1rem' }}>Revenue</th>
                 </tr>
               </thead>
               <tbody>
                 {Object.values(organizerBookings.reduce((acc, b) => {
                    if (!acc[b.eventId]) {
                      acc[b.eventId] = { id: b.eventId, title: b.eventTitle, count: 0, tickets: 0, revenue: 0 };
                    }
                    acc[b.eventId].count += 1;
                    acc[b.eventId].tickets += b.numberOfTickets;
                    acc[b.eventId].revenue += b.totalPrice;
                    return acc;
                 }, {})).map(stat => (
                   <tr key={stat.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                     <td style={{ padding: '1rem', fontWeight: 600 }}>{stat.title}</td>
                     <td style={{ padding: '1rem' }}>{stat.count}</td>
                     <td style={{ padding: '1rem' }}>{stat.tickets}</td>
                     <td style={{ padding: '1rem', color: '#10B981', fontWeight: 600 }}>₹{stat.revenue.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
}
