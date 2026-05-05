# SoundFit — Localhost & GitHub Pages

Project ini sudah dipatch supaya tidak bergantung ke environment Replit.

## Jalankan di localhost

```bash
pnpm install
pnpm run dev
```

Buka alamat yang muncul di terminal, biasanya:

```text
http://localhost:5173
```

## Build test di laptop

```bash
pnpm run build
pnpm run preview
```

Preview biasanya muncul di:

```text
http://localhost:4173
```

## Deploy ke GitHub Pages

1. Upload/push project ini ke repository GitHub.
2. Pastikan branch utama bernama `main`.
3. Di GitHub buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **GitHub Actions**.
5. Push ke `main`, workflow `.github/workflows/deploy-gh-pages.yml` akan build otomatis.

Workflow otomatis menghitung nama repository dan mengirim `BASE_PATH=/<nama-repo>/` ke Vite, jadi asset JS/CSS tidak 404 saat dibuka dari GitHub Pages.

## File penting yang diubah

- `artifacts/roomsound-advisor/vite.config.ts`
  - Tidak lagi wajib memakai `PORT` dan `BASE_PATH` dari Replit.
  - Localhost default ke `/`.
  - GitHub Pages bisa memakai `BASE_PATH` dari workflow.

- `package.json`
  - Ditambah script praktis: `dev`, `build`, `preview`, `typecheck`, `clean`.

- `artifacts/roomsound-advisor/index.html`
  - Favicon dibuat aman untuk GitHub Pages base path.

- `.github/workflows/deploy-gh-pages.yml`
  - Workflow deploy otomatis ke GitHub Pages.

## Catatan

Project ini masih memakai `pnpm`, karena struktur Replit-nya menggunakan workspace dan `catalog:` dependencies. Jangan pakai `npm install` untuk project ini.
