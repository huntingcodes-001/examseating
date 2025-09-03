import React, { useState, useEffect } from 'react'
import { supabase, Student } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { UserPlus, Trash2, Edit, Search, UserCheck, UserX } from 'lucide-react'

export function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    rollNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    grade: '',
    subject: '',
    paperSet: ''
  })
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          user_profiles (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      const username = formData.rollNumber
      const password = formData.middleName || 'password123'
      const email = `${formData.rollNumber}@student.school.edu`

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: email,
            role: 'student',
            first_name: formData.firstName,
            middle_name: formData.middleName || null,
            last_name: formData.lastName,
            username: username,
            one_time_password: password,
            password_changed: false
          })

        if (profileError) throw profileError

        // Create student record
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: authData.user.id,
            roll_number: formData.rollNumber,
            grade: formData.grade,
            subject: formData.subject,
            paper_set: formData.paperSet || null
          })

        if (studentError) throw studentError

        setGeneratedCredentials({ username, password })
        setFormData({
          rollNumber: '',
          firstName: '',
          middleName: '',
          lastName: '',
          grade: '',
          subject: '',
          paperSet: ''
        })
        await fetchStudents()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return

    setAdding(true)
    setError('')

    try {
      // Update student record
      const { error: studentError } = await supabase
        .from('students')
        .update({
          grade: formData.grade,
          subject: formData.subject,
          paper_set: formData.paperSet || null
        })
        .eq('id', editingStudent.id)

      if (studentError) throw studentError

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName
        })
        .eq('id', editingStudent.user_id)

      if (profileError) throw profileError

      setEditingStudent(null)
      setFormData({
        rollNumber: '',
        firstName: '',
        middleName: '',
        lastName: '',
        grade: '',
        subject: '',
        paperSet: ''
      })
      await fetchStudents()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteStudent = async (studentId: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      setError('')

      // Delete student record first
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (studentError) throw studentError

      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      await fetchStudents()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleApprovalToggle = async (student: Student) => {
    try {
      setError('')
      const { error } = await supabase
        .from('students')
        .update({ is_approved: !student.is_approved })
        .eq('id', student.id)

      if (error) throw error
      await fetchStudents()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleBlacklistToggle = async (student: Student, reason?: string) => {
    try {
      setError('')
      const { error } = await supabase
        .from('students')
        .update({ 
          is_blacklisted: !student.is_blacklisted,
          blacklist_reason: !student.is_blacklisted ? reason : null
        })
        .eq('id', student.id)

      if (error) throw error
      await fetchStudents()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const startEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      rollNumber: student.roll_number,
      firstName: student.user_profiles?.first_name || '',
      middleName: student.user_profiles?.middle_name || '',
      lastName: student.user_profiles?.last_name || '',
      grade: student.grade,
      subject: student.subject,
      paperSet: student.paper_set || ''
    })
    setShowAddForm(true)
  }

  const filteredStudents = students.filter(student =>
    student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user_profiles?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user_profiles?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h2 className="text-2xl font-bold text-gray-900">Manage Students</h2>
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingStudent(null)
            setFormData({
              rollNumber: '',
              firstName: '',
              middleName: '',
              lastName: '',
              grade: '',
              subject: '',
              paperSet: ''
            })
          }}
          className="flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingStudent ? handleEditStudent : handleAddStudent} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {generatedCredentials && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-green-800 text-sm font-medium mb-2">Student account created successfully!</p>
                  <p className="text-green-700 text-sm">
                    <strong>Username (Roll Number):</strong> {generatedCredentials.username}<br />
                    <strong>Password (Middle Name):</strong> {generatedCredentials.password}
                  </p>
                  <p className="text-green-600 text-xs mt-2">
                    These credentials have been automatically generated for the student.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setGeneratedCredentials(null)
                      setShowAddForm(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}

              <Input
                label="Roll Number"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g., 2024001"
                required
                disabled={!!editingStudent}
              />

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
                placeholder="Used as default password"
                required={!editingStudent}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g., 12th"
                  required
                />
                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Science"
                  required
                />
              </div>

              <Input
                label="Paper Set"
                value={formData.paperSet}
                onChange={(e) => setFormData({ ...formData, paperSet: e.target.value })}
                placeholder="Optional"
              />

              <div className="flex space-x-3">
                <Button type="submit" loading={adding} className="flex-1">
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingStudent(null)
                    setError('')
                    setGeneratedCredentials(null)
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
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <h3 className="text-lg font-semibold">Students ({students.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No students match your search.' : 'No students found. Add your first student above.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {student.user_profiles?.first_name} {student.user_profiles?.middle_name} {student.user_profiles?.last_name}
                      </h4>
                      {student.is_approved && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>
                      )}
                      {student.is_blacklisted && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Blacklisted</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-1">
                      <p><strong>Roll Number:</strong> {student.roll_number}</p>
                      <p><strong>Grade:</strong> {student.grade}</p>
                      <p><strong>Subject:</strong> {student.subject}</p>
                      {student.paper_set && <p><strong>Paper Set:</strong> {student.paper_set}</p>}
                      {student.is_blacklisted && student.blacklist_reason && (
                        <p className="col-span-full text-red-600"><strong>Blacklist Reason:</strong> {student.blacklist_reason}</p>
                      )}
                      <p className="text-xs col-span-full"><strong>Added:</strong> {formatDate(student.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={student.is_approved ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => handleApprovalToggle(student)}
                      className="flex items-center"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={student.is_blacklisted ? 'warning' : 'error'}
                      size="sm"
                      onClick={() => {
                        if (student.is_blacklisted) {
                          handleBlacklistToggle(student)
                        } else {
                          const reason = prompt('Enter blacklist reason:')
                          if (reason) handleBlacklistToggle(student, reason)
                        }
                      }}
                      className="flex items-center"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(student)}
                      className="flex items-center"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id, student.user_id)}
                      className="flex items-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}