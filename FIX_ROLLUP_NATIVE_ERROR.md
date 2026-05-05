# Fix Rollup native.js error

This project originally came from Replit. Replit generated native-package overrides that excluded Windows/macOS Rollup binaries. On Windows this can cause errors like:

```text
rollup@4.59.0 native.js
Cannot find module @rollup/rollup-win32-x64-msvc
```

## Clean install on Windows PowerShell

Run from the project root:

```powershell
rd /s /q node_modules 2>$null
rd /s /q artifacts\roomsound-advisor\node_modules 2>$null
del pnpm-lock.yaml 2>$null
corepack enable
corepack prepare pnpm@10.20.0 --activate
pnpm install --no-frozen-lockfile
pnpm run dev
```

Open:

```text
http://localhost:5173
```

## Why this patch works

- `pnpm-workspace.yaml` no longer excludes native Rollup/esbuild/Tailwind packages for Windows/macOS.
- The stale Linux/Replit `pnpm-lock.yaml` was removed so your machine can regenerate the correct lockfile.
- GitHub Pages workflow already uses `pnpm install --no-frozen-lockfile`, so it will regenerate the correct Linux lock during deployment.

After `pnpm install` succeeds, commit the new generated `pnpm-lock.yaml` from your own machine.
