import React, { useState } from 'react'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { ManageTeachers } from './admin/ManageTeachers'
import { ManageExamCommittee } from './admin/ManageExamCommittee'
import { AllUsers } from './admin/AllUsers'

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('teachers')

  const renderContent = () => {
    switch (activeTab) {
      case 'teachers':
        return <ManageTeachers />
      case 'exam-committee':
        return <ManageExamCommittee />
      case 'all-users':
        return <AllUsers />
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Settings panel coming soon...</p>
          </div>
        )
      default:
        return <ManageTeachers />
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