using System.Collections.Generic;
using System.Threading.Tasks;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Interfaces
{
    /// <summary>
    /// Extends the generic repository with booking-specific data access methods
    /// that require eager-loading of User and Event navigation properties.
    /// </summary>
    public interface IBookingRepository : IGenericRepository<Booking>
    {
        Task<IEnumerable<Booking>> GetAllWithDetailsAsync();
        Task<Booking?> GetByIdWithDetailsAsync(int id);
        Task<IEnumerable<Booking>> GetBookingsByUserIdAsync(int userId);
        Task<IEnumerable<Booking>> GetBookingsByEventIdAsync(int eventId);
        Task<IEnumerable<Booking>> GetBookingsByOrganizerIdAsync(int organizerId);
        Task<Booking?> GetByTicketCodeWithDetailsAsync(string ticketCode);

        /// <summary>
        /// Atomically marks the booking as checked in. Returns true only if exactly this call
        /// changed it (code matches, confirmed, not used yet, event belongs to the organizer).
        /// </summary>
        Task<bool> TryCheckInAsync(string ticketCode, int? eventId, int organizerId, DateTime nowUtc);
    }
}
