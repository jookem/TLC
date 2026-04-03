-- ============================================================
-- TLC - Teaching & Learning Center
-- ESL App for Japanese Students
-- Initial Schema Migration
-- ============================================================

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  full_name     TEXT NOT NULL,
  display_name  TEXT,
  email         TEXT NOT NULL UNIQUE,
  avatar_url    TEXT,
  timezone      TEXT NOT NULL DEFAULT 'Asia/Tokyo',
  locale        TEXT NOT NULL DEFAULT 'ja' CHECK (locale IN ('ja', 'en')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEACHER_STUDENT_RELATIONSHIPS
-- ============================================================
CREATE TABLE teacher_student_relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  UNIQUE(teacher_id, student_id)
);

-- ============================================================
-- STUDENT_GOALS
-- ============================================================
CREATE TABLE student_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  target_date  DATE,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'achieved', 'paused', 'dropped')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AVAILABILITY_SLOTS
-- ============================================================
CREATE TABLE availability_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_type     TEXT NOT NULL DEFAULT 'recurring'
                  CHECK (slot_type IN ('recurring', 'one_off')),
  day_of_week   SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  specific_date DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  relationship_id UUID REFERENCES teacher_student_relationships(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  lesson_type     TEXT NOT NULL DEFAULT 'regular'
                    CHECK (lesson_type IN ('trial', 'regular', 'intensive')),
  meeting_url     TEXT,
  cancellation_reason TEXT,
  cancelled_by    UUID REFERENCES profiles(id),
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_overlap CHECK (scheduled_end > scheduled_start)
);

-- Prevent double-booking
CREATE UNIQUE INDEX lessons_no_double_book_teacher
  ON lessons (teacher_id, scheduled_start)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE UNIQUE INDEX lessons_no_double_book_student
  ON lessons (student_id, scheduled_start)
  WHERE status NOT IN ('cancelled', 'no_show');

-- ============================================================
-- BOOKING_REQUESTS
-- ============================================================
CREATE TABLE booking_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_start  TIMESTAMPTZ NOT NULL,
  requested_end    TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn')),
  student_note     TEXT,
  teacher_note     TEXT,
  lesson_id        UUID REFERENCES lessons(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LESSON_NOTES
-- ============================================================
CREATE TABLE lesson_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  author_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  vocabulary     JSONB DEFAULT '[]',
  grammar_points JSONB DEFAULT '[]',
  homework       TEXT,
  summary        TEXT,
  teacher_notes  TEXT,
  strengths      TEXT,
  areas_to_focus TEXT,
  goal_ids       UUID[],
  is_visible_to_student BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- ============================================================
-- LESSON_PLANS
-- ============================================================
CREATE TABLE lesson_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  objectives    TEXT[],
  materials     JSONB DEFAULT '[]',
  activities    JSONB DEFAULT '[]',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- ============================================================
-- VOCABULARY_BANK
-- ============================================================
CREATE TABLE vocabulary_bank (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  word          TEXT NOT NULL,
  reading       TEXT,
  definition_en TEXT,
  definition_ja TEXT,
  example       TEXT,
  lesson_id     UUID REFERENCES lessons(id),
  mastery_level SMALLINT NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 3),
  next_review   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, word)
);

-- ============================================================
-- PROGRESS_SNAPSHOTS
-- ============================================================
CREATE TABLE progress_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  snapshot_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  cefr_level       TEXT CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  speaking_score   SMALLINT CHECK (speaking_score BETWEEN 1 AND 10),
  listening_score  SMALLINT CHECK (listening_score BETWEEN 1 AND 10),
  reading_score    SMALLINT CHECK (reading_score BETWEEN 1 AND 10),
  writing_score    SMALLINT CHECK (writing_score BETWEEN 1 AND 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER student_goals_updated_at BEFORE UPDATE ON student_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER booking_requests_updated_at BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lesson_notes_updated_at BEFORE UPDATE ON lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lesson_plans_updated_at BEFORE UPDATE ON lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER vocabulary_bank_updated_at BEFORE UPDATE ON vocabulary_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROFILE AUTO-CREATE TRIGGER
-- Creates a profile row when a new auth user signs up
-- Role and full_name must be passed as user_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_goals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_bank               ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION are_related(p_teacher_id UUID, p_student_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM teacher_student_relationships
    WHERE teacher_id = p_teacher_id
      AND student_id = p_student_id
      AND status = 'active'
  )
$$;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Teachers can read their students profiles"
  ON profiles FOR SELECT
  USING (
    auth_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_student_relationships tsr
      WHERE tsr.teacher_id = auth.uid()
        AND tsr.student_id = profiles.id
        AND tsr.status = 'active'
    )
  );

