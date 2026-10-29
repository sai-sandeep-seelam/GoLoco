using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OnlineEventTicketManagement.Models
{
    public class Event : BaseEntity
    {
        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [StringLength(200)]
        public string Location { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int TotalCapacity { get; set; }

        /// <summary>
        /// Azure Blob Storage URL of the event poster image.
        /// Null if no image has been uploaded.
        /// </summary>
        public string? ImageUrl { get; set; }

        /// <summary>Event category chosen by the organizer (e.g. "Music"). Null for events created before categories were stored.</summary>
        [StringLength(50)]
        public string? Category { get; set; }

        // Foreign Key: One organizer (User) creates many events
        [Required]
        public int OrganizerId { get; set; }

        // Navigation properties
        public User Organizer { get; set; } = null!;
        
        // Relationship: One event has many ticket types
        public ICollection<TicketType> TicketTypes { get; set; } = new List<TicketType>();
        
        // Relationship: One event has many bookings
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
