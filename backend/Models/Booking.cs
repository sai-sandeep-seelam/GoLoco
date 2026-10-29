using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineEventTicketManagement.Models
{
    public class Booking : BaseEntity
    {
        [Required]
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.0, double.MaxValue)]
        public decimal TotalPrice { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // e.g. "Pending", "Confirmed", "Cancelled"

        // Foreign Key: One attendee (User) can make many bookings
        [Required]
        public int UserId { get; set; }

        // Foreign Key: One event has many bookings
        [Required]
        public int EventId { get; set; }

        // Foreign Key: Link to the selected ticket category
        [Required]
        public int TicketTypeId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int NumberOfTickets { get; set; } = 1;

        /// <summary>
        /// Long random code (64 hex chars) encoded in the ticket QR. Unique. Null only for
        /// bookings made before codes existed and not yet backfilled.
        /// </summary>
        [StringLength(64)]
        public string? TicketCode { get; set; }

        /// <summary>When the booking was checked in at the venue (UTC). Null = not used yet.</summary>
        public DateTime? CheckedInAt { get; set; }

        /// <summary>The organizer (User.Id) who checked the booking in. Plain id, no foreign key.</summary>
        public int? CheckedInByUserId { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Event Event { get; set; } = null!;
        public TicketType TicketType { get; set; } = null!;
        
        // Relationship: One booking can contain many seats
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    }
}
