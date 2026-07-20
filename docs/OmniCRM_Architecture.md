# OmniCRM — Dokumen Arsitektur Teknis

**Versi:** 1.0
**Dokumen pendamping:** `OmniCRM_PRD.md`
**Tujuan dokumen:** Referensi teknis implementasi untuk coding agent (Claude Code, Cursor, dll) — fokus pada *bagaimana* sistem dibangun, bukan *apa* yang dibangun (itu ada di PRD).

---

## 1. Tech Stack Final

| Layer | Pilihan |
|---|---|
| Backend API | Python (FastAPI) |
| Database | Supabase (Postgres) + RLS |
| Auth | Supabase Auth — Google OAuth |
| Queue/Worker | Redis + background worker (async) |
| Automation (non-core only) | N8N — hanya notifikasi internal & report, TIDAK untuk logic customer-facing |
| Frontend | Next.js (App Router) |
| Deployment | Railway, Dockerfile eksplisit per service |
| Realtime | Supabase Realtime (push update ke frontend) |
| AI Provider | OpenRouter/Mistral |

---

## 2. Prinsip Arsitektur

1. **Multi-tenancy via RLS di level database**, bukan hanya filter di application layer. Setiap tabel wajib punya `workspace_id`, dan RLS policy memastikan query yang lupa filter tetap aman.
2. **Webhook adalah sumber kebenaran real-time.** Semua pesan masuk (WhatsApp, Instagram, echo dari Coexistence) masuk lewat webhook → queue → worker. Request handler webhook tidak boleh melakukan proses berat, hanya verifikasi + push ke queue.
3. **Idempotency wajib** di setiap event masuk — pakai `message_id` dari Meta sebagai dedup key, karena Meta bisa mengirim webhook duplikat.
4. **Core logic (chatbot, routing, broadcast) hidup di kode backend**, bukan N8N. N8N murni untuk automasi internal non-customer-facing.
5. **Echo message (dari Coexistence) diperlakukan sebagai event masuk juga**, dengan flag `source: app` vs `source: api` supaya frontend bisa membedakan asal pesan tanpa menduplikasi tampilan.
6. **Historical backfill (sinkronisasi chat lama saat onboarding Coexistence) diperlakukan sebagai proses terpisah dari real-time webhook**, meski sama-sama masuk lewat webhook Meta — karena beda karakter: datang sekaligus dalam batch besar, timestamp asli bukan waktu insert, dan butuh upsert kontak/percakapan yang mungkin belum ada di database.

---

## 3. Alur Data

### 3.1 Pesan Masuk (WhatsApp/Instagram API biasa)

```
Meta --webhook--> Webhook Receiver
                       |  verifikasi X-Hub-Signature-256
                       |  cek dedup (message_id)
                       v
                    Queue (Redis)
                       |
                       v
        Worker: parse payload, simpan ke `messages`,
        update `conversations.last_message_at`
                       |
                       v
        Supabase Realtime --> push ke frontend (inbox update)
```

### 3.2 Pesan dari Coexistence (echo dari WhatsApp Business App di HP)

```
Agent balas dari HP (WhatsApp Business App)
                       |
                       v
        Meta kirim "echo" webhook ke sistem
                       |
                       v
        Webhook Receiver (endpoint sama, payload ditandai echo)
                       |
                       v
        Worker: simpan sebagai message dengan source="app_echo"
        (BUKAN diproses sebagai auto-reply trigger)
                       |
                       v
        Supabase Realtime --> frontend menampilkan
        "dibalas dari HP" pada thread yang sama
```

**Catatan implementasi penting:** Worker harus punya logic eksplisit untuk membedakan `source="dashboard"` (dikirim dari OmniCRM) vs `source="app_echo"` (dikirim dari HP) — supaya tidak ada auto-reply/bot yang ikut trigger saat agent sudah balas manual dari HP.

### 3.3 Historical Backfill (Sinkronisasi Chat Lama saat Onboarding Coexistence)

Saat customer pertama kali menyelesaikan flow Coexistence (scan QR code di Embedded Signup), Meta mengirim riwayat chat lama (maks 6 bulan, teks saja, tanpa media, tanpa group chat) sebagai batch — bukan satu-satu seperti pesan real-time biasa.

```
Customer selesai scan QR (Embedded Signup Coexistence)
        |
        v
channels.historical_sync_status = 'syncing'
        |
        v
Meta kirim batch pesan historis lewat webhook
        |
        v
Worker proses tiap pesan dalam batch:
  1. Upsert contact (berdasar external_id/nomor HP — mungkin belum ada)
  2. Upsert conversation (berdasar contact_id — mungkin belum ada)
  3. Insert message dengan:
     - is_historical = true
     - sent_at = timestamp asli dari payload Meta (BUKAN waktu insert)
     - dedup via meta_message_id (sama seperti pesan biasa)
        |
        v
Setelah batch selesai:
channels.historical_sync_status = 'completed'
channels.historical_sync_completed_at = now()
        |
        v
Frontend tampilkan status sinkronisasi (progress/selesai)
        |
        v
Setelah ini, alur kembali normal ke 3.1 (real-time webhook)
```

