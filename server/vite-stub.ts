// Stub file for production - no Vite dependencies
import type { Express } from "express";
import type { Server } from "http";

export async function setupVite(app: Express, server: Server) {
  // No-op in production
  console.log("Vite setup skipped in production");
}

export function serveStatic(app: Express) {
  // No-op in production - Vercel handles static files
  console.log("Static file serving handled by Vercel");
}

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
