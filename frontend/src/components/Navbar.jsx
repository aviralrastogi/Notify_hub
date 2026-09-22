import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      toast.success('Logged out successfully')
    } catch (e) {
      toast.error('Logout failed')
    }
  }

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-lg tracking-tight">🔔 NotifyHub</Link>
        {user && (
          <>
            <Link to="/dashboard" className="hover:text-indigo-200 text-sm">Dashboard</Link>
            {user.is_staff && (
              <Link to="/admin/notifications" className="hover:text-indigo-200 text-sm">Notification Settings</Link>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-indigo-200">Hi, {user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-indigo-900 hover:bg-indigo-800 px-3 py-1.5 rounded text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-200 text-sm">Login</Link>
            <Link to="/register" className="bg-white text-indigo-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-indigo-100">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
