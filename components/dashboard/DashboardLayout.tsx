'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FiHome, FiFileText, FiBookmark, FiSettings, FiBarChart2 } from 'react-icons/fi'
import Image from 'next/image'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab?: string
}

export default function DashboardLayout({ children, activeTab = 'overview' }: DashboardLayoutProps) {
  const { data: session } = useSession()

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: FiHome, current: activeTab === 'overview' },
    { name: 'Articles', href: '/dashboard/articles', icon: FiFileText, current: activeTab === 'articles' },
    { name: 'Bookmarks', href: '/dashboard/bookmarks', icon: FiBookmark, current: activeTab === 'bookmarks' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2, current: activeTab === 'analytics' },
    { name: 'Settings', href: '/dashboard/settings', icon: FiSettings, current: activeTab === 'settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r dark:border-gray-700">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center space-x-3">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ''}
                    width={40}
                    height={40}
                    className="rounded-full"
                    priority={true}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {session?.user?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        item.current
                          ? 'text-gray-500 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="flex-1 pb-8">
            {/* Page header */}
            <div className="bg-white dark:bg-gray-800 shadow">
              <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
                <div className="py-6 md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:leading-9 sm:truncate">
                      Welcome back, {session?.user?.name}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
