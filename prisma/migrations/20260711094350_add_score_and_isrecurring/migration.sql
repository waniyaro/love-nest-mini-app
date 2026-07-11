-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;
