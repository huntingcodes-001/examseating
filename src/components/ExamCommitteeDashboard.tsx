import React, { useState } from 'react'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { ManageClassrooms } from './exam-committee/ManageClassrooms'
import { GenerateSeating } from './exam-committee/GenerateSeating'
import { SeatingArrangements } from './exam-committee/SeatingArrangements'

export function ExamCommitteeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('classrooms')

  const renderContent = () => {
    switch (activeTab) {
      case 'classrooms':
        return <ManageClassrooms />
      case 'generate-seating':
        return <GenerateSeating />
      case 'seating-arrangements':
        return <SeatingArrangements />
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Settings panel coming soon...</p>
          </div>
        )
      default:
        return <ManageClassrooms />
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