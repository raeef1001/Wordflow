'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'
import { BsLightningChargeFill } from 'react-icons/bs'

interface AuthFormProps {
  type: 'signin' | 'signup'
}

export function AuthForm({ type }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (type === 'signup') {
        // Register new user
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Failed to sign up')
        }

        // Sign in after successful registration
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl: '/',
        })
      } else {
        // Sign in existing user
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error('Invalid email or password')
        }

        window.location.href = '/'
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200 to-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        {/* Logo */}
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

        {/* Heading */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {type === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {type === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={type === 'signin' ? '/auth/signup' : '/auth/signin'}
            className="font-medium text-green-600 hover:text-green-500"
          >
            {type === 'signin' ? 'Sign up for free' : 'Sign in'}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white/80 backdrop-blur-lg py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100">
          {/* Features List */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              {type === 'signin' ? 'Sign in to:' : 'Create an account to:'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                </span>
                {type === 'signin' ? 'Write and publish articles' : 'Share your stories with millions of readers'}
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                </span>
                {type === 'signin' ? 'Interact with other writers' : 'Connect with a global community of writers'}
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                </span>
                {type === 'signin' ? 'Build your personal brand' : 'Earn money from your writing'}
              </li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {type === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={type === 'signup' ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              {type === 'signup' && (
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              )}
            </div>

            {type === 'signin' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-green-600 hover:text-green-500">
                    Forgot your password?
                  </a>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-[1.02]"
              >
                {isLoading
                  ? type === 'signin' ? 'Signing in...' : 'Creating account...'
                  : type === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition hover:scale-[1.02]"
              >
                <FcGoogle className="h-5 w-5" />
              </button>
              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition hover:scale-[1.02]"
              >
                <FaGithub className="h-5 w-5" />
              </button>
            </div>

            {type === 'signup' && (
              <p className="mt-6 text-xs text-center text-gray-500">
                By signing up, you agree to our{' '}
                <a href="#" className="text-green-600 hover:text-green-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-green-600 hover:text-green-500">
                  Privacy Policy
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
