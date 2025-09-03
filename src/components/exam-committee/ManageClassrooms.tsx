import React, { useState, useEffect } from 'react'
import { supabase, Classroom } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Plus, Trash2, Edit, MapPin } from 'lucide-react'

export function ManageClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    rows: '',
    columns: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setClassrooms(data || [])
    } catch (error) {
      console.error('Error fetching classrooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    try {
      const classroomData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        rows: parseInt(formData.rows),
        columns: parseInt(formData.columns)
      }

      if (editingClassroom) {
        const { error } = await supabase
          .from('classrooms')
          .update(classroomData)
          .eq('id', editingClassroom.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('classrooms')
          .insert(classroomData)

        if (error) throw error
      }

      setFormData({ name: '', capacity: '', rows: '', columns: '' })
      setShowAddForm(false)
      setEditingClassroom(null)
      await fetchClassrooms()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (classroomId: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return

    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroomId)

      if (error) throw error
      await fetchClassrooms()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const startEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity.toString(),
      rows: classroom.rows.toString(),
      columns: classroom.columns.toString()
    })
    setShowAddForm(true)
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
        <h2 className="text-2xl font-bold text-gray-900">Manage Classrooms</h2>
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingClassroom(null)
            setFormData({ name: '', capacity: '', rows: '', columns: '' })
          }}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Classroom
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
            <h3 className="text-lg font-semibold">
              {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Classroom Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Room A-101"
                required
              />

              <Input
                label="Total Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 40"
                min="1"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Number of Rows"
                  type="number"
                  value={formData.rows}
                  onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                  placeholder="e.g., 8"
                  min="1"
                  required
                />
                <Input
                  label="Number of Columns"
                  type="number"
                  value={formData.columns}
                  onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                  placeholder="e.g., 5"
                  min="1"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" loading={adding} className="flex-1">
                  {editingClassroom ? 'Update Classroom' : 'Add Classroom'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingClassroom(null)
                    setError('')
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
          <h3 className="text-lg font-semibold">Classrooms ({classrooms.length})</h3>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No classrooms found. Add your first classroom above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900">{classroom.name}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      classroom.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {classroom.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p><strong>Capacity:</strong> {classroom.capacity} students</p>
                    <p><strong>Layout:</strong> {classroom.rows} × {classroom.columns}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(classroom)}
                      className="flex items-center flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleDelete(classroom.id)}
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