-- Create feature flags table for remote feature control
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_pressure_cards BOOLEAN DEFAULT false,
    motivation_buttons BOOLEAN DEFAULT false, 
    streak_tracking BOOLEAN DEFAULT true,
    challenge_leaderboards BOOLEAN DEFAULT true,
    audio_messages BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default flags (all features OFF for MVP except existing ones)
INSERT INTO public.feature_flags (
    social_pressure_cards,
    motivation_buttons,
    streak_tracking,
    challenge_leaderboards,
    audio_messages
) VALUES (
    false,  -- Social pressure cards OFF for MVP
    false,  -- Motivation buttons OFF for MVP
    true,   -- Streak tracking ON (existing feature)
    true,   -- Challenge leaderboards ON (existing feature)
    true    -- Audio messages ON (existing feature)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read feature flags
CREATE POLICY "Feature flags are publicly readable" 
    ON public.feature_flags 
    FOR SELECT 
    TO authenticated
    USING (true);

-- Only allow admins to update feature flags (you can modify this)
CREATE POLICY "Only admins can update feature flags" 
    ON public.feature_flags 
    FOR UPDATE 
    TO authenticated
    USING (auth.email() = 'your-admin-email@example.com'); -- Change this!

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();