import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-xl font-bold text-primary-600">
        🤖 DocBot
      </Link>
      <div className="flex items-center gap-4">
        {user?.user_type === 'developer' && (
          <Link to="/dev" className="text-sm text-gray-600 hover:text-primary-600 font-medium">
            API Keys
          </Link>
        )}
        <span className="text-sm text-gray-500">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}