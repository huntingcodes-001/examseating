import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Button } from './ui/Button'
import { LoginForm } from './auth/LoginForm'
import { AdminSignup } from './auth/AdminSignup'
import { UserRole } from '../lib/supabase'
import { GraduationCap, Shield, Users, BookOpen, UserPlus } from 'lucide-react'

const roles = [
  {
    id: 'admin' as UserRole,
    title: 'Admin Portal',
    description: 'System administration and user management',
    icon: Shield,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'teacher' as UserRole,
    title: 'Teacher Portal',
    description: 'Student management and approvals',
    icon: Users,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'student' as UserRole,
    title: 'Student Portal',
    description: 'View exam status and seating information',
    icon: GraduationCap,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'exam_committee' as UserRole,
    title: 'Exam Committee Portal',
    description: 'Exam coordination and seating arrangements',
    icon: BookOpen,
    color: 'from-orange-500 to-orange-600'
  }
]

export function LoginPortal() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [showSignup, setShowSignup] = useState(false)

  if (showSignup) {
    return <AdminSignup />
  }

  if (selectedRole) {
    const role = roles.find(r => r.id === selectedRole)
    return <LoginForm role={selectedRole} title={role?.title || 'Login'} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Seating Arrangement System
          </h1>
          <p className="text-gray-600 text-lg">
            Select your portal to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${role.color} flex items-center justify-center mb-4`}>
                  <role.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600">
                  {role.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Card className="inline-block">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                First Time Setup?
              </h3>
              <p className="text-gray-600 mb-4">
                Create the first admin account to get started
              </p>
              <Button
                onClick={() => setShowSignup(true)}
                variant="outline"
              >
                Create Admin Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}