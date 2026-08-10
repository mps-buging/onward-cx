import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RootRedirect } from "@/components/RootRedirect"
import { SignupPage } from "@/pages/SignupPage"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ClientDetailPage } from "@/pages/ClientDetailPage"
import { AuthCallbackPage } from "@/pages/AuthCallbackPage"
import { TemplateListPage } from "@/pages/settings/TemplateListPage"
import { TemplateBuilderPage } from "@/pages/settings/TemplateBuilderPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/settings" element={<Navigate to="/settings/templates" replace />} />
          <Route path="/settings/templates" element={<TemplateListPage />} />
          <Route path="/settings/templates/new" element={<TemplateBuilderPage />} />
          <Route path="/settings/templates/:id/edit" element={<TemplateBuilderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
