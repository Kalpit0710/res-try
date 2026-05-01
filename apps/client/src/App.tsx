import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<PlaceholderPage title="Dashboard" />} />
        <Route path="students" element={<PlaceholderPage title="Students" />} />
        <Route path="classes" element={<PlaceholderPage title="Classes" />} />
        <Route path="subjects" element={<PlaceholderPage title="Subjects" />} />
        <Route path="teachers" element={<PlaceholderPage title="Teachers" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="logs" element={<PlaceholderPage title="Logs" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
