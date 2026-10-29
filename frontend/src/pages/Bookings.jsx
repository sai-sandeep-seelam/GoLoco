import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, QrCode, Ticket, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import bookingService from '../services/bookingService';
import DownloadableQRCode from '../components/DownloadableQRCode';

/**
 * Bookings page — Attendee-only protected route.
 * Connects to GET /api/bookings/my to show the logged-in attendee's bookings.
 */
export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        // The backend returns only this attendee's own bookings
        const myBookings = await bookingService.getMyBookings();
        if (mounted && user) {
          // Sort by booking date descending (newest first)
          myBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
          setBookings(myBookings);
        }
      } catch (err) {
        if (mounted) setError('Failed to load your bookings. Please try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?.name) {
      fetchBookings();
    }

    return () => { mounted = false; };
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/events" style={{ 
          color: 'var(--text-secondary)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          <ArrowLeft size={18} /> Back to Events
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Welcome, <strong>{user?.name}</strong>. Below are your active event tickets.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p>Loading your tickets...</p>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '1rem'
          }}>
            <Ticket size={48} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No tickets booked yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Browse through our curated list of events to book your next live or online experience!
          </p>
          <Link to="/events" style={{
            display: 'inline-flex', 
            padding: '0.8rem 1.6rem', 
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%)',
            color: '#fff', 
            borderRadius: '0.5rem', 
            fontWeight: 600, 
            textDecoration: 'none',
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }}>
            Explore Live Events
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="glass-card" 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '1.5rem', 
                padding: '1.75rem', 
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Event Image */}
              {booking.eventImageUrl ? (
                <img 
                  src={booking.eventImageUrl} 
                  alt={booking.eventTitle}
                  style={{
                    width: '130px', 
                    height: '130px', 
                    objectFit: 'cover',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '130px', 
                    height: '130px', 
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }} 
                >
                  <Calendar size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
                </div>
              )}
              
              {/* Event Info */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    background: booking.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                    color: booking.status === 'Confirmed' ? '#10B981' : '#f87171', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '9999px', 
                    fontWeight: 700 
                  }}>
                    {booking.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Booked on {formatDate(booking.bookingDate)}
                  </span>
                </div>
                
                <h3 style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                  {booking.eventTitle}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--accent-purple)' }} /> {formatDate(booking.eventDate)} at {formatTime(booking.eventDate)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} style={{ color: 'var(--accent-blue)' }} /> {booking.eventLocation}
                  </span>
                </div>
              </div>

              {/* QR Code and Ticket details */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderLeft: '1px dashed rgba(255,255,255,0.12)', 
                paddingLeft: '1.5rem', 
                minWidth: '150px' 
              }}>
                {booking.ticketCode ? (
                  <div style={{ opacity: booking.checkedInAt ? 0.35 : 1 }}>
                    <DownloadableQRCode value={booking.ticketCode} size={80} />
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Ticket code not available
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '1px', fontWeight: 600, marginTop: '0.5rem' }}>
                  ID: {booking.id}
                </span>
                {booking.checkedInAt && (
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(148, 163, 184, 0.18)',
                    color: '#cbd5e1',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}>
                    USED · {formatDate(booking.checkedInAt)} {formatTime(booking.checkedInAt)}
                  </span>
                )}
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  marginTop: '0.5rem',
                  color: 'var(--accent-purple)'
                }}>
                  {booking.ticketTypeName} (x{booking.numberOfTickets})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Price: ₹{booking.ticketPrice.toFixed(2)}/each
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Total: ₹{booking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
