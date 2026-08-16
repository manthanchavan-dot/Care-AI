import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from '@/lib/utils';

const STATUS_OPTIONS = ['Booked', 'Completed', 'Cancelled'];

export default function AppointmentsQueue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, status, triage_priority, ai_symptom_summary, created_at,
        profiles ( full_name ),
        clinics_slots ( doctor_name, specialty, time_slot )
      `)
      .order('created_at', { ascending: false });

    if (!error) setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };

  const deleteAppointment = async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Appointments queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage every active booking across the clinic.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Patient</th>
                    <th className="px-5 py-3 font-medium">Doctor</th>
                    <th className="px-5 py-3 font-medium">Slot</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-5 py-3 font-medium text-slate-800">{r.profiles?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.clinics_slots?.doctor_name}
                        <div className="text-xs text-muted-foreground">{r.clinics_slots?.specialty}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.clinics_slots?.available_date} · {r.clinics_slots?.time_slot}
                      </td>
                      <td className="px-5 py-3">
                        {r.triage_priority ? <Badge tone={r.triage_priority}>{r.triage_priority}</Badge> : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => deleteAppointment(r.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete appointment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