**Kenapa ini harus proses terpisah, bukan diperlakukan sama seperti webhook biasa:**
- Kontak dan conversation kemungkinan belum ada di database sama sekali (ini pertama kali nomor itu masuk sistem) — perlu upsert, bukan asumsi sudah ada
- Timestamp asli pesan (`sent_at`) berbeda dari kapan baris itu disimpan ke database (`created_at`) — kalau disamakan, urutan chat di UI akan salah
- Volume datang sekaligus dalam jumlah besar (bisa ratusan/ribuan pesan), bukan satu-satu — worker perlu proses ini sebagai batch job, bukan asumsi throughput sama seperti webhook real-time
- User perlu tahu status sinkronisasi (sedang berjalan/selesai), karena backfill nggak instan

### 3.4 Pesan Keluar (dari Dashboard)

```
Agent kirim pesan dari dashboard
        |
        v
Backend API --> Meta Graph API (send message)
        |
        v
Simpan ke `messages` dengan source="dashboard"
        |
        v
Update conversation state
```

### 3.5 Session Window (24 Jam) — Batasan Teknis Meta, Bukan Status Percakapan

**Penting untuk dipahami semua yang kerja di project ini:** `session_expires_at` **tidak ada hubungannya** dengan `conversations.status` (open/pending/resolved). Dua hal ini benar-benar terpisah:

- `conversations.status` → keputusan **manual agent**, soal apakah masalah customer sudah selesai atau belum
- `session_expires_at` → batasan **teknis dari Meta**, soal apakah agent masih boleh kirim pesan bebas (free-form text) atau wajib pakai template

Window ini terikat ke **pesan terakhir dari customer**, bukan ke status percakapan. Reset otomatis 24 jam setiap kali customer chat lagi, terlepas dari status resolved/open yang di-set agent. Field ini murni informasi teknis untuk UI — supaya tombol kirim di frontend tahu harus tampilkan input teks bebas atau template picker, dan agent nggak kaget kena error dari Meta API kalau kirim teks bebas di luar window.

```sql
alter table conversations add column session_expires_at timestamptz;
-- di-update setiap kali ada pesan masuk dari customer:
-- session_expires_at = sent_at + interval '24 hours'
```

Logic di worker: setiap kali pesan masuk dengan `direction='in'` dan `source='customer'`, update `session_expires_at` di conversation terkait. Frontend membaca field ini untuk menentukan mode input pesan.

### 3.6 Alur Media Masuk (Foto, Voice Note, Dokumen)

URL media dari Meta Graph API **hanya valid ~5 menit** — kalau tidak segera diunduh, media hilang permanen. Ini WAJIB diproses dengan prioritas tinggi di worker, bukan menunggu antrian biasa.

```
Webhook masuk dengan media_id (bukan file langsung, cuma referensi)
        |
        v
Worker (prioritas tinggi): panggil Meta Graph API
  GET /{media_id} → dapat URL sementara (~5 menit)
        |
        v
Worker: download binary dari URL sementara tsb
        |
        v
Upload ke Supabase Storage
        |
        v
Simpan ke `messages`:
  media_url = URL Supabase (bukan URL Meta)
  media_expires_at = now() + interval '1 day' (default)
  media_retained = false (default)
```

**Retensi media:**
- Default: media dihapus dari storage setelah 1 hari (`media_expires_at` lewat)
- Agent bisa klik "simpan media ini" di UI → `media_retained = true` → skip penghapusan
- Yang dihapus cuma **file media**-nya (dari Supabase Storage), bukan baris pesan — riwayat chat (teks, waktu, siapa kirim) tetap ada selamanya, cuma lampiran media-nya diganti placeholder "media sudah kedaluwarsa"
- Perlu **scheduled job terpisah** (cron/worker berkala, misal tiap beberapa jam) yang cari `media_expires_at < now() AND media_retained = false`, hapus file dari storage, lalu null-kan `media_url`

---

## 4. Skema Database (Supabase/Postgres)

