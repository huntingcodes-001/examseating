import React, { useState, useEffect } from 'react'
import { supabase, SeatingArrangement, SeatingAssignment } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { formatDate } from '../../lib/utils'
import { CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react'

export function SeatingReview() {
  const [arrangements, setArrangements] = useState<SeatingArrangement[]>([])
  const [selectedArrangement, setSelectedArrangement] = useState<SeatingArrangement | null>(null)
  const [assignments, setAssignments] = useState<SeatingAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)
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

  const handleApprove = async (arrangementId: string) => {
    try {
      setError('')
      const { data: userData } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('seating_arrangements')
        .update({ 
          status: 'approved',
          approved_by: userData.user?.id
        })
        .eq('id', arrangementId)

      if (error) throw error
      await fetchArrangements()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleReject = async (arrangementId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    try {
      setError('')
      const { error } = await supabase
        .from('seating_arrangements')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', arrangementId)

      if (error) throw error
      setRejectionReason('')
      setShowRejectionForm(false)
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
        <h2 className="text-2xl font-bold text-gray-900">Review Seating Arrangements</h2>
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
            <h3 className="text-lg font-semibold">Pending Reviews</h3>
          </CardHeader>
          <CardContent>
            {arrangements.filter(a => a.status === 'submitted').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No seating arrangements pending review.</p>
            ) : (
              <div className="space-y-4">
                {arrangements.filter(a => a.status === 'submitted').map((arrangement) => (
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
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(arrangement.status)}`}>
                          {arrangement.status.charAt(0).toUpperCase() + arrangement.status.slice(1)}
                        </span>
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
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(arrangement.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => {
                            setSelectedArrangement(arrangement)
                            setShowRejectionForm(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
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

              {selectedArrangement.status === 'submitted' && (
                <div className="flex items-center space-x-4 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="success"
                    onClick={() => handleApprove(selectedArrangement.id)}
                    className="flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Arrangement
                  </Button>
                  <Button
                    variant="error"
                    onClick={() => setShowRejectionForm(true)}
                    className="flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Arrangement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Form Modal */}
      {showRejectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold">Reject Seating Arrangement</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="error"
                    onClick={() => selectedArrangement && handleReject(selectedArrangement.id)}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectionForm(false)
                      setRejectionReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}