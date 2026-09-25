# Student API v1

Dokumentasi REST API untuk aplikasi mobile CBTPro. API ini menggunakan business logic, model, database, dan scoring service yang sama dengan aplikasi Blade.

## Base URL

Development:

```text
http://127.0.0.1:8000/api/v1/student
```

Jika menggunakan Laragon:

```text
http://cbt.test/api/v1/student
```

Jalankan aplikasi dengan:

```bash
php artisan serve
```

Semua request sebaiknya mengirim header:

```http
Accept: application/json
```

Request dengan body JSON juga harus mengirim:

```http
Content-Type: application/json
```

## Authentication

Authentication menggunakan Laravel Sanctum dengan access token.

Untuk endpoint yang membutuhkan login, kirim:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Token diperoleh dari endpoint login dan tidak boleh dikirimkan sebagai parameter URL.

## Postman Environment

Buat environment dengan variable berikut:

| Variable | Contoh |
|---|---|
| `base_url` | `http://127.0.0.1:8000/api/v1/student` |
| `token` | token hasil login |
| `exam_id` | hash ID dari response daftar ujian |
| `attempt_id` | ID attempt hasil start exam |
| `question_id` | ID question hasil start exam |

Pada request yang membutuhkan autentikasi, pilih **Authorization → Bearer Token** dan isi:

```text
{{token}}
```

## Standard Response

Response sukses:

```json
{
    "success": true,
    "message": "Pesan berhasil.",
    "data": {}
}
```

Response error dari controller:

```json
{
    "success": false,
    "message": "Pesan error.",
    "errors": {}
}
```

Validation error Laravel dapat menggunakan format `message` dan `errors` standar Laravel dengan HTTP `422`.

## Hash ID Exam

Model `Exam` menggunakan Hashids untuk route binding. Karena itu parameter `{exam}` harus menggunakan hash ID, bukan ID database mentah.

Ambil hash ID dari:

```http
GET {{base_url}}/exams
```

Contoh:

```json
{
    "id": "jR3k",
    "title": "TKA Matematika"
}
```

Gunakan nilai tersebut pada endpoint berikut:

```text
/exams/jR3k
/exams/jR3k/start
/exams/jR3k/status
```

`attempt_id` dan `question_id` tetap menggunakan ID yang dikembalikan API.

## Endpoint Summary

| Method | Endpoint | Auth | Fungsi |
|---|---|---:|---|
| POST | `/login` | Tidak | Login siswa |
| POST | `/logout` | Ya | Logout token aktif |
| GET | `/profile` | Ya | Profil siswa |
| GET | `/dashboard` | Ya | Statistik dashboard |
| GET | `/exams` | Ya | Daftar ujian milik siswa |
| GET | `/exams/{exam}` | Ya | Detail ujian |
| POST | `/exams/{exam}/start` | Ya | Mulai atau lanjutkan ujian |
| GET | `/exams/{exam}/status` | Ya | Status ujian |
| GET | `/attempts/{attempt}` | Ya | Detail attempt |
| GET | `/attempts/{attempt}/questions/{question}` | Ya | Ambil soal |
| POST | `/attempts/{attempt}/answers` | Ya | Simpan jawaban dan flag doubtful |
| GET | `/attempts/{attempt}/progress` | Ya | Progress pengerjaan |
| POST | `/attempts/{attempt}/violation` | Ya | Catat pelanggaran |
| POST | `/attempts/{attempt}/submit` | Ya | Selesaikan dan score ujian |
| GET | `/attempts/{attempt}/result` | Ya | Ambil hasil ujian || GET | `/attempts/{attempt}/discussion` | Ya | Ambil pembahasan soal |

## 1. Login

```http
POST {{base_url}}/login
```

Body:

```json
{
    "username": "123456",
    "password": "password"
}
```

Response:

```json
{
    "success": true,
    "message": "Login berhasil.",
    "data": {
        "token": "1|xxxxxxxxxxxxxxxx",
        "token_type": "Bearer",
        "student": {
            "id": 1,
            "name": "Nama Siswa",
            "username": "123456",
            "school_name": "SMA Contoh",
            "classroom_name": "XII IPA 1"
        }
    }
}
```

