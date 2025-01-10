/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tasks_title_key" ON "Tasks"("title");
