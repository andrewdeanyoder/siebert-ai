import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome to A&P Memory Lab
        </h1>
                  {params.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 text-sm text-center">{params.success}</p>
            </div>
          )}
        <div className="space-y-4">
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

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
            {params.error && (
              <p className="text-red-600 text-sm mt-1">{params.error}</p>
            )}
          </div>
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