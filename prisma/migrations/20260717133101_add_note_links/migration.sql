-- CreateTable
CREATE TABLE "NoteLink" (
    "id" TEXT NOT NULL,
    "noteAId" TEXT NOT NULL,
    "noteBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteLink_noteBId_idx" ON "NoteLink"("noteBId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteLink_noteAId_noteBId_key" ON "NoteLink"("noteAId", "noteBId");

-- AddForeignKey
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_noteAId_fkey" FOREIGN KEY ("noteAId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLink" ADD CONSTRAINT "NoteLink_noteBId_fkey" FOREIGN KEY ("noteBId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
