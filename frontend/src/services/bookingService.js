import { request } from './apiClient';

/**
 * Service to manage ticket bookings and reservations.
 */
export const bookingService = {
  /**
   * Fetch the bookings for the logged-in attendee (their own tickets, with ticket codes).
   */
  async getMyBookings() {
    return request('/bookings/my');
  },

  /**
   * Organizer only: fetch the bookings for the logged-in organizer's own events.
   */
  async getUserBookings() {
    return request('/bookings');
  },

  /**
   * Organizer only: check a ticket in at the door (marks it used once).
   * @param {string} code - The ticket code from the QR
   * @param {number|null} eventId - Optional: only accept tickets for this event
   * @returns {Promise<{result: string, message: string, admitCount: number, ...}>}
   */
  async checkIn(code, eventId = null) {
    return request('/bookings/check-in', {
      method: 'POST',
      body: { code, eventId },
    });
  },

  /**
   * Retrieve specific booking information by its ID.
   * @param {string|number} id - Booking ID
   */
  async getBookingById(id) {
    return request(`/bookings/${id}`);
  },

  /**
   * Book tickets for an event.
   * @param {Object} bookingData - { eventId, ticketQuantity }
   */
  async createBooking(bookingData) {
    return request('/bookings', {
      method: 'POST',
      body: bookingData,
    });
  },

  /**
   * Cancel an existing booking.
   * @param {string|number} id - Booking ID
   */
  async cancelBooking(id) {
    return request(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }
};

export default bookingService;
