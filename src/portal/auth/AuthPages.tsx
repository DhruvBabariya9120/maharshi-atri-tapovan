import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Circle, Loader2 } from 'lucide-react'
import { FieldWrap, Input } from '../../components/ui/Field'
import { api, ApiError, type AuthResponse, type Schemas } from '../api/client'
import { AuthHeading, AuthLayout, Notice } from '../layout/AuthLayout'
import { FullPageSpinner, homeFor, useSession } from './session'

const STAFF = 'School office'
const PORTAL = 'Student portal'

/* ---------- shared bits ---------- */

/** Server rule: 10-72 characters, at least one digit, not the account email. */
function passwordChecks(password: string, email: string) {
  return [
    { label: 'At least 10 characters', ok: password.length >= 10 && password.length <= 72 },
    { label: 'Includes a number', ok: /\d/.test(password) },
    {
      label: 'Not the same as your email',
      ok: !!password && password.toLowerCase() !== email.toLowerCase(),
    },
  ]
}

const newPasswordSchema = (email: string) =>
  z
    .object({ password: z.string(), confirm: z.string() })
    .refine((v) => passwordChecks(v.password, email).every((c) => c.ok), {
      path: ['password'],
      message: 'Choose a password that meets every rule below',
    })
    .refine((v) => v.password === v.confirm, {
      path: ['confirm'],
      message: "Passwords don't match",
    })

type NewPassword = z.infer<ReturnType<typeof newPasswordSchema>>

function PasswordRules({ password, email }: { password: string; email: string }) {
  return (
    <ul className="flex flex-col gap-1.5 rounded-xl bg-slate-100 px-3.5 py-3 text-[13px]">
      {passwordChecks(password, email).map((c) => (
        <li
          key={c.label}
          className={`flex items-center gap-2 ${c.ok ? 'text-green-700' : 'text-muted'}`}
        >
          {c.ok ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          {c.label}
        </li>
      ))}
    </ul>
  )
}

function SubmitButton({ busy, children }: { busy: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="bg-brand hover:bg-brand-dark inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)] transition-colors disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

function formatUnlockTime(retryAfterSeconds: number) {
  return new Date(Date.now() + retryAfterSeconds * 1000).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/* ---------- Login ---------- */

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export function Login() {
  const { user, status, signIn } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  const login = useMutation({
    mutationFn: (body: Schemas['LoginDto']) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body }),
    onSuccess: (auth) => {
      signIn(auth)
      const home = homeFor(auth.user.role)
      navigate(next.startsWith(home) ? next : home, { replace: true })
    },
  })

  if (status === 'loading') return <FullPageSpinner />
  // Already signed in when arriving here. (After a fresh login, onSuccess navigates to `next`.)
  if (user && !login.isSuccess) return <Navigate to={homeFor(user.role)} replace />

  const err = login.error instanceof ApiError ? login.error : null
  const errorText = !login.error
    ? null
    : err?.status === 401
      ? 'Email or password is incorrect.'
      : err?.status === 423
        ? `Too many attempts. This account is locked until ${formatUnlockTime(err.body?.retryAfter ?? 900)}. Try again then, or reset your password.`
        : err?.status === 429
          ? 'Too many attempts from this device. Wait a minute, then try again.'
          : "We couldn't sign you in. Check your connection and try again."

  return (
    <AuthLayout
      title="Sign in"
      kicker={STAFF}
      headline="Students, fees and results in one place."
      lead="Admins manage records and publish results. Students and parents sign in to see fees and published marks."
      footnote="Need access? Ask the school office for an invite link."
    >
      <AuthHeading title="Sign in" sub="Students use the guardian email the invite was sent to." />
      {errorText && <Notice tone={err?.status === 423 ? 'warning' : 'error'}>{errorText}</Notice>}
      <form
        onSubmit={handleSubmit((v) => login.mutate(v))}
        noValidate
        className="flex flex-col gap-5"
      >
        <FieldWrap label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </FieldWrap>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-heading text-sm font-medium">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-brand hover:text-brand-dark text-[13px] font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {errors.password && (
            <span className="text-xs font-medium text-red-500" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>
        <SubmitButton busy={login.isPending}>Sign in</SubmitButton>
        <p className="text-muted text-center text-[13px]">
          Admins go to the admin panel. Students go to their portal.
        </p>
      </form>
    </AuthLayout>
  )
}

/* ---------- Forgot password ---------- */

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.email('Enter a valid email address') })),
  })
  const forgot = useMutation({
    mutationFn: (body: Schemas['ForgotPasswordDto']) =>
      api('/auth/forgot-password', { method: 'POST', body }),
  })
  const tooMany = forgot.error instanceof ApiError && forgot.error.status === 429

  return (
    <AuthLayout
      title="Forgot password"
      kicker={STAFF}
      headline="Forgot your password?"
      lead="We'll email you a link to set a new one. The link works once and lasts 30 minutes."
      footnote="No longer have that email? Ask the school office to update it."
    >
      <AuthHeading title="Reset password" sub="Enter the email you sign in with." />
      {forgot.isSuccess && (
        <Notice tone="success">
          If an account uses that email, we've sent a reset link. Check your inbox and spam folder.
        </Notice>
      )}
      {forgot.isError && (
        <Notice tone="error">
          {tooMany
            ? 'Too many requests. Wait a minute, then try again.'
            : "We couldn't send the link. Try again."}
        </Notice>
      )}
      <form
        onSubmit={handleSubmit((v) => forgot.mutate(v))}
        noValidate
        className="flex flex-col gap-5"
      >
        <FieldWrap label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </FieldWrap>
        <SubmitButton busy={forgot.isPending}>Send reset link</SubmitButton>
        <Link
          to="/login"
          className="text-brand hover:text-brand-dark text-center text-sm font-medium"
        >
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  )
}

