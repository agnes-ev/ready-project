-- CreateTable
CREATE TABLE "ReaderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userKey" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReaderSettings_userKey_key" ON "ReaderSettings"("userKey");
