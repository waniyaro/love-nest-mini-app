/*
  Warnings:

  - You are about to drop the column `photo` on the `DateEvent` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `WishlistItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DateEvent" DROP COLUMN "photo";

-- AlterTable
ALTER TABLE "WishlistItem" DROP COLUMN "photo";

-- CreateTable
CREATE TABLE "DateEventPhoto" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "dateEventId" TEXT NOT NULL,

    CONSTRAINT "DateEventPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItemPhoto" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "wishlistItemId" TEXT NOT NULL,

    CONSTRAINT "WishlistItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateEventPhoto_dateEventId_key" ON "DateEventPhoto"("dateEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItemPhoto_wishlistItemId_key" ON "WishlistItemPhoto"("wishlistItemId");

-- AddForeignKey
ALTER TABLE "DateEventPhoto" ADD CONSTRAINT "DateEventPhoto_dateEventId_fkey" FOREIGN KEY ("dateEventId") REFERENCES "DateEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemPhoto" ADD CONSTRAINT "WishlistItemPhoto_wishlistItemId_fkey" FOREIGN KEY ("wishlistItemId") REFERENCES "WishlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
