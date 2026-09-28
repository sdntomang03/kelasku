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
   VITE_WHATSAPP_NUMBER=628xxxxxxxxxx
   ```

   `VITE_API_URL` adalah URL API siswa. `VITE_ENABLE_LOCAL_PRACTICE_WEB` mengatur ketersediaan menu Belajar dan Latihan di browser:

   - `true`: tampilkan menu di web dan Android.
   - `false` atau tidak diset: menu hanya tersedia di Android.

   `VITE_WHATSAPP_NUMBER` adalah nomor bantuan WhatsApp dalam format internasional berupa angka saja, termasuk kode negara (misalnya awalan `62` untuk Indonesia, tanpa `+`, spasi, atau tanda hubung). Variabel berawalan `VITE_` disertakan ke bundle web saat build; jangan menyimpan secret atau kredensial privat di sana. Setelah mengubah `.env`, mulai ulang Vite.

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

Skema konten mencakup kategori, paket, soal, opsi, pasangan menjodohkan, target pasangan, dan materi belajar. Kolom `is_premium` (0/1) pada kategori, paket, dan materi mengatur penandaan konten Premium. Jawaban serta pengaturan latihan siswa disimpan oleh aplikasi secara lokal, bukan di database konten bawaan. Aplikasi memeriksa `GET /premium/status` sebelum menampilkan konten bertanda Premium; pastikan `is_premium` hanya dipakai untuk menyembunyikan UI, bukan sebagai perlindungan konten.

**Penting:** `public/latihan-contoh.db` disalin ke dalam bundle web/Android dan dapat diekstrak. Menandai baris Premium, mengunci layar, atau mengenkripsi database dengan kunci yang ditanam di aplikasi tidak dapat mencegah pengguna mahir mengambil isi database. Jangan simpan soal/materi rahasia atau jawaban kunci premium di database publik. Untuk perlindungan nyata, hilangkan konten Premium dari bundle lokal dan layani lewat endpoint backend yang memverifikasi token serta status premium pada setiap permintaan.

Konten yang ditandai Premium pada kategori, paket, atau materi menggunakan kolom integer `is_premium` bernilai `1`; konten umum bernilai `0`. Database runtime yang lama dimigrasikan otomatis. Pada pembaruan aplikasi, konten bawaan digabungkan berdasarkan ID agar materi/paket/soal Premium baru ikut tersedia tanpa menghapus jawaban latihan yang tersimpan. Contoh database saat ini berisi satu materi dan satu paket Premium orisinal TKA SD.

Status keanggotaan diperiksa melalui `GET /premium/status`; paket dan checkout memakai `GET /premium/plans` serta `POST /premium/checkout`. Harga berasal dari API server, dan React hanya mengarahkan siswa ke `redirect_url`; premium tidak diaktifkan berdasarkan redirect sukses. Endpoint premium harus tersedia di backend dengan autentikasi yang sama seperti endpoint siswa.

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

Identitas aplikasi Android ditentukan oleh `appId` dan `appName` di `capacitor.config.json`, `applicationId`/`namespace` di `android/app/build.gradle`, serta label di `android/app/src/main/res/values/strings.xml`. Jika mengubah package ID sebelum rilis pertama, selaraskan juga package `MainActivity` dan jalankan `npx cap sync android`. Setelah aplikasi terbit di Play Store, package ID harus dipertahankan untuk pembaruan.

### Mengganti ikon aplikasi

Di Android Studio pilih **File > New > Image Asset**, pilih **Launcher Icons (Adaptive and Legacy)**, pilih file ikon sumber persegi beresolusi tinggi, atur foreground/background dan safe zone, lalu selesaikan wizard. Periksa aset pada `android/app/src/main/res/mipmap-*` dan `mipmap-anydpi-v26`, lalu jalankan build Android kembali. Siapkan ikon listing Play Store terpisah berukuran 512 × 512 piksel.

### Kebijakan privasi dan listing Play Store

Halaman kebijakan privasi tersedia di `public/privacy-policy.html` dan akan disalin ke `dist/privacy-policy.html`. Deploy file itu di HTTPS, lalu masukkan URL publiknya ke Play Console dan tautkan pada listing aplikasi. Pastikan domain produksi dan email kontak pada kebijakan aktif sebelum mengirim aplikasi untuk ditinjau. Formulir pendaftaran aplikasi menautkan kebijakan ini dan mewajibkan siswa menyatakan telah membacanya; halaman profil menyediakan tautan kebijakan dan permintaan penghapusan akun melalui email.

Play Store membatasi judul listing hingga 30 karakter. Nama aplikasi di perangkat saat ini **Kelasku: Belajar & Latihan TKA SD**; judul listing yang lebih pendek dapat menggunakan **Kelasku: Belajar TKA SD**, lalu sebutkan fitur latihan pada deskripsi singkat/panjang. Isi Data safety harus sesuai implementasi backend dan praktik penyimpanan aktual.

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
   VITE_WHATSAPP_NUMBER=628xxxxxxxxxx
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
