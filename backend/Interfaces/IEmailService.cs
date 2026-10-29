using System.Threading.Tasks;
using OnlineEventTicketManagement.DTOs;

namespace OnlineEventTicketManagement.Interfaces
{
    /// <summary>
    /// Sends transactional emails. Implementations must never throw: an email problem
    /// must not fail the registration or booking that triggered it.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>Sends the welcome email after a successful registration.</summary>
        Task SendWelcomeEmailAsync(string name, string toEmail);

        /// <summary>Sends the booking confirmation after a successful booking.</summary>
        Task SendBookingConfirmationAsync(BookingDto booking, string toEmail);
    }
}
