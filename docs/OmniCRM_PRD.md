# OmniCRM — Product Requirements Document

**Versi:** 2.0
**Tanggal:** Juli 2026
**Status:** Draft untuk handoff ke coding agent
**Target:** SMB Indonesia, omnichannel CRM (WhatsApp + Instagram sebagai channel utama)

**Changelog v2.0:**
- WhatsApp Coexistence dimasukkan ke v1 (ada customer riil yang minta) — tambah komponen echo-message sync
- Login via Google (Supabase Auth) ditetapkan sebagai metode login utama
- N8N dihilangkan dari core product logic (chatbot, routing, broadcast) — hanya dipakai untuk automasi internal non-customer-facing
- Deploy target: Railway, dengan Dockerfile eksplisit (bukan full auto-detect/Nixpacks)

---

## 1. Ringkasan Produk

OmniCRM adalah platform CRM omnichannel berbasis SaaS yang menyatukan percakapan pelanggan dari WhatsApp Business API dan Instagram ke dalam satu dashboard. Target awal: SMB Indonesia yang menjual lewat WhatsApp/Instagram tapi kesulitan mengelola percakapan yang tersebar di banyak channel dan device.

**Positioning vs kompetitor (Mekari Qontak dkk):**
- WhatsApp-first, bukan generic omnichannel
- AI-native (auto-reply, auto-tagging) built-in dari awal, bukan add-on
- Harga transparan, tanpa perlu "hubungi sales"
- Fokus SMB micro, bukan enterprise

**Catatan penting:** Aplikasi ini WAJIB lolos Meta App Review untuk mendapat akses `whatsapp_business_messaging` dan Instagram Graph API permission sebelum bisa onboarding customer nyata. Requirement App Review mempengaruhi keputusan arsitektur & UI di seluruh dokumen ini — lihat Bagian 8.

---

## 2. Tujuan & Non-Tujuan

**Tujuan (v1):**
- Unified inbox untuk WhatsApp + Instagram DM
- Multi-tenant (1 instance melayani banyak bisnis, data terisolasi via Supabase RLS)
- Login via Google (Supabase Auth)
- Embedded Signup untuk onboarding WABA mandiri oleh customer
- **WhatsApp Coexistence** — nomor WA bisnis tetap bisa dipakai manual dari HP (WhatsApp Business App) sekaligus terhubung ke dashboard (lihat Bagian 4.4)
- Contact/customer profile dengan riwayat percakapan
- Assignment percakapan ke agent/tim
- Template message & quick reply

**Tujuan v1.5 (menyusul setelah v1 stabil):**
- Auto-reply/chatbot berbasis AI (dibangun native di backend, bukan N8N — lihat Bagian 4.5)
- Model harga (belum ditetapkan — masih tahap development, keputusan pricing ditunda)
- Kemungkinan versi web app yang di-package sebagai mobile (PWA) — masih opsi terbuka, belum keputusan final

**Non-tujuan (v1) — eksplisit di luar scope:**
- Voice/call channel
- Field sales tracking / GPS
- Email & channel lain (Telegram, LINE, Discord) — masuk v2
- Broadcast/blast marketing skala besar (perlu compliance terpisah)
- Native mobile app (iOS/Android) — belum ada rencana pasti, kemungkinan cukup web app/PWA

---

## 3. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Backend API | Python (FastAPI) | Konsisten dengan stack existing, async-friendly untuk webhook |
| Database | Supabase (Postgres) | RLS native untuk multi-tenancy, auth built-in |
| Auth | Supabase Auth — Google OAuth | Login cepat untuk user, tidak perlu bangun sistem auth sendiri |
| Queue/Worker | Redis + background worker | Webhook processing & echo-message sync tidak boleh blocking |
| Automation (non-core) | N8N — **dibatasi** hanya untuk automasi internal (notifikasi tim, report berkala) | Logic customer-facing (chatbot, routing, broadcast) TIDAK boleh ada di N8N — lihat Bagian 4.5 |
| Frontend | Next.js atau React SPA | Dashboard interaktif, harus polished untuk App Review screencast |
| Deployment | Railway, dengan Dockerfile eksplisit per service (backend, worker) | Kontrol penuh atas versi dependency, bukan pasrah ke auto-detect |
| AI Provider | OpenRouter/Mistral (sesuai pengalaman WA Assistant sebelumnya) | Sudah familiar, cost-efficient |

---

## 4. Arsitektur Sistem

