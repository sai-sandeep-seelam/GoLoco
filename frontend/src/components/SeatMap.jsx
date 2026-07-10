import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './SeatMap.module.css';

/**
 * BookMyShow-style visual seat selection grid.
 *
 * Props:
 *  - seats           : SeatDto[] from GET /api/events/{id}/seats
 *  - seatsLoading    : boolean
 *  - selectedSeats   : Set<string>  (seat numbers like "A-1")
 *  - onToggleSeat    : (seatNumber: string) => void
 *  - maxSelectable   : number (= ticketQuantity)
 *  - ticketTypes     : TicketTypeDto[]
 *  - selectedTicketType : TicketTypeDto | null
 *  - onSelectTicketType : (tt) => void
 */
export default function SeatMap({
  seats,
  seatsLoading,
  selectedSeats,
  onToggleSeat,
  maxSelectable,
  ticketTypes,
  selectedTicketType,
  onSelectTicketType
}) {
  // ─── Group seats into rows by their letter prefix ──────────────────────
  // Seat numbers follow the format "A-1", "B-3", etc.
  const { rows, filteredSeats } = useMemo(() => {
    if (!seats || seats.length === 0) return { rows: [], filteredSeats: [] };

    // Filter seats to the selected ticket type
    const filtered = selectedTicketType
      ? seats.filter(s => s.ticketTypeId === selectedTicketType.id)
      : seats;

    // Group by row letter
    const rowMap = new Map();
    filtered.forEach(seat => {
      const parts = seat.seatNumber.split('-');
      const rowLetter = parts[0] || '?';
      if (!rowMap.has(rowLetter)) rowMap.set(rowLetter, []);
      rowMap.get(rowLetter).push(seat);
    });

    // Sort rows alphabetically, seats by column number
    const sorted = Array.from(rowMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, rowSeats]) => ({
        letter,
        seats: rowSeats.sort((a, b) => {
          const numA = parseInt(a.seatNumber.split('-')[1]) || 0;
          const numB = parseInt(b.seatNumber.split('-')[1]) || 0;
          return numA - numB;
        })
      }));

    return { rows: sorted, filteredSeats: filtered };
  }, [seats, selectedTicketType]);

  // ─── Loading state ─────────────────────────────────────────────────────
  if (seatsLoading) {
    return (
      <div className={styles.seatMapWrapper}>
        <div className={styles.loadingSeats}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading seat map...</span>
        </div>
      </div>
    );
  }

  // ─── No seats available ────────────────────────────────────────────────
  if (!seats || seats.length === 0) {
    return (
      <div className={styles.seatMapWrapper}>
        <div className={styles.noSeats}>No seat map available for this event.</div>
      </div>
    );
  }

  const handleSeatClick = (seat) => {
    if (seat.isReserved) return; // booked seats are not clickable
    onToggleSeat(seat.seatNumber);
  };

  const getSeatClass = (seat) => {
    if (seat.isReserved) return styles.seatBooked;
    if (selectedSeats.has(seat.seatNumber)) return styles.seatSelected;
    return styles.seatAvailable;
  };

  const canSelect = (seat) => {
    if (seat.isReserved) return false;
    if (selectedSeats.has(seat.seatNumber)) return true; // can always deselect
    return selectedSeats.size < maxSelectable; // enforce max
  };

  return (
    <div className={styles.seatMapWrapper}>
      {/* Header */}
      <div className={styles.seatMapHeader}>
        <span className={styles.seatMapTitle}>
          🎭 Select Your Seats
        </span>
        <span className={styles.seatCount}>
          {selectedSeats.size} / {maxSelectable} selected
        </span>
      </div>

      {/* Ticket Type Tabs (to switch between tiers) */}
      {ticketTypes.length > 1 && (
        <div className={styles.tierTabs}>
          {ticketTypes.map(tt => (
            <button
              key={tt.id}
              className={`${styles.tierTab} ${selectedTicketType?.id === tt.id ? styles.tierTabActive : ''}`}
              onClick={() => onSelectTicketType(tt)}
            >
              {tt.name} — ₹{tt.price}
            </button>
          ))}
        </div>
      )}

      {/* Screen Indicator */}
      <div className={styles.screenContainer}>
        <div className={styles.screenCurve} />
        <span className={styles.screenLabel}>Screen / Stage</span>
      </div>

      {/* Seat Grid */}
      <div className={styles.seatGrid}>
        {rows.map(row => (
          <div key={row.letter} className={styles.seatRow}>
            <span className={styles.rowLabel}>{row.letter}</span>
            {row.seats.map(seat => {
              const colNum = seat.seatNumber.split('-')[1] || '';
              const clickable = canSelect(seat);
              return (
                <div
                  key={seat.seatNumber}
                  className={`${styles.seat} ${getSeatClass(seat)}`}
                  title={
                    seat.isReserved
                      ? `${seat.seatNumber} — Booked`
                      : selectedSeats.has(seat.seatNumber)
                      ? `${seat.seatNumber} — Click to deselect`
                      : selectedSeats.size >= maxSelectable
                      ? `Max ${maxSelectable} seats reached`
                      : `${seat.seatNumber} — Click to select`
                  }
                  onClick={() => clickable && handleSeatClick(seat)}
                  style={{ cursor: clickable ? 'pointer' : seat.isReserved ? 'not-allowed' : 'default' }}
                >
                  {colNum}
                </div>
              );
            })}
            <span className={styles.rowLabel}>{row.letter}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.swatchAvailable}`} />
          Available
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.swatchSelected}`} />
          Selected
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.swatchBooked}`} />
          Booked
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.size > 0 && (
        <div className={styles.selectedSummary}>
          <span className={styles.selectedLabel}>Your Seats:</span>
          {Array.from(selectedSeats).sort().map(sn => (
            <span
              key={sn}
              className={styles.seatChip}
              onClick={() => onToggleSeat(sn)}
              title="Click to remove"
            >
              {sn} <span className={styles.chipX}>✕</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
