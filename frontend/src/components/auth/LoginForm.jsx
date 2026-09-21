import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import { useAuth } from '../../context/AuthContext.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const signedIn = await login({ email, password })
      const isAdmin = signedIn?.role === 'ADMIN'

      // Redirect based on backend evaluation parameters
      navigate(isAdmin ? '/admin/dashboard' : '/project-manager/dashboard', { replace: true })
    } catch (err) {
      console.error("Login failure: ", err)
      setError(err?.response?.data?.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="SANKET logo" className="mx-auto h-12 w-auto object-contain" />
          <h1 className="text-base font-bold text-gray-800">SANKET</h1>
          <p className="text-xs text-gray-500">Land Acquisition Delay Predictor</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Official Email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Don't have an account? <Link to="/signup" className="font-medium text-accent hover:text-accent-dark">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
