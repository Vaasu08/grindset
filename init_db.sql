-- Copy and paste this into the Supabase SQL Editor

-- 1. Create Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  deep_work_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Allow insert (useful for triggers)
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create Problem History table (tracks every solve/attempt)
CREATE TABLE public.problem_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  problem_slug text NOT NULL,
  status text NOT NULL CHECK (status IN ('solved', 'stuck', 'skipped')),
  hints_used integer DEFAULT 0,
  time_taken_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.problem_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own history" ON public.problem_history FOR ALL USING (auth.uid() = user_id);


-- 3. Create Spaced Repetition queue
CREATE TABLE public.spaced_repetition (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  problem_slug text NOT NULL,
  interval integer DEFAULT 1, -- days
  ease_factor real DEFAULT 2.5,
  next_review_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, problem_slug)
);

ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their spaced repetition" ON public.spaced_repetition FOR ALL USING (auth.uid() = user_id);
