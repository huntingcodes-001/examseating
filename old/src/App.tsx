import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPortal } from './components/LoginPortal'
import { AdminDashboard } from './components/AdminDashboard'
import { TeacherDashboard } from './components/TeacherDashboard'

function AppContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <LoginPortal />
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />
    case 'teacher':
      return <TeacherDashboard />
    case 'student':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Portal</h1>
            <p className="text-gray-600">Student features coming soon...</p>
          </div>
        </div>
      )
    case 'exam_committee':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Committee Portal</h1>
            <p className="text-gray-600">Exam committee features coming soon...</p>
          </div>
        </div>
      )
    default:
      return <LoginPortal />
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App