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
      const id = input.id || nanoid();
      
      const giftData = {
        ...input,
        id,
        // Ensure chainId is stored as integer
        chainId: input.chainId ? Number(input.chainId) : null,
        // Generate gift link
        giftLink: input.giftLink || null,
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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const gift = await storage.getGift(id);
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    res.json(gift);
  });

  app.patch(api.gifts.claim.path, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const input = api.gifts.claim.input.parse(req.body);
      
      // Validate that claimTxHash is a real tx hash (0x...) or 'pending'
      if (input.claimTxHash && 
          input.claimTxHash !== 'pending' && 
          !input.claimTxHash.startsWith('0x')) {
        return res.status(400).json({ message: 'Invalid claimTxHash format' });
      }
      
      const gift = await storage.updateGiftStatus(id, input);
      
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

  // Seed Data Endpoint
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const demoId = "demo-gift-123";
  const existing = await storage.getGift(demoId);
  
  if (!existing) {
    console.log("Seeding database with demo gift...");
    await storage.createGift({
      id: demoId,
      senderAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      tokenType: "USDC",
      amount: "10",
      message: "Happy Birthday! Have a coffee on me.",
      status: "created",
      chainId: 84532, // Base Sepolia
      visualAssets: { sticker: "cake" },
    });
  }
}
