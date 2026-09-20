import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import { useAuth } from '../../context/AuthContext.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('rakesh.patnaik@lrd.odisha.gov.in')
  const [password, setPassword] = useState('demo-password')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    await login({ email, password })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Land Acquisition Delay Monitoring System logo" className="mx-auto h-12 w-auto object-contain" />
          <h1 className="text-base font-bold text-gray-800">Land Acquisition Delay Monitoring System</h1>
          <p className="text-xs text-gray-500">Ministry of Rural Development | Dept. of Land Resources</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Official Email" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</Button>
        </form>
        <p className="mt-4 text-center text-[10px] text-gray-400">Demo build — authentication is mocked. Any credentials will sign in as the District Project Manager.</p>
        <p className="mt-3 text-center text-xs text-gray-500">Don't have an account? <Link to="/signup" className="font-medium text-accent hover:text-accent-dark">Sign Up</Link></p>
      </div>
    </div>
  )
}
