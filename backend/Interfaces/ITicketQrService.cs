using System.Threading.Tasks;

namespace OnlineEventTicketManagement.Interfaces
{
    /// <summary>
    /// Creates the QR image for a ticket code and stores it so it can be linked from an email.
    /// Takes and returns plain strings only, so it is safe to call from a background task.
    /// Implementations must never throw.
    /// </summary>
    public interface ITicketQrService
    {
        /// <summary>
        /// Generates a PNG QR for the ticket code, stores it, and returns its public URL,
        /// or null if QR links are disabled or the upload failed.
        /// </summary>
        Task<string?> CreateQrLinkAsync(string ticketCode);
    }
}
