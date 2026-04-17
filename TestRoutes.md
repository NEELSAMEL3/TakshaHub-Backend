Base URL:

http://localhost:3000/api/auth
1️⃣ Register Admin
Endpoint: POST /register
Full URL:
http://localhost:3000/api/auth/register

Request Body (JSON):
{
  "fullName": "Ananya Mehta",
  "email": "neelsamel69@gmail.com",
  "password": "SecurePass789!",
  "phoneNumber": "9123456789",
  "school": {
    "name": "Lotus Valley School",
    "type": "PRIVATE",
    "board": "CBSE",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "website": "https://lotusvalleyschool.com",
    "udiseNumber": "24010200456"
  }
}

2..http://localhost:3000/api/auth/verify-otp
{
  "email": "neelsamel69@gmail.com",
  "otp": "387121"
}


2️⃣ Login Admin
Endpoint: POST /login
Full URL:
http://localhost:3000/api/auth/login
Request Body (JSON):
{
  "email": "neelsamel69@gmail.com",
  "password": "SecurePass789!",
  "schoolId": ""
}

pass this in header
x-device-id: device-12345-unique
Content-Type: application/json



