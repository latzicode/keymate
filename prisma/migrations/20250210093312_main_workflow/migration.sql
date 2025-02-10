-- AlterTable
ALTER TABLE "Key" ADD COLUMN     "originalKeyId" TEXT,
ADD COLUMN     "sharedWithUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_usedKeyId_fkey" FOREIGN KEY ("usedKeyId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Key" ADD CONSTRAINT "Key_originalKeyId_fkey" FOREIGN KEY ("originalKeyId") REFERENCES "Key"("id") ON DELETE SET NULL ON UPDATE CASCADE;
