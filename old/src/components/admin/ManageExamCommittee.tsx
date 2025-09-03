import React, { useState, useEffect } from 'react'
import { supabase, ExamCommitteeUser } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { generatePassword, formatDate } from '../../lib/utils'
import { UserPlus, Trash2 } from 'lucide-react'

export function ManageExamCommittee() {
  const [examCommitteeUsers, setExamCommitteeUsers] = useState<ExamCommitteeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    department: ''
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExamCommitteeUsers()
  }, [])

  const fetchExamCommitteeUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_committee_users')
        .select(`
          *,
          user_profiles (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExamCommitteeUsers(data || [])
    } catch (error) {
      console.error('Error fetching exam committee users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      const password = generatePassword()
      setGeneratedPassword(password)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            role: 'exam_committee',
            first_name: formData.firstName,
            middle_name: formData.middleName || null,
            last_name: formData.lastName,
            one_time_password: password,
            password_changed: false
          })

        if (profileError) throw profileError

        // Create exam committee user record
        const { error: examCommitteeError } = await supabase
          .from('exam_committee_users')
          .insert({
            user_id: authData.user.id,
            department: formData.department || null
          })

        if (examCommitteeError) throw examCommitteeError

        setFormData({
          email: '',
          firstName: '',
          middleName: '',
          lastName: '',
          department: ''
        })
        setShowPassword(true)
        await fetchExamCommitteeUsers()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteUser = async (userId: string, userProfileId: string) => {
    if (!confirm('Are you sure you want to delete this exam committee user?')) return

    try {
      // Delete exam committee user record first
      const { error: examCommitteeError } = await supabase
        .from('exam_committee_users')
        .delete()
        .eq('id', userId)

      if (examCommitteeError) throw examCommitteeError

      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userProfileId)

      if (profileError) throw profileError

      await fetchExamCommitteeUsers()
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Manage Exam Committee</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add Exam Committee Member</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {generatedPassword && showPassword && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-green-800 text-sm font-medium mb-2">Exam committee member added successfully!</p>
                  <p className="text-green-700 text-sm">
                    <strong>Email:</strong> {formData.email}<br />
                    <strong>One-time Password:</strong> {generatedPassword}
                  </p>
                  <p className="text-green-600 text-xs mt-2">
                    Please share these credentials with the member. They will be prompted to change the password on first login.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setShowPassword(false)
                      setGeneratedPassword('')
                      setShowAddForm(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Middle Name"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                placeholder="Optional"
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="member@school.edu"
                required
              />

              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Optional"
              />

              <div className="flex space-x-3">
                <Button type="submit" loading={adding} className="flex-1">
                  Add Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setError('')
                    setGeneratedPassword('')
                    setShowPassword(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Exam Committee Members ({examCommitteeUsers.length})</h3>
        </CardHeader>
        <CardContent>
          {examCommitteeUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No exam committee members found. Add your first member above.</p>
          ) : (
            <div className="space-y-4">
              {examCommitteeUsers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {member.user_profiles?.first_name} {member.user_profiles?.middle_name} {member.user_profiles?.last_name}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <p><strong>Email:</strong> {member.user_profiles?.email}</p>
                      {member.department && <p><strong>Department:</strong> {member.department}</p>}
                      <p><strong>Status:</strong> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          member.user_profiles?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.user_profiles?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      <p className="text-xs"><strong>Added:</strong> {formatDate(member.created_at)}</p>
                    </div>
                  </div>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleDeleteUser(member.id, member.user_id)}
                    className="flex items-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}