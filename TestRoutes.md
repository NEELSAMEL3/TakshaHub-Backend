Base URL:

http://localhost:3000/api/auth
1️⃣ Register Admin
Endpoint: POST /register
Full URL:
http://localhost:3000/api/auth/register

Request Body (JSON):
{
  "schoolName": "Greenwood High",
  "schoolType": "PRIVATE",
  "board": "CBSE",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "email": "admin1@example.com",
  "websiteLink": "https://greenwoodhigh.edu",
  "fullName": "John Doe",
  "password": "SecurePass123",
  "phoneNumber": "9876543210",
  "verificationDocLink": "https://docs.example.com/doc123"
}

Sample Response:
{
  "message": "Admin registered successfully",
  "adminId": 1
}


2️⃣ Login Admin
Endpoint: POST /login
Full URL:
http://localhost:3000/api/auth/login
Request Body (JSON):
{
  "email": "admin1@example.com",
  "password": "SecurePass123"
}

Sample Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

⚠️ Save the token to use in protected routes.

3️⃣ Get Admin Profile (Protected)
Endpoint: GET /profile
Full URL:
http://localhost:3000/api/auth/profile

Headers:
Authorization: Bearer <token>

Sample Response:
{
  "id": 1,
  "schoolName": "Greenwood High",
  "schoolType": "PRIVATE",
  "board": "CBSE",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "email": "admin1@example.com",
  "websiteLink": "https://greenwoodhigh.edu",
  "fullName": "John Doe",
  "password": "$2a$10$hashhere...",
  "phoneNumber": "9876543210",
  "verificationDocLink": "https://docs.example.com/doc123",
  "createdAt": "2026-04-07T06:30:00.000Z",
  "members": []
}