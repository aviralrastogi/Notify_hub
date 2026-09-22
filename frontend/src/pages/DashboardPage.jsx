import { useAuth } from '../context/AuthContext'
import PushSubscribeBtn from '../components/PushSubscribeBtn'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}! 👋</h1>
          <p className="text-gray-500 mb-6">You&apos;re logged in to NotifyHub.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-sm text-indigo-600 font-medium">Email</div>
              <div className="text-gray-700 mt-1">{user?.email || '—'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Phone</div>
              <div className="text-gray-700 mt-1">{user?.phone_number || '—'}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium">Role</div>
              <div className="text-gray-700 mt-1">{user?.is_staff ? 'Admin' : 'User'}</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">🔔 Web Push Notifications</h2>
            <p className="text-sm text-gray-500 mb-4">
              Enable browser notifications to receive real-time updates.
            </p>
            <PushSubscribeBtn />
          </div>
        </div>
      </div>
    </div>
  )
}
