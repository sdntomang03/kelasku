# API Premium untuk React

Endpoint premium v1 menggunakan autentikasi Sanctum dan hanya dapat dipakai akun
yang email-nya sudah diverifikasi. Kirim token pada setiap request:

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

Semua endpoint v1 memakai wrapper:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Konfigurasi paket dan harga

Harga hanya ditentukan server, bukan dari React. Atur nilai berikut pada `.env`
server lalu jalankan `php artisan config:cache` bila aplikasi menggunakan config
cache:

```dotenv
PREMIUM_MONTHLY_AMOUNT=
PREMIUM_SIX_MONTHS_AMOUNT=
PREMIUM_LIFETIME_AMOUNT=
PREMIUM_PAYMENT_FINISH_URL=https://frontend.example/payment/success
PREMIUM_PAYMENT_UNFINISH_URL=https://frontend.example/payment/pending
PREMIUM_PAYMENT_ERROR_URL=https://frontend.example/payment/error
```

Nilai adalah integer rupiah. Paket dengan harga kosong atau `0` ditampilkan
sebagai tidak tersedia, dan checkout ditolak sampai nominal diisi. Katalog dan
durasi berada di `config/premium.php`:

| plan_code | Nama default | Durasi |
|---|---|---:|
| `monthly` | Premium 1 Bulan | 1 bulan |
| `six_months` | Premium 6 Bulan | 6 bulan |
| `lifetime` | Premium Seumur Hidup | 1200 bulan |

Paket `lifetime` mengikuti implementasi data yang tersedia saat ini, yaitu masa
aktif 1200 bulan, bukan expiry tanpa batas.

Pastikan konfigurasi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, dan
`MIDTRANS_IS_PRODUCTION` juga sudah sesuai environment.
Atur callback URL sesuai domain React. Jika nilainya tidak diatur, konfigurasi
default masih menggunakan deep link aplikasi yang sudah ada.

## 1. Ambil paket

```http
GET /api/v1/student/premium/plans
```

Response:

```json
{
  "success": true,
  "message": "Daftar paket premium berhasil diambil.",
  "data": {
    "plans": [
      {
        "code": "monthly",
        "name": "Premium 1 Bulan",
        "amount": 50000,
        "currency": "IDR",
        "duration_months": 1,
        "available": true
      }
    ]
  }
}
```

Gunakan `code` dari paket yang `available: true` saat meminta checkout. Nominal
paket tidak boleh ditentukan atau dikirim oleh client.

## 2. Cek status dan masa aktif

```http
GET /api/v1/student/premium/status
```

Response:

```json
{
  "success": true,
  "message": "Status premium berhasil diambil.",
  "data": {
    "is_premium": true,
    "status": "active",
    "premium_until": "2026-10-27T02:00:00.000000Z",
    "remaining_days": 30,
    "total_poin": 0
  }
}
```

Nilai `status`:

- `active`: masa aktif premium belum berakhir.
- `expired`: masa berakhir sudah lewat.
- `inactive`: belum pernah mempunyai masa premium.

Status dihitung dari `users.premium_until`; masa aktif yang kedaluwarsa otomatis
menjadi non-premium saat dibaca. React tidak perlu melakukan perubahan database
atau menghitung masa aktif sendiri.

## 3. Buat pendaftaran/pembelian paket

```http
POST /api/v1/student/premium/checkout
```

Body:

```json
{
  "plan_code": "monthly"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Tagihan premium berhasil dibuat.",
  "data": {
    "transaction": {
      "id": 91,
      "order_id": "PREM-EXAMPLE",
      "plan_code": "monthly",
      "plan_name": "Premium 1 Bulan",
      "amount": 50000,
      "currency": "IDR",
      "status": "pending",
      "duration_months": 1,
      "created_at": "2026-09-27T02:00:00.000000Z",
      "updated_at": "2026-09-27T02:00:00.000000Z"
    },
    "snap_token": "midtrans-snap-token",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
  }
}
```

Buka `redirect_url` atau gunakan `snap_token` dengan integrasi Snap yang sesuai
platform. Checkout membuat transaksi `pending`; **jangan aktifkan premium hanya
karena halaman pembayaran kembali ke React dengan status sukses**. Aktivasi
hanya dilakukan setelah server menerima notifikasi pembayaran terverifikasi
dari Midtrans.

## 4. Riwayat transaksi

```http
GET /api/v1/student/premium/transactions?page=1
```

Response `data` berisi paginator Laravel (`data`, `current_page`,
`last_page`, `per_page`, `total`, dan link halaman). Riwayat hanya berisi
transaksi milik user yang sedang login.

Status transaksi yang umum:

- `pending`: pembayaran menunggu.
- `success`: pembayaran terkonfirmasi dan masa premium ditambahkan.
- `failed`: pembayaran ditolak, dibatalkan, atau kedaluwarsa oleh provider.
- `canceled`: tagihan dibatalkan user.

## 5. Batalkan tagihan pending

```http
POST /api/v1/student/premium/transactions/{order_id}/cancel
```

Hanya pemilik transaksi berstatus `pending` yang dapat membatalkan tagihan.
Transaksi sudah selesai menghasilkan HTTP `409`; order yang bukan milik user atau
tidak ditemukan menghasilkan HTTP `404`.

## Siklus status premium

1. React mengambil katalog dengan `GET /premium/plans`.
2. React membaca status menggunakan `GET /premium/status`.
3. User memilih paket; React mengirim `plan_code` ke `POST /premium/checkout`.
4. React membuka Snap menggunakan `redirect_url` atau `snap_token`.
5. Provider mengirim webhook ke `POST /api/webhook/midtrans`.
6. Server memvalidasi signature dan nominal, menandai transaksi sukses, lalu
   menambahkan durasi paket ke `users.premium_until`. Pembayaran webhook duplikat
   tidak menambahkan durasi dua kali.
7. React refresh `GET /premium/status` atau polling status transaksi melalui
   `GET /premium/transactions`.
8. Saat `premium_until` lewat, status endpoint mengembalikan `expired` dan
   `is_premium: false`. User dapat checkout paket lagi; pembayaran sukses
   memperpanjang dari waktu expiry aktif, atau dari waktu pembayaran jika masa
   sebelumnya telah habis.

## Error yang perlu ditangani React

- `401`: token tidak valid atau tidak ada; arahkan ke login.
- `403`: email belum diverifikasi; minta user aktivasi email.
- `409`: transaksi tidak berstatus pending untuk pembatalan.
- `422`: `plan_code` tidak dikenal atau validasi request gagal.
- `503`: harga paket belum diatur di server.
- `502`: provider pembayaran gagal atau tidak tersedia.

Endpoint legacy `/api/subscription/*` tetap tersedia untuk kompatibilitas.
Checkout legacy juga harus memakai `plan_code` yang dikenal; jika masih
mengirim `amount`, nilainya harus sama dengan nominal yang ditentukan server.
