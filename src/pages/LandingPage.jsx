import { Link } from 'react-router-dom';
import { Stethoscope, Activity, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Avg. triage time', value: '11s' },
  { label: 'Slot fill accuracy', value: '98.4%' },
  { label: 'Adherence lift', value: '+32%' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">CareSlot AI</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Asymmetric hero: 7/5 split, copy-heavy left, live-status card right */}
      <main className="container grid grid-cols-1 gap-12 py-12 lg:grid-cols-12 lg:py-20">
        <div className="animate-fade-up lg:col-span-7">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            CareSlot AI 1.0
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
            The Intelligent Operating System for{' '}
            <span className="text-primary">Modern Healthcare Logistics.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            CareSlot AI reads a patient's symptoms, infers the right specialist and
            urgency in seconds, and locks in a slot — while your front desk watches
            it all happen on a live operations dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup?role=patient">
              <Button size="lg" className="group">
                Patient Portal
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Link>
            <Link to="/signup?role=doctor">
              <Button size="lg" variant="secondary" className="group">
                Doctor Dashboard
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Link>
            <Link to="/signup?role=admin">
              <Button size="lg" variant="outline" className="group">
                Admin Dashboard
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature element: live triage-to-slot visual */}
        <div className="animate-fade-in lg:col-span-5" style={{ animationDelay: '0.15s' }}>
          <div className="relative rounded-3xl border border-border bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Activity className="h-4 w-4 text-accent" />
              Live triage
            </div>
            <div className="mt-4 rounded-xl bg-muted p-4 text-sm text-slate-700">
              "My wisdom tooth is aching severely, worse at night."
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                High priority
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                Dentist
              </span>
            </div>

            <div className="mt-6 space-y-2">
              {['Dr. Ananya Rao · 10:00 AM', 'Dr. Ananya Rao · 11:00 AM'].map((slot) => (
                <div
                  key={slot}
                  className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm"
                >
                  <span className="text-slate-700">{slot}</span>
                  <span className="text-xs font-medium text-primary">Open</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs text-primary">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Booking confirmed &amp; synced to the clinic's live queue.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
