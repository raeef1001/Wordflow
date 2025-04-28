'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { FiEdit, FiUser, FiSearch } from 'react-icons/fi'
import ThemeToggle from './ThemeToggle'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Assuming the search query is a tag, we'll search by tag
      const searchParams = new URLSearchParams()
      searchParams.append('tags[]', searchQuery.trim())
      router.push(`/?${searchParams.toString()}`)
    }
  }

  return (
    <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-transparent bg-clip-text">WordFlow</h1>
          </Link>

          {/* Search */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search by tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-full bg-muted/50 dark:bg-muted text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </form>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <ThemeToggle />
            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/write"
                  className="hidden md:flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiEdit className="h-5 w-5" />
                  <span>Write</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <div className="group">
                    <button className="flex items-center space-x-2">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || ''}
                          width={32}
                          height={32}
                          className="rounded-full ring-2 ring-primary/20"
                          priority={true}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20">
                          <FiUser className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                    <div className="invisible group-hover:visible absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-card ring-1 ring-border backdrop-blur-md z-50 transition-all duration-150 transform origin-top scale-95 group-hover:scale-100">
                      <div className="py-1">
                        <Link
                          href={`/profile/${session.user.id}`}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => signOut()}
                          className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
