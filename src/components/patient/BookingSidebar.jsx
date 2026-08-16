import { CalendarCheck, CalendarClock, ClipboardList, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function BookingSidebar({ triage, availableSlots, confirmedSlot, workableDate }) {
  return (
    <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-8 lg:self-start">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Triage result</h2>
              <p className="text-xs text-muted-foreground">Your recommended care</p>
            </div>
          </div>

          {triage ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{triage.specialty}</Badge>
                <Badge tone={triage.priority}>{triage.priority} priority</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">{triage.summary}</p>
              <p className="text-xs text-muted-foreground">
                {availableSlots} matching {availableSlots === 1 ? 'slot is' : 'slots are'} available.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Describe your symptoms to receive a specialist recommendation and see matching slots.
            </p>
          )}
        </CardContent>
      </Card>

      {(confirmedSlot || workableDate) && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  {confirmedSlot ? 'Booked appointment' : 'Next workable date'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {confirmedSlot
                    ? 'Your confirmed visit details'
                    : 'Earliest available date to schedule'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {confirmedSlot ? (
                <>
                  <p className="text-sm font-medium text-slate-800">{confirmedSlot.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{confirmedSlot.specialty}</p>
                  <p className="text-sm text-slate-600">{formatDate(confirmedSlot.time_slot)}</p>
                </>
              ) : (
                <p className="text-sm text-slate-700">
                  {workableDate
                    ? `Book a slot on ${formatDate(workableDate)}`
                    : 'No workable date is available yet.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <h2 className="text-sm font-semibold text-slate-800">Booking steps</h2>
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm text-slate-600">Share your symptoms for an AI-assisted triage.</p>
            </div>
            <div className="flex gap-3">
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm text-slate-600">Choose an available appointment time that works for you.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
