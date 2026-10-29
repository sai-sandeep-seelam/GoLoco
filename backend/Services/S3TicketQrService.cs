using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OnlineEventTicketManagement.Interfaces;
using QRCoder;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Generates the ticket QR as a PNG and uploads it to S3 as qr/{TicketCode}.png.
    /// Uses the existing AwsS3:BucketName and AwsS3:Region settings and the default AWS
    /// credential chain. Never throws: failures are logged and null is returned.
    /// </summary>
    public class S3TicketQrService : ITicketQrService
    {
        private static readonly TimeSpan UploadTimeout = TimeSpan.FromSeconds(10);

        // Ticket codes are 64 lowercase hex characters. Anything else is never turned into an S3 key.
        private static readonly Regex TicketCodePattern = new("^[0-9a-f]{64}$", RegexOptions.Compiled);

        private readonly IAmazonS3 _s3;
        private readonly ILogger<S3TicketQrService> _logger;
        private readonly string _bucket;
        private readonly string _region;

        public S3TicketQrService(IAmazonS3 s3, IConfiguration configuration, ILogger<S3TicketQrService> logger)
        {
            _s3 = s3;
            _logger = logger;
            _bucket = configuration["AwsS3:BucketName"]
                ?? throw new InvalidOperationException("AwsS3:BucketName is not configured.");
            _region = configuration["AwsS3:Region"]
                ?? throw new InvalidOperationException("AwsS3:Region is not configured.");
        }

        public async Task<string?> CreateQrLinkAsync(string ticketCode)
        {
            try
            {
                if (!TicketCodePattern.IsMatch(ticketCode))
                {
                    _logger.LogWarning("Skipping QR upload: ticket code has an unexpected format.");
                    return null;
                }

                string key = $"qr/{ticketCode}.png";

                // The QR encodes only the ticket code. 10 pixels per module keeps it easy to scan.
                using var generator = new QRCodeGenerator();
                using var data = generator.CreateQrCode(ticketCode, QRCodeGenerator.ECCLevel.M);
                using var png = new PngByteQRCode(data);
                byte[] bytes = png.GetGraphic(10);

                using var stream = new MemoryStream(bytes);
                using var cts = new CancellationTokenSource(UploadTimeout);

                var request = new PutObjectRequest
                {
                    BucketName = _bucket,
                    Key = key,
                    InputStream = stream,
                    ContentType = "image/png"
                };
                request.Headers.CacheControl = "public, max-age=31536000, immutable";

                await _s3.PutObjectAsync(request, cts.Token);

                return $"https://{_bucket}.s3.{_region}.amazonaws.com/{key}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload the ticket QR image; the email will be sent without the link.");
                return null;
            }
        }
    }
}