```sql
-- Semua tabel di bawah ini menggunakan RLS policy:
-- workspace_id = (auth.jwt() ->> 'workspace_id')::uuid

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'trial',
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id),
  workspace_id uuid references workspaces(id),
  email text not null,
  role text default 'agent', -- owner | admin | agent
  created_at timestamptz default now()
);

create table channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  type text not null, -- 'whatsapp' | 'instagram'
  external_account_id text not null, -- waba_id atau ig_account_id
  coexistence_enabled boolean default false,
  status text default 'pending', -- pending | active | disconnected
  historical_sync_status text default 'not_started', -- not_started | syncing | completed | failed
  historical_sync_started_at timestamptz,
  historical_sync_completed_at timestamptz,
  created_at timestamptz default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  channel_id uuid references channels(id),
  external_id text not null, -- nomor WA atau IG user id
  name text,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  contact_id uuid references contacts(id),
  status text default 'open', -- open | pending | resolved (KEPUTUSAN MANUAL AGENT)
  session_expires_at timestamptz, -- BATASAN TEKNIS META, terpisah dari status di atas — lihat 3.5
  assigned_to uuid references users(id),
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  direction text not null, -- 'in' | 'out'
  source text not null, -- 'dashboard' | 'app_echo' | 'customer'
  content text,
  message_type text default 'text',
  media_url text, -- URL di Supabase Storage (BUKAN URL Meta, yang expire 5 menit) — lihat 3.6
  media_expires_at timestamptz, -- default now() + interval '1 day', null jika tidak ada media
  media_retained boolean default false, -- true = agent pilih simpan permanen, skip cleanup job
  meta_message_id text unique, -- untuk dedup/idempotency
  sent_at timestamptz not null, -- waktu ASLI pesan terjadi (dari payload Meta) — WAJIB diisi dari data Meta, bukan now()
  is_historical boolean default false, -- true jika berasal dari backfill Coexistence, bukan webhook real-time
  created_at timestamptz default now() -- waktu baris ini disimpan ke DB (bisa jauh berbeda dari sent_at untuk data historis)
);

-- PENTING: urutan tampilan chat di frontend HARUS pakai `sent_at`, bukan `created_at`.
-- created_at hanya untuk keperluan audit/debugging kapan data masuk ke sistem kita.

create table templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  type text not null default 'quick_reply', -- 'quick_reply' (bebas, internal) | 'wa_official' (approved Meta, WAJIB di luar session window)
  name text not null,
  content text not null,
  category text, -- untuk wa_official: marketing | utility | authentication (kosong untuk quick_reply)
  approval_status text default 'draft', -- draft | pending | approved | rejected — relevan hanya untuk wa_official
  meta_template_id text, -- ID template dari Meta setelah disetujui, null untuk quick_reply
  created_at timestamptz default now()
);
-- Catatan: v1 cukup implementasikan quick_reply saja (approval_status/meta_template_id dibiarkan default/null).
-- Struktur wa_official disiapkan agar tidak perlu migrasi skema saat fitur ini digarap di v1.5.
```

---

## 5. Deployment (Railway)

- **Service 1 — Backend API** (FastAPI): `Dockerfile` eksplisit, expose port, env var untuk Supabase keys & Meta app secrets
- **Service 2 — Worker**: proses queue Redis, `Dockerfile` terpisah (bisa image sama dengan backend, beda entrypoint)
- **Service 3 — Redis**: Railway plugin/managed Redis
- **Frontend**: deploy terpisah (Railway atau Vercel), fetch ke backend API via REST/WebSocket

Contoh struktur repo:
```
/backend
  Dockerfile
  main.py
  worker.py
  requirements.txt
/frontend
  (Next.js app)
/docs
  OmniCRM_PRD.md
  OmniCRM_Architecture.md
```

---

## 6. Hal yang Wajib Diperhatikan Coding Agent

- Jangan taruh logic chatbot/routing/broadcast di N8N — itu keputusan arsitektur final, bukan preferensi.
- Setiap tabel baru yang dibuat harus otomatis dapat RLS policy berbasis `workspace_id` — jangan skip ini walau untuk keperluan testing cepat.
- Webhook receiver harus response cepat (<5 detik) — proses berat wajib lewat queue, jangan sinkron di request handler.
- Pembeda `source` di tabel `messages` itu krusial untuk Coexistence — jangan disederhanakan jadi cuma `direction` saja.
- Frontend dashboard adalah bagian yang akan direkam untuk Meta App Review — kualitas visual & alur onboarding jadi prioritas, bukan sekadar functional.
- Untuk historical backfill Coexistence: WAJIB pakai `sent_at` dari payload Meta untuk urutan chat, jangan pernah pakai `created_at` untuk sorting tampilan pesan.
- Proses backfill wajib upsert contact & conversation dulu (jangan asumsi sudah ada), karena ini bisa jadi kontak/percakapan pertama kali masuk sistem.
- Frontend wajib menampilkan status `historical_sync_status` ke user (misal badge "Menyinkronkan riwayat chat..."), jangan biarkan user bingung kenapa history belum lengkap tanpa indikator apa pun.
- `conversations.status` (manual, agent) dan `conversations.session_expires_at` (teknis, Meta) adalah DUA HAL BERBEDA — jangan digabung jadi satu logic atau satu field. Lihat 3.5.
- v1 hanya implementasikan `templates.type = 'quick_reply'`. Field terkait `wa_official` (approval_status, meta_template_id) sudah disiapkan di skema tapi TIDAK perlu logic approval flow di v1 — itu masuk v1.5.
- Media WAJIB diunduh & diupload ke Supabase Storage segera saat webhook diterima (prioritas tinggi di worker) — URL Meta expire ~5 menit. Jangan simpan URL Meta langsung ke `messages.media_url`.
- Perlu scheduled job (cron) terpisah untuk cleanup media yang sudah lewat `media_expires_at` dan `media_retained = false` — ini bukan bagian dari alur webhook real-time, jalan berkala secara independen.
