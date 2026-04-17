// server.ts
import 'dotenv/config';   // ✅ MUST be first

import app from './app';

const PORT: number = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});