using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OnlineEventTicketManagement.DTOs;
using OnlineEventTicketManagement.Interfaces;
using OnlineEventTicketManagement.Models;

namespace OnlineEventTicketManagement.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, IEmailService emailService)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _emailService = emailService;
        }

        /// <summary>
        /// Registers a new user in the system, hashes their password with BCrypt, and returns a JWT response.
        /// </summary>
        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
        {
            // 1. Verify if user already exists
            var existingUser = await _userRepository.GetByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                return null; // Email already in use
            }

            // 2. Hash the password securely using BCrypt (auto-generates salt under the hood)
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            // 3. Create user entity
            var user = new User
            {
                Name = registerDto.Name,
                Email = registerDto.Email.ToLower(),
                PasswordHash = passwordHash,
                Role = registerDto.Role,
                CreatedAt = DateTime.UtcNow
            };

            // 4. Save to database
            await _userRepository.AddAsync(user);
            bool success = await _userRepository.SaveChangesAsync();
            if (!success)
            {
                return null;
            }

            // Welcome email: not awaited and never throws, so it cannot delay or fail registration
            _ = _emailService.SendWelcomeEmailAsync(user.Name, user.Email);

            // 5. Generate and return JWT auth token
            string token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <summary>
        /// Validates login credentials and issues a JWT token.
        /// </summary>
        public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
        {
            // 1. Find user by email
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return null; // User not found
            }

            // 2. Verify password match
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return null; // Invalid credentials
            }

            // 3. Generate token and return profile info
            string token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        /// <summary>
        /// Private helper to generate a JWT token containing key user claims.
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role) // Injects the role for ASP.NET [Authorize(Roles = "...")] attributes
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:DurationInMinutes"] ?? "120")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
