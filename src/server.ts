// server.ts
import env from "./config/env.js";
import app from "./app.js";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(env.PORT ?? 3000);

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});