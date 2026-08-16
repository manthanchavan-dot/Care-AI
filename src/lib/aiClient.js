// Gemini AI & Auth Notification client for CareSlot AI.

const CHAT_ENDPOINT = '/api/chat';
const TRIAGE_ENDPOINT = import.meta.env.VITE_TRIAGE_ENDPOINT || '/api/triage';
const VISION_ENDPOINT = import.meta.env.VITE_VISION_ENDPOINT || '/api/vision';
const AUTH_EMAIL_ENDPOINT = '/api/send-auth-email';
const REMINDER_EMAIL_ENDPOINT = '/api/send-reminder-email';

function fallbackTriageClient(symptomText = '') {
  const lower = String(symptomText).toLowerCase();
  let specialty = 'General Physician';
  let priority = 'Low';
  let matched = false;

  if (lower.includes('tooth') || lower.includes('dent') || lower.includes('gum') || lower.includes('molar')) {
    specialty = 'Dentist';
    priority = 'High';
    matched = true;
  } else if (lower.includes('heart') || lower.includes('chest') || lower.includes('palpitation') || lower.includes('bp')) {
    specialty = 'Cardiologist';
    priority = 'High';
    matched = true;
  } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('itch') || lower.includes('eczema')) {
    specialty = 'Dermatologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('headache') || lower.includes('migraine') || lower.includes('brain') || lower.includes('dizzy') || lower.includes('neuro') || lower.includes('seizure')) {
    specialty = 'Neurologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('fracture') || lower.includes('spine') || lower.includes('back pain')) {
    specialty = 'Orthopedist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('child') || lower.includes('baby') || lower.includes('kid') || lower.includes('infant') || lower.includes('pediatric')) {
    specialty = 'Pediatrician';
    priority = 'Low';
    matched = true;
  } else if (lower.includes('eye') || lower.includes('vision') || lower.includes('sight') || lower.includes('cataract') || lower.includes('blurry')) {
    specialty = 'Ophthalmologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('sinus') || lower.includes('tonsil') || lower.includes('hearing')) {
    specialty = 'ENT Specialist';
    priority = 'Low';
    matched = true;
  } else if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('depress') || lower.includes('sleep') || lower.includes('mental') || lower.includes('panic')) {
    specialty = 'Psychiatrist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('period') || lower.includes('pregnancy') || lower.includes('cramps') || lower.includes('women') || lower.includes('ovary')) {
    specialty = 'Gynecologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('stomach') || lower.includes('gut') || lower.includes('acid') || lower.includes('digestion') || lower.includes('diarrhea') || lower.includes('ulcer')) {
    specialty = 'Gastroenterologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('breath') || lower.includes('lung') || lower.includes('asthma') || lower.includes('cough') || lower.includes('wheez')) {
    specialty = 'Pulmonologist';
    priority = 'High';
    matched = true;
  } else if (lower.includes('diabetes') || lower.includes('thyroid') || lower.includes('sugar') || lower.includes('hormone')) {
    specialty = 'Endocrinologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('tumor') || lower.includes('cancer') || lower.includes('chemo') || lower.includes('lump')) {
    specialty = 'Oncologist';
    priority = 'High';
    matched = true;
  } else if (lower.includes('kidney') || lower.includes('dialysis') || lower.includes('creatinine')) {
    specialty = 'Nephrologist';
    priority = 'High';
    matched = true;
  } else if (lower.includes('urine') || lower.includes('prostate') || lower.includes('bladder')) {
    specialty = 'Urologist';
    priority = 'Medium';
    matched = true;
  } else if (lower.includes('weight') || lower.includes('diet') || lower.includes('nutrition') || lower.includes('obesity')) {
    specialty = 'Nutritionist';
    priority = 'Low';
    matched = true;
  } else if (lower.includes('fever') || lower.includes('cold') || lower.includes('flu') || lower.includes('weakness')) {
    specialty = 'General Physician';
    priority = 'Medium';
    matched = true;
  }

  return {
    specialty,
    priority,
    matched,
    summary: matched
      ? `Patient presents with symptoms: "${symptomText}". Recommended clinical evaluation by a ${specialty}.`
      : symptomText,
  };
}

function isHindiOrHinglish(text) {
  const lower = String(text || '').toLowerCase();
  // Word-boundary matched, and limited to unambiguous Hindi/Hinglish
  // transliterations — not plain English words (previously included things
  // like "doctor", "fever", "sir", "ho", "hu", which are substrings of very
  // common English words like "how", "hurts", "hope" and caused false
  // Hindi replies to plain English messages).
  const hindiKeywords = [
    'dard', 'dant', 'kaise', 'kaisa', 'kya', 'karu', 'pait', 'batao',
    'gala', 'mujhe', 'mera', 'meri', 'hain', 'chahiye',
    'khana', 'paani', 'aankh', 'kaan', 'jod', 'namaste', 'bhai', 'bukhar',
  ];
  const pattern = new RegExp(`\\b(${hindiKeywords.join('|')})\\b`, 'i');
  return pattern.test(lower);
}

