import { Routes, Route } from 'react-router-dom';
import { CalendarClock, ScanLine, Pill, CalendarCheck } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import BookingModule from '@/components/patient/BookingModule';
import PrescriptionScanner from '@/components/patient/PrescriptionScanner';
import RemindersModule from '@/components/patient/RemindersModule';
import MyAppointments from '@/components/patient/MyAppointments';

const navItems = [
  { to: '/patient', label: 'Book a slot', icon: CalendarClock, end: true },
  { to: '/patient/appointments', label: 'My appointments', icon: CalendarCheck },
  { to: '/patient/scan', label: 'Scan prescription', icon: ScanLine },
  { to: '/patient/reminders', label: 'My medications', icon: Pill },
];

export default function PatientPortal() {
  return (
    <DashboardShell navItems={navItems}>
      <Routes>
        <Route index element={<BookingModule />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="scan" element={<PrescriptionScanner />} />
        <Route path="reminders" element={<RemindersModule />} />
      </Routes>
    </DashboardShell>
  );
}
