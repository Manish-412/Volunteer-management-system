# Volunteer Information Management System (VIMS)

A production-ready full-stack volunteer management platform built with modern web technologies.

## 🚀 Features

### Authentication & Security
- ✅ Email & Password authentication with bcrypt hashing (12 salt rounds)
- ✅ Passwordless login with OTP (One-Time Password)
- ✅ Email verification with OTP
- ✅ Forgot password functionality
- ✅ Change password with OTP verification
- ✅ JWT-based authentication
- ✅ Secure HTTP-only cookies
- ✅ Role-based access control (RBAC)

### Volunteer Management
- ✅ Create, read, update, delete volunteer profiles
- ✅ Volunteer skills and interests tracking
- ✅ Availability management
- ✅ Emergency contact information
- ✅ Profile image upload support
- ✅ Search and filtering capabilities
- ✅ Pagination support

### Event Management
- ✅ Create and manage events
- ✅ Volunteer assignment to events
- ✅ Event participation tracking
- ✅ Event status management
- ✅ Upcoming events listing

### Admin Dashboard
- ✅ User statistics and metrics
- ✅ Volunteer analytics
- ✅ Event management interface
- ✅ User management
- ✅ Role assignment
- ✅ Data export capabilities

### Technical Features
- ✅ TypeScript throughout the project
- ✅ Next.js 15 with App Router
- ✅ Tailwind CSS with shadcn/ui components
- ✅ Prisma ORM with PostgreSQL
- ✅ Zod for input validation
- ✅ TanStack Query for state management
- ✅ Nodemailer for email notifications
- ✅ REST API with proper error handling
- ✅ Environment variable configuration
- ✅ Database migrations and seeding

## 📋 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Supabase PostgreSQL |
| **ORM** | Prisma |
| **Validation** | Zod |
| **State Management** | TanStack Query (React Query) |
| **Authentication** | JWT, bcryptjs |
| **Email** | Nodemailer |
| **Deployment** | Vercel (ready) |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL database (Supabase or local)
- npm or yarn package manager

### 1. Clone Repository
```bash
cd vims
npm install
# or
yarn install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vims"
DIRECT_URL="postgresql://user:password@localhost:5432/vims"

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@vims.com"

# JWT Secret (min 32 characters)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# OTP Configuration
OTP_EXPIRY_MINUTES="5"
OTP_MAX_ATTEMPTS="3"
OTP_RESEND_WAIT_SECONDS="60"
```

### 3. Database Setup

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

Seed database with sample data:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

#### Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "purpose": "LOGIN"  // LOGIN, EMAIL_VERIFICATION, PASSWORD_RESET, CHANGE_PASSWORD
}
```

#### Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "purpose": "LOGIN"
}
```

#### Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### Change Password
```bash
POST /api/auth/change-password
Content-Type: application/json

{
  "step": "request-otp",
  "currentPassword": "CurrentPass123!"
}

// After receiving OTP
{
  "step": "verify-and-change",
  "otp": "123456",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### Logout
```bash
POST /api/auth/logout
```

### Volunteer Endpoints

#### Get All Volunteers
```bash
GET /api/volunteers?page=1&limit=10&search=john&status=ACTIVE&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

#### Get Volunteer by ID
```bash
GET /api/volunteers/:id
Authorization: Bearer <token>
```

#### Create Volunteer Profile
```bash
POST /api/volunteers
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "gender": "Male",
  "dateOfBirth": "1995-03-15",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "skills": ["Teaching", "Mentoring"],
  "interests": ["Education", "Tech"],
  "availability": ["Weekends"],
  "bloodGroup": "O+",
  "occupation": "Software Engineer"
}
```

#### Update Volunteer
```bash
PUT /api/volunteers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890"
  // ... other fields to update
}
```

#### Delete Volunteer
```bash
DELETE /api/volunteers/:id
Authorization: Bearer <token>
```

### Event Endpoints

#### Get All Events
```bash
GET /api/events?page=1&limit=10&search=cleanup&status=UPCOMING&category=Environment
Authorization: Bearer <token>
```

#### Get Event by ID
```bash
GET /api/events/:id
Authorization: Bearer <token>
```

#### Create Event (Admin Only)
```bash
POST /api/events
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Community Cleanup",
  "description": "Help clean up the local park",
  "date": "2024-06-20T10:00:00Z",
  "location": "Central Park",
  "category": "Environment",
  "requiredVolunteers": 20
}
```

#### Update Event (Admin Only)
```bash
PUT /api/events/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Community Cleanup - Updated",
  "requiredVolunteers": 25
  // ... other fields to update
}
```

#### Delete Event (Admin Only)
```bash
DELETE /api/events/:id
Authorization: Bearer <admin-token>
```

### Admin Endpoints