### 4.1 Prinsip Desain
- **Multi-tenancy via RLS**: setiap tabel punya `workspace_id`, RLS policy Supabase memastikan isolasi data per tenant di level database, bukan hanya di application layer.
- **Webhook sebagai sumber kebenaran real-time**: semua pesan masuk dari Meta lewat webhook, diproses async lewat queue, bukan diproses langsung di request handler.
- **Idempotency wajib**: Meta bisa mengirim webhook duplikat — setiap event harus punya dedup key (message_id) sebelum diproses.

### 4.2 Alur Data Utama

```
Meta (WhatsApp/IG) --webhook--> Webhook Receiver (verify signature)
                                      |
                                      v
                              Queue (Redis/BullMQ-style)
                                      |
                                      v
                         Worker: parse, dedup, simpan ke DB
                                      |
                                      v
                    Update conversation state + trigger AI (jika perlu)
                                      |
                                      v
                         Realtime push ke frontend (Supabase Realtime)
```

### 4.3 Komponen Backend

**a. Webhook Receiver**
- Endpoint terpisah untuk WhatsApp (`/webhook/whatsapp`) dan Instagram (`/webhook/instagram`)
- Verifikasi `X-Hub-Signature-256` di setiap request
- Response cepat (< 5 detik) lalu lempar ke queue — Meta akan retry/timeout kalau lambat

**b. OAuth / Embedded Signup**
- WhatsApp: gunakan **Embedded Signup flow** resmi Meta (bukan input token manual) — ini penting karena Meta menilai partner yang pakai flow self-service lebih baik saat App Review
- Instagram: OAuth standar Instagram Graph API, scope terbatas ke `instagram_manage_messages`

**c. Conversation Engine**
- State: `open`, `pending`, `resolved`
- Assignment ke agent (nullable — bisa unassigned dulu)
- Message threading per contact per channel

**d. Multi-tenant Data Model (ringkas)**

```
workspaces (id, name, plan, created_at)
users (id, workspace_id, email, role)
channels (id, workspace_id, type[whatsapp|instagram], waba_id/ig_account_id, status)
contacts (id, workspace_id, channel_id, external_id, name, phone/handle)
conversations (id, workspace_id, contact_id, status, assigned_to, last_message_at)
messages (id, conversation_id, direction[in|out], content, message_type, meta_message_id, created_at)
templates (id, workspace_id, name, content, category)
```

Semua tabel di atas: RLS policy `workspace_id = auth.jwt() -> workspace_id`.

### 4.4 WhatsApp Coexistence

Coexistence memungkinkan nomor WA bisnis tetap dipakai manual di WhatsApp Business App (HP) **sekaligus** terhubung ke dashboard OmniCRM lewat Cloud API. Ini masuk v1 karena ada customer riil yang eksplisit meminta fitur ini.

**Implikasi teknis yang wajib diperhitungkan dari awal:**
- **Echo message handling**: pesan yang dikirim/diterima dari HP (WhatsApp Business App) akan masuk ke sistem sebagai "echo" lewat webhook — perlu logic terpisah untuk membedakan pesan echo (dari HP) vs pesan yang benar-benar dikirim dari dashboard, supaya tidak terjadi duplikasi atau kebingungan status di conversation thread.
- **Sinkronisasi dua arah real-time**: worker perlu memproses echo message dengan prioritas sama seperti pesan masuk normal, lalu push ke frontend lewat Supabase Realtime supaya agent yang buka dashboard tetap lihat percakapan ter-update meski dibalas dari HP.
- **Onboarding via Embedded Signup**: proses upgrade nomor existing ke Coexistence tetap lewat Embedded Signup resmi Meta, bukan proses custom.
- **Batasan fitur yang perlu dikomunikasikan ke customer**: disappearing messages, broadcast list, dan view-once media punya keterbatasan saat Coexistence aktif — ini bukan bug di sistem kamu, tapi batasan dari Meta.
- **Ketersediaan bertahap**: rollout Coexistence dari Meta masih tergantung negara, BSP, dan eligibility nomor — perlu ada fallback message di onboarding flow kalau nomor customer belum eligible.

### 4.5 Batasan Penggunaan N8N

**Keputusan eksplisit:** N8N **tidak digunakan** untuk logic customer-facing apa pun — ini termasuk chatbot/auto-reply logic, conversation routing, broadcast/campaign, dan KPI tracking. Semua ini dibangun native di backend (FastAPI + worker), dengan alasan:
- Isolasi multi-tenant jauh lebih rapi lewat query `workspace_id` di kode dibanding workflow N8N terpisah per customer
- N8N bukan execution engine yang didesain untuk logic production skala banyak tenant
- Core differentiator produk (kecepatan iterasi chatbot/routing) harus tetap dalam kontrol penuh tim, bukan tool pihak ketiga

