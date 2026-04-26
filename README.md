# Application environment
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL="postgresql://neondb_owner:npg_N5HYtc7OjeDx@ep-withered-rice-ao4nviu4.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Authentication / Security
OTP_SECRET=ekwn2382urjewew
JWT_ACCESS_SECRET=dsd32ewj9120jfksdmfksfsdf
JWT_REFRESH_SECRET=fsdkfj28ru23f89ijkdjf2jj
BCRYPT_ROUNDS=10
REFRESH_DAYS=7
MAX_SESSIONS=5

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://happy-werewolf-100279.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAAAYe3AAIocDFkZmQ4MTNlYTkyNzY0YjE2YTg5ODFmYjA5ZWY0YTg3ZnAxMTAwMjc5"

# Email / SMTP
EMAIL_FROM=neelsamel3@gmail.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=neelsamel3@gmail.com
MAIL_PASSWORD=cukwkvksoppswgyk

# Logging
LOG_LEVEL=info
