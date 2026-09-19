import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('rakesh.patnaik@lrd.odisha.gov.in')
  const [password, setPassword] = useState('demo-password')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await login({ email, password })
    navigate('/project-manager/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <h1 className="text-base font-bold text-gray-800">Land Acquisition Delay Monitoring System</h1>
          <p className="text-xs text-gray-500">Ministry of Rural Development | Dept. of Land Resources</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Official Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-[10px] text-gray-400">
          Demo build — authentication is mocked. Any credentials will sign in as the District Project Manager.
        </p>
      </div>
    </div>
  )
}
