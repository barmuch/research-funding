# Research Fund Tracker

A modern web application for tracking and managing research funding, built with Next.js, TypeScript, MongoDB, and modern authentication.

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **User Registration & Login**: Complete authentication flow with input validation
- **Protected Routes**: Middleware-protected API routes and pages
- **MongoDB Integration**: Mongoose ODM for database operations
- **Modern UI**: Responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Input Validation**: Zod-based validation for API requests

## 🔧 Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for input validation
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd research-fund-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/research-fund-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NODE_ENV=development
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   └── user/       # User-related endpoints
│   ├── auth/           # Authentication pages
│   │   ├── login/      # Login page
│   │   └── register/   # Registration page
│   └── dashboard/      # Protected dashboard
├── lib/                # Utility functions
│   ├── mongodb.ts      # Database connection
│   ├── jwt.ts          # JWT utilities
│   ├── validation.ts   # Input validation schemas
│   ├── api-response.ts # API response helpers
│   └── auth-middleware.ts # Authentication middleware
├── models/             # Mongoose models
│   └── User.ts         # User model
└── types/              # TypeScript type definitions
    └── index.ts        # Shared types
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### User
- `GET /api/user/profile` - Get user profile (protected)

## 🧪 Testing the Authentication

1. **Register a new user**:
   - Go to `/auth/register`
   - Enter email and password
   - User will be created and automatically logged in

2. **Login with existing user**:
   - Go to `/auth/login`
   - Enter credentials
   - Redirects to dashboard on success

3. **Access protected routes**:
   - Dashboard at `/dashboard` requires authentication
   - API endpoint `/api/user/profile` requires Bearer token

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Server-side validation with Zod
- **Protected Routes**: Middleware-based route protection
- **Error Handling**: Consistent error responses
- **TypeScript**: Type safety throughout the application

## 🗄️ Database Schema

### User Model
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  workspaces: ObjectId[] (references to workspace IDs)
  createdAt: Date
  updatedAt: Date
}
```

## 🚧 Roadmap

- [ ] Workspace management
- [ ] Fund tracking functionality  
- [ ] Team collaboration features
- [ ] Real-time updates
- [ ] Advanced reporting
- [ ] File uploads
- [ ] Email notifications

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For support, email your-email@example.com or create an issue in the repository.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
