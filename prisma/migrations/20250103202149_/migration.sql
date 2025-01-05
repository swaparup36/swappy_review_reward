-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPassKeyAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "passkey" DROP NOT NULL;
