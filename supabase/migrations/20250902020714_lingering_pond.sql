/*
  # Enhanced Exam Management Schema

  1. New Tables
    - `exams` - Store exam periods and details
    - `exam_subjects` - Track subjects included in each exam
    - `student_timetables` - Store student exam schedules
    - `classrooms` - Define available classrooms and capacity
    - `seating_arrangements` - Store generated seating arrangements
    - `seating_assignments` - Individual seat assignments for students

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each user role
    - Ensure data isolation and proper access control

  3. Features
    - Exam period management
    - Subject selection and scheduling
    - Classroom capacity management
    - Seating arrangement generation and approval workflow
    - Student timetable input
*/

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam subjects table
CREATE TABLE IF NOT EXISTS exam_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student timetables table
CREATE TABLE IF NOT EXISTS student_timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  exam_subject_id uuid REFERENCES exam_subjects(id) ON DELETE CASCADE,
  is_registered boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer NOT NULL,
  rows integer NOT NULL,
  columns integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create seating arrangements table
CREATE TABLE IF NOT EXISTS seating_arrangements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_subject_id uuid REFERENCES exam_subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seating assignments table
CREATE TABLE IF NOT EXISTS seating_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seating_arrangement_id uuid REFERENCES seating_arrangements(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  column_number integer NOT NULL,
  seat_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
CREATE POLICY "Admins and exam committee can manage exams"
  ON exams
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'exam_committee')
  ));

CREATE POLICY "Teachers and students can read active exams"
  ON exams
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'exam_committee', 'teacher')
  ));

-- RLS Policies for exam_subjects
CREATE POLICY "Admins and exam committee can manage exam subjects"
  ON exam_subjects
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'exam_committee')
  ));

CREATE POLICY "All authenticated users can read exam subjects"
  ON exam_subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for student_timetables
CREATE POLICY "Students can manage own timetables"
  ON student_timetables
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = student_timetables.student_id
    AND students.user_id = auth.uid()
  ));

CREATE POLICY "Teachers and admins can read all timetables"
  ON student_timetables
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'teacher', 'exam_committee')
  ));

-- RLS Policies for classrooms
CREATE POLICY "Admins and exam committee can manage classrooms"
  ON classrooms
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'exam_committee')
  ));

CREATE POLICY "All authenticated users can read classrooms"
  ON classrooms
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for seating_arrangements
CREATE POLICY "Exam committee can manage seating arrangements"
  ON seating_arrangements
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'exam_committee'
  ));

CREATE POLICY "Admins can approve/reject seating arrangements"
  ON seating_arrangements
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  ));

CREATE POLICY "All authenticated users can read approved arrangements"
  ON seating_arrangements
  FOR SELECT
  TO authenticated
  USING (status = 'approved' OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'exam_committee')
  ));

-- RLS Policies for seating_assignments
CREATE POLICY "Exam committee can manage seating assignments"
  ON seating_assignments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'exam_committee'
  ));

CREATE POLICY "Students can read own seating assignments"
  ON seating_assignments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = seating_assignments.student_id
    AND students.user_id = auth.uid()
  ));

CREATE POLICY "Admins and teachers can read all seating assignments"
  ON seating_assignments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'teacher')
  ));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exams_updated_at') THEN
    CREATE TRIGGER update_exams_updated_at
      BEFORE UPDATE ON exams
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_student_timetables_updated_at') THEN
    CREATE TRIGGER update_student_timetables_updated_at
      BEFORE UPDATE ON student_timetables
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_seating_arrangements_updated_at') THEN
    CREATE TRIGGER update_seating_arrangements_updated_at
      BEFORE UPDATE ON seating_arrangements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default classrooms
INSERT INTO classrooms (name, capacity, rows, columns) VALUES
  ('Room A-101', 40, 8, 5),
  ('Room A-102', 35, 7, 5),
  ('Room A-103', 30, 6, 5),
  ('Room B-201', 45, 9, 5),
  ('Room B-202', 40, 8, 5)
ON CONFLICT DO NOTHING;