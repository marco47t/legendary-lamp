import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BotDetail from './pages/BotDetail'
import DevPortal from './pages/DevPortal'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute noLayout>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/bots/:id" element={<ProtectedRoute><BotDetail /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute noLayout><Analytics /></ProtectedRoute>} />
        <Route path="/dev" element={<ProtectedRoute noLayout><DevPortal /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}