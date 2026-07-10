import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingView from './components/LandingView';
import AttendeePortal from './components/AttendeePortal';
import OrganizerPortal from './components/OrganizerPortal';
import Footer from './components/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bookings from './pages/Bookings';
import AccessDenied from './pages/AccessDenied';
import { useAuth } from './context/AuthContext';
import { Ticket, X, CheckCircle, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import eventService from './services/eventService';
import bookingService from './services/bookingService';
import { mapEventDtos } from './utils/eventMapper';
import SeatMap from './components/SeatMap';
import DownloadableQRCode from './components/DownloadableQRCode';
import './App.css';

const initialFilters = {
  search: '',
  location: 'All Locations',
  date: 'All Dates',
  category: 'All Categories',
  price: 'All Prices',
  availability: 'all',
  sortBy: 'popular'
};

export default function App() {
  // Global States
  const [eventList, setEventList] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [bookedTickets, setBookedTickets] = useState([]);

  // Fetch all events on mount
  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError('');
      try {
        const dtos = await eventService.getAllEvents();
        if (!cancelled) {
          setEventList(mapEventDtos(dtos));
        }
      } catch (err) {
        if (!cancelled) setEventsError('Failed to load events. Please check your connection.');
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };
    loadEvents();
    return () => { cancelled = true; };
  }, []);
  
  // Attendee Search Filters
  const [filters, setFilters] = useState(initialFilters);
  const [activeChip, setActiveChip] = useState('all');

  // Booking Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  // Ticket Types State
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [ticketTypesLoading, setTicketTypesLoading] = useState(false);

  // Seats State
  const [eventSeats, setEventSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(new Set());

  // Enforce selected seats size matches ticket quantity when quantity shrinks
  useEffect(() => {
    if (selectedSeats.size > ticketQuantity) {
      setSelectedSeats(prev => new Set(Array.from(prev).slice(0, ticketQuantity)));
    }
  }, [ticketQuantity, selectedSeats]);

  // Sync quick filter chips with category selection
  const handleSetActiveChip = (value) => {
    setActiveChip(value);
    if (value === 'all') {
      setFilters(prev => ({ ...prev, category: 'All Categories' }));
    } else {
      const formattedCategory = value.charAt(0).toUpperCase() + value.slice(1);
      setFilters(prev => ({ ...prev, category: formattedCategory }));
    }
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setActiveChip('all');
  };

  const handleBookEvent = async (event) => {
    // 1. Enforce Authentication & Role before showing ticket drawer
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (role !== 'Attendee') {
      alert('Only Attendees are permitted to purchase event tickets. Organizer accounts cannot buy tickets.');
      return;
    }

    // Lookup latest event details from state in case capacity changed
    const freshEvent = eventList.find(e => e.id === event.id) || event;
    setSelectedEvent(freshEvent);
    setTicketQuantity(1);
    setBookingConfirmed(false);
    
    // Fetch Ticket Types & Seats
    setTicketTypes([]);
    setSelectedTicketType(null);
    setTicketTypesLoading(true);
    setEventSeats([]);
    setSelectedSeats(new Set());
    setSeatsLoading(true);
    
    try {
      const [types, seats] = await Promise.all([
        eventService.getEventTicketTypes(freshEvent.id),
        eventService.getEventSeats(freshEvent.id).catch(() => [])
      ]);
      setTicketTypes(types);
      setEventSeats(seats);
      if (types && types.length > 0) {
        setSelectedTicketType(types[0]);
      } else {
        setSelectedTicketType(null);
      }
    } catch (err) {
      setTicketTypes([]);
      setSelectedTicketType(null);
      setEventSeats([]);
    } finally {
      setTicketTypesLoading(false);
      setSeatsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingError('');
    
    // Seat Validation
    const availableSeatsForTier = eventSeats.filter(s => s.ticketTypeId === selectedTicketType?.id);
    if (availableSeatsForTier.length > 0 && selectedSeats.size !== ticketQuantity) {
      setBookingError(`Please select ${ticketQuantity} seat(s) from the map.`);
      return;
    }

    setIsBooking(true);

    try {
      // 1. POST /api/bookings — automatically attaches JWT from localStorage via apiClient
      await bookingService.createBooking({
        eventId: selectedEvent.id,
        ticketTypeId: selectedTicketType?.id,
        numberOfTickets: ticketQuantity,
        seatNumbers: Array.from(selectedSeats)
      });

      // 2. Refresh the global events list to sync available tickets from Azure SQL
      const dtos = await eventService.getAllEvents();
      setEventList(mapEventDtos(dtos));

      // Refresh TicketTypes to update available seat count without page refresh
      const updatedTypes = await eventService.getEventTicketTypes(selectedEvent.id);
      setTicketTypes(updatedTypes);
      if (selectedTicketType) {
        const stillAvailable = updatedTypes.find(t => t.id === selectedTicketType.id);
        if (stillAvailable) setSelectedTicketType(stillAvailable);
      }

      // 3. Append ticket receipt object to attendee wallet (local state simulation of wallet)
      const ticketId = `GOLOCO-${Math.floor(100000 + Math.random() * 900000)}`;
      const amountStr = selectedTicketType?.price === 0 ? 'Free' : `₹${((selectedTicketType?.price * ticketQuantity) + (selectedTicketType?.price > 0 ? 49.00 : 0)).toFixed(2)}`;
      
      const newBooking = {
        id: ticketId,
        event: selectedEvent,
        quantity: ticketQuantity,
        amount: amountStr,
        date: selectedEvent.date,
        time: selectedEvent.time,
        location: selectedEvent.location,
        ticketTypeName: selectedTicketType?.name || 'General Admission',
        seats: Array.from(selectedSeats)
      };
      setBookedTickets(prev => [newBooking, ...prev]);

      // 4. Mark modal screen confirmed
      setBookingConfirmed(true);

    } catch (err) {
      if (err.status === 401) {
        setBookingError('Session expired. Please log in again.');
      } else if (err.status === 400) {
        // e.g. "Not enough seats available" from backend
        setBookingError(err.message || 'Booking failed: Please check ticket availability.');
      } else {
        setBookingError(err.message || 'An error occurred while booking. Please try again.');
      }
    } finally {
      setIsBooking(false);
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setBookingConfirmed(false);
    setBookingError('');
    setTicketTypes([]);
    setSelectedTicketType(null);
    setEventSeats([]);
    setSelectedSeats(new Set());
  };

  // Convert price string to integer value for sorting and pricing calculations
  const getNumericPrice = (priceStr) => {
    if (!priceStr || priceStr.toLowerCase().includes('free')) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  // Live filtering and sorting logic
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...eventList];

    // 1. Filter by Search Query
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.organizer.toLowerCase().includes(query)
      );
    }

    // 2. Filter by Location
    if (filters.location !== 'All Locations') {
      result = result.filter(e => e.location.toLowerCase() === filters.location.toLowerCase());
    }

    // 3. Filter by Category
    if (filters.category !== 'All Categories') {
      result = result.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
    }

    // 4. Filter by Date
    if (filters.date !== 'All Dates') {
      result = result.filter(e => {
        if (filters.date === 'Today') return e.startsInDays === 0 || e.startsInDays === 1;
        if (filters.date === 'Tomorrow') return e.startsInDays === 1 || e.startsInDays === 2;
        if (filters.date === 'This Weekend') return e.startsInDays <= 3;
        if (filters.date === 'This Month') return e.startsInDays <= 30;
        return true;
      });
    }

    // 5. Filter by Price
    if (filters.price !== 'All Prices') {
      result = result.filter(e => {
        const numeric = getNumericPrice(e.price);
        if (filters.price === 'Free') return numeric === 0;
        if (filters.price === 'Under ₹500') return numeric > 0 && numeric < 500;
        if (filters.price === '₹500–₹1000') return numeric >= 500 && numeric <= 1000;
        if (filters.price === '₹1000–₹3000') return numeric > 1000 && numeric <= 3000;
        if (filters.price === 'Premium') return numeric > 3000;
        return true;
      });
    }

    // 6. Filter by Availability
    if (filters.availability === 'available') {
      result = result.filter(e => e.seatsLeft > 0);
    } else if (filters.availability === 'soldout') {
      result = result.filter(e => e.seatsLeft === 0);
    }

    // 7. Sorting
    result.sort((a, b) => {
      const priceA = getNumericPrice(a.price);
      const priceB = getNumericPrice(b.price);

      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'closest':
          return a.startsInDays - b.startsInDays;
        case 'seats':
          return b.seatsLeft - a.seatsLeft;
        case 'newest':
          return b.id - a.id;
        case 'popular':
        default:
          return (b.rating * 10 - b.startsInDays) - (a.rating * 10 - a.startsInDays);
      }
    });

    return result;
  }, [eventList, filters]);

    const safeQty = Number.isNaN(ticketQuantity) ? 1 : ticketQuantity;
    const totalPrice = selectedTicketType ? (selectedTicketType.price * safeQty) : (selectedEvent ? getNumericPrice(selectedEvent.price) * safeQty : 0);
    const bookingFee = totalPrice > 0 ? 49.00 : 0;
    const latestSelectedEventInState = selectedEvent ? (eventList.find(e => e.id === selectedEvent.id) || selectedEvent) : null;

  return (
    <div className="app-container">
      {/* Background glow graphics */}
      <div className="bg-gradient-glow" />
      <div className="floating-gradients-container">
        <div className="glow-sphere sphere-1" />
        <div className="glow-sphere sphere-2" />
        <div className="glow-sphere sphere-3" />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content with dynamic transitions */}
      <main style={{ marginTop: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
                {eventsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Loading experiences...</p>
                  </div>
                ) : eventsError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#f87171' }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p>{eventsError}</p>
                  </div>
                ) : (
                  <LandingView eventList={eventList} onBookEvent={handleBookEvent} />
                )}
              </motion.div>
            } />
            <Route path="/events" element={
              <ProtectedRoute allowedRole="Attendee">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
                  {eventsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
                      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                      <p>Loading experiences...</p>
                    </div>
                  ) : eventsError ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#f87171' }}>
                      <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                      <p>{eventsError}</p>
                    </div>
                  ) : (
                    <AttendeePortal
                      eventList={eventList}
                      filters={filters}
                      setFilters={setFilters}
                      onResetFilters={handleResetFilters}
                      filteredEvents={filteredAndSortedEvents}
                      onBookEvent={handleBookEvent}
                      activeChip={activeChip}
                      setActiveChip={handleSetActiveChip}
                      bookedTickets={bookedTickets}
                    />
                  )}
                </motion.div>
              </ProtectedRoute>
            } />
            <Route path="/attendee" element={
              <ProtectedRoute allowedRole="Attendee">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
                  {eventsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
                      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                      <p>Loading attendee dashboard...</p>
                    </div>
                  ) : eventsError ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#f87171' }}>
                      <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                      <p>{eventsError}</p>
                    </div>
                  ) : (
                    <AttendeePortal
                      eventList={eventList}
                      filters={filters}
                      setFilters={setFilters}
                      onResetFilters={handleResetFilters}
                      filteredEvents={filteredAndSortedEvents}
                      onBookEvent={handleBookEvent}
                      activeChip={activeChip}
                      setActiveChip={handleSetActiveChip}
                      bookedTickets={bookedTickets}
                    />
                  )}
                </motion.div>
              </ProtectedRoute>
            } />
            <Route path="/organizer" element={
              <ProtectedRoute allowedRole="Organizer">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
                  <OrganizerPortal
                    eventList={eventList}
                    setEventList={setEventList}
                    bookedTickets={bookedTickets}
                  />
                </motion.div>
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute allowedRole="Attendee">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
                  <Bookings bookedTickets={bookedTickets} />
                </motion.div>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<AccessDenied />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Drawer/Modal */}
      {selectedEvent && latestSelectedEventInState && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              <X size={24} />
            </button>

            {!bookingConfirmed ? (
              <>
                <div className="modal-header">
                  <Ticket className="modal-icon" size={32} />
                  <h2>Select Tickets</h2>
                </div>
                
                <div className="event-summary">
                  <img src={selectedEvent.image} alt={selectedEvent.title} className="summary-img" />
                  <div>
                    <h3>{selectedEvent.title}</h3>
                    <p className="summary-details">{selectedEvent.date} &bull; {selectedEvent.time}</p>
                    <p className="summary-loc">{selectedEvent.location}</p>
                  </div>
                </div>

                  <div className="booking-options">
                    {ticketTypesLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.9rem' }}>Loading ticket types...</span>
                      </div>
                    ) : ticketTypes.length > 0 ? (
                      <div className="ticket-types-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {ticketTypes.map(tt => (
                          <div 
                            key={tt.id}
                            className={`ticket-tier ${selectedTicketType?.id === tt.id ? 'selected' : ''}`}
                            onClick={() => {
                              if (selectedTicketType?.id !== tt.id) {
                                setSelectedTicketType(tt);
                                setSelectedSeats(new Set());
                              }
                            }}
                            style={{ 
                              cursor: 'pointer', 
                              opacity: tt.capacity <= 0 ? 0.5 : 1
                            }}
                          >
                            <div>
                              <h4>{tt.name}</h4>
                              <p className="tier-desc">
                                {tt.capacity <= 0 ? (
                                  <span style={{ color: '#f87171', fontWeight: 600 }}>Sold Out</span>
                                ) : tt.capacity <= 5 ? (
                                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>Only {tt.capacity} seats remaining</span>
                                ) : (
                                  `Available: ${tt.capacity} seats`
                                )}
                              </p>
                            </div>
                            <div className="price-tag">{tt.price === 0 ? 'Free' : `₹${tt.price}`}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#f87171' }}>
                        No ticket types available for this event.
                      </div>
                    )}

                  <div className="quantity-selector">
                    <span>Number of Tickets:</span>
                    <div className="qty-controls">
                      <button 
                        onClick={() => setTicketQuantity(Math.max(1, (Number.isNaN(ticketQuantity) ? 1 : ticketQuantity) - 1))}
                        disabled={ticketQuantity <= 1 || ticketTypes.length === 0}
                      >
                        -
                      </button>
                      <span className="qty-number">{Number.isNaN(ticketQuantity) ? 1 : ticketQuantity}</span>
                      <button 
                        onClick={() => {
                           const currentQty = Number.isNaN(ticketQuantity) ? 1 : ticketQuantity;
                           const maxQty = selectedTicketType?.capacity || 1;
                           setTicketQuantity(Math.min(maxQty, currentQty + 1));
                        }}
                        disabled={ticketTypes.length === 0 || !selectedTicketType || ticketQuantity >= selectedTicketType.capacity || selectedTicketType.capacity <= 0}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {eventSeats.filter(s => s.ticketTypeId === selectedTicketType?.id).length > 0 && (
                    <SeatMap
                      seats={eventSeats}
                      seatsLoading={seatsLoading}
                      selectedSeats={selectedSeats}
                      onToggleSeat={(sn) => {
                        setSelectedSeats(prev => {
                          const next = new Set(prev);
                          if (next.has(sn)) {
                            next.delete(sn);
                          } else {
                            if (next.size < ticketQuantity) {
                              next.add(sn);
                            }
                          }
                          return next;
                        });
                      }}
                      maxSelectable={ticketQuantity}
                      ticketTypes={ticketTypes}
                      selectedTicketType={selectedTicketType}
                      onSelectTicketType={(tt) => {
                        if (selectedTicketType?.id !== tt.id) {
                          setSelectedTicketType(tt);
                          setSelectedSeats(new Set());
                        }
                      }}
                    />
                  )}

                  <div className="billing-summary">
                    <div className="bill-row">
                      <span>Subtotal</span>
                      <span>{selectedTicketType?.price === 0 ? 'Free' : `₹${totalPrice.toFixed(2)}`}</span>
                    </div>
                    <div className="bill-row">
                      <span>Booking Fee</span>
                      <span>{selectedTicketType?.price === 0 ? 'Free' : `₹${bookingFee.toFixed(2)}`}</span>
                    </div>
                    <hr className="divider" />
                    <div className="bill-row total">
                      <span>Total Amount</span>
                      <span>{selectedTicketType?.price === 0 ? 'Free' : `₹${(totalPrice + bookingFee).toFixed(2)}`}</span>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <AlertCircle size={18} /> {bookingError}
                  </div>
                )}

                <button 
                  className="confirm-btn" 
                  onClick={handleConfirmBooking}
                  disabled={!selectedTicketType || selectedTicketType.capacity <= 0 || ticketQuantity > selectedTicketType.capacity || isBooking || ticketTypesLoading}
                  style={{ opacity: (!selectedTicketType || selectedTicketType.capacity <= 0 || ticketQuantity > selectedTicketType.capacity || isBooking || ticketTypesLoading) ? 0.7 : 1, cursor: (!selectedTicketType || selectedTicketType.capacity <= 0 || ticketQuantity > selectedTicketType.capacity || isBooking || ticketTypesLoading) ? 'not-allowed' : 'pointer' }}
                >
                  {isBooking ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }} /> Processing...</>
                  ) : !selectedTicketType ? 'Select Ticket Type' 
                    : selectedTicketType.capacity <= 0 ? 'Sold Out'
                    : ticketQuantity > selectedTicketType.capacity ? 'Not enough seats'
                    : 'Confirm & Pay Now'}
                </button>
                <div className="secure-checkout">
                  <ShieldCheck size={14} />
                  <span>Secure 256-bit SSL encrypted checkout</span>
                </div>
              </>
            ) : (
              <div className="success-screen">
                <CheckCircle size={64} className="success-icon" />
                <h2>Booking Confirmed!</h2>
                <p className="success-message">
                  Thank you for booking with GoLoco. Your tickets have been sent to your email.
                </p>

                <div className="success-receipt">
                  <div className="receipt-row">
                    <span>Event</span>
                    <strong>{selectedEvent.title}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Date & Time</span>
                    <span>{selectedEvent.date} at {selectedEvent.time}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Tickets Purchased</span>
                    <span>{ticketQuantity}x {selectedTicketType?.name}</span>
                  </div>
                  {Array.from(selectedSeats).length > 0 && (
                    <div className="receipt-row">
                      <span>Seats</span>
                      <span>{Array.from(selectedSeats).sort().join(', ')}</span>
                    </div>
                  )}
                  <div className="receipt-row">
                    <span>Amount Paid</span>
                    <span>{selectedEvent.price === 'Free' ? 'Free' : `₹${(totalPrice + bookingFee).toFixed(2)}`}</span>
                  </div>

                  <div className="qr-container">
                    <DownloadableQRCode value={bookedTickets[0]?.id || `GOLOCO-${Math.floor(100000 + Math.random() * 900000)}`} size={120} />
                    <span className="qr-label">TICKET ID: {bookedTickets[0]?.id || `GOLOCO-${Math.floor(100000 + Math.random() * 900000)}`}</span>
                  </div>
                </div>

                <button className="done-btn" onClick={closeModal}>
                  Back to Events
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

