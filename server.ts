import { timingSafeEqual } from "node:crypto";
import { Composio } from "@composio/core";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { z } from "zod";

const env = z.object({
  COMPOSIO_API_KEY: z.string().min(1),
  CE_API_TOKEN: z.string().min(24),
  PORT: z.coerce.number().int().positive().default(10000),
}).parse(process.env);

const app = express();
const composio = new Composio({ apiKey: env.COMPOSIO_API_KEY });

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({ service: "ce-composio-api", status: "ok", version: "1.0.0" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", uptime: Math.round(process.uptime()) });
});

function requireApiToken(req: Request, res: Response, next: NextFunction) {
  const supplied = req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = env.CE_API_TOKEN;
  const valid = supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: "unauthorized" });
  next();
}

const sessionInput = z.object({
  userId: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_.:@-]+$/),
  toolkits: z.array(z.string().min(1).max(80)).max(50).optional(),
});

app.post("/v1/sessions", requireApiToken, async (req, res, next) => {
  try {
    const input = sessionInput.parse(req.body);
    const session = await composio.sessions.create(input.userId, {
      mcp: true,
      ...(input.toolkits ? { toolkits: input.toolkits } : {}),
    });
    res.status(201).json({ sessionId: session.sessionId, mcp: session.mcp });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "invalid_request", issues: error.issues });
  }
  console.error(error);
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`ce-composio-api listening on 0.0.0.0:${env.PORT}`);
});
  
