'use client'

import { useState } from 'react'

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <p className="text-green-800 text-sm text-center">{message}</p>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-red-600 text-sm mt-1">{message}</p>
  )
}

export function EmailInput() {
  return (
    <div className="space-y-2">
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        Email:
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      />
    </div>
  )
}

interface PasswordInputProps {
  error?: string | undefined
}

export function PasswordInput({ error }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
        Password:
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          className="w-full px-3 py-2 pr-10 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  )
}
