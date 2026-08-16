import { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const CATEGORY_COLORS = ['#0f766e', '#14b8a6', '#5eead4', '#0891b2', '#7dd3fc', '#64748b'];

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function OverviewModule() {
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: appts }, { data: meds }] = await Promise.all([
        supabase.from('appointments').select('id, created_at, status, triage_priority, ai_symptom_summary'),
        supabase.from('medication_reminders').select('id, is_active'),
      ]);
      setAppointments(appts ?? []);
      setReminders(meds ?? []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Chart 1: booking velocity (created that day) vs "footfall" (status = Completed that day)
  const velocityData = useMemo(() => {
    const days = last7Days();
    return days.map((day) => {
      const dayAppts = appointments.filter((a) => a.created_at?.slice(0, 10) === day);
      return {
        day: day.slice(5),
        bookings: dayAppts.length,
        footfall: dayAppts.filter((a) => a.status === 'Completed').length,
      };
    });
  }, [appointments]);

  // Chart 2: symptom category distribution, inferred from triage_priority as a stand-in
  // grouping key when a dedicated specialty column isn't joined in.
  const categoryData = useMemo(() => {
    const counts = {};
    appointments.forEach((a) => {
      const key = a.ai_symptom_summary ? a.ai_symptom_summary.split(' ').slice(0, 2).join(' ') : 'Unspecified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // Chart 3: medication adherence — proportion of reminders still active.
  const adherencePct = useMemo(() => {
    if (reminders.length === 0) return 0;
    return Math.round((reminders.filter((r) => r.is_active).length / reminders.length) * 100);
  }, [reminders]);

  const adherenceData = [{ name: 'Adherence', value: adherencePct, fill: '#0f766e' }];

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational pulse across bookings, triage, and adherence.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Booking velocity vs. footfall</CardTitle>
            <CardDescription>Daily new bookings against completed visits, last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" fontSize={12} stroke="#64748b" />
                <YAxis fontSize={12} stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#5eead4" radius={[4, 4, 0, 0]} name="Bookings" />
                <Line type="monotone" dataKey="footfall" stroke="#0f766e" strokeWidth={2.5} name="Footfall" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medication adherence</CardTitle>
            <CardDescription>Share of active reminders across all patients.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-72 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={adherenceData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={12} />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-800 font-display text-2xl font-bold"
                >
                  {adherencePct}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Symptom category distribution</CardTitle>
            <CardDescription>Grouped from AI-generated symptom summaries.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No triaged appointments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
