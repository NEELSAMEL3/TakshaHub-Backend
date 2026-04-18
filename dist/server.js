// server.ts
import env from "./config/env";
import app from "./app";
const PORT = Number(env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map