// Shared local fallback storage for demo mode when Supabase is not connected.

const STORAGE_KEYS = {
  SLOTS: 'careslot_mock_slots',
  APPOINTMENTS: 'careslot_mock_appointments',
  REMINDERS: 'careslot_mock_reminders',
};

const DEFAULT_SLOTS = [
  {
    id: 'slot-1',
    doctor_name: 'Dr. Ananya Rao',
    specialty: 'Dentist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 10:00 AM',
    is_booked: false,
  },
  {
    id: 'slot-2',
    doctor_name: 'Dr. Vikram Shah',
    specialty: 'Cardiologist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 09:30 AM',
    is_booked: false,
  },
  {
    id: 'slot-3',
    doctor_name: 'Dr. Meera Iyer',
    specialty: 'Dermatologist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 04:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-4',
    doctor_name: 'Dr. Rohan Gupta',
    specialty: 'General Physician',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 06:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-5',
    doctor_name: 'Dr. Priya Sharma',
    specialty: 'Neurologist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 11:30 AM',
    is_booked: false,
  },
  {
    id: 'slot-6',
    doctor_name: 'Dr. Suresh Kumar',
    specialty: 'Orthopedist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 03:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-7',
    doctor_name: 'Dr. Kavita Deshmukh',
    specialty: 'Pediatrician',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 02:30 PM',
    is_booked: false,
  },
  {
    id: 'slot-8',
    doctor_name: 'Dr. Rajesh Nambiar',
    specialty: 'Ophthalmologist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 10:00 AM',
    is_booked: false,
  },
  {
    id: 'slot-9',
    doctor_name: 'Dr. Sameer Sen',
    specialty: 'ENT Specialist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 05:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-10',
    doctor_name: 'Dr. Sunita Kulkarni',
    specialty: 'Psychiatrist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 04:30 PM',
    is_booked: false,
  },
  {
    id: 'slot-11',
    doctor_name: 'Dr. Pooja Hegde',
    specialty: 'Gynecologist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 01:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-12',
    doctor_name: 'Dr. Arvind Menon',
    specialty: 'Gastroenterologist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 12:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-13',
    doctor_name: 'Dr. Farhan Khan',
    specialty: 'Pulmonologist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 11:30 AM',
    is_booked: false,
  },
  {
    id: 'slot-14',
    doctor_name: 'Dr. Neha Kapoor',
    specialty: 'Endocrinologist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 05:30 PM',
    is_booked: false,
  },
  {
    id: 'slot-15',
    doctor_name: 'Dr. Alok Nath',
    specialty: 'Oncologist',
    available_date: '2026-08-14',
    time_slot: '2026-08-14 10:30 AM',
    is_booked: false,
  },
  {
    id: 'slot-16',
    doctor_name: 'Dr. Devendra Roy',
    specialty: 'Nephrologist',
    available_date: '2026-08-14',
    time_slot: '2026-08-14 02:00 PM',
    is_booked: false,
  },
  {
    id: 'slot-17',
    doctor_name: 'Dr. Sanjeev Bajaj',
    specialty: 'Urologist',
    available_date: '2026-08-13',
    time_slot: '2026-08-13 06:30 PM',
    is_booked: false,
  },
  {
    id: 'slot-18',
    doctor_name: 'Dr. Radhika Mehta',
    specialty: 'Nutritionist',
    available_date: '2026-08-12',
    time_slot: '2026-08-12 03:30 PM',
    is_booked: false,
  },
];

const DEFAULT_APPOINTMENTS = [
  {
    id: 'appt-1',
    patient_id: 'demo-patient-1',
    slot_id: 'slot-19',
    ai_symptom_summary: 'Patient reported mild fever and fatigue.',
    triage_priority: 'Low',
    status: 'Completed',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    profiles: { full_name: 'Alex Johnson' },
    clinics_slots: {
      doctor_name: 'Dr. Rohan Gupta',
      specialty: 'General Physician',
      available_date: '2026-08-11',
      time_slot: '2026-08-11 05:30 PM',
    },
  },
  {
    id: 'appt-2',
    patient_id: 'demo-patient-1',
    slot_id: 'slot-1',
    ai_symptom_summary: 'Severe wisdom tooth ache, worse at night.',
    triage_priority: 'High',
    status: 'Booked',
    created_at: new Date().toISOString(),
    profiles: { full_name: 'Alex Johnson' },
    clinics_slots: {
      doctor_name: 'Dr. Ananya Rao',
      specialty: 'Dentist',
      available_date: '2026-08-12',
      time_slot: '2026-08-12 10:00 AM',
    },
  },
];

