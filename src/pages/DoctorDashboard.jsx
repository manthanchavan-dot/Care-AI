import { useEffect, useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CalendarDays,
  Plus,
  Trash2,
  Search,
  Users,
} from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getMockAppointments, getMockSlots, addMockSlot, deleteMockSlot } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/doctor-dashboard', label: 'Appointments', icon: Calendar, end: true },
  { to: '/doctor-dashboard/week', label: 'Upcoming Week', icon: CalendarDays },
  { to: '/doctor-dashboard/availability', label: 'Availability', icon: Clock },
  { to: '/doctor-dashboard/patients', label: 'Patient History', icon: Users },
];

function DoctorAppointmentsView({ appointments, loading, onUpdateStatus }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your scheduled patient visits and triage notes.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Review patient symptom summaries and triage priority before consultation.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading appointments…</p>
          ) : appointments.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No appointments booked yet.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => {
                const slot = appt.clinics_slots;
                const patientName = appt.profiles?.full_name || 'Patient';
                return (
                  <div key={appt.id} className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-border/80">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{patientName}</h3>
                          {appt.triage_priority && (
                            <Badge tone={appt.triage_priority}>{appt.triage_priority} Priority</Badge>
                          )}
                          <Badge>{appt.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {slot?.doctor_name ? `Dr. ${slot.doctor_name}` : 'Assigned Doctor'} · {slot?.specialty || 'General Practice'}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {slot?.time_slot ? formatDate(slot.time_slot) : 'Date Pending'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={appt.status}
                          onChange={(e) => onUpdateStatus(appt.id, e.target.value)}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="Booked">Booked</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {appt.status !== 'Cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onUpdateStatus(appt.id, 'Cancelled')}
                          >
                            Cancel Appointment
                          </Button>
                        )}
                      </div>
                    </div>

                    {appt.ai_symptom_summary && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-slate-700">
                        <strong className="font-semibold text-slate-800">Triage Summary: </strong>
                        {appt.ai_symptom_summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DoctorUpcomingWeekView({ appointments }) {
  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Upcoming Week</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of visits scheduled for the next 7 days.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {next7Days.map((day) => {
          const dayStr = day.toISOString().slice(0, 10);
          const dayName = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const dayAppts = appointments.filter((a) => {
            const timeSlot = a.clinics_slots?.time_slot || a.created_at;
            return timeSlot && timeSlot.slice(0, 10) === dayStr;
          });

          return (
            <Card key={dayStr}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{dayName}</CardTitle>
                <CardDescription>{dayAppts.length} {dayAppts.length === 1 ? 'appointment' : 'appointments'}</CardDescription>
              </CardHeader>
              <CardContent>
                {dayAppts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No visits scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {dayAppts.map((a) => (
                      <div key={a.id} className="rounded-lg bg-muted/60 p-2.5 text-xs">
                        <p className="font-medium text-slate-800">{a.profiles?.full_name || 'Patient'}</p>
                        <p className="text-muted-foreground">{a.clinics_slots?.specialty || 'General Practice'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DoctorAvailabilityView({ slots, onAddSlot, onDeleteSlot, slotError }) {
  const { profile } = useAuth();
  const [doctorName, setDoctorName] = useState(profile?.full_name || 'Dr. Rohan Gupta');
  const [specialty, setSpecialty] = useState('General Physician');
  const [timeSlot, setTimeSlot] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!timeSlot) return;
    onAddSlot({
      doctor_name: doctorName,
      specialty,
      time_slot: timeSlot,
      available_date: timeSlot.slice(0, 10),
      is_booked: false,
    });
    setTimeSlot('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Availability Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure open slots for patients to book care.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Available Slot</CardTitle>
            <CardDescription>Publish a new time slot to the booking schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            {slotError ? (
              <p className="mb-3 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">{slotError}</p>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Doctor Name</label>
                <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Specialty</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="General Physician">General Physician</option>
                  <option value="Dentist">Dentist</option>
                  <option value="Cardiologist">Cardiologist (Heart)</option>
                  <option value="Dermatologist">Dermatologist (Skin)</option>
                  <option value="Neurologist">Neurologist (Brain & Nervous system)</option>
                  <option value="Orthopedist">Orthopedist (Bones & Joints)</option>
                  <option value="Pediatrician">Pediatrician (Child Specialist)</option>
                  <option value="Ophthalmologist">Ophthalmologist (Eye Care)</option>
                  <option value="ENT Specialist">ENT Specialist (Ear, Nose, Throat)</option>
                  <option value="Psychiatrist">Psychiatrist (Mental Health)</option>
                  <option value="Gynecologist">Gynecologist (Women's Health)</option>
                  <option value="Gastroenterologist">Gastroenterologist (Stomach & Digestive)</option>
                  <option value="Pulmonologist">Pulmonologist (Lungs & Respiratory)</option>
                  <option value="Endocrinologist">Endocrinologist (Diabetes & Hormones)</option>
                  <option value="Oncologist">Oncologist (Cancer Care)</option>
                  <option value="Nephrologist">Nephrologist (Kidney Care)</option>
                  <option value="Urologist">Urologist (Urinary System)</option>
                  <option value="Nutritionist">Nutritionist / Dietitian</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Slot
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Slots</CardTitle>
            <CardDescription>Available time slots active in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots listed.</p>
            ) : (
              <div className="space-y-3">
                {slots.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
                    <div>
                      <p className="font-medium text-slate-800">{s.doctor_name}</p>
                      <p className="text-xs text-muted-foreground">{s.specialty}</p>
                      <p className="mt-1 text-sm text-slate-600">{formatDate(s.time_slot)}</p>
                    </div>
                    <button
                      onClick={() => onDeleteSlot(s.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DoctorPatientsView({ appointments }) {
  const [search, setSearch] = useState('');

  const patientsList = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const name = a.profiles?.full_name || 'Patient';
      if (!map.has(name)) {
        map.set(name, []);
      }
      map.get(name).push(a);
    });

    return Array.from(map.entries()).map(([name, records]) => ({
      name,
      records,
      latest: records[0],
    }));
  }, [appointments]);

  const filtered = patientsList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Patient History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search and review patient triage and medical history.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No patient records found.</p>
        ) : (
          filtered.map((p) => (
            <Card key={p.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>{p.records.length} total visit records</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.records.map((r) => (
                  <div key={r.id} className="rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">
                        {r.clinics_slots?.time_slot ? formatDate(r.clinics_slots.time_slot) : 'Visit Record'}
                      </span>
                      {r.triage_priority && <Badge tone={r.triage_priority}>{r.triage_priority}</Badge>}
                    </div>
                    {r.ai_symptom_summary && (
                      <p className="mt-1.5 leading-relaxed text-slate-600">{r.ai_symptom_summary}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotError, setSlotError] = useState('');

  const fetchDoctorData = async () => {
    if (isSupabaseConfigured) {
      try {
        const [{ data: appts }, { data: slts }] = await Promise.all([
          supabase.from('appointments').select(`
            id, status, triage_priority, ai_symptom_summary, created_at,
            profiles ( full_name ),
            clinics_slots ( doctor_name, specialty, available_date, time_slot )
          `).order('created_at', { ascending: false }),
          supabase.from('clinics_slots').select('*').order('time_slot', { ascending: true }),
        ]);

        if (appts) setAppointments(appts);
        if (slts) setSlots(slts);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Supabase fetch doctor data failed, using mock:', e);
      }
    }

    setAppointments(getMockAppointments());
    setSlots(getMockSlots());
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').update({ status }).eq('id', id);
      } catch (e) {
        console.warn('Update status failed:', e);
      }
    }
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleAddSlot = async (newSlot) => {
    setSlotError('');
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('clinics_slots').insert([newSlot]).select().single();
        if (!error && data) {
          setSlots((prev) => [...prev, data]);
          return;
        }
        if (error) {
          // Only fall back to local mock storage on genuine network/connectivity
          // failures. A real backend error (e.g. RLS denying the insert because
          // this account's profile role isn't actually 'doctor'/'admin' in the
          // database) should be shown to the doctor — silently pretending
          // success while nothing was actually saved is exactly what caused
          // slots to "add successfully" but never appear on the patient side.
          const msg = error.message?.toLowerCase() || '';
          const isFetchError = msg.includes('fetch') || error.status === 0;
          if (!isFetchError) {
            setSlotError(error.message || 'Could not save this slot to the database.');
            return;
          }
        }
      } catch (e) {
        console.warn('Add slot network exception, falling back to mock persistence:', e);
      }
    }
    // Demo mode: persist to localStorage so the slot is visible on the
    // patient side too (patient portal reads slots from the same store).
    const mockCreated = addMockSlot(newSlot);
    setSlots((prev) => [...prev, mockCreated]);
  };

  const handleDeleteSlot = async (id) => {
    setSlotError('');
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('clinics_slots').delete().eq('id', id);
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          const isFetchError = msg.includes('fetch') || error.status === 0;
          if (!isFetchError) {
            setSlotError(error.message || 'Could not delete this slot.');
            return;
          }
        } else {
          setSlots((prev) => prev.filter((s) => s.id !== id));
          return;
        }
      } catch (e) {
        console.warn('Delete slot network exception, falling back to mock persistence:', e);
      }
    }
    // Demo mode: keep localStorage in sync as well.
    deleteMockSlot(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <DashboardShell navItems={NAV_ITEMS}>
      <Routes>
        <Route
          path="/"
          element={
            <DoctorAppointmentsView
              appointments={appointments}
              loading={loading}
              onUpdateStatus={handleUpdateStatus}
            />
          }
        />
        <Route
          path="/week"
          element={<DoctorUpcomingWeekView appointments={appointments} />}
        />
        <Route
          path="/availability"
          element={
            <DoctorAvailabilityView
              slots={slots}
              onAddSlot={handleAddSlot}
              onDeleteSlot={handleDeleteSlot}
              slotError={slotError}
            />
          }
        />
        <Route
          path="/patients"
          element={<DoctorPatientsView appointments={appointments} />}
        />
      </Routes>
    </DashboardShell>
  );
}
