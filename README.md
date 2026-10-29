# P48 - Online Event Ticketing and Management System

## 📖 Project Overview
P48 is a comprehensive, full-stack Online Event Ticketing and Management System designed to streamline the process of organizing events and booking tickets. It offers a seamless experience for both event organizers and attendees, featuring advanced capabilities such as interactive BookMyShow-style seat selection, automated QR code generation for tickets, and robust role-based access control.

## ✨ Features
- **User Authentication & Authorization**: Secure login and registration using JWT (JSON Web Tokens). Role-based authorization for varying access levels.
- **Organizer Dashboard**: Dedicated portal for event organizers to create, manage, and monitor their events.
- **Attendee Dashboard**: Personalized space for users to browse events, book tickets, and view their booking history.
- **Event CRUD Operations**: Full control over event creation, reading, updating, and deletion.
- **Multiple Ticket Types**: Support for diverse ticket categories (e.g., VIP, General Admission, Early Bird) with dynamic pricing.
- **Ticket Booking & Seat Availability**: Real-time tracking of seat availability to prevent double-booking.
- **BookMyShow-Style Seat Selection**: Interactive and intuitive graphical interface for users to select their preferred seats.
- **QR Code Generation**: Unique QR codes generated for each ticket to facilitate quick and secure check-ins at the venue.
- **My Bookings**: Easy access for attendees to view and manage their past and upcoming event tickets.
- **Cloud Integration**: 
  - **Amazon RDS for SQL Server** for reliable, scalable, and secure data storage.
  - **Amazon S3** for efficient handling of media files like event banners.
  - **Amazon SES** for welcome and booking confirmation emails.

## 💻 Tech Stack

### Frontend
- **React**: Modern UI library for building responsive user interfaces.
- **Vite**: Next-generation frontend tooling for fast development.
- **Axios**: Promise-based HTTP client for seamless API communication.

### Backend
- **ASP.NET Core Web API**: High-performance backend framework.
- **Entity Framework Core**: Robust ORM for database interactions.
- **JWT (JSON Web Tokens)**: Standardized method for securing endpoints.
- **SQL Server**: Relational database management.

### AWS (Cloud Infrastructure)
- **AWS Amplify**: Hosts the React frontend.
- **Amazon ECS Express Mode (Fargate)**: Runs the backend container behind a managed load balancer (health check at `/health`).
- **Amazon ECR**: Stores the backend Docker images.
- **Amazon RDS for SQL Server**: Managed relational database (apply EF Core migrations manually with `dotnet ef database update`).
- **Amazon S3**: Object storage for event poster images.
- **AWS Secrets Manager**: Holds the database connection string and the JWT signing key.
- **Amazon SES**: Sends transactional emails (sender must be verified in SES).
- **GitHub Actions with OIDC**: `.github/workflows/deploy-aws.yml` builds the backend image, pushes it to ECR and deploys it to ECS using a short-lived IAM role, with no stored AWS keys.

## 📂 Folder Structure

```text
P48-Online-Event-Ticketing-System
│
├── frontend
│
├── backend
│
└── README.md
```

## 🚀 Installation & Setup

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Backend Setup
Navigate to the backend directory and run the ASP.NET Core API.

```bash
cd backend
dotnet restore
dotnet run
```

### 3. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the development server.

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Environment Variables

To properly run this application, set up the following environment variables.

### Frontend
Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
cp .env.example .env

### Backend
Add the following to your `appsettings.json` or configure them via environment variables:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your_azure_sql_connection_string"
  },
  "AzureBlobStorage": {
    "ConnectionString": "your_azure_blob_connection_string",
    "ContainerName": "your_container_name"
  }
}
```
Copy appsettings.example.json to appsettings.Development.json

## 📸 Screenshots

*(Placeholders for future screenshots)*

- **Home Page**: `[Add screenshot here]`
- **Organizer Dashboard**: `[Add screenshot here]`
- **Seat Selection Interface**: `[Add screenshot here]`
- **QR Code Ticket**: `[Add screenshot here]`

## 🔮 Future Enhancements
- Integration with third-party payment gateways (e.g., Stripe, PayPal).
- Real-time notifications and email confirmations for bookings.
- Advanced analytics and reporting for event organizers.
- Mobile application for attendees using React Native.

## 👥 Contributors
- **[Your Name/Team Name]** - *Initial work* - [Your GitHub Profile](https://github.com/your-username)

## 📄 License
This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
