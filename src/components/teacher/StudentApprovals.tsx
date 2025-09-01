import React, { useState, useEffect } from 'react'
import { supabase, Student } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { UserCheck, UserX, AlertTriangle } from 'lucide-react'

export function StudentApprovals() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
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
          blacklist_reason: !student.is_blacklisted ? reason : null,
          is_approved: student.is_blacklisted ? student.is_approved : false // Remove approval if blacklisting
        })
        .eq('id', student.id)

      if (error) throw error
      await fetchStudents()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const pendingStudents = students.filter(s => !s.is_approved && !s.is_blacklisted)
  const approvedStudents = students.filter(s => s.is_approved && !s.is_blacklisted)
  const blacklistedStudents = students.filter(s => s.is_blacklisted)

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
        <h2 className="text-2xl font-bold text-gray-900">Student Approvals</h2>
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>Pending: {pendingStudents.length}</span>
          <span>Approved: {approvedStudents.length}</span>
          <span>Blacklisted: {blacklistedStudents.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Pending Approvals ({pendingStudents.length})</h3>
          </div>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending approvals.</p>
          ) : (
            <div className="space-y-4">
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {student.user_profiles?.first_name} {student.user_profiles?.middle_name} {student.user_profiles?.last_name}
                    </h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p><strong>Roll:</strong> {student.roll_number} | <strong>Grade:</strong> {student.grade} | <strong>Subject:</strong> {student.subject}</p>
                      {student.paper_set && <p><strong>Paper Set:</strong> {student.paper_set}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprovalToggle(student)}
                      className="flex items-center"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Enter blacklist reason:')
                        if (reason) handleBlacklistToggle(student, reason)
                      }}
                      className="flex items-center"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Blacklist
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Approved Students ({approvedStudents.length})</h3>
          </div>
        </CardHeader>
        <CardContent>
          {approvedStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No approved students.</p>
          ) : (
            <div className="space-y-3">
              {approvedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {student.user_profiles?.first_name} {student.user_profiles?.middle_name} {student.user_profiles?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {student.roll_number} | {student.grade} | {student.subject}
                    </p>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleApprovalToggle(student)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blacklisted Students */}
      {blacklistedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <UserX className="mr-2 h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold">Blacklisted Students ({blacklistedStudents.length})</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blacklistedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {student.user_profiles?.first_name} {student.user_profiles?.middle_name} {student.user_profiles?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {student.roll_number} | {student.grade} | {student.subject}
                    </p>
                    {student.blacklist_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        <strong>Reason:</strong> {student.blacklist_reason}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleBlacklistToggle(student)}
                  >
                    Remove from Blacklist
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}