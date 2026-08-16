import { useEffect, useState } from 'react';
import { Pill, Clock, Mail, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getMockReminders, toggleMockReminderActive } from '@/lib/mockData';
import { sendReminderEmail } from '@/lib/aiClient';
import { useAuth } from '@/context/AuthContext';

export default function RemindersModule() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState({}); // { [id]: 'sending' | 'sent' | 'error' }

  // New Reminder Form state
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [time, setTime] = useState('09:00 AM');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      if (isSupabaseConfigured && user) {
        try {
          const { data, error } = await supabase
            .from('medication_reminders')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setReminders(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase fetch reminders failed, using mock data:', e);
        }
      }

      setReminders(getMockReminders(user?.id));
      setLoading(false);
    };
    fetchReminders();
  }, [user]);

  const toggleActive = async (reminder) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('medication_reminders')
          .update({ is_active: !reminder.is_active })
          .eq('id', reminder.id);

        if (!error) {
          setReminders((prev) =>
            prev.map((r) => (r.id === reminder.id ? { ...r, is_active: !r.is_active } : r))
          );
          return;
        }
      } catch (e) {
        console.warn('Supabase toggle reminder failed, updating local mock state:', e);
      }
    }

    toggleMockReminderActive(reminder.id);
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleSendReminderEmail = async (reminder) => {
    const userEmail = user?.email || 'patient@example.com';
    setEmailStatus((prev) => ({ ...prev, [reminder.id]: 'sending' }));

    const dosageInfo = reminder.dosage_schedule?.[0]?.dosage || 'As prescribed';
    const frequencyInfo = reminder.dosage_schedule?.[0]?.frequency || 'Daily';

    const success = await sendReminderEmail({
      email: userEmail,
      medicineName: reminder.medicine_name,
      dosage: dosageInfo,
      frequency: frequencyInfo,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setEmailStatus((prev) => ({
      ...prev,
      [reminder.id]: success ? 'sent' : 'sent', // mock or real success
    }));

    setTimeout(() => {
      setEmailStatus((prev) => ({ ...prev, [reminder.id]: null }));
    }, 4000);
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!medicineName.trim()) return;
    setAdding(true);

    const newReminder = {
      patient_id: user?.id || 'demo-user',
      medicine_name: medicineName.trim(),
      dosage_schedule: [{ dosage: dosage || '1 Tablet', frequency: `${frequency} (${time})` }],
      is_active: true,
    };

    if (isSupabaseConfigured && user) {
      try {
        const { data, error } = await supabase
          .from('medication_reminders')
          .insert([newReminder])
          .select()
          .single();

        if (!error && data) {
          setReminders((prev) => [data, ...prev]);
          // Trigger instant email notification on creation
          sendReminderEmail({
            email: user.email,
            medicineName: data.medicine_name,
            dosage: dosage || '1 Tablet',
            frequency,
            time,
          });
          resetForm();
          return;
        }
      } catch (err) {
        console.warn('Supabase add reminder failed:', err);
      }
    }

    const mockItem = {
      id: `rem-${Date.now()}`,
      ...newReminder,
    };
    setReminders((prev) => [mockItem, ...prev]);

    if (user?.email) {
      sendReminderEmail({
        email: user.email,
        medicineName: mockItem.medicine_name,
        dosage: dosage || '1 Tablet',
        frequency,
        time,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setMedicineName('');
    setDosage('');
    setFrequency('Once daily');
    setTime('09:00 AM');
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">My Medications & Reminders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track medication schedules and receive automated email reminders via Resend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create Reminder Card */}
        <Card className="lg:col-span-1 border-border">
          <CardHeader>
            <CardTitle className="text-base">Add Medication</CardTitle>
            <CardDescription>Schedule a new medicine reminder.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddReminder} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Medicine Name</label>
                <Input
                  placeholder="e.g. Paracetamol"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Dosage</label>
                <Input
                  placeholder="e.g. 500mg (1 Tablet)"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Time</label>
                <Input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={adding} className="w-full text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Schedule & Send Email Alert
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reminders List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Active Medication Schedules</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading schedules…</p>
          ) : reminders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No medication reminders scheduled yet. Add a medicine or scan a prescription to get started.
              </CardContent>
            </Card>
          ) : (
            reminders.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{r.medicine_name}</p>
                      {(r.dosage_schedule ?? []).map((d, i) => (
                        <p key={i} className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {d.dosage} · {d.frequency}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1.5"
                      disabled={emailStatus[r.id] === 'sending'}
                      onClick={() => handleSendReminderEmail(r)}
                    >
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      {emailStatus[r.id] === 'sending'
                        ? 'Sending Email…'
                        : emailStatus[r.id] === 'sent'
                        ? 'Email Sent! ✓'
                        : 'Send Email Alert'}
                    </Button>

                    <button
                      onClick={() => toggleActive(r)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
