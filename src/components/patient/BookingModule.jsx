import { useEffect, useMemo, useState, useRef } from 'react';
import { Sparkles, Send, CalendarClock, CheckCircle2, Bot, User, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BookingSidebar from '@/components/patient/BookingSidebar';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getMockSlots, bookMockSlot } from '@/lib/mockData';
import { chatWithAI } from '@/lib/aiClient';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

function isMatchingSpecialty(slotSpecialty, targetSpecialty) {
  if (!slotSpecialty || !targetSpecialty) return false;
  const s1 = String(slotSpecialty).toLowerCase().trim();
  const s2 = String(targetSpecialty).toLowerCase().trim();
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;

  const normalizeWord = (w) => w.replace(/s$/, '').replace(/ist$/, '').replace(/ian$/, '').replace(/ogist$/, '');
  return normalizeWord(s1) === normalizeWord(s2);
}

function inferSpecialtyFromText(text) {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('tooth') || lower.includes('dent') || lower.includes('gum') || lower.includes('dant')) return 'Dentist';
  if (lower.includes('heart') || lower.includes('chest') || lower.includes('bp') || lower.includes('dil')) return 'Cardiologist';
  if (lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('itch') || lower.includes('twacha') || lower.includes('khujli')) return 'Dermatologist';
  if (lower.includes('headache') || lower.includes('migraine') || lower.includes('sar dard') || lower.includes('sir dard') || lower.includes('chakkar')) return 'Neurologist';
  if (lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('back pain') || lower.includes('jod')) return 'Orthopedist';
  if (lower.includes('child') || lower.includes('baby') || lower.includes('kid') || lower.includes('bachha')) return 'Pediatrician';
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('blurry') || lower.includes('aankh')) return 'Ophthalmologist';
  if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('kaan') || lower.includes('gala')) return 'ENT Specialist';
  if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('sleep') || lower.includes('neend')) return 'Psychiatrist';
  if (lower.includes('period') || lower.includes('pregnancy') || lower.includes('cramps')) return 'Gynecologist';
  if (lower.includes('stomach') || lower.includes('acid') || lower.includes('digestion') || lower.includes('pet') || lower.includes('pait') || lower.includes('vomit') || lower.includes('gas')) return 'Gastroenterologist';
  if (lower.includes('breath') || lower.includes('lung') || lower.includes('asthma') || lower.includes('cough') || lower.includes('saans')) return 'Pulmonologist';
  if (lower.includes('diabetes') || lower.includes('thyroid') || lower.includes('sugar')) return 'Endocrinologist';
  if (lower.includes('fever') || lower.includes('bukhar') || lower.includes('cold') || lower.includes('flu') || lower.includes('sardi') || lower.includes('weakness')) return 'General Physician';
  return null;
}

const SPECIALTY_CATEGORIES = [
  'All Doctors',
  'General Physician',
  'Dentist',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedist',
  'Pediatrician',
  'Ophthalmologist',
  'ENT Specialist',
  'Psychiatrist',
  'Gynecologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Endocrinologist',
  'Oncologist',
  'Nephrologist',
  'Urologist',
  'Nutritionist',
];

