-- A user cannot have two forms with the same title (other users can reuse it).
-- Duplicates were renamed with (copy N) suffixes before this constraint.
CREATE UNIQUE INDEX "Form_creatorId_title_key" ON "Form"("creatorId", "title");
