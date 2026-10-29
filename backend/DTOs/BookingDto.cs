using System;
using System.Collections.Generic;

namespace OnlineEventTicketManagement.DTOs
{
    /// <summary>
    /// DTO returned to clients when reading booking details.
    /// Exposes a safe, flattened view of the Booking entity.
    /// </summary>
    public class BookingDto
    {
        public int Id { get; set; }
        public DateTime BookingDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;

        // Linked User (Attendee)
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        // Linked Event
        public int EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string EventLocation { get; set; } = string.Empty;
        public string? EventImageUrl { get; set; }

        // TicketType details
        public int TicketTypeId { get; set; }
        public string TicketTypeName { get; set; } = string.Empty;
        public decimal TicketPrice { get; set; }
        public int NumberOfTickets { get; set; }

        // Assigned seats (empty list when no specific seats were selected)
        public List<string> SelectedSeats { get; set; } = new();

        /// <summary>
        /// The secret code shown as the ticket QR. Only returned to the booking's owner;
        /// null in organizer views.
        /// </summary>
        public string? TicketCode { get; set; }

        /// <summary>UTC time the booking was checked in at the venue; null if not used yet.</summary>
        public DateTime? CheckedInAt { get; set; }
    }
}
