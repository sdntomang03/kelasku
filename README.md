# Kelasku — Portal Ujian Digital

Aplikasi CBT berbasis React untuk siswa. Aplikasi menyediakan ujian online melalui API serta menu Belajar dan Latihan dari database SQLite lokal. Aplikasi web dibuat dengan Vite dan dapat dibungkus menjadi aplikasi Android menggunakan Capacitor.

## Teknologi

- React 19, React Router, dan Vite
- Capacitor 8 dan Android Gradle Plugin
- SQLite lokal melalui `@capacitor-community/sqlite`
- Chart.js untuk visualisasi hasil ujian
- KaTeX untuk menampilkan persamaan matematika

## Persyaratan

### Pengembangan web

- Node.js yang memenuhi kebutuhan Vite 8
- npm

### Build Android

- Android Studio
- Android SDK Platform 36 dan Android SDK Build-Tools
- Java Development Kit 17 atau lebih baru
- Android Gradle Wrapper disertakan di folder `android`

Minimum Android yang ditargetkan proyek ini adalah API 24 (Android 7.0). Untuk build melalui Android Studio, instal SDK dan tools yang diminta oleh Android Studio atau Gradle.

## Menjalankan secara lokal

1. Clone repository dan masuk ke folder proyek.
2. Pasang dependency:

   ```bash
   npm ci
   ```

3. Siapkan file `.env` di root proyek:

   ```env
   VITE_API_URL=https://alamat-server-anda/api/v1/student
   VITE_ENABLE_LOCAL_PRACTICE_WEB=false
   ```

   `VITE_API_URL` adalah URL API siswa. `VITE_ENABLE_LOCAL_PRACTICE_WEB` mengatur ketersediaan menu Belajar dan Latihan di browser:

   - `true`: tampilkan menu di web dan Android.
   - `false` atau tidak diset: menu hanya tersedia di Android.

   Variabel berawalan `VITE_` disertakan ke bundle web saat build; jangan menyimpan secret atau kredensial privat di sana. Setelah mengubah `.env`, mulai ulang Vite.

4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

   Buka URL lokal yang ditampilkan Vite di terminal.

Perintah pemeriksaan:

```bash
npm run lint
npm run build
npm run preview
```

`npm run preview` menyajikan hasil build lokal untuk pengecekan, bukan server produksi.

## Database Belajar dan Latihan

Database SQLite bawaan berada di `public/latihan-contoh.db`. Vite menyalinnya ke `dist/latihan-contoh.db` saat build. Capacitor kemudian menyalin web bundle beserta file database tersebut ke Android.

Skema konten mencakup kategori, paket, soal, opsi, pasangan menjodohkan, target pasangan, dan materi belajar. Jawaban serta pengaturan latihan siswa disimpan oleh aplikasi secara lokal, bukan di database konten bawaan.

Script pembuat database contoh:

```bash
python scripts/generate_practice_sample.py
```

Script menghasilkan `public/latihan-contoh.db` dan sengaja berhenti jika file tersebut sudah ada, agar database yang berisi data tidak tertimpa. Buat salinan/backup terlebih dahulu sebelum mengganti database. Pastikan file database siap sebelum menjalankan build dan sinkronisasi Android.

Untuk gambar pada konten soal atau materi, letakkan file di dalam `public/` (misalnya `public/images/materi/pancasila.png`) lalu gunakan path relatif `images/materi/pancasila.png` dalam konten HTML. Konten soal dan materi juga mendukung LaTeX yang diproses aplikasi.

## Build aplikasi Android dengan Capacitor

Capacitor menggunakan hasil build Vite dalam folder `dist`. Setiap kali kode web, konfigurasi `.env`, atau database bawaan berubah, build ulang dan sinkronkan asset sebelum menjalankan Android:

```bash
npm run build
npx cap sync android
```

### Membuka dan menjalankan di Android Studio

```bash
npx cap open android
```

Di Android Studio, tunggu Gradle sync selesai, pilih emulator/perangkat Android, lalu tekan **Run**.

### Membuat APK debug melalui Gradle

Windows PowerShell:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

macOS/Linux:

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK debug dibuat di:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Membuat rilis untuk distribusi

Untuk membuat APK release atau Android App Bundle (AAB), buka proyek melalui Android Studio dan pilih **Build > Generate Signed Bundle / APK**. Buat atau pilih keystore, isi konfigurasi signing, lalu simpan keystore dan password-nya dengan aman di luar repository. Jangan commit keystore atau kredensial signing ke Git.

Setelah mengganti database contoh atau gambar lokal, jalankan kembali `npm run build` dan `npx cap sync android`, lalu build ulang APK/AAB. Sinkronisasi Capacitor menyalin konten web ke proyek native; perintah tersebut tidak dengan sendirinya menghasilkan APK release bertanda tangan.

## Build dan deploy web

1. Atur `.env` atau environment variables pada layanan build:

   ```env
   VITE_API_URL=https://alamat-server-anda/api/v1/student
   VITE_ENABLE_LOCAL_PRACTICE_WEB=true
   ```

   Gunakan `true` agar Belajar dan Latihan tampil di web, atau `false` untuk membatasi keduanya ke Android.

2. Build versi produksi:

   ```bash
   npm ci
   npm run lint
   npm run build
   ```

3. Deploy **isi folder `dist/`** ke layanan static hosting seperti Nginx, Apache, Netlify, Vercel, atau layanan sejenis.

### Fallback untuk React Router

Aplikasi memakai URL berbasis path, misalnya `/dashboard`, `/learn`, dan `/practice`. Konfigurasikan hosting agar permintaan ke path aplikasi yang bukan file statis diarahkan kembali ke `index.html`. Tanpa fallback SPA, halaman dapat terlihat normal saat navigasi dari dalam aplikasi tetapi menghasilkan 404 ketika URL dibuka langsung atau browser di-refresh.

Contoh konfigurasi:

**Netlify** — buat file `public/_redirects` (agar ikut masuk ke `dist`):

```text
/* /index.html 200
```

**Apache** — gunakan aturan rewrite pada `.htaccess` di document root deployment:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

**Nginx** — atur blok `server`:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Konfigurasi Vite saat ini menggunakan base path `/`, sehingga panduan ini mengasumsikan aplikasi dipasang di root domain. Jika deploy pada subpath, sesuaikan `base` Vite dan konfigurasi routing/hosting sebelum build.

## Struktur penting

```text
src/                       Kode React aplikasi
src/pages/                 Halaman ujian, hasil, Belajar, dan Latihan
src/services/               Integrasi API dan SQLite lokal
public/latihan-contoh.db    Database SQLite bawaan
scripts/                    Script pembuat database contoh
android/                    Proyek native Android Capacitor
dist/                       Hasil build web (dibuat saat npm run build)
```

## Catatan

- Ujian online tetap menggunakan API. Belajar dan Latihan membaca konten SQLite lokal.
- Perubahan pada file `.env` hanya berlaku setelah server pengembangan dimulai ulang atau bundle dibangun ulang.
- Hindari mengunggah data siswa, token, secret API, keystore, atau password signing ke repository.
- Ukuran JavaScript bundle dapat menghasilkan peringatan chunk saat build. Build tetap berhasil, tetapi chunking dapat ditinjau untuk optimasi performa di kemudian hari.
