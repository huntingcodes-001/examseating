import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'teacher' | 'student' | 'exam_committee'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  first_name: string
  middle_name?: string
  last_name: string
  username?: string
  is_active: boolean
  one_time_password?: string
  password_changed: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  roll_number: string
  grade: string
  subject: string
  paper_set?: string
  is_approved: boolean
  is_blacklisted: boolean
  blacklist_reason?: string
  created_at: string
  updated_at: string
  user_profiles?: UserProfile
}

export interface Teacher {
  id: string
  user_id: string
  department?: string
  created_at: string
  user_profiles?: UserProfile
}

export interface ExamCommitteeUser {
  id: string
  user_id: string
  department?: string
  created_at: string
  user_profiles?: UserProfile
}

export interface Exam {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExamSubject {
  id: string
  exam_id: string
  subject_name: string
  exam_date: string
  start_time: string
  end_time: string
  created_at: string
}

export interface StudentTimetable {
  id: string
  student_id: string
  exam_subject_id: string
  is_registered: boolean
  created_at: string
  updated_at: string
  exam_subjects?: ExamSubject
}

export interface Classroom {
  id: string
  name: string
  capacity: number
  rows: number
  columns: number
  is_active: boolean
  created_at: string
}

export interface SeatingArrangement {
  id: string
  exam_subject_id: string
  name: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_by: string
  approved_by?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  exam_subjects?: ExamSubject
}

export interface SeatingAssignment {
  id: string
  seating_arrangement_id: string
  student_id: string
  classroom_id: string
  row_number: number
  column_number: number
  seat_number: string
  created_at: string
  students?: Student
  classrooms?: Classroom
}