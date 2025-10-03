// Vercel serverless function entry point
import { createServer } from 'http';
import { registerRoutes } from '../server/routes.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import '../server/seed.js';

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Seed membership tiers
import { seedMembershipTiers } from '../server/seed.js';
await seedMembershipTiers();

// Register routes
const server = await registerRoutes(app);

// Export for Vercel
export default app;
