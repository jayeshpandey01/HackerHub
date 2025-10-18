# Swap Health API Backend

FastAPI backend for the Swap Health application with authentication for doctors and patients.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user (doctor or patient)
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info

### User Profile
- `GET /users/profile` - Get detailed user profile

## Database

The application uses SQLite database with the following tables:
- `users` - Basic user information
- `doctor_profiles` - Doctor-specific information (license, specialization)
- `patient_profiles` - Patient-specific information (DOB, phone)

## Authentication

Uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Types

### Doctor Registration
Required fields:
- email, password, first_name, last_name
- license_number, specialization

### Patient Registration
Required fields:
- email, password, first_name, last_name
- date_of_birth (optional), phone_number (optional)

## Demo Credentials

For testing purposes, you can use these credentials:
- **Doctor**: doctor@demo.com / demo123
- **Patient**: patient@demo.com / demo123

## Security Notes

- Change the SECRET_KEY in production
- Use HTTPS in production
- Configure CORS properly for your domain
- Consider implementing token blacklisting for logout
- Add rate limiting for authentication endpoints