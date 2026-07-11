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

// Add services to the container.
builder.Services.AddControllers();

// ─── Database ────────────────────────────────────────────────────────────────
// In production, the connection string is supplied by Azure App Service via:
//   Connection Strings → Name: DefaultConnection, Type: SQLAzure
//   (which maps to env var SQLAZURECONNSTR_DefaultConnection)
// In Development, it is read from appsettings.Development.json.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Authentication ───────────────────────────────────────────────────────
// In production, set via Azure App Service → Application Settings:
//   JwtSettings__Key | JwtSettings__Issuer | JwtSettings__Audience
// ─── JWT DEBUG (Temporary) ────────────────────────────────────────────────────
var jwtKey = builder.Configuration["JwtSettings:Key"];

Console.WriteLine("========== JWT DEBUG ==========");
Console.WriteLine($"JWT Key: '{jwtKey}'");
Console.WriteLine($"JWT Length: {(jwtKey == null ? "NULL" : jwtKey.Length.ToString())}");
Console.WriteLine($"Issuer: '{builder.Configuration["JwtSettings:Issuer"]}'");
Console.WriteLine($"Audience: '{builder.Configuration["JwtSettings:Audience"]}'");
Console.WriteLine("================================");

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new Exception("JWT key is NULL or EMPTY");
}

var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Origins are read from config so they can be overridden per-environment without
// touching code. In production, set via Azure App Service → Application Settings:
//   AllowedOrigins__0 = https://your-frontend.azurestaticapps.net
//   AllowedOrigins__1 = https://www.your-custom-domain.com   (if applicable)
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

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
                "http://127.0.0.1:5174"
            )
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

// ─── Dependency Injection ─────────────────────────────────────────────────────
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// ─── Swagger / OpenAPI ────────────────────────────────────────────────────────
// Swagger is always registered so you can enable it in production for testing
// via the Azure App Service Application Setting: EnableSwagger = true
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Online Event Ticket Management API", Version = "v1" });
    
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\""
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

// ─── Swagger Middleware ───────────────────────────────────────────────────────
// Always enabled in Development.
// In Production, enable by setting Application Setting: EnableSwagger = true
bool enableSwagger = app.Environment.IsDevelopment()
    || string.Equals(builder.Configuration["EnableSwagger"], "true", StringComparison.OrdinalIgnoreCase);

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Online Event Ticket Management API v1");
        c.RoutePrefix = "swagger";
    });
}

// Azure App Service handles TLS termination at the load balancer level,
// so HTTPS redirection inside the container would redirect to a port that
// doesn't exist. 
// if (app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }

app.UseRouting();

// CORS must be called before Authentication and Authorization
app.UseCors("ReactPolicy");

// Authentication MUST be called before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
