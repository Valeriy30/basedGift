import { db } from "./db";
import { gifts, type InsertGift, type Gift, type UpdateGiftStatusRequest } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  createGift(gift: InsertGift): Promise<Gift>;
  getGift(id: string): Promise<Gift | undefined>;
  updateGiftStatus(id: string, updates: UpdateGiftStatusRequest): Promise<Gift | undefined>;
  confirmGift(id: string, escrowTxHash: string): Promise<Gift | undefined>;
  getGiftsBySender(senderAddress: string): Promise<Gift[]>;
  /** Delete a gift only if it is still in 'pending' status (blockchain tx never confirmed). */
  deletePendingGift(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createGift(insertGift: InsertGift): Promise<Gift> {
    const [gift] = await db.insert(gifts).values(insertGift).returning();
    return gift;
  }

  async getGift(id: string): Promise<Gift | undefined> {
    const [gift] = await db.select().from(gifts).where(eq(gifts.id, id));
    return gift;
  }

  async updateGiftStatus(id: string, updates: UpdateGiftStatusRequest): Promise<Gift | undefined> {
    const [updated] = await db
      .update(gifts)
      .set({
        status: updates.status,
        receiverAddress: updates.receiverAddress,
        claimTxHash: updates.claimTxHash,
      })
      .where(eq(gifts.id, id))
      .returning();
    return updated;
  }

  async confirmGift(id: string, escrowTxHash: string): Promise<Gift | undefined> {
    const [updated] = await db
      .update(gifts)
      .set({ status: 'created', escrowTxHash })
      .where(eq(gifts.id, id))
      .returning();
    return updated;
  }

  async getGiftsBySender(senderAddress: string): Promise<Gift[]> {
    return await db.select().from(gifts).where(eq(gifts.senderAddress, senderAddress));
  }

  async deletePendingGift(id: string): Promise<boolean> {
    const result = await db
      .delete(gifts)
      .where(and(eq(gifts.id, id), eq(gifts.status, 'pending')))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