#### Get Dashboard
```bash
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Get All Users
```bash
GET /api/admin/users?page=1&limit=10&search=john&role=VOLUNTEER
Authorization: Bearer <admin-token>
```

#### Update User Status
```bash
PATCH /api/admin/users/:id?action=status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "ACTIVE"  // ACTIVE, INACTIVE, ON_LEAVE, DEACTIVATED
}
```

#### Update User Role
```bash
PATCH /api/admin/users/:id?action=role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "ADMIN"  // ADMIN, VOLUNTEER
}
```

## 🔐 Security Features

### Password Security
- Passwords hashed with bcryptjs (12 salt rounds)
- Password strength validation required
- Secure password comparison
- Password change tracking

### OTP Security
- 6-digit random OTP generation
- OTP hashed before storage
- 5-minute expiration
- Single-use OTP
- Rate limiting (max 5 attempts)
- 15-minute lockout after max attempts

### API Security
- Input validation with Zod
- SQL injection prevention (via Prisma)
- XSS prevention with input sanitization
- CSRF protection ready
- Secure HTTP-only cookies
- JWT token validation
- Role-based authorization
- Rate limiting middleware ready
- CORS configuration ready

### Data Protection
- Audit fields (createdAt, updatedAt)
- Email verification tracking
- Last login tracking
- Password change tracking
- User status management

## 🗃️ Database Schema

### Users Table
- id (Primary Key)
- fullName, email (Unique)
- passwordHash, role
- emailVerified, emailVerifiedAt
- lastLoginAt, passwordChangedAt
- createdAt, updatedAt

### OTP Table
- id (Primary Key)
- email, otpHash, purpose
- expiresAt, used
- userId (Foreign Key)
- createdAt

### Volunteers Table
- id, userId (Unique Foreign Key)
- Personal info (fullName, phoneNumber, gender, etc.)
- Professional info (skills, interests, occupation)
- Emergency contact, blood group
- status (ACTIVE, INACTIVE, ON_LEAVE, DEACTIVATED)
- joiningDate, createdAt, updatedAt

### Events Table
- id, title, description
- date, location, category
- requiredVolunteers, status
- createdAt, updatedAt

### EventParticipants Table (Many-to-Many)
- id, volunteerId (Foreign Key)
- eventId (Foreign Key)
- joinedAt, status
- Unique constraint on (volunteerId, eventId)

## 📁 Folder Structure

```
vims/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Auth pages (login, register, etc.)
│   │   ├── (dashboard)/            # Dashboard pages (protected)
│   │   │   ├── dashboard/          # Admin/Volunteer dashboard
│   │   │   ├── volunteers/         # Volunteer management
│   │   │   ├── events/             # Event management
│   │   │   └── admin/              # Admin panel
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── volunteers/         # Volunteer endpoints
│   │   │   ├── events/             # Event endpoints
│   │   │   └── admin/              # Admin endpoints
│   │   └── layout.tsx              # Root layout
│   ├── components/                 # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   │   ├── prisma.ts               # Prisma client
│   │   ├── jwt.ts                  # JWT utilities
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── email.ts                # Email utilities
│   │   └── api.ts                  # API response utilities
│   ├── middleware.ts               # Next.js middleware
│   ├── schemas/                    # Zod validation schemas
│   ├── services/                   # Business logic services
│   ├── types/                      # TypeScript type definitions
│   ├── utils/                      # Helper functions
│   └── constants/                  # App constants
├── prisma/
│   ├── schema.prisma               # Prisma schema
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Database seeding script
├── public/                         # Static assets
├── .env.example                    # Environment template
├── .env.local                      # Local environment (git-ignored)
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies and scripts
```

## 📊 Database Seeding

The database comes with sample data:

### Test Users
- **Admin Account**
  - Email: `admin@vims.com`
  - Password: `Admin@123`

- **Volunteer Accounts**
  - Email: `john@example.com`
  - Email: `jane@example.com`
  - Email: `michael@example.com`
  - Password: `Volunteer@123`

### Sample Data Includes
- 3 volunteer profiles with complete information
- 3 upcoming events
- Event participation records


## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run seed             # Seed database with sample data
```

## 🔧 Configuration

### Email Setup (Gmail Example)
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password in `SMTP_PASS`

### JWT Secret
- Minimum 32 characters
- Use strong random string
- Keep it secret and secure

### OTP Configuration
- Default expiry: 5 minutes
- Max attempts: 5
- Resend wait: 60 seconds

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request


## 📞 Support

For support, issues, or questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Volunteer certification tracking
- [ ] Event feedback and ratings
- [ ] Mobile application
- [ ] Real-time notifications
- [ ] Calendar integration
- [ ] Automated reminders
- [ ] Multi-language support
- [ ] Dark mode UI
- [ ] Advanced filtering and search

## ✨ Acknowledgments

Built with best practices in security, scalability, and maintainability.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Built with ❤️ for volunteer management**
