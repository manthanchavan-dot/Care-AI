import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, status, triage_priority, ai_symptom_summary, created_at,
          clinics_slots ( doctor_name, specialty, time_slot )
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setAppointments(data ?? []);
      }
      setLoading(false);
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">My appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See the appointments you have booked and review the clinician details.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appointments booked yet.</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const slot = appointment.clinics_slots;
            return (
              <Card key={appointment.id}>
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{slot?.doctor_name ?? 'Unknown provider'}</p>
                      <p className="text-xs text-muted-foreground">{slot?.specialty ?? 'General care'}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {slot?.time_slot ? formatDate(slot.time_slot) : 'Date unavailable'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{appointment.status}</Badge>
                      {appointment.triage_priority ? (
                        <Badge tone={appointment.triage_priority}>{appointment.triage_priority}</Badge>
                      ) : null}
                    </div>
                  </div>

                  {appointment.ai_symptom_summary ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {appointment.ai_symptom_summary}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
