# EdGLO Backend API

REST API untuk admin panel EdGLO. Backend menggunakan Laravel 12, Laravel Sanctum, MySQL/MariaDB, dan DomPDF.

## Fitur

- Login Super Admin dan Admin dengan Bearer token.
- CRUD admin khusus Super Admin.
- Pemisahan hak akses Super Admin (Owner) dan Admin operasional.
- Formulir pendaftaran publik tanpa akun orang tua; data baru masuk ke antrean verifikasi Admin.
- Pilihan beberapa program, durasi paket, preferensi waktu, dan masa aktif paket murid.
- Data murid dengan foto, biodata, level program, biaya awal, promo, dan riwayat status.
- Data guru dengan foto, kontak darurat, keterangan, serta riwayat status.
- Riwayat aktif/off murid dan guru.
- Sinkronisasi jadwal kelas dengan jadwal murid.
- Absensi guru per sesi, pencatatan murid tidak hadir, dan jadwal pengganti dengan guru yang sama.
- Slip gaji guru berdasarkan jumlah sesi hadir yang dicatat Admin.
- Pembuatan tagihan otomatis berdasarkan program.
- Biaya daftar Rp100.000 dan biaya buku Rp100.000 setiap dua bulan.
- Status pembayaran, pengingat, rekap bulanan/tahunan, dan dashboard.
- Laporan PDF murid, guru, keuangan bulanan, dan keuangan tahunan.
- Filter, pencarian, pengurutan, dan paginasi pada daftar data.

## Menjalankan Proyek

Persyaratan: PHP 8.2+, Composer, dan MySQL/MariaDB.

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --no-reload --host=0.0.0.0 --port=8000
```

Opsi `--no-reload` membuat konfigurasi `PHP_CLI_SERVER_WORKERS=4` dapat digunakan, sehingga request login dan workspace tidak saling mengantre saat frontend dibuka bersamaan.

API tersedia di `http://localhost:8000/api/v1`.

Konfigurasi database bawaan untuk XAMPP:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edglo
DB_USERNAME=root
DB_PASSWORD=
```

## Akun Demo

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `superadmin@edglo.id` | `admin123` |
| Admin | `admin@edglo.id` | `admin123` |

## Pembagian Hak Akses

| Modul | Super Admin (Owner) | Admin |
| --- | --- | --- |
| Dashboard | Lihat seluruh ringkasan | Lihat ringkasan operasional |
| Murid dan status murid | Lihat saja | Tambah, edit, hapus, dan ubah status |
| Guru dan status guru | Tambah, edit, hapus, dan ubah status | Lihat saja |
| Jadwal belajar | Lihat saja | Kelola kelas dan peserta |
| Absensi dan jadwal pengganti | Lihat saja | Catat absensi guru, murid tidak hadir, dan jadwal pengganti |
| Keuangan | Lihat dan cetak | Buat tagihan dan tandai pembayaran |
| Slip gaji guru | Hitung, finalisasi, dan cetak | Tidak dapat mengakses |
| Akun Admin | Kelola | Hanya profil dan password sendiri |

Portal dan akun orang tua belum diaktifkan. Orang tua mengisi formulir publik, lalu Admin memeriksa data dan menghubungi nomor WhatsApp yang dicantumkan.

Login:

```http
POST /api/v1/auth/admin/login
Content-Type: application/json

