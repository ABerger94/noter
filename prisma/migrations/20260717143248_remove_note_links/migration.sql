/*
  Warnings:

  - You are about to drop the `NoteLink` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NoteLink" DROP CONSTRAINT "NoteLink_noteAId_fkey";

-- DropForeignKey
ALTER TABLE "NoteLink" DROP CONSTRAINT "NoteLink_noteBId_fkey";

-- DropTable
DROP TABLE "NoteLink";
