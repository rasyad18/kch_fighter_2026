/* ============================================
   KCH FIGHTER 2026 — MAIN JAVASCRIPT
   Mode: Google Sheets "Publish to Web" (CSV)
   Tidak memerlukan API Key
   ============================================ */

'use strict';

// ─── CONFIG ─────────────────────────────────
// Cukup isi SHEET_ID dari URL Google Sheets kamu
// Tidak perlu API Key sama sekali!
const CONFIG = {
  // Langsung tanam ID spreadsheet kamu di sini di dalam tanda kutip
  SHEET_ID: '2PACX-1vREikVDcDlwJBoN-Fh84AkVftrKTS_nARZDXP-oNoRngokwjRR0pgezNJhamccD7_tZMNeilX_pPZ4s',
  REFRESH_INTERVAL: 30000, // auto-refresh tiap 30 detik

  // Pastikan GID (ID Tab) disesuaikan jika kamu pakai tab berbeda untuk tiap cabang
  SHEET_GIDS: {
    futsal:       '0', // '0' biasanya adalah tab pertama (Futsal)
    basket:       '1602342405', // Ganti dengan GID tab Basket kamu
    volly:        '1905666751', // Ganti dengan GID tab Volly kamu
    bulutangkis:  '1645421078',
    dance:        '1433423859',
    tenismeja:    '720813413',
    karaoke:      '2118822557',
    esport:       '20640519',
  }
};

function buildCsvUrl(gid) {
  if (!CONFIG.SHEET_ID) return null;
  // Perubahan struktur URL menjadi /d/e/.../pub untuk mendukung link web publish kamu
  return `https://docs.google.com/spreadsheets/d/e/${CONFIG.SHEET_ID}/pub?output=csv&gid=${gid}`;
}

// ─── FETCH & PARSE CSV ───────────────────────
async function fetchSheetData(gid) {
  const url = buildCsvUrl(gid);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return parseCsv(text);
  } catch (err) {
    console.warn('Gagal fetch sheet (GID ' + gid + '):', err.message);
    return null;
  }
}

