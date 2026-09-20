import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'

const INITIAL_FORM = { name: '', email: '', mobile: '', role: 'PROJECT_MANAGER', password: '', confirmPassword: '' }
const ROLE_OPTIONS = [{ value: 'PROJECT_MANAGER', label: 'Project Manager' }]

function validate(form) {
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Enter your full name (at least 2 characters).'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s|-/g, ''))) errors.mobile = 'Enter a valid 10-digit Indian mobile number.'
  if (!form.role) errors.role = 'Select a role.'
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export default function SignupForm() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const updateField = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })); setSubmitError('') }
  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(error.message || 'Unable to create the account. Please try again.')
    }
  }
  const passwordControl = (visible, onToggle, label) => <button type="button" onClick={onToggle} className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25" aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center"><img src={logo} alt="Land Acquisition Delay Monitoring System logo" className="mx-auto h-12 w-auto object-contain" /><h1 className="text-base font-bold text-gray-800">Create your account</h1><p className="text-xs text-gray-500">Register to access the Land Acquisition Delay Monitoring System.</p></div>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Input label="Full Name" name="name" autoComplete="name" value={form.name} onChange={(event) => updateField('name', event.target.value)} error={errors.name} aria-invalid={Boolean(errors.name)} />
          <Input label="Email Address" type="email" name="email" autoComplete="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} error={errors.email} aria-invalid={Boolean(errors.email)} />
          <Input label="Mobile Number" type="tel" name="mobile" autoComplete="tel" inputMode="numeric" value={form.mobile} onChange={(event) => updateField('mobile', event.target.value)} error={errors.mobile} aria-invalid={Boolean(errors.mobile)} />
          <Select label="Role" name="role" value={form.role} options={ROLE_OPTIONS} onChange={(event) => updateField('role', event.target.value)} error={errors.role} aria-invalid={Boolean(errors.role)} />
          <Input label="Password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" value={form.password} onChange={(event) => updateField('password', event.target.value)} error={errors.password} aria-invalid={Boolean(errors.password)} endAdornment={passwordControl(showPassword, () => setShowPassword((visible) => !visible), 'password')} />
          <Input label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} error={errors.confirmPassword} aria-invalid={Boolean(errors.confirmPassword)} endAdornment={passwordControl(showConfirmPassword, () => setShowConfirmPassword((visible) => !visible), 'confirm password')} />
          {submitError ? <p role="alert" className="-mt-1 text-xs leading-relaxed text-red-600">{submitError}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</Button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">Already have an account? <Link to="/login" className="font-medium text-accent hover:text-accent-dark">Login</Link></p>
      </div>
    </div>
  )
}
