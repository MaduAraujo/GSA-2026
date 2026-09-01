import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import { app, runInactivityPushScan } from "./src/server/app";

const PORT = 3000;
const SCHEDULER_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  setInterval(() => runInactivityPushScan().catch((err) => console.error("Erro no scan de inatividade:", err)), SCHEDULER_INTERVAL_MS);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Embaixadora Google 2026 Server running on http://localhost:${PORT}`);
  });
}

startServer();