// ─── CSV PARSER ─────────────────────────────
// Parser CSV sederhana yang handle koma dalam tanda kutip
function parseCsv(text) {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

// ─── PARSE SCHEDULE ROWS ─────────────────────
// Format kolom spreadsheet (baris 1 = header):
// [0] Tanggal | [1] Waktu | [2] Tim A | [3] Tim B
// [4] Skor A  | [5] Skor B | [6] Status | [7] Pemenang
function parseScheduleRows(rows) {
  if (!rows || rows.length < 2) return [];
  const [, ...data] = rows; // skip header row
  return data
    .filter(row => row.some(cell => cell && cell.length > 0)) // skip baris kosong
    .map(row => ({
      tanggal:  row[0] || '-',
      waktu:    row[1] || '-',
      timA:     row[2] || '-',
      timB:     row[3] || '-',
      skorA:    row[4] || '',
      skorB:    row[5] || '',
      status:   (row[6] || 'Belum').trim(),
      pemenang: row[7] || ''
    }));
}

// ─── RENDER TABLE ────────────────────────────
function statusBadge(status) {
  const map = {
    'Selesai':     'badge-selesai',
    'Berlangsung': 'badge-berlangsung',
    'Belum':       'badge-belum',
    'WO':          'badge-selesai'
  };
  const cls = map[status] || 'badge-belum';
  return `<span class="badge-status ${cls}">${status}</span>`;
}

function winnerCell(pemenang) {
  if (!pemenang || pemenang === '-' || pemenang === '') return '-';
  return `
    <div class="winner-tag">
      <svg class="winner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      ${pemenang}
    </div>`;
}

// ─── DESAIN FLYER PERTANDINGAN & FILTER OTOMATIS (BARU) ────────────────
function renderMatchFlyers(matches) {
  if (!matches || matches.length === 0) {
    return `<div class="no-matches-today-box"><p>Belum ada data jadwal di Spreadsheet.</p></div>`;
  }

  // 1. Dapatkan objek tanggal hari ini dan besok (Waktu Lokal)
  const hariIni = new Date();
  const besok = new Date();
  besok.setDate(hariIni.getDate() + 1);

  // Fungsi helper untuk mengubah format Date menjadi string "YYYY-MM-DD" agar akurat saat dicocokkan
  const formatTanggalKomparasi = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const strHariIni = formatTanggalKomparasi(hariIni);
  const strBesok = formatTanggalKomparasi(besok);

  // 2. Filter data pertandingan: HANYA ambil data Hari Ini dan Besok
  const matchesFiltered = matches.filter(m => {
    if (!m.tanggal || m.tanggal === '-') return false;
    
    // Konversi tanggal dari spreadsheet ke objek Date javascript
    // Mendukung format umum spreadsheet: "YYYY-MM-DD" atau "DD/MM/YYYY" atau "MM/DD/YYYY"
    let matchDateObj = new Date(m.tanggal);
    
    // Deteksi jika input menggunakan garis miring lokal (misal: 25/05/2026)
    if (isNaN(matchDateObj.getTime()) && m.tanggal.includes('/')) {
      const parts = m.tanggal.split('/');
      if (parts[0].length === 4) { // YYYY/MM/DD
        matchDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      } else { // DD/MM/YYYY
        matchDateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    if (isNaN(matchDateObj.getTime())) return false; // Abaikan jika format teks rusak
    
    const strMatchDate = formatTanggalKomparasi(matchDateObj);
    return strMatchDate === strHariIni || strMatchDate === strBesok;
  });

  // Jika setelah difilter ternyata tidak ada pertandingan untuk hari ini & besok
  if (matchesFiltered.length === 0) {
    return `
      <div class="no-matches-today-box">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:0.5rem; opacity:0.6;">
          <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>
        </svg>
        <p>Tidak ada jadwal pertandingan untuk Hari Ini &amp; Besok.</p>
      </div>`;
  }

  // 3. Render data yang lolos filter ke dalam bentuk Match Card Flyer
  return matchesFiltered.map(m => {
    // Tentukan badge penanda hari lokal
    let dayBadgeHTML = `<span class="match-time-text">${m.tanggal}</span>`;
    let matchDateObj = new Date(m.tanggal);
    if (m.tanggal.includes('/')) {
      const parts = m.tanggal.split('/');
      matchDateObj = parts[0].length === 4 ? new Date(parts[0], parts[1]-1, parts[2]) : new Date(parts[2], parts[1]-1, parts[0]);
    }
    const strMatchDate = formatTanggalKomparasi(matchDateObj);

    if (strMatchDate === strHariIni) {
      dayBadgeHTML = `<span class="match-day-badge today">Hari Ini</span>`;
    } else if (strMatchDate === strBesok) {
      dayBadgeHTML = `<span class="match-day-badge tomorrow">Besok</span>`;
    }

    // Olah display skor & tanda hubung VS
    const statusClean = m.status.toLowerCase();
    let scoreOrVsHTML = `<div class="flyer-vs-box">VS</div>`;
    let statusBadgeHTML = `<span class="flyer-badge-status status-upcoming-match">Upcoming</span>`;

    if (statusClean === 'berlangsung' || statusClean === 'live') {
      statusBadgeHTML = `<span class="flyer-badge-status status-live-match">LIVE</span>`;
      scoreOrVsHTML = `<div class="flyer-score-box">${m.skorA || '0'}:${m.skorB || '0'}</div>`;
    } else if (statusClean === 'selesai' || statusClean === 'wo') {
      statusBadgeHTML = `<span class="flyer-badge-status status-ended-match">Ended</span>`;
      scoreOrVsHTML = `<div class="flyer-score-box">${m.skorA || '0'}:${m.skorB || '0'}</div>`;
    }

    // Tampilkan pengumuman pemenang di bagian bawah jika ada
    let footerHTML = `<div class="match-card-footer">${statusBadgeHTML}</div>`;
    if ((statusClean === 'selesai' || statusClean === 'wo') && m.pemenang && m.pemenang !== '-') {
      footerHTML = `
        <div class="match-card-footer">
          <div class="flyer-winner-announcement">
            <svg viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Winner: ${m.pemenang}</span>
          </div>
        </div>`;
    }

    // Ambil inisial tim untuk ditaruh di dalam lingkaran logo mockup
    const inisialA = m.timA ? m.timA.substring(0, 2).toUpperCase() : '??';
    const inisialB = m.timB ? m.timB.substring(0, 2).toUpperCase() : '??';

    return `
      <div class="match-card-flyer reveal visible">
        <div class="match-card-header">
          ${dayBadgeHTML}
          <div class="match-time-text">${m.waktu} WITA</div>
        </div>
        
        <div class="match-card-body">
          <div class="match-team-block">
            <div class="match-team-logo-placeholder" style="border-color: #39FF14;">${inisialA}</div>
            <div class="match-team-name-text">${m.timA}</div>
          </div>
          
          <div class="match-center-score-block">
            ${scoreOrVsHTML}
          </div>
          
          <div class="match-team-block">
            <div class="match-team-logo-placeholder" style="border-color: #00CFFF;">${inisialB}</div>
            <div class="match-team-name-text">${m.timB}</div>
          </div>
        </div>
        
        ${footerHTML}
      </div>
    `;
  }).join('');
}

// ─── AMBIL DATA PER CABANG (DIUBAH UNTUK MENDUKUNG FLYER) ────────────────
async function loadSchedule(sport, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const container = panel.querySelector('.schedule-content');
  if (!container) return;

  // Efek loading animasi shimmer modern
  container.innerHTML = `
    <div class="shimmer" style="height:160px; border-radius:16px; grid-column:1/-1;"></div>
  `;

  const gid = CONFIG.SHEET_GIDS[sport];
  const rows = await fetchSheetData(gid);
  const matches = parseScheduleRows(rows);
  
  // Memasukkan hasil render flyer pertandingan baru ke dalam kontainer grid
  container.innerHTML = renderMatchFlyers(matches);

  const lastUpdate = panel.querySelector('.last-update');
  if (lastUpdate) {
    const now = new Date();
    lastUpdate.textContent = `Update: ${now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;
  }

  const dot = panel.querySelector('.status-dot');
  if (dot) {
    if (rows !== null) {
      dot.classList.remove('offline');
      // Jika status aktif/live, berikan kedipan merah di indikator status bar
      dot.style.background = '#39FF14';
    } else {
      dot.classList.add('offline');
      dot.style.background = '#ff3838';
    }
  }
}
// ─── LOAD ONE PANEL ──────────────────────────
async function loadSchedule(sport, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const container = panel.querySelector('.schedule-content');
  if (!container) return;

  container.innerHTML = `<div class="shimmer" style="height:200px;border-radius:12px;"></div>`;

  const gid = CONFIG.SHEET_GIDS[sport];
  const rows = await fetchSheetData(gid);
  const matches = parseScheduleRows(rows);
  container.innerHTML = renderTable(matches);

  const lastUpdate = panel.querySelector('.last-update');
  if (lastUpdate) {
    const now = new Date();
    lastUpdate.textContent = `Update: ${now.toLocaleTimeString('id-ID')}`;
  }

  const dot = panel.querySelector('.status-dot');
  if (dot) {
    if (rows !== null) dot.classList.remove('offline');
    else dot.classList.add('offline');
  }
}

// ─── REFRESH ALL PANELS ──────────────────────
async function refreshAll() {
  const sports = Object.keys(CONFIG.SHEET_GIDS);
  for (const sport of sports) {
    await loadSchedule(sport, `panel-${sport}`);
  }
}

// ─── SAVE CONFIG ─────────────────────────────
function saveConfig() {
  const sheetId = document.getElementById('inputSheetId')?.value?.trim();
  if (!sheetId) { alert('Masukkan Spreadsheet ID terlebih dahulu.'); return; }

  CONFIG.SHEET_ID = sheetId;
  localStorage.setItem('kch_sheet_id', sheetId);

  // Simpan GID per cabang jika diisi
  const gidFields = [
    'futsal','basket','volly','bulutangkis','dance','tenismeja','karaoke','esport'
  ];
  gidFields.forEach(sport => {
    const el = document.getElementById(`gid_${sport}`);
    if (el && el.value.trim()) {
      CONFIG.SHEET_GIDS[sport] = el.value.trim();
      localStorage.setItem(`gid_${sport}`, el.value.trim());
    }
  });

  const btn = document.getElementById('btnSaveConfig');
  if (btn) {
    btn.textContent = 'Tersimpan!';
    btn.style.background = 'var(--electric-blue)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = 'Simpan & Muat';
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  }

  refreshAll();
}

window.saveConfig = saveConfig;

// ─── THEME TOGGLE ────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('kch_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('kch_theme', next);
});

// ─── HAMBURGER MENU ──────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
  navLinks?.classList.toggle('open');
  hamburger.classList.toggle('active');
});
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger?.classList.remove('active');
  });
});

// ─── NAV SCROLL EFFECT ───────────────────────
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ─── SCROLL REVEAL ───────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── SMOOTH ANCHOR ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    }
  });
});

// ─── MODAL ───────────────────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalBody');

const TNC_DATA = {
  futsal: {
    title: 'Term & Condition — Futsal',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Peserta wajib berdomisili di Kecamatan/Kabupaten Kolaka</li>
        <li>Tim terdiri dari 5 pemain inti + 5 cadangan (max)</li>
        <li>Usia peserta 15–35 tahun</li>
        <li>Wajib membawa KTP/KTM saat pertandingan</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan FIFA Futsal resmi</li>
        <li>Durasi: 2×20 menit waktu bersih</li>
        <li>Tim yang terlambat lebih dari 10 menit dianggap WO</li>
        <li>Keputusan wasit bersifat mutlak dan final</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 300.000/tim</li>
        <li>Pendaftaran ditutup 3 hari sebelum pelaksanaan</li>
        <li>Kuota maksimal 16 tim</li>
      </ul>`
  },
  basket: {
    title: 'Term & Condition — Basket',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 5 pemain inti + 7 cadangan</li>
        <li>Usia peserta 15–35 tahun</li>
        <li>Format 5on5</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan FIBA resmi</li>
        <li>Durasi: 4×10 menit</li>
        <li>Pakaian seragam wajib bernomor</li>
        <li>Sepatu olahraga wajib digunakan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 250.000/tim</li>
        <li>Kuota maksimal 12 tim</li>
      </ul>`
  },
  volly: {
    title: 'Term & Condition — Volley Ball',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 6 pemain inti + 6 cadangan</li>
        <li>Kategori putra dan putri (terpisah)</li>
        <li>Usia peserta tidak dibatasi</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan FIVB resmi</li>
        <li>Format best of 3 set</li>
        <li>Pakaian seragam wajib</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 200.000/tim</li>
        <li>Kuota maksimal 16 tim per kategori</li>
      </ul>`
  },
  bulutangkis: {
    title: 'Term & Condition — Bulu Tangkis',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Kategori: Tunggal Pria, Tunggal Wanita, Ganda Campuran</li>
        <li>Usia peserta 12 tahun ke atas</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan BWF resmi</li>
        <li>Sistem gugur, best of 3 (21 poin)</li>
        <li>Shuttlecock disediakan panitia</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 50.000/orang/kategori</li>
        <li>Dapat mendaftar lebih dari satu kategori</li>
      </ul>`
  },
  dance: {
    title: 'Term & Condition — Dance',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Kategori: Solo, Duet, Group (min 3 max 10 orang)</li>
        <li>Tema bebas namun tidak mengandung SARA</li>
        <li>Usia peserta 12–30 tahun</li>
      </ul>
      <h3>Peraturan Penampilan</h3>
      <ul>
        <li>Durasi penampilan: 3–5 menit</li>
        <li>Music dikirim H-2 dalam format MP3/WAV</li>
        <li>Penilaian: Koreografi, Kostum, Ekspresi, Kekompakan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 75.000/orang</li>
        <li>Kuota terbatas</li>
      </ul>`
  },
  tenismeja: {
    title: 'Term & Condition — Tenis Meja',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Kategori: Tunggal Pria, Tunggal Wanita</li>
        <li>Usia peserta tidak dibatasi</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan ITTF resmi</li>
        <li>Sistem gugur, best of 5 game (@11 poin)</li>
        <li>Bola disediakan panitia</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 30.000/orang/kategori</li>
      </ul>`
  },
  karaoke: {
    title: 'Term & Condition — Karaoke',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Perorangan atau duet</li>
        <li>Lagu bebas (Indonesia/Daerah/Internasional)</li>
        <li>Konten lagu tidak mengandung unsur negatif</li>
      </ul>
      <h3>Peraturan</h3>
      <ul>
        <li>Durasi per penampilan: max 5 menit</li>
        <li>Urutan tampil ditentukan melalui undian</li>
        <li>Penilaian: Intonasi, Teknik, Penghayatan, Penampilan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 50.000/peserta</li>
        <li>Kuota maksimal 30 peserta</li>
      </ul>`
  },
  esport: {
    title: 'Term & Condition — E-Sport Mobile Legend',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 5 pemain + 1 cadangan</li>
        <li>Akun Mobile Legend minimal Advanced Server</li>
        <li>Menggunakan device masing-masing (HP/tablet)</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Format: Custom Room, Draft Pick</li>
        <li>Mode: Classic 5v5, sistem gugur</li>
        <li>Best of 3, final best of 5</li>
        <li>Dilarang menggunakan cheat, hack, atau bug</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 150.000/tim</li>
        <li>Kuota maksimal 16 tim</li>
        <li>Koneksi WiFi disediakan panitia</li>
      </ul>`
  }
};

function openModal(sport) {
  const data = TNC_DATA[sport];
  if (!data || !modalOverlay) return;
  modalTitle.textContent = data.title;
  modalBody.innerHTML = data.content;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.getElementById('modalClose')?.addEventListener('click', closeModal);
window.openModal  = openModal;
window.closeModal = closeModal;

// ─── TABS ────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.schedule-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${target}`)?.classList.add('active');
  });
});

