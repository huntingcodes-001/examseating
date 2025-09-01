/*
  # Exam Seating Arrangement System Schema

  1. New Tables
    - `user_profiles` - Extended user information with roles
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `role` (text, enum: admin, teacher, student, exam_committee)
      - `first_name` (text)
      - `middle_name` (text, nullable)
      - `last_name` (text)
      - `username` (text, unique, nullable)
      - `is_active` (boolean)
      - `one_time_password` (text, nullable)
      - `password_changed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `teachers` - Teacher specific information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `department` (text, nullable)
      - `created_at` (timestamp)

    - `students` - Student specific information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `roll_number` (text, unique)
      - `grade` (text)
      - `subject` (text)
      - `paper_set` (text, nullable)
      - `is_approved` (boolean)
      - `is_blacklisted` (boolean)
      - `blacklist_reason` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `exam_committee_users` - Exam committee specific information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `department` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Admin can manage all users
    - Teachers can manage their students
    - Users can read their own profile data
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'exam_committee');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  username text UNIQUE,
  is_active boolean DEFAULT true,
  one_time_password text,
  password_changed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  department text,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  roll_number text UNIQUE NOT NULL,
  grade text NOT NULL,
  subject text NOT NULL,
  paper_set text,
  is_approved boolean DEFAULT false,
  is_blacklisted boolean DEFAULT false,
  blacklist_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam_committee_users table
CREATE TABLE IF NOT EXISTS exam_committee_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  department text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_committee_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert all profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can delete all profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for teachers
CREATE POLICY "Teachers can read own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage teachers"
  ON teachers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for students
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'exam_committee')
    )
  );

CREATE POLICY "Teachers and admins can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for exam_committee_users
CREATE POLICY "Exam committee can read own data"
  ON exam_committee_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage exam committee"
  ON exam_committee_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();