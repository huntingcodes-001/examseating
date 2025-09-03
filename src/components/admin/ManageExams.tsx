import React, { useState, useEffect } from 'react'
import { supabase, Exam, ExamSubject } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { Calendar, Plus, Trash2, Play, Square } from 'lucide-react'

export function ManageExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  })
  const [subjectForm, setSubjectForm] = useState({
    subjectName: '',
    examDate: '',
    startTime: '',
    endTime: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      fetchExamSubjects(selectedExam)
    }
  }, [selectedExam])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExamSubjects = async (examId: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_subjects')
        .select('*')
        .eq('exam_id', examId)
        .order('exam_date', { ascending: true })

      if (error) throw error
      setExamSubjects(data || [])
    } catch (error) {
      console.error('Error fetching exam subjects:', error)
    }
  }

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('exams')
        .insert({
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          created_by: userData.user?.id
        })

      if (error) throw error

      setFormData({ name: '', startDate: '', endDate: '' })
      setShowAddForm(false)
      await fetchExams()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam) return

    try {
      setError('')
      const { error } = await supabase
        .from('exam_subjects')
        .insert({
          exam_id: selectedExam,
          subject_name: subjectForm.subjectName,
          exam_date: subjectForm.examDate,
          start_time: subjectForm.startTime,
          end_time: subjectForm.endTime
        })

      if (error) throw error

      setSubjectForm({ subjectName: '', examDate: '', startTime: '', endTime: '' })
      await fetchExamSubjects(selectedExam)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleActivateExam = async (examId: string) => {
    try {
      setError('')
      
      // Deactivate all other exams first
      await supabase
        .from('exams')
        .update({ status: 'draft' })
        .neq('id', examId)

      // Activate selected exam
      const { error } = await supabase
        .from('exams')
        .update({ status: 'active' })
        .eq('id', examId)

      if (error) throw error
      await fetchExams()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all related subjects and arrangements.')) return

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)

      if (error) throw error
      await fetchExams()
      if (selectedExam === examId) {
        setSelectedExam(null)
        setExamSubjects([])
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return

    try {
      const { error } = await supabase
        .from('exam_subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error
      if (selectedExam) {
        await fetchExamSubjects(selectedExam)
      }
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
        <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Exam Period
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Create New Exam Period</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExam} className="space-y-4">
              <Input
                label="Exam Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Final Examinations 2024"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" loading={adding} className="flex-1">
                  Create Exam Period
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Periods */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Exam Periods ({exams.length})</h3>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exam periods created yet.</p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedExam === exam.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${exam.status === 'active' ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => setSelectedExam(exam.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{exam.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          exam.status === 'active' ? 'bg-green-100 text-green-800' :
                          exam.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {exam.status !== 'active' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivateExam(exam.id)
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="error"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteExam(exam.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Subjects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedExam ? 'Exam Subjects' : 'Select an Exam'}
              </h3>
              {selectedExam && (
                <Button
                  size="sm"
                  onClick={() => setSubjectForm({ ...subjectForm, examDate: '', startTime: '', endTime: '', subjectName: '' })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedExam ? (
              <p className="text-gray-500 text-center py-8">Select an exam period to manage subjects.</p>
            ) : (
              <div className="space-y-4">
                {/* Add Subject Form */}
                <form onSubmit={handleAddSubject} className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <Input
                    label="Subject Name"
                    value={subjectForm.subjectName}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                  />
                  <Input
                    label="Exam Date"
                    type="date"
                    value={subjectForm.examDate}
                    onChange={(e) => setSubjectForm({ ...subjectForm, examDate: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time"
                      type="time"
                      value={subjectForm.startTime}
                      onChange={(e) => setSubjectForm({ ...subjectForm, startTime: e.target.value })}
                      required
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={subjectForm.endTime}
                      onChange={(e) => setSubjectForm({ ...subjectForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full">
                    Add Subject
                  </Button>
                </form>

                {/* Subjects List */}
                {examSubjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No subjects added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {examSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{subject.subject_name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(subject.exam_date).toLocaleDateString()} | {subject.start_time} - {subject.end_time}
                          </p>
                        </div>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}