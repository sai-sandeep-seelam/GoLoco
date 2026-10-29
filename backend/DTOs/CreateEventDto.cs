using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OnlineEventTicketManagement.DTOs
{
    public class CreateEventDto
    {
        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, ErrorMessage = "Title cannot exceed 100 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Event date is required")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Location is required")]
        public string Location { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Total capacity must be at least 1")]
        public int TotalCapacity { get; set; }

        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }

        // One or more ticket categories (e.g. VIP, General Admission) submitted with the event
        public List<CreateTicketTypeDto> TicketTypes { get; set; } = new List<CreateTicketTypeDto>();
    }
}

