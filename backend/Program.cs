using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OnlineEventTicketManagement.Data;
using OnlineEventTicketManagement.Interfaces;
using OnlineEventTicketManagement.Repositories;
using OnlineEventTicketManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT
var jwtKey = builder.Configuration["JwtSettings:Key"]
    ?? throw new InvalidOperationException(
        "JwtSettings:Key is not configured. Set it as an Azure App Service Application Setting.");

var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:5174")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

// Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("AUTH FAILED: " + context.Exception.Message);
            return Task.CompletedTask;
        }
    };
});

// Dependency Injection
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
// Image storage: "S3" or "Azure" (default: Azure, the current behaviour)
var storageProvider = builder.Configuration["Storage:Provider"] ?? "Azure";
if (string.Equals(storageProvider, "S3", StringComparison.OrdinalIgnoreCase))
{
    // Uses the default AWS credential chain (aws configure locally, IAM role in AWS)
    builder.Services.AddSingleton<Amazon.S3.IAmazonS3>(_ =>
        new Amazon.S3.AmazonS3Client(Amazon.RegionEndpoint.GetBySystemName(
            builder.Configuration["AwsS3:Region"]
                ?? throw new InvalidOperationException("AwsS3:Region is not configured."))));
    builder.Services.AddScoped<IBlobStorageService, S3StorageService>();
    // Ticket QR images (qr/{code}.png) are created and linked in emails only with S3 storage
    builder.Services.AddSingleton<ITicketQrService, S3TicketQrService>();
}
else
{
    builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
    builder.Services.AddSingleton<ITicketQrService, NoOpTicketQrService>();
}
// Email: Amazon SES when Email:SenderAddress is set, otherwise a no-op that only logs
var emailSender = builder.Configuration["Email:SenderAddress"];
if (!string.IsNullOrWhiteSpace(emailSender))
{
    // Uses the default AWS credential chain (aws configure locally, IAM role in AWS)
    builder.Services.AddSingleton<Amazon.SimpleEmailV2.IAmazonSimpleEmailServiceV2>(_ =>
        new Amazon.SimpleEmailV2.AmazonSimpleEmailServiceV2Client(Amazon.RegionEndpoint.GetBySystemName(
            builder.Configuration["Email:Region"] is { Length: > 0 } emailRegion ? emailRegion : "ap-south-1")));
    builder.Services.AddSingleton<IEmailService, SesEmailService>();
}
else
{
    builder.Services.AddSingleton<IEmailService, NoOpEmailService>();
}
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Swagger
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Online Event Ticket Management API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description =
            "JWT Authorization header using the Bearer scheme. Example: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Report once at startup whether emails will actually be sent
if (string.IsNullOrWhiteSpace(emailSender))
{
    app.Logger.LogInformation("Email: DISABLED (Email:SenderAddress is not set). Emails will only be logged.");
}
else
{
    app.Logger.LogInformation(
        "Email: ENABLED via Amazon SES (sender {Sender}, region {Region}).",
        emailSender,
        string.IsNullOrWhiteSpace(builder.Configuration["Email:Region"]) ? "ap-south-1" : builder.Configuration["Email:Region"]);
}

// Enable Swagger
bool enableSwagger =
    app.Environment.IsDevelopment() ||
    string.Equals(
        builder.Configuration["EnableSwagger"],
        "true",
        StringComparison.OrdinalIgnoreCase);

if (enableSwagger)
{
    app.UseSwagger();

    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json",
            "Online Event Ticket Management API v1");

        c.RoutePrefix = "swagger";
    });
}

// HTTPS handled by Azure App Service
// app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("ReactPolicy");

app.UseAuthentication();

app.UseAuthorization();

// Liveness check for load balancers: no auth, no database access
app.MapGet("/health", () => Results.Ok());

app.MapControllers();

app.Run();