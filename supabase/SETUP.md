# Setting up a new Supabase project for CareSlot AI

## 1. Create the project
1. Go to https://supabase.com/dashboard and sign in (or create a free account).
2. Click **New project**.
3. Pick an organization, name the project (e.g. `careslot-ai`), set a database
   password (save it somewhere), pick a region close to your users, and click
   **Create new project**. Wait ~1-2 minutes for it to provision.

## 2. Run the schema
1. In the left sidebar, open **SQL Editor**.
2. Click **New query**.
3. Paste the entire contents of `supabase/schema.sql` (from this project) into
   the editor.
4. Click **Run**. You should see "Success. No rows returned" and the 18 seed
   slots inserted.

This creates:
- `profiles` — one row per signed-up user, with a `role` of `patient`,
  `doctor`, or `admin`
- `clinics_slots` — the bookable appointment slots
- `appointments` — patient bookings against a slot
- `medication_reminders` — patient medicine reminders
- Row Level Security policies so patients only see their own data, and
  doctors/admins can see and manage everything
- A trigger that auto-creates a `profiles` row whenever someone signs up

The script is safe to re-run — it drops and recreates CareSlot's own tables
first, so it won't error out on a second run.

## 3. Get your API keys
1. In the left sidebar, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key (not the
   `service_role` key — that one should never go in client-side code).

## 4. Configure the app
1. Copy `.env.example` to `.env` in the project root.
2. Fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
3. (Optional) Fill in `GEMINI_API_KEY` if you want the AI symptom-triage chat
   to use a real model instead of its local fallback, and `RESEND_API_KEY` if
   you want real email sending. Neither is required for booking/slots to
   work.
4. Restart the dev server (`npm run dev`) so Vite picks up the new env vars.

Once `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app
automatically switches out of local Demo Mode and every doctor/patient action
reads and writes the real database — that's what `isSupabaseConfigured` in
`src/lib/supabaseClient.js` checks.

## 5. Create your first doctor and patient accounts
Just sign up normally through the app's Sign Up page — pick "Doctor" or
"Patient" as the role. The `handle_new_user` trigger will create the matching
`profiles` row automatically with that role.

## 6. Verify it end-to-end
1. Sign up as a doctor, go to **Availability**, add a slot.
2. Open the app in a private/incognito window (or a different browser),
   sign up as a patient, and confirm the new slot appears in **Book Care**.
3. Book it as the patient, then confirm it shows up in the doctor's
   **Appointments** queue.

If a step doesn't work, open your browser console — the app logs a
`console.warn` any time a Supabase call fails and it falls back to demo mode,
which is the quickest way to see what went wrong (usually a missing/incorrect
`.env` value, or the schema not having been run yet).
