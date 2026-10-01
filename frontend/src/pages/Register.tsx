import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';

const UID_PATTERN = /^\d{6,12}$/;
const MOBILE_PATTERN = /^\d{7,15}$/;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    freeFireUid: '',
    nickname: '',
    mobile: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): string | null => {
    if (form.fullName.trim().length < 2) return 'Enter your full name.';
    if (!UID_PATTERN.test(form.freeFireUid)) return 'Free Fire UID must be 6–12 digits.';
    if (form.nickname.trim().length < 2) return 'Enter your Free Fire nickname.';
    if (!MOBILE_PATTERN.test(form.mobile)) return 'Enter a valid mobile number.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(readableAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-sm mx-auto">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-arena-orange">Join the Arena</h1>
        <p className="text-arena-muted text-sm mt-1">Register once, play every tournament</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" value={form.fullName} onChange={update('fullName')} autoComplete="name" />
        <Field
          label="Free Fire UID"
          value={form.freeFireUid}
          onChange={update('freeFireUid')}
          inputMode="numeric"
          placeholder="e.g. 123456789"
        />
        <Field label="Free Fire nickname" value={form.nickname} onChange={update('nickname')} />
        <Field
          label="Mobile number"
          value={form.mobile}
          onChange={update('mobile')}
          inputMode="tel"
          autoComplete="tel"
        />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} autoComplete="email" />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-arena-red">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-arena-muted mt-6">
        Already registered?{' '}
        <Link to="/login" className="text-arena-orange font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} required className="input" {...inputProps} />
    </div>
  );
}

function readableAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('email-already-in-use')) return 'That email is already registered.';
  if (code.includes('weak-password')) return 'Password is too weak.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  return 'Registration failed. Please try again.';
}