CREATE POLICY "Students can read their teachers profiles"
  ON profiles FOR SELECT
  USING (
    auth_user_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM teacher_student_relationships tsr
      WHERE tsr.student_id = auth.uid()
        AND tsr.teacher_id = profiles.id
        AND tsr.status = 'active'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- TEACHER_STUDENT_RELATIONSHIPS POLICIES
-- ============================================================
CREATE POLICY "Teachers manage their relationships"
  ON teacher_student_relationships FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their relationships"
  ON teacher_student_relationships FOR SELECT
  USING (student_id = auth.uid());

-- ============================================================
-- STUDENT_GOALS POLICIES
-- ============================================================
CREATE POLICY "Teachers manage goals for their students"
  ON student_goals FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their own goals"
  ON student_goals FOR SELECT USING (student_id = auth.uid());

-- ============================================================
-- AVAILABILITY_SLOTS POLICIES
-- ============================================================
CREATE POLICY "Teachers manage their own availability"
  ON availability_slots FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their teachers availability"
  ON availability_slots FOR SELECT
  USING (is_active = TRUE AND are_related(teacher_id, auth.uid()));

-- ============================================================
-- LESSONS POLICIES
-- ============================================================
CREATE POLICY "Lesson participants can read their lessons"
  ON lessons FOR SELECT
  USING (teacher_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Teachers can create lessons"
  ON lessons FOR INSERT
  WITH CHECK (teacher_id = auth.uid() AND auth_user_role() = 'teacher');

CREATE POLICY "Teachers can update their lessons"
  ON lessons FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Students can cancel their own lessons"
  ON lessons FOR UPDATE
  USING (student_id = auth.uid() AND status = 'scheduled')
  WITH CHECK (status = 'cancelled' AND cancelled_by = auth.uid());

-- ============================================================
-- BOOKING_REQUESTS POLICIES
-- ============================================================
CREATE POLICY "Students can create booking requests"
  ON booking_requests FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND auth_user_role() = 'student'
    AND are_related(teacher_id, auth.uid())
  );

CREATE POLICY "Students can read their own requests"
  ON booking_requests FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can withdraw pending requests"
  ON booking_requests FOR UPDATE
  USING (student_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'withdrawn');

CREATE POLICY "Teachers can read requests directed to them"
  ON booking_requests FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can approve or decline requests"
  ON booking_requests FOR UPDATE
  USING (teacher_id = auth.uid() AND status = 'pending')
  WITH CHECK (status IN ('approved', 'declined'));

-- ============================================================
-- LESSON_NOTES POLICIES
-- ============================================================
CREATE POLICY "Teachers can manage notes for their lessons"
  ON lesson_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_notes.lesson_id AND l.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read visible notes for their lessons"
  ON lesson_notes FOR SELECT
  USING (
    is_visible_to_student = TRUE
    AND EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_notes.lesson_id AND l.student_id = auth.uid()
    )
  );

-- ============================================================
-- LESSON_PLANS POLICIES
-- ============================================================
CREATE POLICY "Teachers manage their lesson plans"
  ON lesson_plans FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view plans for their lessons"
  ON lesson_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_plans.lesson_id AND l.student_id = auth.uid()
    )
  );

-- ============================================================
-- VOCABULARY_BANK POLICIES
-- ============================================================
CREATE POLICY "Teachers manage vocab for their students"
  ON vocabulary_bank FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students read their own vocabulary"
  ON vocabulary_bank FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students update mastery on own vocab"
  ON vocabulary_bank FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ============================================================
-- PROGRESS_SNAPSHOTS POLICIES
-- ============================================================
CREATE POLICY "Teachers manage progress snapshots"
  ON progress_snapshots FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their own snapshots"
  ON progress_snapshots FOR SELECT USING (student_id = auth.uid());
