using System.ComponentModel.DataAnnotations;

namespace OnlineEventTicketManagement.DTOs
{
    public class CheckInRequestDto
    {
        [Required(ErrorMessage = "Ticket code is required")]
        [StringLength(64, ErrorMessage = "Ticket code is too long")]
        public string Code { get; set; } = string.Empty;

        /// <summary>Optional: only accept tickets for this event (the one selected on the check-in page).</summary>
        public int? EventId { get; set; }
    }
}