// ─── COUNTER ANIMATION ───────────────────────
function animateCount(el, target, duration = 1500) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      if (!isNaN(target)) { animateCount(el, target); counterObserver.unobserve(el); }
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ─── TICKER ──────────────────────────────────
const tickerTrack = document.querySelector('.ticker-track');
if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

// ─── HERO PARALLAX ───────────────────────────
const heroBgImg = document.querySelector('.hero-bg-img');
window.addEventListener('scroll', () => {
  if (heroBgImg) heroBgImg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
}, { passive: true });

// ─── REGISTRATION LINKS ──────────────────────
const REG_LINKS = {
  futsal:       'https://forms.gle/your-futsal-form-link',
  basket:       'https://forms.gle/your-basket-form-link',
  volly:        'https://forms.gle/your-volly-form-link',
  bulutangkis:  'https://forms.gle/your-badminton-form-link',
  dance:        'https://forms.gle/your-dance-form-link',
  tenismeja:    'https://forms.gle/your-tabletennis-form-link',
  karaoke:      'https://forms.gle/your-karaoke-form-link',
  esport:       'https://forms.gle/your-esport-form-link'
};

window.daftarNow = function(sport) {
  const link = REG_LINKS[sport];
  if (link && !link.includes('your-')) {
    window.open(link, '_blank', 'noopener noreferrer');
  } else {
    alert(`Link pendaftaran untuk ${sport} belum dikonfigurasi.\nEdit REG_LINKS di assets/js/main.js`);
  }
};

// ─── GALLERY LIGHTBOX ────────────────────────
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;
      display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn 0.3s ease;`;
    const image = document.createElement('img');
    image.src = img.src;
    image.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;';
    overlay.appendChild(image);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  });
});

// ─── INIT ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Restore saved values ke input
  const inputId = document.getElementById('inputSheetId');
  if (inputId) inputId.value = CONFIG.SHEET_ID;

  const gidFields = ['futsal','basket','volly','bulutangkis','dance','tenismeja','karaoke','esport'];
  gidFields.forEach(sport => {
    const el = document.getElementById(`gid_${sport}`);
    if (el) el.value = CONFIG.SHEET_GIDS[sport] !== '0' ? CONFIG.SHEET_GIDS[sport] : '';
  });

  // Load jadwal jika sudah ada config
  if (CONFIG.SHEET_ID) {
    refreshAll();
  }

  // Auto-refresh
  setInterval(refreshAll, CONFIG.REFRESH_INTERVAL);
});
