using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OnlineEventTicketManagement.Data;
using OnlineEventTicketManagement.Interfaces;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Repositories
{
    /// <summary>
    /// Concrete implementation of IBookingRepository.
    /// Uses EF Core's Include() to eagerly load related User, Event, and TicketType
    /// entities in a single SQL JOIN query, avoiding N+1 query problems.
    /// </summary>
    public class BookingRepository : GenericRepository<Booking>, IBookingRepository
    {
        public BookingRepository(AppDbContext context) : base(context)
        {
        }

        /// <summary>
        /// Fetches all bookings, joining User, Event, and TicketType data in one query.
        /// </summary>
        public async Task<IEnumerable<Booking>> GetAllWithDetailsAsync()
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.TicketType)
                .Include(b => b.Seats)
                .ToListAsync();
        }

        /// <summary>
        /// Fetches a single booking by ID, with User, Event, and TicketType details.
        /// </summary>
        public async Task<Booking?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.TicketType)
                .Include(b => b.Seats)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        /// <summary>
        /// Fetches all bookings belonging to a specific user.
        /// Useful for an attendee to view their own booking history.
        /// </summary>
        public async Task<IEnumerable<Booking>> GetBookingsByUserIdAsync(int userId)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.TicketType)
                .Include(b => b.Seats)
                .Where(b => b.UserId == userId)
                .ToListAsync();
        }
        /// <summary>
        /// Fetches all bookings for events organized by the given user.
        /// </summary>
        public async Task<IEnumerable<Booking>> GetBookingsByOrganizerIdAsync(int organizerId)
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.TicketType)
                .Include(b => b.Seats)
                .Where(b => b.Event.OrganizerId == organizerId)
                .ToListAsync();
        }

        /// <summary>
        /// Fetches a booking by its ticket code (read-only), with User, Event, TicketType and Seats.
        /// </summary>
        public async Task<Booking?> GetByTicketCodeWithDetailsAsync(string ticketCode)
        {
            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.User)
                .Include(b => b.Event)
                .Include(b => b.TicketType)
                .Include(b => b.Seats)
                .FirstOrDefaultAsync(b => b.TicketCode == ticketCode);
        }

        /// <summary>
        /// One conditional UPDATE: the database decides the winner, so two simultaneous
        /// scans of the same ticket can never both succeed.
        /// </summary>
        public async Task<bool> TryCheckInAsync(string ticketCode, int? eventId, int organizerId, DateTime nowUtc)
        {
            int rows = await _context.Bookings
                .Where(b => b.TicketCode == ticketCode
                            && b.CheckedInAt == null
                            && b.Status == "Confirmed"
                            && (eventId == null || b.EventId == eventId)
                            && _context.Events.Any(e => e.Id == b.EventId && e.OrganizerId == organizerId))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(b => b.CheckedInAt, (DateTime?)nowUtc)
                    .SetProperty(b => b.CheckedInByUserId, (int?)organizerId)
                    .SetProperty(b => b.UpdatedAt, (DateTime?)nowUtc));
            return rows == 1;
        }

        /// <summary>
        /// Fetches all bookings belonging to a specific event.
        /// Used by EventService when deleting an event to remove related bookings first.
        /// </summary>
        public async Task<IEnumerable<Booking>> GetBookingsByEventIdAsync(int eventId)
        {
            return await _context.Bookings
                .Where(b => b.EventId == eventId)
                .ToListAsync();
        }
    }
}
