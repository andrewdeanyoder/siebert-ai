'use client'

import { login, signup } from './actions'
import { SuccessMessage, EmailInput, PasswordInput } from '../../components/FormComponents'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }> | { error?: string; success?: string }
}) {
  // todo: is this code correct?
  const params = searchParams instanceof Promise ? { error: undefined, success: undefined } : searchParams
  // todo: factor out a reusable form component to use in the reset password forms?
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome to A&P Memory Lab
        </h1>
        {params.success && <SuccessMessage message={params.success} />}
        <div className="space-y-4">
          <EmailInput />
          <PasswordInput error={params.error || undefined} />
        </div>
        <div className="space-y-3">
          <button
            formAction={login}
            className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}