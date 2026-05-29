/*
  Warnings:

  - Made the column `excerpt` on table `post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `activity` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'kegiatan',
    ADD COLUMN `ustadz` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `excerpt` TEXT NOT NULL,
    MODIFY `content` LONGTEXT NOT NULL,
    ALTER COLUMN `category` DROP DEFAULT,
    ALTER COLUMN `author` DROP DEFAULT;

-- CreateTable
CREATE TABLE `Contact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
