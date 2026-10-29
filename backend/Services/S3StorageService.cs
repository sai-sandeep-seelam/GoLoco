using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using OnlineEventTicketManagement.Interfaces;

namespace OnlineEventTicketManagement.Services
{
    /// <summary>
    /// Wraps Amazon S3 operations for event images.
    /// Reads AwsS3:BucketName and AwsS3:Region from configuration. Credentials come from
    /// the default AWS credential chain (aws configure locally, IAM role in AWS).
    /// </summary>
    public class S3StorageService : IBlobStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _region;

        public S3StorageService(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _bucketName = configuration["AwsS3:BucketName"]
                ?? throw new InvalidOperationException("AwsS3:BucketName is not configured.");
            _region = configuration["AwsS3:Region"]
                ?? throw new InvalidOperationException("AwsS3:Region is not configured.");
        }

        /// <summary>
        /// Uploads an image to S3 and returns its public URL.
        /// blobName is the object key (e.g. "events/{eventId}/poster.jpg").
        /// </summary>
        public async Task<string> UploadImageAsync(IFormFile file, string blobName)
        {
            await using Stream stream = file.OpenReadStream();
            await _s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = blobName,
                InputStream = stream,
                ContentType = file.ContentType
            });

            return $"https://{_bucketName}.s3.{_region}.amazonaws.com/{blobName}";
        }

        /// <summary>
        /// Deletes an object by its absolute URL.
        /// Silently no-ops if blobUrl is null or empty.
        /// </summary>
        public async Task DeleteImageAsync(string? blobUrl)
        {
            if (string.IsNullOrWhiteSpace(blobUrl)) return;

            // E.g. https://my-bucket.s3.ap-south-1.amazonaws.com/events/5/poster.jpg
            //      → "events/5/poster.jpg"  (no container segment in an S3 URL)
            Uri uri = new Uri(blobUrl);
            string key = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));

            await _s3Client.DeleteObjectAsync(_bucketName, key);
        }
    }
}
