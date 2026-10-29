using System;
using System.Globalization;
using System.Linq;
using System.Net;
using OnlineEventTicketManagement.DTOs;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Builds the subject, HTML body and plain-text body for each email.
    /// All user-supplied text is HTML-encoded in the HTML version.
    /// </summary>
    public static class EmailTemplates
    {
        public record EmailBody(string Subject, string Html, string Text);

        private static string H(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        private static string Wrap(string innerHtml) =>
            "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;line-height:1.5\">" +
            "<h2 style=\"color:#6c47ff;margin-bottom:4px\">GoLoco</h2>" + innerHtml +
            "<p style=\"color:#888;font-size:12px;margin-top:32px\">You received this email because of activity on your GoLoco account.</p></div>";

        public static EmailBody Welcome(string name)
        {
            string subject = "Welcome to GoLoco!";
            string html = Wrap(
                $"<p>Hi {H(name)},</p>" +
                "<p>Welcome to GoLoco! Your account is ready. You can now discover events and book your tickets.</p>" +
                "<p>See you at the next event!</p>");
            string text =
                $"Hi {name},\n\nWelcome to GoLoco! Your account is ready. You can now discover events and book your tickets.\n\nSee you at the next event!\n";
            return new EmailBody(subject, html, text);
        }

        public static EmailBody BookingConfirmation(BookingDto b, string? qrUrl = null)
        {
            string date = b.EventDate.ToString("ddd, dd MMM yyyy, HH:mm", CultureInfo.InvariantCulture);
            string total = "₹" + b.TotalPrice.ToString("N2", CultureInfo.InvariantCulture);
            string seats = b.SelectedSeats.Any() ? string.Join(", ", b.SelectedSeats) : "General admission (no specific seats)";
            string subject = $"Booking confirmed: {b.EventTitle}";

            string html = Wrap(
                $"<p>Hi {H(b.UserName)},</p>" +
                "<p>Your booking is confirmed. Here are the details:</p>" +
                "<table style=\"border-collapse:collapse;width:100%\">" +
                Row("Event", H(b.EventTitle)) +
                Row("Date", H(date)) +
                Row("Location", H(b.EventLocation)) +
                Row("Ticket type", H(b.TicketTypeName)) +
                Row("Tickets", b.NumberOfTickets.ToString(CultureInfo.InvariantCulture)) +
                Row("Seats", H(seats)) +
                Row("Total", H(total)) +
                Row("Booking ID", "#" + b.Id.ToString(CultureInfo.InvariantCulture)) +
                "</table>" +
                (qrUrl == null ? "" :
                    "<p style=\"margin:20px 0\"><a href=\"" + H(qrUrl) + "\" style=\"background:#6c47ff;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold\">View your ticket QR</a></p>") +
                "<p>You can view your tickets any time under My Bookings.</p>");

            string text =
                $"Hi {b.UserName},\n\nYour booking is confirmed.\n\n" +
                $"Event: {b.EventTitle}\nDate: {date}\nLocation: {b.EventLocation}\n" +
                $"Ticket type: {b.TicketTypeName}\nTickets: {b.NumberOfTickets}\nSeats: {seats}\n" +
                $"Total: {total}\nBooking ID: #{b.Id}\n\n" +
                (qrUrl == null ? "" : $"View your ticket QR: {qrUrl}\n\n") +
                "You can view your tickets any time under My Bookings.\n";
            return new EmailBody(subject, html, text);
        }

        private static string Row(string label, string valueHtml) =>
            $"<tr><td style=\"padding:6px 8px;border-bottom:1px solid #eee;color:#666\">{label}</td>" +
            $"<td style=\"padding:6px 8px;border-bottom:1px solid #eee\"><strong>{valueHtml}</strong></td></tr>";
    }
}