/* ---------- Reset password ---------- */

export function ResetPassword() {
  const navigate = useNavigate()
  const token = useSearchParams()[0].get('token') ?? ''
  // The reset link doesn't carry the email, so the "not your email" rule is checked by the server.
  const form = useForm<NewPassword>({ resolver: zodResolver(newPasswordSchema('')) })
  const reset = useMutation({
    mutationFn: (password: string) =>
      api('/auth/reset-password', { method: 'POST', body: { token, newPassword: password } }),
    onSuccess: () => {
      toast.success('Password changed. Sign in with your new password.')
      navigate('/login', { replace: true })
    },
  })
  const expired = !token || (reset.error instanceof ApiError && reset.error.status === 410)
  const [password, setPassword] = useState('')

  return (
    <AuthLayout
      title="Reset password"
      kicker={STAFF}
      headline="Choose a new password."
      lead="After you save it, every device signed in to this account is signed out."
      footnote="Reset links work once and last 30 minutes."
    >
      <AuthHeading title="New password" />
      {expired ? (
        <>
          <Notice tone="warning">This reset link has expired or was already used.</Notice>
          <Link
            to="/forgot-password"
            className="text-brand hover:text-brand-dark text-center text-sm font-medium"
          >
            Send a new link
          </Link>
        </>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => reset.mutate(v.password))}
          noValidate
          className="flex flex-col gap-5"
        >
          {reset.isError && <Notice tone="error">{reset.error.message}</Notice>}
          <FieldWrap
            label="New password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.password?.message}
              {...form.register('password', { onChange: (e) => setPassword(e.target.value) })}
            />
          </FieldWrap>
          <PasswordRules password={password} email="" />
          <FieldWrap
            label="Confirm password"
            htmlFor="confirm"
            error={form.formState.errors.confirm?.message}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.confirm?.message}
              {...form.register('confirm')}
            />
          </FieldWrap>
          <SubmitButton busy={reset.isPending}>Save password</SubmitButton>
        </form>
      )}
    </AuthLayout>
  )
}

/* ---------- Accept invite ---------- */

export function AcceptInvite() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const token = useSearchParams()[0].get('token') ?? ''

  const preview = useQuery({
    queryKey: ['invitation', token],
    queryFn: () =>
      api<Schemas['InvitationPreviewDto']>(`/auth/invitations/${encodeURIComponent(token)}`),
    enabled: !!token,
  })
  const email = preview.data?.email ?? ''
  const form = useForm<NewPassword>({ resolver: zodResolver(newPasswordSchema(email)) })
  const [password, setPassword] = useState('')

  const accept = useMutation({
    mutationFn: (pw: string) =>
      api<AuthResponse>('/auth/invitations/accept', {
        method: 'POST',
        body: { token, password: pw },
      }),
    onSuccess: (auth) => {
      signIn(auth)
      navigate(homeFor(auth.user.role), { replace: true })
    },
  })

  const status =
    (preview.error ?? accept.error) instanceof ApiError
      ? ((preview.error ?? accept.error) as ApiError).status
      : null
  const isStudent = preview.data?.role !== 'ADMIN'

  return (
    <AuthLayout
      title="Accept invite"
      kicker={isStudent ? PORTAL : STAFF}
      headline="Welcome to Tapovan."
      lead={
        isStudent
          ? 'Set a password to see your fees, receipts and published results.'
          : 'Set a password to start using the admin panel.'
      }
      footnote={
        preview.data &&
        `This invite link works once and expires on ${new Date(preview.data.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}.`
      }
    >
      <AuthHeading
        title="Set up your account"
        sub={preview.data && `The school invited you as ${isStudent ? 'a student' : 'an admin'}.`}
      />
      {!token || status === 404 ? (
        <Notice tone="error">
          This invite is no longer valid. Contact the school office for a new one.
        </Notice>
      ) : status === 410 ? (
        <>
          <Notice tone="warning">
            This invite has expired or was already used. If you've set your password, sign in.
            Otherwise ask the school office to send a new invite.
          </Notice>
          <Link
            to="/login"
            className="text-brand hover:text-brand-dark text-center text-sm font-medium"
          >
            Go to sign in
          </Link>
        </>
      ) : preview.isPending ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="text-brand h-8 w-8 animate-spin" />
        </div>
      ) : preview.isError ? (
        <Notice tone="error">We couldn't load this invite. Refresh the page to try again.</Notice>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => accept.mutate(v.password))}
          noValidate
          className="flex flex-col gap-4"
        >
          {accept.isError && <Notice tone="error">{accept.error.message}</Notice>}
          <FieldWrap label="Name" htmlFor="name">
            <Input id="name" value={preview.data.fullName} readOnly className="bg-surface" />
          </FieldWrap>
          <FieldWrap label="Email" htmlFor="invite-email">
            <Input id="invite-email" value={email} readOnly className="bg-surface" />
          </FieldWrap>
          <FieldWrap
            label="New password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.password?.message}
              {...form.register('password', { onChange: (e) => setPassword(e.target.value) })}
            />
          </FieldWrap>
          <PasswordRules password={password} email={email} />
          <FieldWrap
            label="Confirm password"
            htmlFor="confirm"
            error={form.formState.errors.confirm?.message}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              error={form.formState.errors.confirm?.message}
              {...form.register('confirm')}
            />
          </FieldWrap>
          <SubmitButton busy={accept.isPending}>Create account</SubmitButton>
        </form>
      )}
    </AuthLayout>
  )
}