export default function BookingModule() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am CareSlot AI, your health assistant. You can ask me any medical question, discuss symptoms, or ask for available doctor slots for direct booking!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatting, setChatting] = useState(false);
  const [triage, setTriage] = useState(null); // { specialty, priority, summary }
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Doctors');

  const [slots, setSlots] = useState([]);
  const [bookedSlotIds, setBookedSlotIds] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [confirmedSlot, setConfirmedSlot] = useState(null);

  const chatEndRef = useRef(null);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setSlotsError('');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('clinics_slots')
          .select('*')
          .eq('is_booked', false)
          .order('time_slot', { ascending: true });

        // A successful query is authoritative even if it returns zero rows
        // (that just means every slot is currently booked) — only fall
        // through to local mock data on an actual error/exception below,
        // not on a genuinely empty real result.
        if (!error && data) {
          setSlots(data);
          setLoadingSlots(false);
          return;
        }
      } catch (e) {
        console.warn('Supabase fetch open slots failed, using mock data:', e);
      }
    }

    const mockSlots = getMockSlots().filter((s) => !s.is_booked);
    setSlots(mockSlots);
    setLoadingSlots(false);
  };

  useEffect(() => {
    fetchSlots();

    // In demo mode, slots live in localStorage. If a doctor adds/removes a
    // slot in another tab (or the same browser), pick up the change here too.
    if (!isSupabaseConfigured) {
      const handleStorage = (e) => {
        if (!e.key || e.key === 'careslot_mock_slots') fetchSlots();
      };
      window.addEventListener('storage', handleStorage);
      window.addEventListener('focus', fetchSlots);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('focus', fetchSlots);
      };
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatting]);

  const activeFilterSpecialty = selectedSpecialty !== 'All Doctors' ? selectedSpecialty : (triage?.specialty || null);

  const { filteredSlots, noExactMatch } = useMemo(() => {
    if (!activeFilterSpecialty) {
      return { filteredSlots: slots, noExactMatch: false };
    }

    const matchedSlots = slots.filter(
      (slot) => isMatchingSpecialty(slot.specialty, activeFilterSpecialty)
    );

    return {
      filteredSlots: matchedSlots.length > 0 ? matchedSlots : slots,
      noExactMatch: matchedSlots.length === 0 && slots.length > 0,
    };
  }, [slots, activeFilterSpecialty]);

  const earliestWorkableDate = filteredSlots[0]?.time_slot ?? null;

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || chatting) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setChatting(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const aiResponse = await chatWithAI(text.trim(), history);

      // Determine target specialty from AI response or text inference
      const targetSpecialty = aiResponse.specialty || inferSpecialtyFromText(text.trim());

      const lowerText = text.toLowerCase();
      const isExplicitBookingOrSymptoms =
        aiResponse.isBookingQuery ||
        Boolean(targetSpecialty) ||
        lowerText.includes('book') ||
        lowerText.includes('slot') ||
        lowerText.includes('doctor') ||
        lowerText.includes('appointment') ||
        lowerText.includes('pain') ||
        lowerText.includes('fever') ||
        lowerText.includes('symptom') ||
        lowerText.includes('rash') ||
        lowerText.includes('ache') ||
        lowerText.includes('dard') ||
        lowerText.includes('pet') ||
        lowerText.includes('bukhar');

      let suggestedSlots = [];
      if (targetSpecialty) {
        suggestedSlots = slots.filter(
          (s) => isMatchingSpecialty(s.specialty, targetSpecialty) && !s.is_booked
        );
      }

      if (suggestedSlots.length === 0 && isExplicitBookingOrSymptoms) {
        const available = slots.filter((s) => !s.is_booked);
        const prioritySpecialties = ['General Physician', 'Dermatologist', 'Cardiologist', 'Gastroenterologist', 'Orthopedist'];
        for (const spec of prioritySpecialties) {
          const match = available.find((s) => isMatchingSpecialty(s.specialty, spec));
          if (match && !suggestedSlots.some((s) => s.id === match.id)) {
            suggestedSlots.push(match);
          }
        }
        if (suggestedSlots.length < 3) {
          suggestedSlots = available.slice(0, 3);
        } else {
          suggestedSlots = suggestedSlots.slice(0, 3);
        }
      } else {
        suggestedSlots = suggestedSlots.slice(0, 4);
      }

      const effectiveSpecialty = targetSpecialty || aiResponse.specialty;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiResponse.reply,
          specialty: effectiveSpecialty,
          priority: aiResponse.priority,
          summary: aiResponse.summary,
          suggestedSlots,
        },
      ]);

      if (effectiveSpecialty) {
        setTriage({
          specialty: effectiveSpecialty,
          priority: aiResponse.priority || 'Low',
          summary: aiResponse.summary || text.trim(),
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I had trouble processing that. Please try rephrasing your question.',
        },
      ]);
    } finally {
      setChatting(false);
    }
  };

  const handleBookSlot = async (slot) => {
    if (!user) return;
    setBookingId(slot.id);
    setBookingError('');

    let isSuccess = false;
    let hardError = null;

    if (isSupabaseConfigured) {
      try {
        // Atomically claim the slot: this UPDATE only takes effect if the row
        // is STILL unbooked at the moment it runs (`.eq('is_booked', false)`).
        // Postgres serializes concurrent UPDATEs on the same row, so if two
        // patients click "Book" on the same slot at the same time, only one
        // of these can actually flip is_booked to true — the other gets back
        // an empty result with no error, which is how we detect the race and
        // block the second booking instead of letting both through.
        const { data: claimed, error: claimError } = await supabase
          .from('clinics_slots')
          .update({ is_booked: true })
          .eq('id', slot.id)
          .eq('is_booked', false)
          .select()
          .maybeSingle();

        if (claimError) {
          const msg = claimError.message?.toLowerCase() || '';
          const isFetchError = msg.includes('fetch') || claimError.status === 0;
          if (!isFetchError) {
            hardError = claimError.message || 'Could not reserve this slot.';
          }
        } else if (!claimed) {
          hardError = 'This slot was just booked by another patient. Please choose a different time.';
        } else {
          const { error: appointmentError } = await supabase.from('appointments').insert({
            patient_id: user.id,
            slot_id: slot.id,
            ai_symptom_summary: triage?.summary ?? `Direct booking for ${slot.specialty}`,
            triage_priority: triage?.priority ?? 'Low',
            status: 'Booked',
          });

          if (!appointmentError) {
            isSuccess = true;
          } else {
            // The slot claim succeeded but saving the appointment failed —
            // release the claim so the slot doesn't get stuck as "booked"
            // with no actual appointment behind it.
            await supabase.from('clinics_slots').update({ is_booked: false }).eq('id', slot.id);

            // Only fall back to local mock storage on genuine network/connectivity
            // failures. A real backend error (RLS denial, missing foreign key row,
            // constraint violation, etc.) should be shown to the patient — silently
            // pretending success while nothing was actually saved just hides real
            // problems and makes bookings vanish from both the patient and doctor
            // views.
            const msg = appointmentError.message?.toLowerCase() || '';
            const isFetchError = msg.includes('fetch') || appointmentError.status === 0;
            if (!isFetchError) {
              hardError = appointmentError.message || 'Could not save this booking.';
            }
          }
        }
      } catch (e) {
        console.warn('Supabase booking network exception, falling back to mock persistence:', e);
      }
    }

    if (hardError) {
      setBookingError(hardError);
      setBookingId(null);
      // Refresh the list so a slot someone else just took disappears instead
      // of sitting there looking bookable.
      fetchSlots();
      return;
    }

    if (!isSuccess) {
      bookMockSlot(slot, user, triage);
      isSuccess = true;
    }

    setConfirmedSlot(slot);
    setBookedSlotIds((prev) => new Set([...prev, slot.id]));
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, is_booked: true } : s)));
    setBookingId(null);

    // Append AI confirmation receipt directly in the conversation thread
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `🎉 **Appointment Confirmed!**\n\nYour consultation with **${slot.doctor_name}** (${slot.specialty}) on **${formatDate(
          slot.time_slot
        )}** is successfully booked. An confirmation receipt has been saved to your dashboard.`,
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">CareSlot AI Health Assistant & Booking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat naturally with AI for health guidance and medical questions, or directly book multiple doctor slot options right inside the chat.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {/* Interactive AI Chat Box */}
          <Card className="border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">CareSlot Conversational AI</h2>
                  <p className="text-[11px] text-muted-foreground">CareSlot AI 1.0</p>
                </div>
              </div>
              {triage && (
                <Badge tone={triage.priority} className="text-xs">
                  {triage.specialty} · {triage.priority} Priority
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              {/* Chat Messages */}
              <div className="max-h-[440px] min-h-[260px] space-y-4 overflow-y-auto pr-1">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        msg.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent text-accent-foreground rounded-tr-none'
                          : 'bg-muted/90 text-slate-800 rounded-tl-none border border-border/70'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {msg.specialty && (
                        <div className="mt-2.5 flex items-center gap-2 border-t border-border/40 pt-2 text-xs">
                          <span className="text-muted-foreground font-medium">Recommended Specialty:</span>
                          <Badge variant="outline" className="bg-white text-slate-800">
                            {msg.specialty}
                          </Badge>
                        </div>
                      )}

                      {/* Interactive Slot Booking Cards inside AI Chat */}
                      {msg.suggestedSlots && msg.suggestedSlots.length > 0 && (
                        <div className="mt-3.5 space-y-2 border-t border-border/60 pt-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                            <span className="flex items-center gap-1.5 text-primary">
                              <CalendarClock className="h-4 w-4" /> Recommended Doctor Slots for Booking:
                            </span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {msg.suggestedSlots.length} options available
                            </span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
                            {msg.suggestedSlots.map((slot) => {
                              const isAlreadyBooked = bookedSlotIds.has(slot.id) || slot.is_booked;
                              const isBookingThis = bookingId === slot.id;

                              return (
                                <div
                                  key={slot.id}
                                  className={`flex flex-col justify-between rounded-xl border p-3 transition-all text-xs ${
                                    isAlreadyBooked
                                      ? 'border-emerald-300 bg-emerald-50/90 text-emerald-900 shadow-2xs'
                                      : 'border-border bg-white hover:border-primary/50 shadow-2xs'
                                  }`}
                                >
                                  <div className="mb-2 space-y-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <p className="font-semibold text-slate-800">{slot.doctor_name}</p>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 font-normal bg-primary/5 border-primary/20 text-primary shrink-0"
                                      >
                                        {slot.specialty}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <CalendarClock className="h-3 w-3 text-muted-foreground shrink-0" />
                                      {formatDate(slot.time_slot)}
                                    </p>
                                  </div>

                                  {isAlreadyBooked ? (
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Booked & Confirmed
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="accent"
                                      className="h-7 w-full text-xs font-medium"
                                      disabled={isBookingThis}
                                      onClick={() => handleBookSlot(slot)}
                                    >
                                      {isBookingThis ? 'Booking…' : 'Book This Slot'}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatting && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    CareSlot AI is thinking…
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="mt-3 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask AI anything or describe symptoms to view & book doctor slots..."
                    className="pl-10"
                    disabled={chatting}
                  />
                </div>
                <Button type="submit" disabled={chatting || !inputMessage.trim()}>
                  {chatting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          {confirmedSlot && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Appointment confirmed with {confirmedSlot.doctor_name} ({confirmedSlot.specialty}) on {formatDate(confirmedSlot.time_slot)}.
            </div>
          )}

          {/* Doctor Specialty Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-slate-700">Filter by Doctor Specialty</h2>
              </div>
              {(triage || selectedSpecialty !== 'All Doctors') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    setTriage(null);
                    setSelectedSpecialty('All Doctors');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SPECIALTY_CATEGORIES.map((cat) => {
                const isActive =
                  (triage && isMatchingSpecialty(triage.specialty, cat)) ||
                  (!triage && isMatchingSpecialty(selectedSpecialty, cat));
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setTriage(null);
                      setSelectedSpecialty(cat);
                    }}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-muted/80 text-slate-600 hover:bg-muted hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctors Slot Selection List */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-slate-700">
                  {activeFilterSpecialty && !noExactMatch
                    ? `Available ${activeFilterSpecialty} slots`
                    : 'All available doctor slots'}
                </h2>
              </div>
            </div>

            {noExactMatch && (
              <p className="mb-3 text-sm text-amber-700">
                No open slots found for {activeFilterSpecialty} at the moment — displaying all available clinic slots below.
              </p>
            )}

            {bookingError && <p className="mb-3 text-sm text-destructive">{bookingError}</p>}

            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            ) : slotsError ? (
              <p className="text-sm text-destructive">{slotsError}</p>
            ) : filteredSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open slots available right now — check back soon.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredSlots.map((slot) => {
                  const isBooked = bookedSlotIds.has(slot.id) || slot.is_booked;
                  return (
                    <Card key={slot.id} className="animate-fade-up">
                      <CardContent className="flex items-center justify-between pt-5">
                        <div>
                          <p className="font-medium text-slate-800">{slot.doctor_name}</p>
                          <Badge variant="outline" className="mt-0.5 text-[11px] font-normal text-primary border-primary/20 bg-primary/5">
                            {slot.specialty}
                          </Badge>
                          <p className="mt-2 text-xs text-slate-600">
                            {formatDate(slot.time_slot)}
                          </p>
                        </div>
                        {isBooked ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-medium">
                            Booked
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="accent"
                            disabled={bookingId === slot.id}
                            onClick={() => handleBookSlot(slot)}
                          >
                            {bookingId === slot.id ? 'Booking…' : 'Book'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <BookingSidebar
          triage={triage}
          availableSlots={filteredSlots.length}
          confirmedSlot={confirmedSlot}
          workableDate={earliestWorkableDate}
        />
      </div>
    </div>
  );
}
