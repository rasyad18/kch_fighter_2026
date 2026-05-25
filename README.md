# KCH Fighter 2026 — Website Setup Guide

Website resmi event KCH Fighter 2026 dengan jadwal pertandingan real-time dari Google Sheets.

---

## Struktur File

```
kch-fighter-2026/
├── index.html              # Halaman utama
├── assets/
│   ├── css/
│   │   └── style.css       # Semua styling
│   └── js/
│       └── main.js         # Logic & Google Sheets integration
└── README.md               # Panduan ini
```

---

## LANGKAH 1 — Setup Google Spreadsheet

### 1.1 Buat Google Spreadsheet baru
Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru.

### 1.2 Buat sheet/tab dengan nama berikut (PERSIS sama):
- `Futsal`
- `Basket`
- `Volly`
- `BuluTangkis`
- `Dance`
- `TenisMeja`
- `Karaoke`
- `ESport`
- `Pendaftaran` *(untuk data pendaftaran dari form)*

### 1.3 Format kolom per sheet (baris 1 = header):
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Tanggal | Waktu | Tim A | Tim B | Skor A | Skor B | Status | Pemenang |

**Nilai kolom Status yang dikenali:**
- `Belum` → pertandingan belum dimulai
- `Berlangsung` → sedang bertanding (animasi blink)
- `Selesai` → pertandingan selesai
- `WO` → walkout

### 1.4 Publish Spreadsheet
1. `File` → `Share` → `Publish to web`
2. Pilih `Entire Document` → `Comma-separated values (.csv)` → `Publish`
3. **Atau** cukup publish via Sheets API (lihat langkah 2)

---

## LANGKAH 2 — Google Sheets API Key

### 2.1 Buat project di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru
3. Aktifkan **Google Sheets API**: `APIs & Services` → `Library` → cari `Google Sheets API` → Enable

### 2.2 Buat API Key
1. `APIs & Services` → `Credentials` → `Create Credentials` → `API Key`
2. Salin API Key tersebut
3. (Opsional) Restrict key hanya untuk `Google Sheets API` dan domain kamu

### 2.3 Ambil Spreadsheet ID
URL spreadsheet: `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

Salin bagian `SPREADSHEET_ID` dari URL tersebut.

### 2.4 Share spreadsheet ke publik (read-only)
`Share` → `Anyone with the link` → `Viewer`

---

## LANGKAH 3 — Konfigurasi Website

### Opsi A — Via UI (paling mudah)
1. Buka website
2. Scroll ke bagian **Jadwal Pertandingan**
3. Isi kolom **Spreadsheet ID** dan **API Key**
4. Klik **Simpan & Muat**
5. Data tersimpan di browser (localStorage) — tidak perlu diisi ulang

### Opsi B — Edit kode langsung
Di `assets/js/main.js`, edit bagian:
```javascript
const CONFIG = {
  SHEET_ID: 'MASUKKAN_SPREADSHEET_ID_KAMU',
  API_KEY:  'MASUKKAN_API_KEY_KAMU',
  ...
}
```

---

## LANGKAH 4 — Link Pendaftaran

### 4.1 Buat Google Form untuk tiap cabang
Buat Google Form untuk masing-masing cabang, sambungkan ke sheet `Pendaftaran` di spreadsheet.

### 4.2 Isi link di main.js
Di `assets/js/main.js`, edit bagian `REG_LINKS`:
```javascript
const REG_LINKS = {
  futsal:       'https://forms.gle/link-form-futsal',
  basket:       'https://forms.gle/link-form-basket',
  volly:        'https://forms.gle/link-form-volly',
  bulutangkis:  'https://forms.gle/link-form-badminton',
  dance:        'https://forms.gle/link-form-dance',
  tenismeja:    'https://forms.gle/link-form-tabletennis',
  karaoke:      'https://forms.gle/link-form-karaoke',
  esport:       'https://forms.gle/link-form-esport'
};
```

---

## LANGKAH 5 — Deploy ke GitHub Pages

### 5.1 Upload ke GitHub
```bash
git init
git add .
git commit -m "Initial commit - KCH Fighter 2026"
git remote add origin https://github.com/USERNAME/kch-fighter-2026.git
git push -u origin main
```

### 5.2 Aktifkan GitHub Pages
1. Repository → `Settings` → `Pages`
2. Source: `Deploy from a branch`
3. Branch: `main` / root
4. Klik `Save`
5. Website live di: `https://USERNAME.github.io/kch-fighter-2026`

---

## LANGKAH 6 — Ganti Gambar & Konten

### Gambar Hero & About
Di `index.html`, ganti semua `src="https://images.unsplash.com/..."` dengan:
- Upload foto ke folder `assets/images/`
- Ganti URL dengan path lokal, contoh: `src="assets/images/hero.jpg"`

### Informasi Kontak
Di `index.html`, cari dan ganti:
- `kchfighter2026@gmail.com` → email panitia
- `https://wa.me/628xxxxxxxxxx` → nomor WA panitia
- Social media links (Instagram, TikTok, Facebook)

### Term & Condition
Di `assets/js/main.js`, edit objek `TNC_DATA` untuk masing-masing cabang sesuai ketentuan resmi.

---

## Update Jadwal (Untuk Panitia)

Cukup **edit Google Spreadsheet**:
1. Buka spreadsheet
2. Isi/update data di sheet yang sesuai
3. Website otomatis update dalam **30 detik**

### Contoh isi data Futsal:
| Tanggal | Waktu | Tim A | Tim B | Skor A | Skor B | Status | Pemenang |
|---------|-------|-------|-------|--------|--------|--------|----------|
| 10 Juli 2026 | 08:00 | Tim Garuda | Tim Naga | 3 | 1 | Selesai | Tim Garuda |
| 10 Juli 2026 | 10:00 | Tim Harimau | Tim Elang | | | Berlangsung | |
| 10 Juli 2026 | 13:00 | Tim Phoenix | Tim Rajawali | | | Belum | |

---

## Fitur Website

- **Dark/Light Mode** — Toggle di navbar, tersimpan otomatis
- **Real-time Jadwal** — Data dari Google Sheets, refresh 30 detik
- **Responsive** — Mobile friendly
- **Term & Condition** — Modal per cabang lomba
- **Galeri** — Lightbox saat klik foto
- **Counter Animasi** — Statistik event di hero section
- **Scroll Reveal** — Animasi saat scroll

---

*KCH Fighter 2026 — Kolaka Championship Event*
