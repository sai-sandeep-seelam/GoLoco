using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnlineEventTicketManagement.DTOs;
using OnlineEventTicketManagement.Interfaces;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Sends email through Amazon SES. Reads Email:SenderAddress and the optional
    /// Email:SenderName. Credentials come from the default AWS credential chain.
    /// Never throws: failures are logged and swallowed so callers are never affected.
    /// </summary>
    public class SesEmailService : IEmailService
    {
        private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(10);

        private readonly IAmazonSimpleEmailServiceV2 _ses;
        private readonly ITicketQrService _ticketQr;
        private readonly ILogger<SesEmailService> _logger;
        private readonly string _from;

        public SesEmailService(
            IAmazonSimpleEmailServiceV2 ses,
            ITicketQrService ticketQr,
            IConfiguration configuration,
            ILogger<SesEmailService> logger)
        {
            _ses = ses;
            _ticketQr = ticketQr;
            _logger = logger;

            string address = configuration["Email:SenderAddress"]
                ?? throw new InvalidOperationException("Email:SenderAddress is not configured.");
            _from = BuildFromHeader(configuration["Email:SenderName"], address.Trim());
        }

        public async Task SendWelcomeEmailAsync(string name, string toEmail)
        {
            try
            {
                await SendAsync(toEmail, EmailTemplates.Welcome(name));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email.");
            }
        }

        public async Task SendBookingConfirmationAsync(BookingDto booking, string toEmail)
        {
            try
            {
                // Runs in the caller's fire-and-forget task and uses plain values only (a DTO and strings).
                // The QR service never throws; if the upload fails the link is null and the email is sent without it.
                string? qrUrl = string.IsNullOrEmpty(booking.TicketCode)
                    ? null
                    : await _ticketQr.CreateQrLinkAsync(booking.TicketCode);

                await SendAsync(toEmail, EmailTemplates.BookingConfirmation(booking, qrUrl));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send confirmation email for booking {BookingId}.", booking.Id);
            }
        }

        private async Task SendAsync(string toEmail, EmailTemplates.EmailBody email)
        {
            using var cts = new CancellationTokenSource(SendTimeout);

            await _ses.SendEmailAsync(new SendEmailRequest
            {
                FromEmailAddress = _from,
                Destination = new Destination { ToAddresses = new List<string> { toEmail } },
                Content = new EmailContent
                {
                    Simple = new Message
                    {
                        Subject = new Content { Data = email.Subject, Charset = "UTF-8" },
                        Body = new Body
                        {
                            Html = new Content { Data = email.Html, Charset = "UTF-8" },
                            Text = new Content { Data = email.Text, Charset = "UTF-8" }
                        }
                    }
                }
            }, cts.Token);
        }

        /// <summary>
        /// Builds the From header. Without a name it is just the address; with one it is
        /// "Name" &lt;address&gt;, with characters that could break the header removed and
        /// non-ASCII names encoded as an RFC 2047 encoded-word.
        /// </summary>
        private static string BuildFromHeader(string? senderName, string address)
        {
            if (string.IsNullOrWhiteSpace(senderName)) return address;

            var cleaned = new StringBuilder();
            foreach (char c in senderName)
            {
                if (c is '"' or '\\' or '<' or '>' or '\r' or '\n') continue;
                cleaned.Append(c);
            }
            string name = cleaned.ToString().Trim();
            if (name.Length == 0) return address;

            bool ascii = true;
            foreach (char c in name)
            {
                if (c > 127) { ascii = false; break; }
            }

            string display = ascii
                ? $"\"{name}\""
                : $"=?UTF-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(name))}?=";
            return $"{display} <{address}>";
        }
    }
}
