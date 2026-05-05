# SoundFit Phase 3 — Smart Recommendation Engine + Educational Result

Patch ini menaikkan SoundFit dari guided UI menjadi assistant yang terasa lebih cerdas dan edukatif.

## Fokus patch

- Menambahkan `SmartInsight` ke `advisorEngine.ts`.
- Membaca bentuk ruangan: proporsional, memanjang, sangat memanjang, atau melebar.
- Memberi keputusan pemasangan speaker depan: cukup kanan-kiri atau perlu fill tengah/belakang.
- Memberi saran tinggi pemasangan dan catatan khusus jika speaker tidak bisa tilt/menunduk.
- Menambahkan risk meter:
  - Coverage belakang
  - Risiko feedback
  - Risiko gema
  - Kenyamanan area depan
  - Kebutuhan delay zone
- Menambahkan educational result blocks untuk panitia/DKM/user awam.
- Menambahkan jalur upgrade bertahap.

## File utama yang berubah

- `artifacts/roomsound-advisor/src/logic/advisorEngine.ts`
- `artifacts/roomsound-advisor/src/pages/home.tsx`

## Cara run lokal

```bash
pnpm install
pnpm run dev
```

Jika `pnpm` belum tersedia:

```bash
corepack enable
corepack pnpm install
corepack pnpm run dev
```

## Cara build

```bash
pnpm run build
```

## Catatan

Rekomendasi SoundFit tetap advisory awal. Untuk instalasi final, kondisi lapangan seperti posisi mic, bracket speaker, material ruangan, kabel, amplifier, dan akustik ruangan tetap perlu dicek.
