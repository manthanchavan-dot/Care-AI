import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Stethoscope, User, Stethoscope as DoctorIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { sendAuthEmail } from '@/lib/aiClient';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const paramRole = searchParams.get('role');
  const initialRole = paramRole === 'admin' ? 'admin' : paramRole === 'doctor' ? 'doctor' : 'patient';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState(initialRole === 'doctor' ? 'dr.rohan@careslot.com' : initialRole === 'admin' ? 'admin@careslot.com' : '');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'doctor') {
      setEmail('dr.rohan@careslot.com');
      setPassword('doctor123');
    } else if (newRole === 'admin') {
      setEmail('admin@careslot.com');
      setPassword('admin123');
    } else {
      setEmail('patient@careslot.com');
      setPassword('patient123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    const { data, profile: userProfile, error: authErr } = await signIn({ email, password, role });
    setBusy(false);

    if (authErr) {
      setError(authErr.message);
      return;
    }

    // Trigger login notification email (non-blocking)
    if (data?.user?.email) {
      sendAuthEmail({
        email: data.user.email,
        type: 'login',
        fullName: userProfile?.full_name,
      }).catch(() => {});
    }

    const dest = location.state?.from?.pathname;
    const finalRole = userProfile?.role || role;

    if (dest && !dest.startsWith('/login') && !dest.startsWith('/signup')) {
      navigate(dest, { replace: true });
      return;
    }

    if (finalRole === 'doctor') {
      navigate('/doctor-dashboard', { replace: true });
    } else if (finalRole === 'admin') {
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
          <h1 className="font-display text-xl font-bold text-slate-800">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to continue to your dashboard.</p>

          <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {[
              { id: 'patient', label: 'Patient', icon: User },
              { id: 'doctor', label: 'Doctor', icon: DoctorIcon },
              { id: 'admin', label: 'Admin', icon: Shield },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRoleChange(item.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium capitalize transition-colors ${
                    role === item.id ? 'bg-white text-primary shadow-xs font-semibold' : 'text-muted-foreground hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full capitalize" disabled={busy}>
              {busy ? 'Logging in…' : `Log in to ${role} Portal`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account yet?{' '}
            <Link to={`/signup?role=${role}`} className="font-medium text-primary hover:underline">
              Sign up as {role}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
