-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "keyVersion" TEXT,
ADD COLUMN     "usedKeyId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeKeyId" TEXT;

-- CreateTable
CREATE TABLE "KeyVault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KeyVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeyVault_userId_key" ON "KeyVault"("userId");

-- AddForeignKey
ALTER TABLE "KeyVault" ADD CONSTRAINT "KeyVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Key" ADD CONSTRAINT "Key_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "KeyVault"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
