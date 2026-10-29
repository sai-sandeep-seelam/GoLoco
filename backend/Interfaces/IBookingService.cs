using System.Collections.Generic;
using System.Threading.Tasks;
using OnlineEventTicketManagement.DTOs;

namespace OnlineEventTicketManagement.Interfaces
{
    /// <summary>
    /// Defines the business logic contract for the Booking module.
    /// Controllers depend on this abstraction, never on the concrete service,
    /// keeping the layers loosely coupled and testable.
    /// </summary>
    public interface IBookingService
    {
        /// <summary>Bookings for events organized by this user (no ticket codes).</summary>
        Task<IEnumerable<BookingDto>> GetBookingsForOrganizerAsync(int organizerId);

        /// <summary>One booking, only if the requester owns it or organizes its event; otherwise null.</summary>
        Task<BookingDto?> GetBookingByIdAsync(int id, int requesterId);

        /// <summary>Validates a ticket code at the door and marks it used (once).</summary>
        Task<CheckInResultDto> CheckInAsync(string code, int? eventId, int organizerId);
        Task<IEnumerable<BookingDto>> GetBookingsForUserAsync(int userId);
        Task<BookingDto> CreateBookingAsync(CreateBookingDto createBookingDto, int userId);
    }
}
