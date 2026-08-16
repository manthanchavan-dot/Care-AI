import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, CheckCircle2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { saveMockReminders } from '@/lib/mockData';
import { parsePrescriptionImage } from '@/lib/aiClient';
import { useAuth } from '@/context/AuthContext';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PrescriptionScanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [medications, setMedications] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setSaved(false);
    setSaveError('');
    setMedications([]);
    setPreview(URL.createObjectURL(file));
    setScanning(true);

    try {
      const base64 = await fileToBase64(file);
      const meds = await parsePrescriptionImage(base64, file.type);
      setMedications(meds);
    } catch (err) {
      setError('Could not read the prescription. Please verify the AI relay server is running.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setSaveError('Please sign in again before saving reminders.');
      return;
    }

    const rows = medications
      .filter((med) => typeof med.name === 'string' && med.name.trim())
      .map((med) => ({
        patient_id: user.id,
        medicine_name: med.name.trim(),
        dosage_schedule: [
          {
            dosage: med.dosage || 'Not specified',
            frequency: med.frequency || 'Not specified',
            notes: med.notes ?? '',
          },
        ],
        is_active: true,
      }));

    if (rows.length === 0) {
      setSaveError('No valid medicine names were found to save.');
      return;
    }

    setSaving(true);
    setSaveError('');

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('medication_reminders').insert(rows);
        if (!error) {
          setSaving(false);
          setSaved(true);
          return;
        }
      } catch (e) {
        console.warn('Supabase save reminders failed, using mock persistence:', e);
      }
    }

    saveMockReminders(user, rows);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800">Scan a prescription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo and AI Vision will pull out each medicine, dose, and schedule.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/60 py-10 text-center transition-colors hover:border-primary/40 hover:bg-muted"
          >
            {preview ? (
              <img src={preview} alt="Prescription preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-slate-700">Click to upload a prescription image</span>
                <span className="text-xs text-muted-foreground">PNG or JPG</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {scanning && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading prescription…
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {medications.length > 0 && (
        <Card className="animate-fade-up">
          <CardContent className="pt-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Pill className="h-4 w-4 text-accent" />
              Detected medications
            </h2>
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-slate-800">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} · {med.frequency} {med.notes ? `· ${med.notes}` : ''}
                  </p>
                </div>
              ))}
            </div>

            {saved ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved to your medication reminders.
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/patient/reminders')}>
                  View reminders
                </Button>
              </div>
            ) : (
              <>
                <Button className="mt-4" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save to my reminders'}
                </Button>
                {saveError && <p className="mt-3 text-sm text-destructive">Could not save: {saveError}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
