using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using OnlineEventTicketManagement.DTOs;
using OnlineEventTicketManagement.Interfaces;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Used when Email:SenderAddress is not configured (local runs, tests). Only logs.
    /// </summary>
    public class NoOpEmailService : IEmailService
    {
        private readonly ILogger<NoOpEmailService> _logger;

        public NoOpEmailService(ILogger<NoOpEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendWelcomeEmailAsync(string name, string toEmail)
        {
            _logger.LogInformation("Email disabled: skipping welcome email.");
            return Task.CompletedTask;
        }

        public Task SendBookingConfirmationAsync(BookingDto booking, string toEmail)
        {
            _logger.LogInformation("Email disabled: skipping confirmation email for booking {BookingId}.", booking.Id);
            return Task.CompletedTask;
        }
    }
}
