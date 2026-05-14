CREATE TABLE  IF NOT EXISTS calendar_events (
                                 id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                 household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
                                 created_by UUID NOT NULL REFERENCES auth.users(id),
                                 title VARCHAR(255) NOT NULL,
                                 description TEXT,
                                 start_time TIMESTAMPTZ NOT NULL,
                                 end_time TIMESTAMPTZ NOT NULL,
                                 created_at TIMESTAMPTZ DEFAULT NOW(),
                                 updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_household_time
    ON calendar_events(household_id, start_time);