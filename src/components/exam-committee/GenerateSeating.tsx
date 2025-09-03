import React, { useState, useEffect } from 'react'
import { supabase, ExamSubject, Classroom, Student } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Shuffle, Save, Send } from 'lucide-react'

interface SeatingData {
  student: Student
  classroom: Classroom
  row: number
  column: number
  seatNumber: string
}

export function GenerateSeating() {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])
  const [generatedSeating, setGeneratedSeating] = useState<SeatingData[]>([])
  const [arrangementName, setArrangementName] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subjectsResult, classroomsResult] = await Promise.all([
        supabase
          .from('exam_subjects')
          .select(`
            *,
            exams!inner(status)
          `)
          .eq('exams.status', 'active'),
        supabase
          .from('classrooms')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })
      ])

      if (subjectsResult.error) throw subjectsResult.error
      if (classroomsResult.error) throw classroomsResult.error

      setExamSubjects(subjectsResult.data || [])
      setClassrooms(classroomsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSeatingArrangement = async () => {
    if (!selectedSubject || selectedClassrooms.length === 0) {
      setError('Please select a subject and at least one classroom')
      return
    }

    setGenerating(true)
    setError('')

    try {
      // Get registered students for this subject
      const { data: registeredStudents, error: studentsError } = await supabase
        .from('student_timetables')
        .select(`
          students (
            *,
            user_profiles (*)
          )
        `)
        .eq('exam_subject_id', selectedSubject)
        .eq('is_registered', true)

      if (studentsError) throw studentsError

      const students = registeredStudents
        ?.map(st => st.students)
        .filter(Boolean) as Student[]

      if (!students || students.length === 0) {
        setError('No registered students found for this subject')
        return
      }

      // Get selected classrooms with details
      const selectedClassroomData = classrooms.filter(c => selectedClassrooms.includes(c.id))
      const totalCapacity = selectedClassroomData.reduce((sum, c) => sum + c.capacity, 0)

      if (students.length > totalCapacity) {
        setError(`Not enough capacity. Students: ${students.length}, Total capacity: ${totalCapacity}`)
        return
      }

      // Shuffle students for randomization
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5)
      
      // Generate seating arrangement
      const seatingData: SeatingData[] = []
      let studentIndex = 0

      for (const classroom of selectedClassroomData) {
        for (let row = 1; row <= classroom.rows; row++) {
          for (let col = 1; col <= classroom.columns; col++) {
            if (studentIndex < shuffledStudents.length) {
              const student = shuffledStudents[studentIndex]
              
              // Anti-cheating logic: check adjacent seats
              const isValidPlacement = checkAntiCheatingRules(
                student,
                seatingData,
                classroom,
                row,
                col
              )

              if (isValidPlacement || seatingData.length === 0) {
                seatingData.push({
                  student,
                  classroom,
                  row,
                  column: col,
                  seatNumber: `${classroom.name}-R${row}C${col}`
                })
                studentIndex++
              }
            }
          }
        }
      }

      // If we couldn't place all students due to anti-cheating rules, 
      // place remaining students in available seats
      while (studentIndex < shuffledStudents.length) {
        for (const classroom of selectedClassroomData) {
          for (let row = 1; row <= classroom.rows; row++) {
            for (let col = 1; col <= classroom.columns; col++) {
              const seatTaken = seatingData.some(
                s => s.classroom.id === classroom.id && s.row === row && s.column === col
              )
              
              if (!seatTaken && studentIndex < shuffledStudents.length) {
                seatingData.push({
                  student: shuffledStudents[studentIndex],
                  classroom,
                  row,
                  column: col,
                  seatNumber: `${classroom.name}-R${row}C${col}`
                })
                studentIndex++
                break
              }
            }
            if (studentIndex >= shuffledStudents.length) break
          }
          if (studentIndex >= shuffledStudents.length) break
        }
        break // Prevent infinite loop
      }

      setGeneratedSeating(seatingData)
      
      // Auto-generate arrangement name
      const subject = examSubjects.find(s => s.id === selectedSubject)
      setArrangementName(`${subject?.subject_name} - ${new Date().toLocaleDateString()}`)
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const checkAntiCheatingRules = (
    student: Student,
    existingSeating: SeatingData[],
    classroom: Classroom,
    row: number,
    col: number
  ): boolean => {
    // Check adjacent seats (left, right, front, back)
    const adjacentPositions = [
      { row: row, col: col - 1 }, // left
      { row: row, col: col + 1 }, // right
      { row: row - 1, col: col }, // front
      { row: row + 1, col: col }  // back
    ]

    for (const pos of adjacentPositions) {
      const adjacentStudent = existingSeating.find(
        s => s.classroom.id === classroom.id && 
             s.row === pos.row && 
             s.column === pos.col
      )

      if (adjacentStudent) {
        // Check if same grade, subject, or paper set
        if (
          adjacentStudent.student.grade === student.grade ||
          adjacentStudent.student.subject === student.subject ||
          (adjacentStudent.student.paper_set && student.paper_set && 
           adjacentStudent.student.paper_set === student.paper_set)
        ) {
          return false
        }
      }
    }

    return true
  }

  const handleSaveArrangement = async (status: 'draft' | 'submitted') => {
    if (!arrangementName.trim()) {
      setError('Please provide an arrangement name')
      return
    }

    if (generatedSeating.length === 0) {
      setError('No seating arrangement to save')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()

      // Create seating arrangement
      const { data: arrangement, error: arrangementError } = await supabase
        .from('seating_arrangements')
        .insert({
          exam_subject_id: selectedSubject,
          name: arrangementName,
          status: status,
          created_by: userData.user?.id
        })
        .select()
        .single()

      if (arrangementError) throw arrangementError

      // Create seating assignments
      const assignments = generatedSeating.map(seat => ({
        seating_arrangement_id: arrangement.id,
        student_id: seat.student.id,
        classroom_id: seat.classroom.id,
        row_number: seat.row,
        column_number: seat.column,
        seat_number: seat.seatNumber
      }))

      const { error: assignmentsError } = await supabase
        .from('seating_assignments')
        .insert(assignments)

      if (assignmentsError) throw assignmentsError

      // Reset form
      setGeneratedSeating([])
      setArrangementName('')
      setSelectedSubject('')
      setSelectedClassrooms([])

      alert(`Seating arrangement ${status === 'draft' ? 'saved as draft' : 'submitted for approval'} successfully!`)
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const groupSeatingByClassroom = () => {
    const grouped: { [key: string]: SeatingData[] } = {}
    generatedSeating.forEach(seat => {
      const classroomName = seat.classroom.name
      if (!grouped[classroomName]) {
        grouped[classroomName] = []
      }
      grouped[classroomName].push(seat)
    })
    return grouped
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
        <h2 className="text-2xl font-bold text-gray-900">Generate Seating Arrangement</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Exam Configuration</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a subject...</option>
                {examSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name} - {new Date(subject.exam_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Classrooms
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {classrooms.map((classroom) => (
                  <label key={classroom.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedClassrooms.includes(classroom.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassrooms([...selectedClassrooms, classroom.id])
                        } else {
                          setSelectedClassrooms(selectedClassrooms.filter(id => id !== classroom.id))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {classroom.name} (Capacity: {classroom.capacity})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={generateSeatingArrangement}
              loading={generating}
              disabled={!selectedSubject || selectedClassrooms.length === 0}
              className="flex items-center"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Generate Seating Arrangement
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedSeating.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Seating Arrangement</h3>
              <div className="text-sm text-gray-600">
                Total Students: {generatedSeating.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrangement Name
                </label>
                <input
                  type="text"
                  value={arrangementName}
                  onChange={(e) => setArrangementName(e.target.value)}
                  placeholder="Enter arrangement name..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupSeatingByClassroom()).map(([classroomName, seats]) => {
                  const classroom = seats[0]?.classroom
                  if (!classroom) return null

                  return (
                    <div key={classroomName} className="space-y-3">
                      <h4 className="font-medium text-gray-900">{classroomName}</h4>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div 
                          className="grid gap-1"
                          style={{
                            gridTemplateColumns: `repeat(${classroom.columns}, 1fr)`,
                            gridTemplateRows: `repeat(${classroom.rows}, 1fr)`
                          }}
                        >
                          {Array.from({ length: classroom.rows * classroom.columns }, (_, index) => {
                            const row = Math.floor(index / classroom.columns) + 1
                            const col = (index % classroom.columns) + 1
                            const seat = seats.find(s => s.row === row && s.column === col)

                            return (
                              <div
                                key={index}
                                className={`aspect-square border rounded text-xs flex flex-col items-center justify-center p-1 ${
                                  seat 
                                    ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}
                                title={seat ? `${seat.student.user_profiles?.first_name} ${seat.student.user_profiles?.last_name} (${seat.student.roll_number})` : 'Empty'}
                              >
                                {seat ? (
                                  <>
                                    <div className="font-medium">{seat.student.roll_number}</div>
                                    <div className="text-xs">{seat.student.grade}</div>
                                  </>
                                ) : (
                                  <div>Empty</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleSaveArrangement('draft')}
                  loading={saving}
                  variant="outline"
                  className="flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSaveArrangement('submitted')}
                  loading={saving}
                  className="flex items-center"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}