{
  "email": "superadmin@edglo.id",
  "password": "admin123",
  "deviceName": "edglo-frontend"
}
```

Pendaftaran calon murid tidak memerlukan token dan tidak membuat akun:

```http
POST /api/v1/registrations
```

Gunakan token dari respons pada endpoint yang dilindungi:

```http
Authorization: Bearer TOKEN_ANDA
Accept: application/json
```

## Endpoint Utama

| Modul | Endpoint |
| --- | --- |
| Auth | `POST /auth/admin/login`, `GET /auth/me`, `PATCH /auth/profile`, `PUT /auth/password`, `POST /auth/logout` |
| Pendaftaran publik | `POST /registrations` |
| Verifikasi pendaftaran | `GET /registrations`, `POST /registrations/{id}/approve`, `POST /registrations/{id}/reject` (khusus Admin) |
| Dashboard | `GET /dashboard` |
| Workspace awal | `GET /workspace` |
| Program | `GET/POST /programs`, `GET/PATCH/DELETE /programs/{id}` |
| Murid | `GET/POST /students`, `GET/PATCH/DELETE /students/{id}` |
| Status Murid | `POST /students/{id}/deactivate`, `POST /students/{id}/activate` |
| Guru | `GET/POST /teachers`, `GET/PATCH/DELETE /teachers/{id}` |
| Status Guru | `POST /teachers/{id}/deactivate`, `POST /teachers/{id}/activate` |
| Jadwal | `GET/POST /class-sessions`, `GET/PATCH/DELETE /class-sessions/{id}` |
| Absensi Guru | `GET/POST /teacher-attendances`, `DELETE /teacher-attendances/{id}` |
| Murid Tidak Hadir | `GET/POST /student-absences`, `DELETE /student-absences/{id}` |
| Jadwal Pengganti | `GET/POST /make-up-schedules`, `PATCH/DELETE /make-up-schedules/{id}` |
| Slip Gaji | `GET/POST /teacher-payrolls`, `DELETE /teacher-payrolls/{id}` |
| Keuangan | `GET/POST /payments`, `GET/PATCH/DELETE /payments/{id}` |
| Operasi Keuangan | `GET /payments/summary`, `POST /payments/generate-month`, `POST /payments/{id}/mark-paid`, `POST /payments/{id}/reminders` |
| Laporan | `GET /reports/overview`, `GET /reports/download` |
| Admin | `GET/POST /admins`, `GET/PATCH/DELETE /admins/{id}` (khusus Super Admin) |

Semua path pada tabel menggunakan prefix `/api/v1`.

## Filter dan Paginasi

Endpoint daftar menerima `page` dan `perPage`. Nilai `perPage` bawaan adalah 10 dan maksimum 100.

```http
GET /api/v1/students?search=aisyah&status=active&programId=P002&page=1&perPage=10
GET /api/v1/teachers?status=active&employmentType=fulltime&page=1&perPage=10
GET /api/v1/class-sessions?day=Senin&teacherId=T001&status=active
GET /api/v1/payments?month=7&year=2026&programId=P002&status=overdue
```

Respons daftar menggunakan format Laravel pagination: `data`, `links`, dan `meta`.

## Contoh Membuat Murid

Field API memakai camelCase agar langsung cocok dengan frontend.

```json
{
  "fullName": "Nadia Putri",
  "parentName": "Bapak Fajar",
  "address": "Batam",
  "phone": "081234567890",
  "programId": "P002",
  "sessionsPerWeek": 3,
  "joinDate": "2026-08-19",
  "teacherId": "T001",
  "notes": "Murid baru",
  "schedules": [
    { "day": "Senin", "time": "15:00" },
    { "day": "Rabu", "time": "15:00" },
    { "day": "Jumat", "time": "15:00" }
  ]
}
```

Foto dikirim sebagai `multipart/form-data` pada field `photo`. Format: JPG, JPEG, PNG, atau WebP maksimal 2 MB.

Nonaktifkan murid atau guru:

```json
{
  "date": "2026-08-19",
  "reason": "Berhenti sementara"
}
```

Aktifkan kembali:

```json
{
  "date": "2026-08-19",
  "reason": "Mulai belajar kembali"
}
```

## Jadwal Kelas

Jam kelas tidak dikunci ke daftar tertentu. Admin dapat memasukkan jam mulai/selesai selama format valid dan tidak bentrok untuk guru yang sama.

```json
{
  "name": "Calistung Sore A",
  "day": "Senin",
  "startTime": "15:00",
  "endTime": "16:00",
  "teacherId": "T001",
  "programId": "P002",
  "room": "Ruang 1",
  "capacity": 8,
  "studentIds": ["S001", "S003"],
  "status": "active"
}
```

## Keuangan

Buat tagihan satu murid:

```json
{
  "studentId": "S001",
  "month": 8,
  "year": 2026,
  "dueDate": "2026-08-10",
  "notes": "Tagihan Agustus"
}
```

Buat tagihan seluruh murid aktif untuk satu bulan:

```http
POST /api/v1/payments/generate-month

{
  "month": 8,
  "year": 2026
}
```

Tandai lunas:

```http
POST /api/v1/payments/PAY0001/mark-paid

{
  "paidDate": "2026-08-19",
  "paymentMethod": "cash",
  "notes": "Diterima oleh admin"
}
```

## Laporan PDF

```http
GET /api/v1/reports/download?type=students&paper=a4&orientation=portrait&showSignature=1
GET /api/v1/reports/download?type=teachers&paper=a4&orientation=landscape
GET /api/v1/reports/download?type=finance-monthly&month=7&year=2026
GET /api/v1/reports/download?type=finance-yearly&year=2026
```

Nilai `type`: `students`, `teachers`, `finance-monthly`, atau `finance-yearly`.

Nilai `paper`: `a4`, `a5`, `letter`, atau `legal`. Nilai `orientation`: `portrait` atau `landscape`.

## Pengujian

Test menggunakan SQLite in-memory sehingga tidak mengubah database MySQL lokal.

```bash
php artisan test
vendor\\bin\\pint --test
```
