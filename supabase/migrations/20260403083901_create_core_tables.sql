CREATE TABLE households (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            name TEXT NOT NULL,
                            created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
                          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                          display_name TEXT,
                          created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE household_members (
                                   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                   household_id UUID REFERENCES households(id) ON DELETE CASCADE,
                                   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                                   role TEXT NOT NULL DEFAULT 'member',
                                   created_at TIMESTAMPTZ DEFAULT NOW(),
                                   UNIQUE(household_id, user_id)
);