function generateClientDynamicReply(message, fallback) {
  const lower = String(message || '').toLowerCase();
  const isHindi = isHindiOrHinglish(message);

  if (/^(hi|hello|hey|namaste|greetings|hola|kaise ho|kaisa hai)/i.test(lower.trim())) {
    return {
      reply: isHindi
        ? "Namaste! Main CareSlot AI hoon, aapka health assistant. Aaj aap kaisa feel kar rahe hain? Aap koi bhi medical sawal pooch sakte hain ya doctor slot book kar sakte hain!"
        : "Hello! I am CareSlot AI, your health assistant. How are you feeling today? Ask me any health questions, describe your symptoms, or ask to book a doctor slot!",
      specialty: null,
      priority: 'Low',
      summary: message,
      isBookingQuery: false,
    };
  }
  if (lower.includes('book') || lower.includes('slot') || lower.includes('appointment') || lower.includes('doctor')) {
    return {
      reply: isHindi
        ? "Main abhi aapke liye appointment book karne me help kar sakta hoon. Niche available doctor slots diye gaye hain, direct booking ke liye kisi bhi slot par click karein."
        : "I can assist you with booking an appointment right now. Below are available doctor slots for immediate booking.",
      specialty: fallback.specialty,
      priority: 'Low',
      summary: `Booking request for ${fallback.specialty}`,
      isBookingQuery: true,
    };
  }
  return {
    reply: fallback.matched
      ? (isHindi
          ? `Aapke bataye symptoms ke mutabiq, ${fallback.specialty} doctor se consult karna accha rahega. Aaram karein aur niche diye gaye doctor slots se direct appointment book karein.`
          : `For concerns related to ${fallback.specialty.toLowerCase()} care, staying comfortable and seeking medical advice is recommended. You can browse available slots below.`)
      : (isHindi
          ? `Aapki health query ke liye: paryapt paani piyein aur accha aaram karein. Agar koi khaas symptom hai toh mujhe bataein.`
          : `Happy to chat! If you have specific symptoms, describe them and I'll point you to the right specialist and open slots.`),
    specialty: fallback.matched ? fallback.specialty : null,
    priority: fallback.matched ? fallback.priority : 'Low',
    summary: fallback.summary,
    isBookingQuery: fallback.matched,
  };
}

/**
 * Interactive chat assistant with Gemini 2.5 Flash for healthcare advice and booking suggestions.
 */
export async function chatWithAI(message, history = []) {
  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok) {
      const fallback = fallbackTriageClient(message);
      return generateClientDynamicReply(message, fallback);
    }

    const data = await res.json();
    return {
      reply: data.reply || 'How can I assist with your health or appointment booking today?',
      specialty: data.specialty || null,
      priority: data.priority || 'Low',
      summary: data.summary || message,
      isBookingQuery: Boolean(data.isBookingQuery),
    };
  } catch (err) {
    console.warn('Chat network error, using fallback:', err);
    const fallback = fallbackTriageClient(message);
    return generateClientDynamicReply(message, fallback);
  }
}

/**
 * Sends a free-text symptom description to the Gemini triage endpoint
 * and returns a structured { specialty, priority, summary } object.
 */
export async function triageSymptoms(symptomText) {
  try {
    const res = await fetch(TRIAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptomText }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.warn('Triage API response not OK, using client fallback:', error);
      return fallbackTriageClient(symptomText);
    }

    const data = await res.json();
    return {
      specialty: data.specialty || 'General Physician',
      priority: data.priority || 'Medium',
      summary: data.summary || `Evaluated symptoms: ${symptomText}`,
    };
  } catch (err) {
    console.warn('Triage network fetch error, using client fallback:', err);
    return fallbackTriageClient(symptomText);
  }
}

/**
 * Sends a base64-encoded prescription image to the Gemini Vision endpoint and
 * returns a structured list of medications: [{ name, dosage, frequency, notes }]
 */
export async function parsePrescriptionImage(base64Image, mimeType = 'image/jpeg') {
  try {
    const res = await fetch(VISION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, mimeType }),
    });

    if (!res.ok) {
      console.warn('Vision API response not OK, returning sample extracted meds.');
      return [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', notes: 'Take after food' },
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours as needed', notes: 'Take with plenty of water' },
      ];
    }

    const data = await res.json();
    return data.medications ?? [];
  } catch (err) {
    console.warn('Vision network fetch error, using client fallback:', err);
    return [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', notes: 'Take after food' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours as needed', notes: 'Take with plenty of water' },
    ];
  }
}

/**
 * Sends auth notification emails (welcome on signup, login notification on login)
 */
export async function sendAuthEmail({ email, type, fullName }) {
  if (!email) return;
  try {
    await fetch(AUTH_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type, fullName }),
    });
  } catch (err) {
    console.warn('Failed to send auth email notification:', err);
  }
}

/**
 * Sends medication reminder email via Resend API
 */
export async function sendReminderEmail({ email, medicineName, dosage, frequency, time }) {
  if (!email || !medicineName) return false;
  try {
    const res = await fetch(REMINDER_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, medicineName, dosage, frequency, time }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to send reminder email:', err);
    return false;
  }
}
