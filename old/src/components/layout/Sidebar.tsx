import React from 'react'
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  BookOpen,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

const adminMenuItems = [
  { id: 'teachers', label: 'Manage Teachers', icon: GraduationCap },
  { id: 'exam-committee', label: 'Exam Committee', icon: Shield },
  { id: 'all-users', label: 'All Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const teacherMenuItems = [
  { id: 'students', label: 'Manage Students', icon: Users },
  { id: 'add-student', label: 'Add Student', icon: UserPlus },
  { id: 'approvals', label: 'Student Approvals', icon: UserCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isOpen, onToggle, activeTab, onTabChange }: SidebarProps) {
  const { profile, signOut } = useAuth()
  
  const menuItems = profile?.role === 'admin' ? adminMenuItems : teacherMenuItems

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            {profile?.role === 'admin' ? 'Admin Panel' : 'Teacher Panel'}
          </h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200',
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center px-3 py-2 text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}