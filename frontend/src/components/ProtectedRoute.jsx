import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

export default function ProtectedRoute({ children, noLayout = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (noLayout) return children
  return <Layout>{children}</Layout>
}