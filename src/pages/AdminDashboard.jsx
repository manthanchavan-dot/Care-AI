import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, ListChecks } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import OverviewModule from '@/components/admin/OverviewModule';
import AppointmentsQueue from '@/components/admin/AppointmentsQueue';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Appointments queue', icon: ListChecks },
];

export default function AdminDashboard() {
  return (
    <DashboardShell navItems={navItems}>
      <Routes>
        <Route index element={<OverviewModule />} />
        <Route path="appointments" element={<AppointmentsQueue />} />
      </Routes>
    </DashboardShell>
  );
}
