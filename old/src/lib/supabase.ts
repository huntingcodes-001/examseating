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