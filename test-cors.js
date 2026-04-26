// Simple CORS test
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});