Untuk menyimpan token otomatis di Postman, tambahkan pada tab **Tests**:

```javascript
const json = pm.response.json();

if (json.success && json.data && json.data.token) {
    pm.environment.set("token", json.data.token);
}
```

## 2. Logout

```http
POST {{base_url}}/logout
```

Response:

```json
{
    "success": true,
    "message": "Logout berhasil.",
    "data": null
}
```

## 3. Profile

```http
GET {{base_url}}/profile
```

Response:

```json
{
    "success": true,
    "message": "Profil berhasil diambil.",
    "data": {
        "id": 1,
        "name": "Nama Siswa",
        "username": "123456"
    }
}
```

## 4. Dashboard

```http
GET {{base_url}}/dashboard
```

Response berisi `stats`, `upcoming_sessions`, `recent_results`, dan `classrooms`.

```json
{
    "success": true,
    "message": "Dashboard berhasil diambil.",
    "data": {
        "stats": {
            "total_ujian": 10,
            "ujian_selesai": 4,
            "ujian_aktif": 1,
            "rata_nilai": 82.5
        },
        "upcoming_sessions": [],
        "recent_results": [],
        "classrooms": []
    }
}
```

## 5. Daftar Ujian

```http
GET {{base_url}}/exams
```

Response hanya berisi exam/session yang diikuti siswa.

```json
{
    "success": true,
    "message": "Daftar ujian berhasil diambil.",
    "data": [
        {
            "id": "jR3k",
            "session_id": 5,
            "title": "TKA Matematika",
            "start_time": "2026-09-24T08:00:00.000000Z",
            "end_time": "2026-09-24T12:00:00.000000Z",
            "duration_minutes": 90,
            "show_explanation": true,
            "status": "not_started",
            "is_open": true,
            "final_score": null,
            "is_locked": false,
            "total_questions": 40
        }
    ]
}
```

Simpan `data[0].id` ke variable Postman:

```javascript
const json = pm.response.json();

if (json.success && json.data && json.data.length > 0) {
    pm.environment.set("exam_id", json.data[0].id);
}
```

## 6. Detail Ujian

```http
GET {{base_url}}/exams/{{exam_id}}
```

Response:

```json
{
    "success": true,
    "message": "Detail ujian berhasil diambil.",
    "data": {
        "id": "jR3k",
        "session_id": 5,
        "title": "TKA Matematika",
        "duration_minutes": 90,
        "start_time": "2026-09-24T08:00:00.000000Z",
        "end_time": "2026-09-24T12:00:00.000000Z",
        "require_token": false,
        "show_explanation": true,
        "status": "not_started",
        "is_locked": false,
        "total_questions": 40
    }
}
```

Siswa yang tidak terdaftar pada session ujian menerima HTTP `404`.

## 7. Start Exam

### Exam tanpa token

```http
POST {{base_url}}/exams/{{exam_id}}/start
```

Body:

```json
{}
```

### Exam dengan token

```json
{
    "token": "ABC123"
}
```

Response:

```json
{
    "success": true,
    "message": "Ujian siap dikerjakan.",
    "data": {
        "exam": {
            "id": "jR3k",
            "title": "TKA Matematika",
            "duration_minutes": 90,
            "show_explanation": true
        },
        "attempt": {
            "id": 123,
            "status": "ongoing",
            "started_at": "2026-09-24T19:50:00+07:00",
            "end_at": "2026-09-24T21:20:00+07:00",
            "remaining_seconds": 5400
        },
        "sections": [],
        "question_ids": [12, 13, 14],
        "existing_answers": {},
        "flags": [],
        "config": {
            "random_question": false,
            "random_answer": false,
            "enable_violation": true,
            "max_tolerances": 3
        },
        "server_time": "2026-09-24T19:50:00+07:00"
    }
}
```

Simpan ID attempt dan question pertama:

```javascript
const json = pm.response.json();

if (json.success && json.data && json.data.attempt) {
    pm.environment.set("attempt_id", json.data.attempt.id);
}

if (json.success && json.data && json.data.question_ids.length > 0) {
    pm.environment.set("question_id", json.data.question_ids[0]);
}
```

Server menentukan `started_at`, deadline, dan remaining time. Client tidak boleh mengirim waktu sebagai sumber kebenaran.

## 8. Detail Attempt

```http
GET {{base_url}}/attempts/{{attempt_id}}
```

Response:

```json
{
    "success": true,
    "message": "Detail attempt berhasil diambil.",
    "data": {
        "id": 123,
        "exam_id": "jR3k",
        "status": "ongoing",
        "started_at": "2026-09-24T19:50:00+07:00",
        "finished_at": null,
        "is_locked": false,
        "violation_count": 0,
        "remaining_seconds": 5400
    }
}
```

## 9. Ambil Soal

```http
GET {{base_url}}/attempts/{{attempt_id}}/questions/{{question_id}}
```

Response tidak berisi correct answer atau scoring key:

```json
{
    "success": true,
    "message": "Soal berhasil diambil.",
    "data": {
        "attempt_id": 123,
        "question": {
            "id": 12,
            "type": "single_choice",
            "content": "<p>Isi soal...</p>",
            "options": [
                {
                    "id": 101,
                    "option_text": "Jawaban A"
                },
                {
                    "id": 102,
                    "option_text": "Jawaban B"
                }
            ]
        },
        "answer": null,
        "is_doubtful": false,
        "server_time": "2026-09-24T19:55:00+07:00",
        "remaining_seconds": 5100
    }
}
```

## 10. Simpan Jawaban dan Flag Doubtful

```http
POST {{base_url}}/attempts/{{attempt_id}}/answers
```

Body pilihan tunggal:

```json
{
    "question_id": 12,
    "answer": 101,
    "is_doubtful": false
}
```

Menandai ragu-ragu:

```json
{
    "question_id": 12,
    "answer": 101,
    "is_doubtful": true
}
```

Membatalkan flag:

```json
{
    "question_id": 12,
    "answer": 101,
    "is_doubtful": false
}
```

Response:

```json
{
    "success": true,
    "message": "Jawaban berhasil disimpan.",
    "data": {
        "question_id": 12,
        "saved": true,
        "is_doubtful": true
    }
}
```

Request berulang untuk question yang sama menggunakan `updateOrCreate`, sehingga tidak membuat jawaban duplikat.

## 11. Progress

```http
GET {{base_url}}/attempts/{{attempt_id}}/progress
```

Response:

```json
{
    "success": true,
    "message": "Progress berhasil diambil.",
    "data": {
        "total_questions": 40,
        "answered": 25,
        "unanswered": 15,
        "doubtful": 4,
        "percentage": 62.5,
        "status": "ongoing",
        "remaining_seconds": 5000
    }
}
```

## 12. Violation

```http
POST {{base_url}}/attempts/{{attempt_id}}/violation
```

Body:

```json
{}
```

Response:

```json
{
    "success": true,
    "message": "Pelanggaran berhasil dicatat.",
    "data": {
        "violation_count": 1,
        "max_tolerances": 3,
        "is_locked": false
    }
}
```

Saat `violation_count` mencapai `max_tolerances`, attempt menjadi locked dan tidak dapat melanjutkan pengerjaan.

## 13. Submit Exam

```http
POST {{base_url}}/attempts/{{attempt_id}}/submit
```

Body:

```json
{}
```

Response:

```json
{
    "success": true,
    "message": "Ujian berhasil diselesaikan.",
    "data": {
        "attempt_id": 123,
        "status": "completed",
        "finished_at": "2026-09-24T21:10:00.000000Z",
        "score": 85
    }
}
```

Scoring menggunakan `AttemptScoringService`. Submit ulang setelah completed mengembalikan hasil yang sudah tersimpan.

## 14. Result

```http
GET {{base_url}}/attempts/{{attempt_id}}/result
```

Response:

