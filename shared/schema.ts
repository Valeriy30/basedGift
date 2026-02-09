import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gifts = pgTable("gifts", {
  id: text("id").primaryKey(), // nanoid — URL-friendly ID for the share link
  giftId: text("gift_id"), // bytes32 hex used in the smart contract
  chainId: integer("chain_id"), // Network chain ID (8453 = Base, 84532 = Base Sepolia)
  giftLink: text("gift_link"), // Full share link (e.g. https://basedgift.com/claim/abc123)
  senderAddress: text("sender_address").notNull(),
  receiverAddress: text("receiver_address"),
  tokenType: text("token_type").notNull(), // 'USDC', 'NFT', 'ETH'
  tokenAddress: text("token_address"), // ERC20/ERC721 contract address
  tokenId: text("token_id"), // NFT token ID
  amount: text("amount"), // String to handle high precision
  message: text("message"),
  colorStart: text("color_start").notNull().default('#4F46E5'),
  colorEnd: text("color_end").notNull().default('#EC4899'),
  emoji: text("emoji").notNull().default('🎁'),
  visualAssets: jsonb("visual_assets"),
  status: text("status").notNull().default('created'), // 'created', 'claimed', 'expired'
  escrowTxHash: text("escrow_tx_hash"), // Transaction hash of the deposit
  claimTxHash: text("claim_tx_hash"), // Transaction hash of the claim (real tx hash only)
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
