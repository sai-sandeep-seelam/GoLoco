using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using OnlineEventTicketManagement.DTOs;
using OnlineEventTicketManagement.Interfaces;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Implements the booking business logic layer.
    /// Validates event and ticket type existence, calculates pricing, creates the booking entity,
    /// and maps the persisted entity to a safe DTO for the HTTP response.
    /// </summary>
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IEventRepository _eventRepository;

        private readonly IEmailService _emailService;

        public BookingService(IBookingRepository bookingRepository, IEventRepository eventRepository, IEmailService emailService)
        {
            _bookingRepository = bookingRepository;
            _eventRepository = eventRepository;
            _emailService = emailService;
        }

        /// <summary>
        /// Returns bookings for events organized by this user. Ticket codes are never included.
        /// </summary>
        public async Task<IEnumerable<BookingDto>> GetBookingsForOrganizerAsync(int organizerId)
        {
            var bookings = await _bookingRepository.GetBookingsByOrganizerIdAsync(organizerId);
            return bookings.Select(b => MapToDto(b, includeTicketCode: false));
        }

        /// <summary>
        /// Returns a single booking, only to its owner or to the organizer of its event.
        /// The ticket code is included for the owner only.
        /// </summary>
        public async Task<BookingDto?> GetBookingByIdAsync(int id, int requesterId)
        {
            var booking = await _bookingRepository.GetByIdWithDetailsAsync(id);
            if (booking == null) return null;

            bool isOwner = booking.UserId == requesterId;
            bool isEventOrganizer = booking.Event?.OrganizerId == requesterId;
            if (!isOwner && !isEventOrganizer) return null;

            return MapToDto(booking, includeTicketCode: isOwner);
        }

        /// <summary>
        /// Returns bookings for a specific user (their own tickets, with ticket codes).
        /// </summary>
        public async Task<IEnumerable<BookingDto>> GetBookingsForUserAsync(int userId)
        {
            var bookings = await _bookingRepository.GetBookingsByUserIdAsync(userId);
            return bookings.Select(b => MapToDto(b, includeTicketCode: true));
        }

        /// <summary>
        /// Checks a ticket in at the door. The state change is a single atomic UPDATE in the
        /// repository; if it did not apply, the booking is read back to explain why.
        /// </summary>
        public async Task<CheckInResultDto> CheckInAsync(string code, int? eventId, int organizerId)
        {
            string normalized = (code ?? string.Empty).Trim().ToLowerInvariant();
            if (normalized.Length == 0 || normalized.Length > 64)
            {
                return new CheckInResultDto { Result = CheckInResults.Invalid, Message = "Invalid ticket code." };
            }

            DateTime now = DateTime.UtcNow;
            bool admitted = await _bookingRepository.TryCheckInAsync(normalized, eventId, organizerId, now);

            var booking = await _bookingRepository.GetByTicketCodeWithDetailsAsync(normalized);
            if (booking == null)
            {
                return new CheckInResultDto { Result = CheckInResults.Invalid, Message = "Invalid ticket code." };
            }

            // Not this organizer's event, or not the event selected on the check-in page.
            // Reveal nothing else about the booking.
            if (booking.Event?.OrganizerId != organizerId || (eventId.HasValue && booking.EventId != eventId.Value))
            {
                return new CheckInResultDto { Result = CheckInResults.WrongEvent, Message = "This ticket is for a different event." };
            }

            var result = new CheckInResultDto
            {
                AdmitCount = booking.NumberOfTickets,
                AttendeeName = booking.User?.Name,
                EventTitle = booking.Event?.Title,
                TicketTypeName = booking.TicketType?.Name,
                Seats = booking.Seats?.Where(s => s.IsReserved).Select(s => s.SeatNumber).ToList() ?? new List<string>(),
                CheckedInAt = booking.CheckedInAt
            };

            if (admitted)
            {
                result.Result = CheckInResults.Admitted;
                result.Message = $"Valid. Admit {booking.NumberOfTickets}.";
            }
            else if (string.Equals(booking.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                result.Result = CheckInResults.Cancelled;
                result.Message = "This booking was cancelled.";
            }
            else if (booking.CheckedInAt != null)
            {
                result.Result = CheckInResults.AlreadyUsed;
                result.Message = "This ticket was already used.";
            }
            else
            {
                // Not confirmed (e.g. still pending): not admissible
                result.Result = CheckInResults.Invalid;
                result.Message = "This booking is not confirmed.";
                result.AdmitCount = 0;
            }
            return result;
        }

        /// <summary>
        /// Creates a new booking for the authenticated user.
        /// Validates the event, ensures the selected ticket type belongs to the event,
        /// validates and assigns specific seats if requested,
        /// calculates the total price dynamically, and persists the booking.
        /// </summary>
        public async Task<BookingDto> CreateBookingAsync(CreateBookingDto createBookingDto, int userId)
        {
            // 1. Fetch the Event including its TicketTypes and their Seats
            var @event = await _eventRepository.GetEventWithTicketsAsync(createBookingDto.EventId);
            if (@event == null)
            {
                throw new KeyNotFoundException($"Event with ID {createBookingDto.EventId} was not found.");
            }

            // 2. Locate the selected TicketType within the event's collection
            var ticketType = @event.TicketTypes.FirstOrDefault(tt => tt.Id == createBookingDto.TicketTypeId);
            if (ticketType == null)
            {
                throw new ArgumentException($"TicketType with ID {createBookingDto.TicketTypeId} does not belong to Event with ID {createBookingDto.EventId}.");
            }

            // 3. Validate seat availability to prevent overbooking
            if (ticketType.Capacity < createBookingDto.NumberOfTickets)
            {
                throw new ArgumentException(
                    ticketType.Capacity <= 0
                        ? $"TicketType '{ticketType.Name}' is sold out."
                        : $"Not enough seats available for '{ticketType.Name}'. Requested: {createBookingDto.NumberOfTickets}, Available: {ticketType.Capacity}");
            }

            // 4. Reduce available seats on the TicketType only.
            ticketType.Capacity -= createBookingDto.NumberOfTickets;

            // 5. Calculate the total price based on ticket tier price and quantity
            decimal totalPrice = ticketType.Price * createBookingDto.NumberOfTickets;

            // 6. Build the Booking entity
            var booking = new Booking
            {
                UserId = userId,
                EventId = createBookingDto.EventId,
                TicketTypeId = createBookingDto.TicketTypeId,
                NumberOfTickets = createBookingDto.NumberOfTickets,
                BookingDate = DateTime.UtcNow,
                TotalPrice = totalPrice,
                Status = "Confirmed",
                // 256 random bits as 64 hex characters: unguessable, unique
                TicketCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(),
                CreatedAt = DateTime.UtcNow
            };

            // 7. Validate and assign specific seats if requested
            if (createBookingDto.SeatNumbers != null && createBookingDto.SeatNumbers.Count > 0)
            {
                if (createBookingDto.SeatNumbers.Count != createBookingDto.NumberOfTickets)
                {
                    throw new ArgumentException(
                        $"SeatNumbers count ({createBookingDto.SeatNumbers.Count}) must match NumberOfTickets ({createBookingDto.NumberOfTickets}).");
                }

                // Check for duplicate seat numbers in the request
                var distinctSeats = createBookingDto.SeatNumbers.Distinct().ToList();
                if (distinctSeats.Count != createBookingDto.SeatNumbers.Count)
                {
                    throw new ArgumentException("Duplicate seat numbers are not allowed.");
                }

                foreach (var seatNumber in createBookingDto.SeatNumbers)
                {
                    var seat = ticketType.Seats.FirstOrDefault(s => s.SeatNumber == seatNumber);
                    if (seat == null)
                    {
                        throw new ArgumentException($"Seat '{seatNumber}' does not exist for TicketType '{ticketType.Name}'.");
                    }
                    if (seat.IsReserved)
                    {
                        throw new ArgumentException($"Seat '{seatNumber}' is already reserved.");
                    }

                    // Reserve the seat and link it to this booking
                    seat.IsReserved = true;
                    seat.Booking = booking;
                }
            }

            // 8. Persist booking + seat assignments in one transaction
            await _bookingRepository.AddAsync(booking);
            await _bookingRepository.SaveChangesAsync();

            // 9. Re-fetch with all navigation details for DTO representation
            var savedBooking = await _bookingRepository.GetByIdWithDetailsAsync(booking.Id);
            var bookingDto = MapToDto(savedBooking!, includeTicketCode: true);

            // Confirmation email: not awaited and never throws, so it cannot delay or fail the booking
            if (!string.IsNullOrWhiteSpace(savedBooking!.User?.Email))
            {
                _ = _emailService.SendBookingConfirmationAsync(bookingDto, savedBooking.User.Email);
            }

            return bookingDto;
        }

        /// <summary>
        /// Private helper: maps a Booking entity to a BookingDto.
        /// </summary>
        private static BookingDto MapToDto(Booking b, bool includeTicketCode) => new BookingDto
        {
            Id = b.Id,
            BookingDate = b.BookingDate,
            TotalPrice = b.TotalPrice,
            Status = b.Status,
            UserId = b.UserId,
            UserName = b.User?.Name ?? "Unknown",
            EventId = b.EventId,
            EventTitle = b.Event?.Title ?? "Unknown",
            EventDate = b.Event?.Date ?? DateTime.MinValue,
            EventLocation = b.Event?.Location ?? "Unknown",
            EventImageUrl = b.Event?.ImageUrl,
            TicketTypeId = b.TicketTypeId,
            TicketTypeName = b.TicketType?.Name ?? "Unknown",
            TicketPrice = b.TicketType?.Price ?? 0.00m,
            NumberOfTickets = b.NumberOfTickets,
            SelectedSeats = b.Seats?.Where(s => s.IsReserved).Select(s => s.SeatNumber).ToList() ?? new List<string>(),
            TicketCode = includeTicketCode ? b.TicketCode : null,
            CheckedInAt = b.CheckedInAt
        };
    }
}
