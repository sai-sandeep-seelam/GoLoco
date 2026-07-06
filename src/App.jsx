import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventDiscovery from './components/EventDiscovery';
import EventList from './components/EventList';
import Footer from './components/Footer';
import { events } from './data/events';
import { Ticket, X, CheckCircle, ShieldCheck } from 'lucide-react';
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
  const [filters, setFilters] = useState(initialFilters);
  const [activeChip, setActiveChip] = useState('all');

  // Booking Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Sync quick filter chips with category selection
  const handleSetActiveChip = (value) => {
    setActiveChip(value);
    if (value === 'all') {
      setFilters(prev => ({ ...prev, category: 'All Categories' }));
    } else {
      // Find matching category (case-insensitive)
      const formattedCategory = value.charAt(0).toUpperCase() + value.slice(1);
      setFilters(prev => ({ ...prev, category: formattedCategory }));
    }
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setActiveChip('all');
  };

  const handleBookEvent = (event) => {
    setSelectedEvent(event);
    setTicketQuantity(1);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setBookingConfirmed(false);
  };

  // Convert price string to integer value for sorting and pricing calculations
  const getNumericPrice = (priceStr) => {
    if (!priceStr || priceStr.toLowerCase().includes('free')) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  // Live filtering and sorting logic
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

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
          return b.rating - a.rating; // Highest rated first
        case 'price-low':
          return priceA - priceB; // Lowest price first
        case 'price-high':
          return priceB - priceA; // Highest price first
        case 'closest':
          return a.startsInDays - b.startsInDays; // Closest date first
        case 'seats':
          return b.seatsLeft - a.seatsLeft; // Most seats first
        case 'newest':
          return b.id - a.id; // Mock newest (latest added to db)
        case 'popular':
        default:
          return (b.rating * 10 - b.startsInDays) - (a.rating * 10 - a.startsInDays); // Hybrid popular metric
      }
    });

    return result;
  }, [filters]);

  const totalPrice = selectedEvent ? getNumericPrice(selectedEvent.price) * ticketQuantity : 0;
  const bookingFee = selectedEvent && selectedEvent.price !== 'Free' ? 49.00 : 0;

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

      {/* Main Content */}
      <main style={{ marginTop: '80px' }}>
        <Hero />
        
        {/* Sticky filter & discovery panel */}
        <EventDiscovery 
          filters={filters} 
          setFilters={setFilters} 
          onReset={handleResetFilters}
        />

        <EventList 
          filteredEvents={filteredAndSortedEvents} 
          onBookEvent={handleBookEvent}
          activeChip={activeChip}
          setActiveChip={handleSetActiveChip}
          sortBy={filters.sortBy}
          setSortBy={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Drawer/Modal */}
      {selectedEvent && (
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
                  <div className="ticket-tier">
                    <div>
                      <h4>General Admission</h4>
                      <p className="tier-desc">Standard access to all main stages and event activities.</p>
                    </div>
                    <div className="price-tag">{selectedEvent.price}</div>
                  </div>

                  <div className="quantity-selector">
                    <span>Number of Tickets:</span>
                    <div className="qty-controls">
                      <button 
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        disabled={ticketQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-number">{ticketQuantity}</span>
                      <button 
                        onClick={() => setTicketQuantity(Math.min(selectedEvent.seatsLeft, ticketQuantity + 1))}
                        disabled={ticketQuantity >= selectedEvent.seatsLeft}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="billing-summary">
                    <div className="bill-row">
                      <span>Subtotal</span>
                      <span>{selectedEvent.price === 'Free' ? 'Free' : `₹${totalPrice.toFixed(2)}`}</span>
                    </div>
                    <div className="bill-row">
                      <span>Booking Fee</span>
                      <span>{selectedEvent.price === 'Free' ? 'Free' : `₹${bookingFee.toFixed(2)}`}</span>
                    </div>
                    <hr className="divider" />
                    <div className="bill-row total">
                      <span>Total Amount</span>
                      <span>{selectedEvent.price === 'Free' ? 'Free' : `₹${(totalPrice + bookingFee).toFixed(2)}`}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className="confirm-btn" 
                  onClick={handleConfirmBooking}
                  disabled={selectedEvent.seatsLeft <= 0}
                  style={{ opacity: selectedEvent.seatsLeft <= 0 ? 0.5 : 1 }}
                >
                  {selectedEvent.seatsLeft <= 0 ? 'Sold Out' : 'Confirm & Pay Now'}
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
                    <span>{ticketQuantity}x General Admission</span>
                  </div>
                  <div className="receipt-row">
                    <span>Amount Paid</span>
                    <span>{selectedEvent.price === 'Free' ? 'Free' : `₹${(totalPrice + bookingFee).toFixed(2)}`}</span>
                  </div>

                  <div className="qr-container">
                    {/* Mock QR Code representation */}
                    <div className="qr-code">
                      <div className="qr-corner qr-tl"></div>
                      <div className="qr-corner qr-tr"></div>
                      <div className="qr-corner qr-bl"></div>
                      <div className="qr-dot dot-1"></div>
                      <div className="qr-dot dot-2"></div>
                      <div className="qr-dot dot-3"></div>
                      <div className="qr-dot dot-4"></div>
                    </div>
                    <span className="qr-label">TICKET ID: GOLOCO-{Math.floor(100000 + Math.random() * 900000)}</span>
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
