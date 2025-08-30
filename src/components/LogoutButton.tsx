'use client'

import { logout } from '#/app/login/actions'

export default function LogoutButton() {
  const handleLogout = async () => {
    await logout()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-black text-white border border-white rounded hover:bg-gray-800 transition-colors"
      aria-label="Log Out"
    >
      Log Out
    </button>
  )
}
