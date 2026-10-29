using System.Threading.Tasks;
using OnlineEventTicketManagement.Interfaces;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>Used when Storage:Provider is not S3: no QR image is created and no link is added to emails.</summary>
    public class NoOpTicketQrService : ITicketQrService
    {
        public Task<string?> CreateQrLinkAsync(string ticketCode) => Task.FromResult<string?>(null);
    }
}
