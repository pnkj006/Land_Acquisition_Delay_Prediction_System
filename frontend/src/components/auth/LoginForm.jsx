import { useState } from 'react'
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
=======
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import { DEMO_ADMIN_EMAIL, useAuth } from '../../context/AuthContext.jsx'
>>>>>>> 584dfbe (Add admin pages and update SANKET branding)
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'

const PM_DEMO_EMAIL = 'rakesh.patnaik@lrd.odisha.gov.in'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('project-manager')
  const [email, setEmail] = useState(PM_DEMO_EMAIL)
  const [password, setPassword] = useState('demo-password')
  const [submitting, setSubmitting] = useState(false)

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await login({ email, password })
    navigate('/project-manager/dashboard', { replace: true })
=======
  const handleRoleChange = (event) => {
    const nextRole = event.target.value
    setRole(nextRole)
    setEmail(nextRole === 'admin' ? DEMO_ADMIN_EMAIL : PM_DEMO_EMAIL)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    const signedIn = await login({ email, password, role })
    const isAdmin = signedIn?.roleKey === 'admin' || signedIn?.role === 'Administrator'
    navigate(isAdmin ? '/admin/dashboard' : '/dashboard', { replace: true })
>>>>>>> 584dfbe (Add admin pages and update SANKET branding)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
<<<<<<< HEAD
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
=======
          <img src={logo} alt="SANKET logo" className="mx-auto h-12 w-auto object-contain" />
          <h1 className="text-base font-bold text-gray-800">SANKET</h1>
          <p className="text-xs text-gray-500">Land Acquisition Delay Predictor</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Login as"
            name="role"
            value={role}
            onChange={handleRoleChange}
            options={[
              { value: 'project-manager', label: 'Project Manager' },
              { value: 'admin', label: 'Administrator' },
            ]}
          />
          <Input label="Official Email" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</Button>
        </form>
        <p className="mt-4 text-center text-[10px] text-gray-400">
          Demo build — authentication is mocked. Use the pre-filled Project Manager account, or{' '}
          <span className="font-medium text-gray-500">admin@lrd.odisha.gov.in</span> / demo-password for Administrator.
        </p>
        <p className="mt-3 text-center text-xs text-gray-500">Don't have an account? <Link to="/signup" className="font-medium text-accent hover:text-accent-dark">Sign Up</Link></p>
>>>>>>> 584dfbe (Add admin pages and update SANKET branding)
      </div>
    </div>
  )
}
