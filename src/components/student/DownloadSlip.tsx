import React, { useState, useEffect } from 'react'
import { supabase, SeatingAssignment, Student } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Download, FileText, Calendar, MapPin, User } from 'lucide-react'
import jsPDF from 'jspdf'

export function DownloadSlip() {
  const [seatingAssignments, setSeatingAssignments] = useState<SeatingAssignment[]>([])
  const [studentData, setStudentData] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
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
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('user_id', userData.user.id)
        .single()

      if (studentError) throw studentError
      setStudentData(student)

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

  const generatePDF = async (assignment: SeatingAssignment) => {
    setDownloading(true)
    
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('EXAM SEATING SLIP', pageWidth / 2, 30, { align: 'center' })
      
      // Student Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('STUDENT INFORMATION', 20, 60)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const studentName = `${studentData?.user_profiles?.first_name} ${studentData?.user_profiles?.middle_name || ''} ${studentData?.user_profiles?.last_name}`.trim()
      
      pdf.text(`Name: ${studentName}`, 20, 75)
      pdf.text(`Roll Number: ${studentData?.roll_number}`, 20, 90)
      pdf.text(`Grade: ${studentData?.grade}`, 20, 105)
      pdf.text(`Subject: ${studentData?.subject}`, 20, 120)
      
      // Exam Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('EXAM INFORMATION', 20, 150)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Subject: ${assignment.seating_arrangements?.exam_subjects?.subject_name}`, 20, 165)
      pdf.text(`Date: ${assignment.seating_arrangements?.exam_subjects?.exam_date ? new Date(assignment.seating_arrangements.exam_subjects.exam_date).toLocaleDateString() : 'N/A'}`, 20, 180)
      pdf.text(`Time: ${assignment.seating_arrangements?.exam_subjects?.start_time} - ${assignment.seating_arrangements?.exam_subjects?.end_time}`, 20, 195)
      
      // Seating Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('SEATING INFORMATION', 20, 225)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Classroom: ${assignment.classrooms?.name}`, 20, 240)
      pdf.text(`Seat Number: ${assignment.seat_number}`, 20, 255)
      pdf.text(`Row: ${assignment.row_number}, Column: ${assignment.column_number}`, 20, 270)
      
      // Instructions
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Instructions:', 20, 300)
      pdf.text('• Arrive at the examination hall 15 minutes before the exam starts', 25, 315)
      pdf.text('• Bring your student ID card and this seating slip', 25, 325)
      pdf.text('• Mobile phones and electronic devices are strictly prohibited', 25, 335)
      pdf.text('• Follow all examination rules and regulations', 25, 345)
      
      // Footer
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20)
      pdf.text('Exam Seating Arrangement System', pageWidth / 2, pageHeight - 20, { align: 'center' })
      
      // Download the PDF
      const fileName = `seating-slip-${studentData?.roll_number}-${assignment.seating_arrangements?.exam_subjects?.subject_name?.replace(/\s+/g, '-')}.pdf`
      pdf.save(fileName)
      
    } catch (error: any) {
      setError('Failed to generate PDF: ' + error.message)
    } finally {
      setDownloading(false)
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
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Access Restricted</h3>
            <p className="text-red-700">
              You are blacklisted and cannot download seating slips.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Download Seating Slips</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {seatingAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Seating Slips Available</h3>
            <p className="text-gray-600">
              Seating slips will be available once your seating arrangements are finalized.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {seatingAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.seating_arrangements?.exam_subjects?.subject_name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {assignment.seating_arrangements?.exam_subjects?.exam_date 
                            ? new Date(assignment.seating_arrangements.exam_subjects.exam_date).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {assignment.seating_arrangements?.exam_subjects?.start_time} - {assignment.seating_arrangements?.exam_subjects?.end_time}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{assignment.classrooms?.name}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Your Seat: {assignment.seat_number}
                      </p>
                      <p className="text-xs text-blue-700">
                        Row {assignment.row_number}, Column {assignment.column_number}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => generatePDF(assignment)}
                    loading={downloading}
                    className="flex items-center ml-6"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}