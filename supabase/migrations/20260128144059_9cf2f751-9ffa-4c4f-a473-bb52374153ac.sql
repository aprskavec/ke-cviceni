-- =============================================
-- PROGRESS TRACKING & SPACED REPETITION SYSTEM
-- =============================================

-- User progress table - tracks overall stats
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- device/session ID for now (no auth)
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  level INTEGER NOT NULL DEFAULT 1,
  total_exercises_completed INTEGER NOT NULL DEFAULT 0,
  total_correct_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Word mastery table - spaced repetition per word
CREATE TABLE public.word_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  lesson_id TEXT, -- optional reference to lesson
  ease_factor REAL NOT NULL DEFAULT 2.5, -- SM-2 algorithm factor
  interval_days INTEGER NOT NULL DEFAULT 1, -- days until next review
  repetition_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mastery_level TEXT NOT NULL DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'reviewing', 'mastered')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Practice session history
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT,
  lesson_name TEXT,
  score INTEGER NOT NULL,
  total_exercises INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  exercise_types TEXT[], -- array of exercise types used
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exercise results - detailed per-exercise tracking
CREATE TABLE public.exercise_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  time_spent_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_results ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress (public access by user_id for now)
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (true);

-- Policies for word_mastery
CREATE POLICY "Users can view their word mastery" ON public.word_mastery FOR SELECT USING (true);
CREATE POLICY "Users can insert word mastery" ON public.word_mastery FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update word mastery" ON public.word_mastery FOR UPDATE USING (true);

-- Policies for practice_sessions
CREATE POLICY "Users can view their sessions" ON public.practice_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert sessions" ON public.practice_sessions FOR INSERT WITH CHECK (true);

-- Policies for exercise_results
CREATE POLICY "Users can view their results" ON public.exercise_results FOR SELECT USING (true);
CREATE POLICY "Users can insert results" ON public.exercise_results FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_word_mastery_user_next_review ON public.word_mastery(user_id, next_review_at);
CREATE INDEX idx_word_mastery_user_mastery ON public.word_mastery(user_id, mastery_level);
CREATE INDEX idx_practice_sessions_user ON public.practice_sessions(user_id, completed_at DESC);
CREATE INDEX idx_exercise_results_session ON public.exercise_results(session_id);
CREATE INDEX idx_exercise_results_word ON public.exercise_results(user_id, word);

-- Triggers for updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_word_mastery_updated_at
  BEFORE UPDATE ON public.word_mastery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();