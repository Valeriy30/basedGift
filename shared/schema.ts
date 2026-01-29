import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gifts = pgTable("gifts", {
  id: text("id").primaryKey(), // We'll use a nanoid or UUID from client/server for the link
  senderAddress: text("sender_address").notNull(),
  receiverAddress: text("receiver_address"), // Nullable, as it might be a general link initially
  tokenType: text("token_type").notNull(), // 'USDC', 'NFT', 'ETH'
  tokenAddress: text("token_address"), // Contract address
  tokenId: text("token_id"), // For NFTs
  amount: text("amount"), // String to handle high precision
  message: text("message"),
  colorStart: text("color_start").notNull().default('#4F46E5'), // HEX левого цвета
  colorEnd: text("color_end").notNull().default('#EC4899'),     // HEX правого цвета
  emoji: text("emoji").notNull().default('🎁'),  visualAssets: jsonb("visual_assets"), // Store stickers, bg settings as JSON
  status: text("status").notNull().default('created'), // 'created', 'claimed'
  escrowTxHash: text("escrow_tx_hash"), // Transaction hash of the deposit
  claimTxHash: text("claim_tx_hash"), // Transaction hash of the claim
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiftSchema = createInsertSchema(gifts).omit({ createdAt: true });

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = z.infer<typeof insertGiftSchema>;

// API Types
export type CreateGiftRequest = InsertGift;
export type UpdateGiftStatusRequest = {
  status: 'claimed';
  receiverAddress: string;
  claimTxHash: string;
};
