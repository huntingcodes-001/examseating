import React, { useState } from 'react'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { ManageStudents } from './teacher/ManageStudents'
import { StudentApprovals } from './teacher/StudentApprovals'

export function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('students')

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <ManageStudents />
      case 'add-student':
        return <ManageStudents />
      case 'approvals':
        return <StudentApprovals />
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Settings panel coming soon...</p>
          </div>
        )
      default:
        return <ManageStudents />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}