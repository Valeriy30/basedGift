import { db } from "./db";
import { gifts, type InsertGift, type Gift, type UpdateGiftStatusRequest } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGift(gift: InsertGift): Promise<Gift>;
  getGift(id: string): Promise<Gift | undefined>;
  updateGiftStatus(id: string, updates: UpdateGiftStatusRequest): Promise<Gift | undefined>;
  // For demo/dashboard purposes
  getGiftsBySender(senderAddress: string): Promise<Gift[]>;
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

  async getGiftsBySender(senderAddress: string): Promise<Gift[]> {
    return await db.select().from(gifts).where(eq(gifts.senderAddress, senderAddress));
  }
}

export const storage = new DatabaseStorage();