```json
{
    "success": true,
    "message": "Hasil ujian berhasil diambil.",
    "data": {
        "attempt_id": 123,
        "exam": {
            "id": "jR3k",
            "title": "TKA Matematika",
            "show_explanation": true
        },
        "status": "completed",
        "average_score": 85,
        "result_mode": "average",
        "score": 85,
        "sections": []
    }
}
```

Result sebelum ujian selesai mengembalikan HTTP `400`.

## 15. Pembahasan Soal

Pembahasan hanya dapat diambil setelah attempt berstatus `completed`, hanya oleh siswa pemilik attempt, dan hanya jika `show_explanation` pada exam bernilai `true`.

```http
GET {{base_url}}/attempts/{{attempt_id}}/discussion
```

Response mencakup soal, jawaban siswa, kunci jawaban, pembahasan, status benar/salah, dan nilai per soal. Jenis soal yang didukung adalah `single_choice`, `complex_choice`, `true_false`, `true_false_multi`, `matching`, `essay`, dan `tkp`.

```json
{
    "success": true,
    "message": "Pembahasan soal berhasil diambil.",
    "data": {
        "attempt_id": 123,
        "exam": {
            "id": "jR3k",
            "title": "TKA Matematika"
        },
        "status": "completed",
        "questions": [
            {
                "id": 12,
                "type": "single_choice",
                "content": "<p>Isi soal...</p>",
                "explanation": "<p>Langkah pembahasan...</p>",
                "section": "Sesi Utama",
                "answer": 101,
                "is_doubtful": false,
                "is_correct": true,
                "score": 1,
                "maximum_score": 1,
                "options": [
                    {
                        "id": 101,
                        "option_text": "Jawaban A",
                        "is_correct": true,
                        "score_weight": null
                    }
                ],
                "matches": []
            }
        ]
    }
}
```

Field `answer` mengikuti bentuk jawaban saat disimpan:

- `single_choice` dan `tkp`: ID option.
- `complex_choice`: array ID option.
- `true_false` dan `true_false_multi`: object dengan key ID option dan nilai `benar`/`salah`.
- `matching`: object dengan key ID match dan value ID target yang dipilih.
- `essay`: teks jawaban siswa.

Untuk `matching`, `correct_target_id` menunjukkan pasangan benar. Untuk `tkp`, `score_weight` menunjukkan bobot option yang digunakan dalam scoring.

## 16. Status Exam

```http
GET {{base_url}}/exams/{{exam_id}}/status
```

Response:

```json
{
    "success": true,
    "message": "Status ujian berhasil diambil.",
    "data": {
        "status": "ongoing",
        "is_locked": false,
        "server_time": "2026-09-24T20:10:00+07:00",
        "remaining_seconds": 4200
    }
}
```

## Mobile Flow

```text
POST /login
  ↓ simpan data.token
GET /profile
GET /exams
  ↓ simpan data[0].id sebagai exam_id
GET /exams/{exam_id}
POST /exams/{exam_id}/start
  ↓ simpan data.attempt.id dan data.question_ids
GET /attempts/{attempt_id}/questions/{question_id}
POST /attempts/{attempt_id}/answers
GET /attempts/{attempt_id}/progress
POST /attempts/{attempt_id}/violation (jika diperlukan)
POST /attempts/{attempt_id}/submit
GET /attempts/{attempt_id}/result
POST /logout
```

## HTTP Status

| Status | Arti |
|---:|---|
| 200 | Request berhasil |
| 401 | Token tidak ada atau tidak valid |
| 403 | Attempt locked, completed, atau akses ditolak |
| 404 | Exam, attempt, atau question tidak ditemukan atau bukan milik siswa |
| 422 | Validasi input gagal atau token ujian salah |

## Security Notes

- API hanya mengambil exam/session yang terhubung ke siswa yang login.
- Attempt harus dimiliki user yang sedang login.
- Question harus berasal dari exam milik attempt tersebut.
- Correct answer dan scoring key tidak pernah dikirim pada endpoint soal.
- Client tidak dapat mengubah score, started time, finished time, atau status secara langsung.
- Jangan menyimpan token di URL, log publik, atau source control.
