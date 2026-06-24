import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { runMetacognitiveLoop } from "./server/metaloop";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/metacognitive/run", async (req, res) => {
    try {
      const { task, domain, memories, selfModel, confidenceThreshold } = req.body;
      
      if (!task) {
        return res.status(400).json({ error: "Missing required parameter: task" });
      }
      if (!domain) {
        return res.status(400).json({ error: "Missing required parameter: domain" });
      }
      if (!memories) {
        return res.status(400).json({ error: "Missing required parameter: memories" });
      }
      if (!selfModel) {
        return res.status(400).json({ error: "Missing required parameter: selfModel" });
      }

      console.log(`[MetaServer] Starting metacycle for domain "${domain.id}"...`);
      const steps = await runMetacognitiveLoop(task, domain, memories, selfModel, confidenceThreshold);
      
      return res.json({ success: true, steps });
    } catch (error: any) {
      console.error("[MetaServer] Error in run route:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development (handles routing fallback automatically)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[MetaServer] Vite middleware integrated in development mode.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[MetaServer] Serving static client files in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MetaServer] Metacognitive Sandbox server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[MetaServer] Fatal error during startup:", err);
});
