import React, { useState, useEffect } from 'react'
import { supabase, ExamSubject, StudentTimetable as StudentTimetableType, Student } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Calendar, Clock, BookOpen, CheckCircle, XCircle } from 'lucide-react'

export function StudentTimetable() {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([])
  const [studentTimetables, setStudentTimetables] = useState<StudentTimetableType[]>([])
  const [studentData, setStudentData] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
        setError('You are blacklisted and cannot appear for the exam. Please contact your teacher.')
        setLoading(false)
        return
      }

      // Get active exam subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('exam_subjects')
        .select(`
          *,
          exams!inner(status)
        `)
        .eq('exams.status', 'active')
        .order('exam_date', { ascending: true })

      if (subjectsError) throw subjectsError

      // Get student's current timetable
      const { data: timetables, error: timetablesError } = await supabase
        .from('student_timetables')
        .select(`
          *,
          exam_subjects (*)
        `)
        .eq('student_id', student.id)

      if (timetablesError) throw timetablesError

      setExamSubjects(subjects || [])
      setStudentTimetables(timetables || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubject = async (subjectId: string) => {
    if (!studentData) return

    try {
      setError('')
      
      const existingTimetable = studentTimetables.find(t => t.exam_subject_id === subjectId)
      
      if (existingTimetable) {
        // Toggle registration status
        const { error } = await supabase
          .from('student_timetables')
          .update({ is_registered: !existingTimetable.is_registered })
          .eq('id', existingTimetable.id)

        if (error) throw error
      } else {
        // Create new timetable entry
        const { error } = await supabase
          .from('student_timetables')
          .insert({
            student_id: studentData.id,
            exam_subject_id: subjectId,
            is_registered: true
          })

        if (error) throw error
      }

      await fetchData()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const isSubjectRegistered = (subjectId: string) => {
    const timetable = studentTimetables.find(t => t.exam_subject_id === subjectId)
    return timetable?.is_registered || false
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
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Account Blacklisted</h3>
            <p className="text-red-700 mb-4">
              You are blacklisted and cannot appear for the exam.
            </p>
            {studentData.blacklist_reason && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <strong>Reason:</strong> {studentData.blacklist_reason}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-4">
              Please contact your teacher for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Exam Timetable</h2>
        <div className="text-sm text-gray-600">
          Registered: {studentTimetables.filter(t => t.is_registered).length} subjects
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
            <strong>Pending Approval:</strong> Your account is pending teacher approval. You can register for subjects, but you won't be able to appear for exams until approved.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Available Exam Subjects</h3>
          </div>
        </CardHeader>
        <CardContent>
          {examSubjects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active exams available for registration.</p>
          ) : (
            <div className="space-y-4">
              {examSubjects.map((subject) => {
                const isRegistered = isSubjectRegistered(subject.id)
                
                return (
                  <div
                    key={subject.id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      isRegistered 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900">{subject.subject_name}</h4>
                          {isRegistered && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(subject.exam_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{subject.start_time} - {subject.end_time}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isRegistered ? 'error' : 'success'}
                        size="sm"
                        onClick={() => handleToggleSubject(subject.id)}
                        disabled={!studentData?.is_approved}
                      >
                        {isRegistered ? 'Unregister' : 'Register'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {studentTimetables.filter(t => t.is_registered).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">My Registered Subjects</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentTimetables
                .filter(t => t.is_registered)
                .map((timetable) => (
                  <div
                    key={timetable.id}
                    className="p-3 border border-green-200 rounded-lg bg-green-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-900">
                          {timetable.exam_subjects?.subject_name}
                        </h4>
                        <p className="text-sm text-green-700">
                          {timetable.exam_subjects?.exam_date ? new Date(timetable.exam_subjects.exam_date).toLocaleDateString() : 'N/A'} | 
                          {timetable.exam_subjects?.start_time} - {timetable.exam_subjects?.end_time}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}