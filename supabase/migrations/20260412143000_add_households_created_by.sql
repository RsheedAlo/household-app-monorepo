ALTER TABLE households
ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

UPDATE households AS h
SET created_by = hm.user_id
FROM household_members AS hm
WHERE hm.household_id = h.id
  AND hm.role = 'admin'
  AND h.created_by IS NULL;

CREATE INDEX idx_households_created_by ON households(created_by);
