import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { sendAuthEmail } from '@/lib/aiClient';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paramRole = searchParams.get('role');
  const initialRole = paramRole === 'admin' ? 'admin' : paramRole === 'doctor' ? 'doctor' : 'patient';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    const { data, profile: newProfile, error: authErr } = await signUp({ email, password, fullName, role });
    setBusy(false);

    if (authErr) {
      setError(authErr.message);
      return;
    }

    // Trigger welcome email (non-blocking)
    if (data?.user?.email) {
      sendAuthEmail({
        email: data.user.email,
        type: 'signup',
        fullName,
      }).catch(() => {});
    }

    const userRole = newProfile?.role || role;
    if (userRole === 'doctor') {
      navigate('/doctor-dashboard', { replace: true });
    } else if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/patient', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">CareSlot AI</span>
        </Link>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold text-slate-800">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join CareSlot AI in under a minute.</p>

          <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {['patient', 'doctor', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-md py-2 text-xs font-medium capitalize transition-colors ${
                  role === r ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jordan Patel" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Creating account…' : `Create ${role} account`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
