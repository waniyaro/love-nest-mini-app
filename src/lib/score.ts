import { prisma } from "./prisma";

/**
 * Increments or decrements the couple's relationship score.
 * Ensures that the score never drops below zero.
 * 
 * @param coupleId Unique ID of the couple
 * @param points Points to add (positive) or subtract (negative)
 */
export async function incrementCoupleScore(coupleId: string, points: number) {
  try {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { score: true }
    });

    if (couple) {
      const currentScore = couple.score ?? 0;
      const newScore = Math.max(0, currentScore + points);

      await prisma.couple.update({
        where: { id: coupleId },
        data: { score: newScore }
      });
    }
  } catch (error) {
    console.error(`Failed to update score for couple ${coupleId} by ${points}:`, error);
  }
}
