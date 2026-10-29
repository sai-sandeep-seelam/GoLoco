using System;

namespace OnlineEventTicketManagement.DTOs
{
    public class EventDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public int TotalCapacity { get; set; }
        /// <summary>
        /// Remaining seats across all ticket types. Computed from sum of TicketType.Capacity.
        /// </summary>
        public int AvailableSeats { get; set; }
        public decimal Price { get; set; }
        public int OrganizerId { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
        /// <summary>Azure Blob Storage URL of the event poster. Null when no image has been uploaded.</summary>
        public string? ImageUrl { get; set; }
        /// <summary>Event category. Null for events created before categories were stored.</summary>
        public string? Category { get; set; }
    }
}