const DEFAULT_REMINDERS = [
  {
    id: 'med-1',
    patient_id: 'demo-patient-1',
    medicine_name: 'Amoxicillin',
    dosage_schedule: [{ dosage: '500mg', frequency: 'Twice daily', notes: 'After food' }],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'med-2',
    patient_id: 'demo-patient-1',
    medicine_name: 'Ibuprofen',
    dosage_schedule: [{ dosage: '400mg', frequency: 'Every 8 hours as needed', notes: 'Take with water' }],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function getStored(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }
}

export function getMockSlots() {
  return getStored(STORAGE_KEYS.SLOTS, DEFAULT_SLOTS);
}

export function addMockSlot(newSlot) {
  const slots = getStored(STORAGE_KEYS.SLOTS, DEFAULT_SLOTS);
  const created = {
    id: `slot-${Date.now()}`,
    is_booked: false,
    available_date: newSlot.time_slot ? String(newSlot.time_slot).slice(0, 10) : '',
    ...newSlot,
  };
  const updated = [...slots, created];
  setStored(STORAGE_KEYS.SLOTS, updated);
  return created;
}

export function deleteMockSlot(id) {
  const slots = getStored(STORAGE_KEYS.SLOTS, DEFAULT_SLOTS).filter((s) => s.id !== id);
  setStored(STORAGE_KEYS.SLOTS, slots);
}

export function getMockAppointments(patientId) {
  const all = getStored(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  if (!patientId) return all;
  return all.filter((a) => a.patient_id === patientId || a.patient_id === 'demo-patient-1');
}

export function getMockReminders(patientId) {
  const all = getStored(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDERS);
  if (!patientId) return all;
  return all.filter((r) => r.patient_id === patientId || r.patient_id === 'demo-patient-1');
}

export function bookMockSlot(slot, user, triage) {
  const slots = getMockSlots().map((s) => (s.id === slot.id ? { ...s, is_booked: true } : s));
  setStored(STORAGE_KEYS.SLOTS, slots);

  const newAppt = {
    id: `appt-${Date.now()}`,
    patient_id: user?.id || 'demo-patient-1',
    slot_id: slot.id,
    ai_symptom_summary: triage?.summary || 'General Consultation',
    triage_priority: triage?.priority || 'Medium',
    status: 'Booked',
    created_at: new Date().toISOString(),
    profiles: { full_name: user?.user_metadata?.full_name || 'Alex Johnson' },
    clinics_slots: { ...slot, is_booked: true },
  };

  const appts = getStored(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  appts.unshift(newAppt);
  setStored(STORAGE_KEYS.APPOINTMENTS, appts);

  return newAppt;
}

export function saveMockReminders(user, newRows) {
  const existing = getStored(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDERS);
  const created = newRows.map((row, i) => ({
    id: `med-${Date.now()}-${i}`,
    patient_id: user?.id || 'demo-patient-1',
    medicine_name: row.medicine_name,
    dosage_schedule: row.dosage_schedule,
    is_active: true,
    created_at: new Date().toISOString(),
  }));
  const updated = [...created, ...existing];
  setStored(STORAGE_KEYS.REMINDERS, updated);
  return created;
}

export function updateMockAppointmentStatus(id, status) {
  const appts = getStored(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS).map((a) =>
    a.id === id ? { ...a, status } : a
  );
  setStored(STORAGE_KEYS.APPOINTMENTS, appts);
}

export function deleteMockAppointment(id) {
  const appts = getStored(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS).filter((a) => a.id !== id);
  setStored(STORAGE_KEYS.APPOINTMENTS, appts);
}

export function toggleMockReminderActive(id) {
  const reminders = getStored(STORAGE_KEYS.REMINDERS, DEFAULT_REMINDERS).map((r) =>
    r.id === id ? { ...r, is_active: !r.is_active } : r
  );
  setStored(STORAGE_KEYS.REMINDERS, reminders);
}
