import React, { useState, useEffect } from 'react'
import { supabase, SeatingAssignment, Student } from '../../lib/supabase'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { MapPin, Calendar, Clock, User } from 'lucide-react'

export function StudentSeating() {
  const [seatingAssignments, setSeatingAssignments] = useState<SeatingAssignment[]>([])
  const [studentData, setStudentData] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSeatingData()
  }, [])

  const fetchSeatingData = async () => {
    try {
      // Get current student data
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()

      if (studentError) throw studentError
      setStudentData(student)

      // Check if student is blacklisted
      if (student.is_blacklisted) {
        setError('You are blacklisted and cannot view seating arrangements.')
        setLoading(false)
        return
      }

      // Get approved seating assignments for this student
      const { data: assignments, error: assignmentsError } = await supabase
        .from('seating_assignments')
        .select(`
          *,
          classrooms (*),
          seating_arrangements!inner (
            name,
            status,
            exam_subjects (
              subject_name,
              exam_date,
              start_time,
              end_time
            )
          )
        `)
        .eq('student_id', student.id)
        .eq('seating_arrangements.status', 'approved')

      if (assignmentsError) throw assignmentsError
      setSeatingAssignments(assignments || [])
    } catch (error) {
      console.error('Error fetching seating data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (studentData?.is_blacklisted) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <MapPin className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Access Restricted</h3>
            <p className="text-red-700">
              You are blacklisted and cannot view seating arrangements.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Seating Arrangements</h2>
        <div className="text-sm text-gray-600">
          {seatingAssignments.length} exam(s) assigned
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!studentData?.is_approved && (
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-800 text-sm">
            <strong>Pending Approval:</strong> Your account is pending teacher approval. Seating arrangements will be available once approved.
          </p>
        </div>
      )}

      {seatingAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Seating Arrangements</h3>
            <p className="text-gray-600">
              {!studentData?.is_approved 
                ? 'Seating arrangements will appear here once your account is approved and exams are scheduled.'
                : 'No seating arrangements have been finalized yet. Check back later.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {seatingAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">
                      {assignment.seating_arrangements?.exam_subjects?.subject_name}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Confirmed
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Exam Date</p>
                        <p className="text-sm text-gray-600">
                          {assignment.seating_arrangements?.exam_subjects?.exam_date 
                            ? new Date(assignment.seating_arrangements.exam_subjects.exam_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">
                          {assignment.seating_arrangements?.exam_subjects?.start_time} - {assignment.seating_arrangements?.exam_subjects?.end_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{assignment.classrooms?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Seat Number</p>
                        <p className="text-sm text-gray-600 font-mono">{assignment.seat_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Seat Position</h4>
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div 
                        className="grid gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${assignment.classrooms?.columns || 5}, 1fr)`,
                          gridTemplateRows: `repeat(${assignment.classrooms?.rows || 8}, 1fr)`
                        }}
                      >
                        {Array.from({ 
                          length: (assignment.classrooms?.rows || 8) * (assignment.classrooms?.columns || 5) 
                        }, (_, index) => {
                          const row = Math.floor(index / (assignment.classrooms?.columns || 5)) + 1
                          const col = (index % (assignment.classrooms?.columns || 5)) + 1
                          const isMyseat = assignment.row_number === row && assignment.column_number === col

                          return (
                            <div
                              key={index}
                              className={`aspect-square border rounded text-xs flex items-center justify-center ${
                                isMyseat 
                                  ? 'bg-blue-600 border-blue-700 text-white font-bold' 
                                  : 'bg-gray-100 border-gray-200 text-gray-400'
                              }`}
                            >
                              {isMyseat ? 'YOU' : ''}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Your seat is highlighted in blue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}