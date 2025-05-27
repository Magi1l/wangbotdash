import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { connectMongoDB } from "./mongodb";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Serve static files first in production
    const publicPath = path.join(process.cwd(), 'dist', 'public');
    
    // Debug: Check file structure at runtime
    console.log('=== Runtime Debug Info ===');
    console.log('Current working directory:', process.cwd());
    console.log('Public path:', publicPath);
    
    try {
      const fs = await import('fs');
      console.log('Files in /app/dist:', fs.readdirSync('/app/dist'));
      if (fs.existsSync('/app/dist/public')) {
        console.log('Files in /app/dist/public:', fs.readdirSync('/app/dist/public'));
      } else {
        console.log('No /app/dist/public directory found');
      }
      console.log('index.html exists at expected path:', fs.existsSync(path.join(publicPath, "index.html")));
    } catch (err) {
      console.log('Debug error:', err.message);
    }
    
    app.use(express.static(publicPath));

    // Setup authentication
    setupAuth(app);

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Fall through to index.html for SPA routing
    app.use("*", (_req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });

    // Use Railway's provided PORT or fallback to 5000 for local development
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();