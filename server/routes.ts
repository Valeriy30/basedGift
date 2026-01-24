import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.gifts.create.path, async (req, res) => {
    try {
      const input = api.gifts.create.input.parse(req.body);
      // Ensure we have an ID. If the client sent one (e.g. predictable ID), use it, otherwise generate.
      // The schema has `id` as text primary key.
      const giftData = {
        ...input,
        id: input.id || nanoid(),
      };
      
      const gift = await storage.createGift(giftData);
      res.status(201).json(gift);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.gifts.get.path, async (req, res) => {
    const gift = await storage.getGift(req.params.id);
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    res.json(gift);
  });

  app.patch(api.gifts.claim.path, async (req, res) => {
    try {
      const input = api.gifts.claim.input.parse(req.body);
      const gift = await storage.updateGiftStatus(req.params.id, input);
      
      if (!gift) {
        return res.status(404).json({ message: 'Gift not found' });
      }
      res.json(gift);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed Data Endpoint (Optional, or auto-seed)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Check if we have any gifts
  // Since we don't have a getAll, we can't easily check count without adding method.
  // We'll just try to fetch a specific known ID or just skip for now to avoid duplicates if persistent.
  // Actually, let's just create one demo gift if it doesn't exist.
  const demoId = "demo-gift-123";
  const existing = await storage.getGift(demoId);
  
  if (!existing) {
    console.log("Seeding database with demo gift...");
    await storage.createGift({
      id: demoId,
      senderAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      tokenType: "USDC",
      amount: "10",
      theme: "birthday",
      message: "Happy Birthday! Have a coffee on me.",
      status: "created",
      visualAssets: { sticker: "cake" },
    });
  }
}
