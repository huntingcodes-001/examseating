import React, { useState, useEffect } from 'react'
import { supabase, SeatingArrangement, SeatingAssignment } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { Eye, Edit, Trash2, Send } from 'lucide-react'

export function SeatingArrangements() {
  const [arrangements, setArrangements] = useState<SeatingArrangement[]>([])
  const [selectedArrangement, setSelectedArrangement] = useState<SeatingArrangement | null>(null)
  const [assignments, setAssignments] = useState<SeatingAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArrangements()
  }, [])

  const fetchArrangements = async () => {
    try {
      const { data, error } = await supabase
        .from('seating_arrangements')
        .select(`
          *,
          exam_subjects (
            subject_name,
            exam_date,
            start_time,
            end_time
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setArrangements(data || [])
    } catch (error) {
      console.error('Error fetching arrangements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async (arrangementId: string) => {
    try {
      const { data, error } = await supabase
        .from('seating_assignments')
        .select(`
          *,
          students (
            roll_number,
            grade,
            subject,
            paper_set,
            user_profiles (
              first_name,
              middle_name,
              last_name
            )
          ),
          classrooms (
            name,
            rows,
            columns
          )
        `)
        .eq('seating_arrangement_id', arrangementId)
        .order('classroom_id', { ascending: true })
        .order('row_number', { ascending: true })
        .order('column_number', { ascending: true })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const handleSubmitForApproval = async (arrangementId: string) => {
    try {
      setError('')
      const { error } = await supabase
        .from('seating_arrangements')
        .update({ status: 'submitted' })
        .eq('id', arrangementId)

      if (error) throw error
      await fetchArrangements()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDelete = async (arrangementId: string) => {
    if (!confirm('Are you sure you want to delete this seating arrangement?')) return

    try {
      const { error } = await supabase
        .from('seating_arrangements')
        .delete()
        .eq('id', arrangementId)

      if (error) throw error
      await fetchArrangements()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const viewArrangement = (arrangement: SeatingArrangement) => {
    setSelectedArrangement(arrangement)
    fetchAssignments(arrangement.id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const groupAssignmentsByClassroom = () => {
    const grouped: { [key: string]: SeatingAssignment[] } = {}
    assignments.forEach(assignment => {
      const classroomName = assignment.classrooms?.name || 'Unknown'
      if (!grouped[classroomName]) {
        grouped[classroomName] = []
      }
      grouped[classroomName].push(assignment)
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
        <h2 className="text-2xl font-bold text-gray-900">Seating Arrangements</h2>
        {selectedArrangement && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedArrangement(null)
              setAssignments([])
            }}
          >
            Back to List
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!selectedArrangement ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">All Arrangements ({arrangements.length})</h3>
          </CardHeader>
          <CardContent>
            {arrangements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No seating arrangements created yet.</p>
            ) : (
              <div className="space-y-4">
                {arrangements.map((arrangement) => (
                  <div
                    key={arrangement.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{arrangement.name}</h4>
                        <p className="text-sm text-gray-600">
                          Subject: {arrangement.exam_subjects?.subject_name} | 
                          Date: {arrangement.exam_subjects?.exam_date ? new Date(arrangement.exam_subjects.exam_date).toLocaleDateString() : 'N/A'}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(arrangement.status)}`}>
                            {arrangement.status.charAt(0).toUpperCase() + arrangement.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created: {formatDate(arrangement.created_at)}
                          </span>
                        </div>
                        {arrangement.rejection_reason && (
                          <p className="text-sm text-red-600 mt-1">
                            <strong>Rejection Reason:</strong> {arrangement.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => viewArrangement(arrangement)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {arrangement.status === 'draft' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSubmitForApproval(arrangement.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {(arrangement.status === 'draft' || arrangement.status === 'rejected') && (
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleDelete(arrangement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedArrangement.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedArrangement.exam_subjects?.subject_name} - {selectedArrangement.exam_subjects?.exam_date ? new Date(selectedArrangement.exam_subjects.exam_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedArrangement.status)}`}>
                {selectedArrangement.status.charAt(0).toUpperCase() + selectedArrangement.status.slice(1)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(groupAssignmentsByClassroom()).map(([classroomName, classroomAssignments]) => {
                const classroom = classroomAssignments[0]?.classrooms
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
                          const assignment = classroomAssignments.find(
                            a => a.row_number === row && a.column_number === col
                          )

                          return (
                            <div
                              key={index}
                              className={`aspect-square border rounded text-xs flex flex-col items-center justify-center p-1 ${
                                assignment 
                                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                  : 'bg-gray-50 border-gray-200 text-gray-400'
                              }`}
                              title={assignment ? `${assignment.students?.user_profiles?.first_name} ${assignment.students?.user_profiles?.last_name} (${assignment.students?.roll_number})` : 'Empty'}
                            >
                              {assignment ? (
                                <>
                                  <div className="font-medium">{assignment.students?.roll_number}</div>
                                  <div className="text-xs">{assignment.students?.grade}</div>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}