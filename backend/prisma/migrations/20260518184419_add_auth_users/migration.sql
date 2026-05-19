/*
  Warnings:

  - You are about to drop the column `userKey` on the `ReaderSettings` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ReaderSettings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "scrollPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastOpenedAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("createdAt", "currentPage", "favorite", "fileName", "id", "lastOpenedAt", "progress", "scrollPercent", "title", "updatedAt") SELECT "createdAt", "currentPage", "favorite", "fileName", "id", "lastOpenedAt", "progress", "scrollPercent", "title", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_ReaderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fontSize" INTEGER NOT NULL DEFAULT 18,
    "lineHeight" REAL NOT NULL DEFAULT 1.6,
    "letterSpacing" REAL NOT NULL DEFAULT 0,
    "contrast" TEXT NOT NULL DEFAULT 'default',
    "readingMode" TEXT NOT NULL DEFAULT 'page',
    "focusMode" BOOLEAN NOT NULL DEFAULT false,
    "fontFamily" TEXT NOT NULL DEFAULT 'Arial',
    "bold" BOOLEAN NOT NULL DEFAULT false,
    "italic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReaderSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReaderSettings" ("bold", "contrast", "createdAt", "focusMode", "fontFamily", "fontSize", "id", "italic", "letterSpacing", "lineHeight", "readingMode", "updatedAt") SELECT "bold", "contrast", "createdAt", "focusMode", "fontFamily", "fontSize", "id", "italic", "letterSpacing", "lineHeight", "readingMode", "updatedAt" FROM "ReaderSettings";
DROP TABLE "ReaderSettings";
ALTER TABLE "new_ReaderSettings" RENAME TO "ReaderSettings";
CREATE UNIQUE INDEX "ReaderSettings_userId_key" ON "ReaderSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
