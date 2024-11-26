'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'
import { BsLightningChargeFill } from 'react-icons/bs'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Something went wrong')
      }

      // Sign in the user after successful registration
      await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-900 dark:to-green-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-200 to-pink-300 dark:from-pink-900 dark:to-pink-800 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-6">
          <div className="relative animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg transform rotate-12 flex items-center justify-center">
              <div className="transform -rotate-12 text-white text-3xl font-bold">M</div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12">
              <BsLightningChargeFill className="w-3 h-3 text-yellow-900 transform -rotate-12" />
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Join the community
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500 dark:text-blue-400 dark:hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-gray-600">
          {/* Features List */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Create an account to:</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-gray-600 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-gray-400"></span>
                </span>
                Share your stories with millions of readers
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-gray-600 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-gray-400"></span>
                </span>
                Connect with a global community of writers
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-gray-600 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-gray-400"></span>
                </span>
                Earn money from your writing
              </li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 dark:from-green-900 dark:to-green-800 hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-900 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-[1.02]"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-900"
              >
                <FcGoogle className="h-5 w-5" />
              </button>
              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-green-900"
              >
                <FaGithub className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
              By signing up, you agree to our{' '}
              <a href="#" className="text-green-600 hover:text-green-500 dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-green-600 hover:text-green-500 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