**N8N hanya boleh dipakai untuk:**
- Notifikasi internal ke tim (Slack/Telegram/email) — bukan ke customer
- Report otomatis berkala untuk keperluan internal
- Automasi ops yang sifatnya sekali pakai / eksperimen, bukan bagian dari core flow produk

Jika ke depan ada rencana memberi customer kemampuan bikin automasi sendiri (workflow builder ala Zapier di dalam produk), itu keputusan fitur terpisah yang dibangun sebagai UI native di atas queue/rule engine sendiri — bukan expose N8N mentah ke customer.

### 4.6 Frontend — Requirement Spesifik

Karena frontend ini yang akan direkam untuk screencast App Review, requirement-nya lebih ketat dari sekadar "berfungsi":

- **Unified inbox view**: list percakapan di kiri (mirip WhatsApp Web), detail chat di tengah, contact profile panel di kanan
- **Onboarding flow yang smooth**: connect WABA/IG → verifikasi → langsung terlihat pesan masuk dalam demo
- **Data dummy realistis** untuk keperluan demo/review: nama kontak wajar, riwayat chat natural, jangan "Test User 1", "asdasd"
- Alur harus **match 1:1** dengan deskripsi use case yang didaftarkan di form App Review

---

## 5. Non-Functional Requirements

- **Latency webhook**: respon ke Meta < 5 detik (proses berat dilempar ke worker)
- **Data isolation**: tidak boleh ada satu pun query yang bisa cross-tenant, wajib RLS + testing eksplisit
- **Uptime webhook receiver**: ini komponen paling kritikal, downtime = pesan customer hilang
- **Audit log**: siapa membalas apa dan kapan, minimal untuk keperluan compliance/dispute

---

## 6. Data Privacy & Compliance

- Privacy Policy & Terms of Service harus live di domain publik sebelum submit App Review
- Data deletion request handling wajib ada (endpoint atau proses manual terdokumentasi) — Meta mensyaratkan ini
- Business Verification di Meta Business Manager harus selesai duluan — ini sering jadi blocker tersembunyi yang prosesnya lama, mulai paling awal

---

## 7. Roadmap Fase

| Fase | Fokus | Estimasi |
|---|---|---|
| 0 | Business verification + compliance docs (privacy policy, ToS, data deletion) | Mulai paling awal, paralel dengan fase 1 |
| 1 | Backend inti: data model, webhook receiver, auth (Google via Supabase), multi-tenant RLS | 3-4 minggu |
| 2 | Frontend inbox (polished, siap direkam) + dummy data realistis | 3-4 minggu |
| 3 | Embedded Signup + Coexistence (echo message sync) + Instagram OAuth | 2-3 minggu |
| 4 | Setup deployment Railway (Dockerfile backend + worker) | 3-5 hari |
| 5 | Rekam screencast, submit App Review | 1 minggu |
| 6 | Iterasi berdasar feedback reviewer (jika ditolak) | Variabel |

---

## 8. Meta App Review — Checklist Kritis

- [ ] Screencast merekam **business-facing interface**, bukan sisi konsumen
- [ ] Video menunjukkan bukti jelas penggunaan permission `whatsapp_business_messaging`
- [ ] Use case description di form persis sama dengan yang didemokan
- [ ] Business Verification selesai
- [ ] Privacy Policy & ToS live di domain
- [ ] Data deletion instruction tersedia
- [ ] Dummy data demo terlihat realistis, bukan placeholder testing

---

## 9. Open Questions — Status

1. ~~AI auto-reply v1 atau v1.5?~~ — **Terjawab**: v1.5
2. ~~Model harga~~ — **Ditunda sengaja**: belum ditetapkan, masih tahap development
3. ~~Mobile app~~ — **Terjawab sebagian**: kemungkinan web app/PWA, belum keputusan final, bukan native app
4. ~~WhatsApp Coexistence~~ — **Terjawab**: masuk v1
5. ~~Deploy target~~ — **Terjawab**: Railway
6. ~~Peran N8N~~ — **Terjawab**: hanya automasi internal, tidak untuk core logic

Dokumen arsitektur teknis lebih detail ada di file terpisah: `OmniCRM_Architecture.md`

---

*Dokumen ini dimaksudkan sebagai context tunggal yang bisa di-paste ke coding agent manapun (Claude Code, Cursor, dll) tanpa perlu re-explain background project.*
