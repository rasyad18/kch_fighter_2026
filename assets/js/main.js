/* ============================================
   KCH FIGHTER 2026 — MAIN JAVASCRIPT
   Mode: Google Sheets "Publish to Web" (CSV)
   Tidak memerlukan API Key
   ============================================ */

'use strict';

// ─── CONFIG ─────────────────────────────────
const CONFIG = {
  SHEET_ID: '2PACX-1vREikVDcDlwJBoN-Fh84AkVftrKTS_nARZDXP-oNoRngokwjRR0pgezNJhamccD7_tZMNeilX_pPZ4s',
  REFRESH_INTERVAL: 30000, // auto-refresh tiap 30 detik

  SHEET_GIDS: {
    futsal:       '0', 
    basket:       '1602342405', 
    volly:        '1905666751', 
    bulutangkis:  '1645421078',
    dance:        '1433423859',
    tenismeja:    '720813413',
    karaoke:      '2118822557',
    esport:       '20640519',
   catur: '2074558484',
  }
};

function buildCsvUrl(gid) {
  if (!CONFIG.SHEET_ID) return null;
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
// Kolom sheet: Site | Tanggal | Waktu | Tim A | Tim B | Skor A | Skor B | Status | Pemenang
function parseScheduleRows(rows) {
  if (!rows || rows.length < 2) return [];

  // Deteksi posisi kolom dari header row secara otomatis (case-insensitive)
  const headerRow = rows[0].map(h => h.toLowerCase().trim());
  const idx = {
    site:     headerRow.findIndex(h => h === 'site'),
    tanggal:  headerRow.findIndex(h => h.includes('tanggal') || h.includes('date')),
    waktu:    headerRow.findIndex(h => h.includes('waktu') || h.includes('time') || h.includes('jam')),
    timA:     headerRow.findIndex(h => h.includes('tim a') || h === 'tima' || h.includes('team a')),
    timB:     headerRow.findIndex(h => h.includes('tim b') || h === 'timb' || h.includes('team b')),
    skorA:    headerRow.findIndex(h => h.includes('skor a') || h === 'skora' || h.includes('score a')),
    skorB:    headerRow.findIndex(h => h.includes('skor b') || h === 'skorb' || h.includes('score b')),
    status:   headerRow.findIndex(h => h.includes('status')),
    pemenang: headerRow.findIndex(h => h.includes('pemenang') || h.includes('winner')),
  };

  // Fallback ke urutan default jika header tidak ditemukan
  // Mendukung dua kemungkinan urutan kolom:
  //   (A) Site | Tanggal | Waktu | Tim A | Tim B | Skor A | Skor B | Status | Pemenang
  //   (B) Tanggal | Waktu | Tim A | Tim B | Skor A | Skor B | Status | Pemenang | Site
  const hasSiteFirst = idx.site === 0 || (idx.site === -1 && idx.tanggal === 1);
  if (idx.site     === -1) idx.site     = hasSiteFirst ? 0 : 8;
  if (idx.tanggal  === -1) idx.tanggal  = hasSiteFirst ? 1 : 0;
  if (idx.waktu    === -1) idx.waktu    = hasSiteFirst ? 2 : 1;
  if (idx.timA     === -1) idx.timA     = hasSiteFirst ? 3 : 2;
  if (idx.timB     === -1) idx.timB     = hasSiteFirst ? 4 : 3;
  if (idx.skorA    === -1) idx.skorA    = hasSiteFirst ? 5 : 4;
  if (idx.skorB    === -1) idx.skorB    = hasSiteFirst ? 6 : 5;
  if (idx.status   === -1) idx.status   = hasSiteFirst ? 7 : 6;
  if (idx.pemenang === -1) idx.pemenang = hasSiteFirst ? 8 : 7;

  const [, ...data] = rows; // skip header row
  return data
    .filter(row => row.some(cell => cell && cell.length > 0))
    .map(row => ({
      site:     (row[idx.site]     || '').trim(),
      tanggal:  row[idx.tanggal]   || '-',
      waktu:    row[idx.waktu]     || '-',
      timA:     row[idx.timA]      || '-',
      timB:     row[idx.timB]      || '-',
      skorA:    row[idx.skorA]     || '',
      skorB:    row[idx.skorB]     || '',
      status:   (row[idx.status]   || 'Belum').trim(),
      pemenang: row[idx.pemenang]  || '',
    }));
}

// Helper untuk standarisasi objek tanggal dari spreadsheet teks
function parseFlexibleDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return null;

  const s = dateStr.trim();

  // Format DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));

  // Format YYYY/MM/DD atau YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));

  // Format DD/MM/YY
  const dmyShort = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmyShort) return new Date(2000 + parseInt(dmyShort[3]), parseInt(dmyShort[2]) - 1, parseInt(dmyShort[1]));

  // Fallback native parse
  const native = new Date(s);
  if (!isNaN(native.getTime())) return native;

  return null;
}

// ─── RENDER SATU MATCH CARD ──────────────────
function renderMatchCard(m, strHariIni, strBesok) {
  const matchDateObj = parseFlexibleDate(m.tanggal);

  // Guard: jika tanggal tidak bisa diparsing, tetap tampilkan card
  const formatTanggalKomparasi = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  let dayBadgeHTML = `<span class="match-time-text">${m.tanggal}</span>`;
  if (matchDateObj && !isNaN(matchDateObj.getTime())) {
    const strMatchDate = formatTanggalKomparasi(matchDateObj);
    if (strMatchDate === strHariIni) {
      dayBadgeHTML = `<span class="match-day-badge today">Hari Ini</span>`;
    } else if (strMatchDate === strBesok) {
      dayBadgeHTML = `<span class="match-day-badge tomorrow">Besok</span>`;
    }
  }

  // ... sisa kode renderMatchCard tidak berubah (statusClean, scoreOrVsHTML, dst)

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

  let footerHTML = `<div class="match-card-footer">${statusBadgeHTML}</div>`;
  if ((statusClean === 'selesai' || statusClean === 'wo') && m.pemenang && m.pemenang !== '-') {
    footerHTML = `
      <div class="match-card-footer">
        <div class="flyer-winner-announcement">
          <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:currentColor; margin-right:4px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Winner: ${m.pemenang}</span>
        </div>
      </div>`;
  }

  const inisialA = m.timA ? m.timA.substring(0, 2).toUpperCase() : '??';
  const inisialB = m.timB ? m.timB.substring(0, 2).toUpperCase() : '??';

  return `
    <div class="match-card-flyer reveal visible">
      <div class="match-card-header">
        ${dayBadgeHTML}
        <div class="match-time-text">${m.waktu} WIB</div>
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
}

// ─── ICON TIAP SITE ──────────────────────────
const SITE_META = {
  'Cikarang':   { icon: '🏭', color: '#FF6B00' },
  'Pulogadung': { icon: '🏢', color: '#00CFFF' },
  'Pulomas':    { icon: '🏟️', color: '#39FF14' },
};
const SITE_ORDER = ['Cikarang', 'Pulogadung', 'Pulomas'];

// ─── DESAIN FLYER PERTANDINGAN & FILTER OTOMATIS ────────────────
// ─── RENDER SEMUA JADWAL (ACCORDION PER TANGGAL) ────────────────
function renderMatchFlyers(matches) {
  if (!matches || matches.length === 0) {
    return `<div class="no-matches-today-box"><p>Belum ada data jadwal di Spreadsheet.</p></div>`;
  }

  const hariIni = new Date();
  const formatTanggalKomparasi = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const strHariIni = formatTanggalKomparasi(hariIni);

  // ── Filter baris valid saja ──
  const matchesValid = matches.filter(m => {
    const d = parseFlexibleDate(m.tanggal);
    return d && !isNaN(d.getTime());
  });

  if (matchesValid.length === 0) {
    return `<div class="no-matches-today-box"><p>Belum ada data jadwal di Spreadsheet.</p></div>`;
  }

  // ── Kelompokkan per tanggal ──
  const byDate = {};
  matchesValid.forEach(m => {
    const d = parseFlexibleDate(m.tanggal);
    const key = formatTanggalKomparasi(d);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  // ── Urutkan tanggal ascending ──
  const sortedDates = Object.keys(byDate).sort();

  // ── Format label tanggal ──
  const formatLabel = (strDate) => {
    const [y, m, d] = strDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const hariNama = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][dateObj.getDay()];
    const bulanNama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m - 1];
    return `${hariNama}, ${d} ${bulanNama} ${y}`;
  };

  // ── Hitung total match per tanggal ──
  let html = '<div class="accordion-schedule">';

  sortedDates.forEach(strDate => {
    const isToday = strDate === strHariIni;
    const isPast  = strDate < strHariIni;
    const matchList = byDate[strDate];
    const totalMatch = matchList.length;

    // Badge label
    let dateBadge = '';
    if (isToday) {
      dateBadge = `<span class="acc-date-badge today">Hari Ini</span>`;
    } else if (isPast) {
      dateBadge = `<span class="acc-date-badge past">Selesai</span>`;
    } else {
      dateBadge = `<span class="acc-date-badge upcoming">Upcoming</span>`;
    }

    // Kelompokkan per site di dalam tanggal ini
    const hasSiteData = matchList.some(m => m.site && m.site.length > 0);
    let innerHTML = '';

    if (!hasSiteData) {
      innerHTML = `<div class="match-flyer-grid">${matchList.map(m => renderMatchCard(m, strHariIni, strHariIni)).join('')}</div>`;
    } else {
      const grouped = {};
      matchList.forEach(m => {
        const siteKey = m.site || 'Lainnya';
        if (!grouped[siteKey]) grouped[siteKey] = [];
        grouped[siteKey].push(m);
      });
      const siteKeys = [
        ...SITE_ORDER.filter(s => grouped[s]),
        ...Object.keys(grouped).filter(s => !SITE_ORDER.includes(s))
      ];
      siteKeys.forEach((site, idx) => {
        const meta  = SITE_META[site] || { icon: '📍', color: '#FF6B00' };
        const cards = grouped[site];
        innerHTML += `
          <div class="site-section${idx > 0 ? ' site-section--gap' : ''}">
            <div class="site-divider">
              <div class="site-divider-line"></div>
              <div class="site-divider-badge" style="--site-color:${meta.color};">
                <span class="site-divider-icon">${meta.icon}</span>
                <span class="site-divider-label">Site ${site}</span>
                <span class="site-divider-count">${cards.length} Match</span>
              </div>
              <div class="site-divider-line"></div>
            </div>
            <div class="match-flyer-grid">
              ${cards.map(m => renderMatchCard(m, strHariIni, strHariIni)).join('')}
            </div>
          </div>`;
      });
    }

    // Accordion item — hari ini otomatis open
    html += `
      <div class="acc-item${isToday ? ' acc-open' : ''}${isPast ? ' acc-past' : ''}">
        <button class="acc-header" onclick="toggleAccordion(this)">
          <div class="acc-header-left">
            <svg class="acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span class="acc-date-label">${formatLabel(strDate)}</span>
            ${dateBadge}
          </div>
          <span class="acc-match-count">${totalMatch} Match</span>
        </button>
        <div class="acc-body">
          <div class="acc-body-inner">
            ${innerHTML}
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  return html;
}
// ─── ACCORDION TOGGLE ────────────────────────
function toggleAccordion(btn) {
  const item = btn.closest('.acc-item');
  const isOpen = item.classList.contains('acc-open');
  // Tutup semua accordion dalam panel yang sama
  const panel = btn.closest('.schedule-panel');
  panel.querySelectorAll('.acc-item.acc-open').forEach(el => el.classList.remove('acc-open'));
  // Buka yang diklik (kecuali sudah open → toggle tutup)
  if (!isOpen) item.classList.add('acc-open');
}
window.toggleAccordion = toggleAccordion;
// ─── AMBIL DATA PER CABANG (LOAD ONE PANEL) ──────────────────────────
async function loadSchedule(sport, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const container = panel.querySelector('.schedule-content');
  if (!container) return;

  container.innerHTML = `<div class="shimmer" style="height:160px; border-radius:16px; grid-column:1/-1;"></div>`;

  const gid = CONFIG.SHEET_GIDS[sport];
  const rows = await fetchSheetData(gid);
  const matches = parseScheduleRows(rows);
  
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
      dot.style.background = '#39FF14';
    } else {
      dot.classList.add('offline');
      dot.style.background = '#ff3838';
    }
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

  const gidFields = [
    'futsal','basket','volly','bulutangkis','dance','tenismeja','karaoke','esport','catur'
  ];
  gidFields.forEach(sport => {
    const el = document.getElementById(`gid_${sport}`);
    if (el && el.value.trim() !== '') {
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
      <h3>Peraturan Teknis</h3>
      <ul>
        <li>Drawing dilakukan sebelum Opening Turnamen (acak/random), hasil drawing bersifat final</li>
      </ul>

      <h3>Prosedur Sebelum Pertandingan</h3>
      <ul>
        <li>Pemeriksaan pemain (jersey, sepatu, aksesoris)</li>
        <li>Briefing singkat oleh wasit</li>
        <li>Toss koin: menentukan kick-off atau sisi lapangan</li>
        <li>Foto tim (opsional)</li>
      </ul>

      <h3>Sistem Point & Klasemen</h3>
      <ul>
        <li>Menang = 3 Point, Seri = 1 Point, Kalah = 0 Point</li>
        <li>Klasemen: Point tertinggi → Selisih Gol → Jumlah Gol Kemasukan → Head-to-head → Fair Play</li>
      </ul>

      <h3>Durasi Pertandingan</h3>
      <ul>
        <li><strong>Putra:</strong> Penyisihan 2×15 menit | 8 Besar/SF/Final 2×20 menit | Istirahat 2–5 menit</li>
        <li><strong>Putri:</strong> Penyisihan 2×10 menit | 8 Besar/SF/Final 2×12 menit | Istirahat 2–5 menit</li>
      </ul>

      <h3>Jumlah & Kelengkapan Pemain</h3>
      <ul>
        <li>5 pemain inti (termasuk 1 kiper) + cadangan bebas sesuai departemen</li>
        <li>Minimal 3 pemain untuk memulai pertandingan. Kurang dari 3 saat berlangsung → kalah</li>
        <li>Wajib: jersey seragam, celana olahraga, kaos kaki panjang, sepatu futsal sol karet</li>
        <li>Kiper wajib jersey berbeda warna dari pemain lain</li>
        <li>Dilarang: sandal, sepatu metal/stud, jam tangan, cincin/kalung/aksesoris berbahaya</li>
      </ul>

      <h3>Peraturan Permainan</h3>
      <ul>
        <li>Pergantian pemain: rolling substitution, bebas kapan saja tanpa menghentikan pertandingan</li>
        <li>Kick-off dari titik tengah, pemain lawan minimal 3 meter dari bola</li>
        <li>Kick-in: bola di garis, dilakukan dalam 4 detik. Gagal → bola untuk lawan</li>
        <li>Corner kick: jarak minimal ±5 meter, dilakukan dalam 4 detik</li>
        <li>Back pass: kiper tidak boleh menerima umpan kaki dari rekan menggunakan tangan</li>
        <li>Akumulasi foul: dicatat tiap babak, foul ke-6 → second penalty</li>
      </ul>

      <h3>Kartu & Sanksi</h3>
      <ul>
        <li><strong>Kartu Kuning:</strong> denda Rp25.000. 2 kartu kuning dalam 1 pertandingan = kartu merah</li>
        <li><strong>Kartu Merah:</strong> denda Rp50.000, keluar pertandingan, skorsing minimal 1 pertandingan berikutnya. Tim bermain kurang 2 menit penuh atau hingga lawan cetak gol</li>
      </ul>

      <h3>Fair Play</h3>
      <ul>
        <li>Semua pemain wajib menjaga sportivitas selama pertandingan</li>
        <li>Dilarang provokasi terhadap lawan maupun suporter</li>
        <li>Panitia berhak memberikan sanksi tambahan atas tindakan yang merugikan turnamen</li>
      </ul>
    `
  },

  bulutangkis: {
    title: 'Term & Condition — Bulu Tangkis',
    content: `
      <h3>Format Tim</h3>
      <ul>
        <li>Sistem beregu campuran, 1 tim terdiri dari: 1 Tunggal Putra, 1 Tunggal Putri, 1 Ganda Putra, 1 Ganda Putri, 1 Ganda Campuran</li>
        <li>Maksimal 6 pemain cadangan</li>
        <li>Pemain putra dan putri tidak boleh bermain rangkap (2 partai)</li>
      </ul>

      <h3>Urutan Pertandingan</h3>
      <ul>
        <li>1. Tunggal Putra</li>
        <li>2. Tunggal Putri</li>
        <li>3. Ganda Putra</li>
        <li>4. Ganda Putri</li>
        <li>5. Ganda Campuran</li>
        <li>Urutan tidak boleh ditukar dan tidak ada partai yang dilewati/skip</li>
      </ul>

      <h3>Sistem Score</h3>
      <ul>
        <li>Rally Point, poin 21 pemain pindah tempat</li>
        <li>Pemain yang mencapai 42 poin sebagai pemenang, tidak ada deuce</li>
        <li>Berlaku untuk semua nomor</li>
      </ul>

      <h3>Babak Penyisihan</h3>
      <ul>
        <li>Semua 5 partai dipertandingkan dengan sistem Round Robin per Site</li>
        <li>Jika 1 grup per site: peringkat 1 & 2 lolos ke Quarter Final</li>
        <li>Jika 2 grup per site: hanya peringkat 1 tiap grup yang lolos ke Quarter Final</li>
        <li>Klasemen: Jumlah Kemenangan Tim → Selisih Kemenangan Partai → Selisih Poin → Head-to-Head</li>
      </ul>

      <h3>Babak Quarter Final, Semi Final & Final</h3>
      <ul>
        <li>Menggunakan sistem Best of 5 (menang 3 partai terlebih dahulu)</li>
      </ul>

      <h3>Ketentuan Lain</h3>
      <ul>
        <li>Istirahat 1 menit pada poin 11 & 32 tiap partai, serta saat pergantian tempat antara game 1 dan 2</li>
        <li>Pemain tidak boleh meninggalkan lapangan tanpa izin wasit</li>
        <li>Pemain dipanggil 3 kali dalam 15 menit tidak hadir → WO (skor 42–0)</li>
        <li>Pemain cedera tidak dapat dilanjutkan → kalah, lawan mendapat poin kemenangan partai: 1 dengan skor 42</li>
        <li>Wajib berpakaian olahraga bulutangkis dan menggunakan sepatu olahraga</li>
        <li>Setiap departemen wajib mengirimkan nama wasit utama dan hakim garis</li>
        <li>Ketentuan lain disampaikan saat Technical Meeting</li>
      </ul>
    `
  },

  volly: {
    title: 'Term & Condition — Volley Ball',
    content: `
      <h3>Ketentuan Tim</h3>
      <ul>
        <li>6 pemain inti + maksimal 6 cadangan (total 12 pemain)</li>
        <li>Pemain kurang dari 4 saat bertanding → WO (skor otomatis 30–0)</li>
        <li>Maksimal 3 kali pukulan per regu</li>
        <li>Bola menyentuh garis = masuk. Menyentuh antena/di luar garis = keluar</li>
        <li>Dilarang menangkap atau melempar bola saat rally berlangsung</li>
      </ul>

      <h3>Babak Penyisihan</h3>
      <ul>
        <li>2 game set, rally @15 poin, tukar lapangan setelah game set 1</li>
        <li>Menang jika mencapai 30 poin lebih dulu dengan selisih 2 poin</li>
        <li>Jika 29–29, berlanjut hingga selisih 2 poin (maksimal deuce poin 35)</li>
        <li>Time out: 1x per set, durasi 1 menit</li>
      </ul>

      <h3>Babak Semi Final & Final</h3>
      <ul>
        <li>Sistem rally @25 poin, best of three games (3×25)</li>
        <li>Menang jika telah memenangkan 2 game set (maksimal deuce poin 30)</li>
        <li>Game ke-3: pindah lapangan di poin 13</li>
        <li>Time out: 1x per set, durasi 1 menit</li>
        <li>Water break 1x di skor 15 (Quarter hingga Final), maksimal 1 menit</li>
      </ul>

      <h3>Pergantian Pemain</h3>
      <ul>
        <li>Maksimal 6x pergantian tiap set, dilakukan setelah rally selesai</li>
        <li>Pemain yang diganti boleh kembali setelah posisi melewati 1 putaran</li>
        <li>Pemain cedera tidak dihitung dalam kuota 6 pergantian dan tidak boleh bermain lagi</li>
      </ul>

      <h3>Pelanggaran</h3>
      <ul>
        <li>Menyentuh net saat pertandingan berlangsung</li>
        <li>Kaki masuk lapangan/menginjak garis saat serve</li>
        <li>Melewati garis tengah atau masuk area lawan saat permainan berlangsung</li>
        <li>Menyentuh bola lebih dari 1 kali (kecuali saat blocking smash)</li>
      </ul>

      <h3>Sistem Point & Klasemen</h3>
      <ul>
        <li>Menang = 3 Point | Kalah = 0 Point</li>
        <li>Klasemen: Point kemenangan → Selisih skor kemenangan → Head to Head → Pertandingan ulang jika masih sama</li>
      </ul>
    `
  },

  basket: {
    title: 'Term & Condition — Basket (3x3)',
    content: `
      <h3>Format Permainan</h3>
      <ul>
        <li>3on3 di setengah lapangan basket</li>
        <li><strong>Putra:</strong> 2×7 menit (kotor) | <strong>Putri:</strong> 2×5 menit (kotor) | Istirahat 3 menit</li>
        <li>Mulai Quarter Final: waktu bersih (bola out/foul → timer berhenti)</li>
        <li>Shot clock 12 detik. Tanpa shot clock → wasit hitung mundur 5 detik terakhir</li>
      </ul>

      <h3>Jumlah Pemain</h3>
      <ul>
        <li>3 pemain inti + maksimal 4 cadangan (total 7)</li>
        <li>Minimal 3 pemain harus ada di lapangan, toleransi menunggu 5 menit dari jam pertandingan</li>
      </ul>

      <h3>Perhitungan Skor</h3>
      <ul>
        <li>Tembakan di dalam garis 3 angka = 1 poin</li>
        <li>Tembakan di belakang garis 3 angka = 2 poin</li>
        <li>Tim yang lebih dulu mencapai 21 poin sebelum waktu habis → menang</li>
        <li>Adu freethrow jika waktu habis dan poin draw (3x tembakan atau selisih 1 poin)</li>
      </ul>

      <h3>Team Foul</h3>
      <ul>
        <li>6 kali team foul (tidak direset di babak kedua)</li>
        <li>Foul ke-7, 8, 9 → 1x lemparan bebas</li>
        <li>Foul ke-10 dan seterusnya → 2x lemparan bebas + penguasaan bola kembali</li>
        <li>Free throw: 1 lemparan bebas. 2 lemparan bebas jika foul terjadi di luar garis 3 poin</li>
      </ul>

      <h3>Aturan Bola</h3>
      <ul>
        <li>Check ball selalu dilakukan setelah dead ball atau permulaan game (1x peringatan, 2x → pindah penguasaan bola)</li>
        <li>After point: tim non-scoring melanjutkan dari dalam lapangan di bawah keranjang ke belakang garis 3 poin (clear out)</li>
        <li>Rebound tim menyerang → boleh langsung cetak skor tanpa harus ke belakang garis 3 poin</li>
        <li>Rebound/steal tim bertahan → wajib keluarkan bola ke belakang garis 3 poin</li>
        <li>Bola clear: kedua kaki dan bola sudah berada di belakang garis 3 poin</li>
      </ul>

      <h3>Pergantian Pemain & Wasit</h3>
      <ul>
        <li>Pergantian saat dead ball sebelum check ball. Tidak perlu tindakan dari wasit</li>
        <li>Time out: 1x per babak per tim (30 detik)</li>
        <li>Penyisihan: wasit internal Bintang Toedjoe. Semi Final & Final: wasit eksternal</li>
      </ul>
    `
  },

  tenismeja: {
    title: 'Term & Condition — Tenis Meja',
    content: `
      <h3>Sistem Pertandingan</h3>
      <ul>
        <li>Site PG, PLM, SFL: Single Round Robin (setiap tim bertanding melawan seluruh tim 1 kali)</li>
        <li>Site B7 CKR: format khusus, setiap tim bertanding 2 kali berdasarkan hasil undian</li>
        <li>Semua match wajib dimainkan untuk perhitungan poin</li>
      </ul>

      <h3>Kategori & Format</h3>
      <ul>
        <li>Kategori beregu: Tunggal Putra, Ganda Putra, Ganda Campuran</li>
        <li>Urutan: 1. Tunggal Putra → 2. Ganda Putra → 3. Ganda Campuran</li>
        <li>Urutan dapat berubah atas kesepakatan kedua tim. Jika tidak ada kesepakatan, kembali ke urutan awal</li>
        <li>Kemenangan tim ditentukan dari 2 kemenangan dari 3 kategori</li>
      </ul>

      <h3>Komposisi Tim</h3>
      <ul>
        <li>5 pemain inti + 5 pemain cadangan</li>
        <li>Pemain tidak boleh bermain rangkap dalam satu pertandingan</li>
        <li>Perubahan komposisi diperbolehkan saat pendaftaran ulang sebelum pertandingan</li>
      </ul>

      <h3>Sistem Penilaian</h3>
      <ul>
        <li>Setiap match: 11 poin, servis pindah tiap 2 poin, best of 3 set</li>
        <li>Menang 3–0 = 3 poin | Menang 2–1 = 2 poin | Kalah 1–2 = 1 poin | Kalah 0–3 = 0 poin</li>
        <li>Jika poin sama: total kemenangan → total kemenangan set → score tiap set</li>
      </ul>

      <h3>Peraturan Servis & Permainan</h3>
      <ul>
        <li>Bola harus dilambungkan saat servis</li>
        <li>Pelanggaran servis: peringatan 1x → diulang, peringatan 2x → poin lawan</li>
        <li>3 kali net berturut-turut saat servis → poin lawan</li>
        <li>Ganda: servis harus menyilang, salah kamar → poin lawan</li>
        <li>Bet menyentuh meja saat rally → poin lawan</li>
      </ul>

      <h3>Kehadiran & Perlengkapan</h3>
      <ul>
        <li>Toleransi keterlambatan 5 menit. Lebih dari itu → WO</li>
        <li>Pemain cedera tidak bisa melanjutkan → kalah, tidak bisa diganti</li>
        <li>Wajib menggunakan sepatu olahraga / pelindung kaki</li>
      </ul>
    `
  },

  dance: {
    title: 'Term & Condition — Dance',
    content: `
      <p>Peraturan lengkap Dance dapat dilihat di:</p>
      <p style="margin-top:0.75rem;">
        <a href="https://tinyurl.com/RulesARTKCHFighter2026" target="_blank" rel="noopener"
          style="display:inline-flex; align-items:center; gap:6px; color:#FF6B00; font-weight:500; text-decoration:none; border:1px solid rgba(255,107,0,0.4); padding:10px 18px; border-radius:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Lihat Peraturan Dance (ART)
        </a>
      </p>
    `
  },

  karaoke: {
    title: 'Term & Condition — Karaoke',
    content: `
      <p>Peraturan lengkap Karaoke dapat dilihat di:</p>
      <p style="margin-top:0.75rem;">
        <a href="https://tinyurl.com/RulesARTKCHFighter2026" target="_blank" rel="noopener"
          style="display:inline-flex; align-items:center; gap:6px; color:#FF6B00; font-weight:500; text-decoration:none; border:1px solid rgba(255,107,0,0.4); padding:10px 18px; border-radius:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Lihat Peraturan Karaoke (ART)
        </a>
      </p>
    `
  },
   catur: {
  title: 'Term & Condition — Catur',
  content: `
    <h3>Peserta</h3>
    <ul>
      <li>All Karyawan B7 yang mewakili Bagian/Departemen di Bintang 7</li>
      <li>Peserta tidak dibatasi gender (boleh campuran pria & wanita)</li>
      <li>Setiap departemen mengirimkan <strong>3 orang peserta</strong></li>
    </ul>

    <h3>Tata Cara Pertandingan</h3>
    <ul>
      <li>Permainan dilakukan menggunakan papan catur yang telah dipersiapkan panitia</li>
      <li>Format <strong>3 on 3</strong> — 6 peserta saling berhadapan secara bersamaan (offline)</li>
      <li>Masing-masing tim menentukan posisi nama pemain (Pemain 1, 2, 3) sebelum pertandingan</li>
      <li>Tidak dibatasi gender — pertandingan bisa mempertemukan pria dan wanita dalam satu meja</li>
      <li>Setiap peserta hanya bertanding <strong>1 ronde</strong> hingga babak Perempat Final</li>
      <li>Penentuan bidak (hitam/putih) berdasarkan undian atau kesepakatan peserta sebelum pertandingan</li>
      <li>Pemenang tim ditentukan dari poin: <strong>2–1</strong> atau <strong>3–0</strong></li>
    </ul>

    <h3>Peraturan Pertandingan</h3>
    <ul>
      <li>Setiap pemain <strong>dilarang bekerja sama</strong> dengan rekan satu tim selama pertandingan berlangsung</li>
      <li>Peserta yang mendapatkan bidak <strong>putih</strong> melangkahkan bidak pertama kali</li>
      <li>Setiap pemain memiliki waktu maksimal <strong>20 detik</strong> per langkah</li>
      <li>Bidak yang disentuh pertama kali <strong>wajib dijalankan</strong> (touch-move)</li>
      <li>Peserta <strong>tidak boleh mengulang</strong> langkah bidak yang telah disentuh dan dijalankan</li>
      <li>Pelanggaran aturan touch-move dicatat wasit dan dapat mempengaruhi hasil jika terjadi REMIS</li>
      <li>Peserta wajib bermain sportif dan fair play — terbukti melakukan gangguan/intimidasi terhadap lawan → <strong>Diskualifikasi</strong></li>
    </ul>

    <h3>Kondisi Pertandingan Selesai</h3>
    <ul>
      <li>Salah satu peserta melakukan <strong>SKAKMAT</strong> kepada lawannya</li>
      <li>Pihak lawan <strong>menyerah</strong> sebelum pertandingan selesai</li>
      <li>Terjadi <strong>REMIS</strong>, yaitu kondisi:
        <ul style="margin-top:0.4rem; padding-left:1.2rem;">
          <li>Raja vs Raja</li>
          <li>Raja &amp; Gajah vs Raja</li>
          <li>Raja &amp; Kuda vs Raja</li>
          <li>Raja &amp; Gajah vs Raja &amp; Gajah dengan warna gajah yang sama</li>
        </ul>
      </li>
    </ul>

    <h3>Penentuan Pemenang saat REMIS</h3>
    <ul>
      <li>Pemenang ditentukan dari <strong>jumlah pelanggaran</strong> — pemain dengan pelanggaran lebih sedikit menang</li>
      <li>Jika tidak ada pelanggaran → dilakukan <strong>permainan ulang</strong> dengan pemain yang sama</li>
    </ul>

    <h3>Format Babak</h3>
    <ul>
      <li><strong>Penyisihan s/d Perempat Final:</strong> 1 ronde per pertandingan</li>
      <li><strong>Semi Final &amp; Final:</strong> 3 ronde — pemenang adalah tim yang memenangkan 2 ronde terlebih dahulu</li>
    </ul>
  `
},
  esport: {
    title: 'Term & Condition — E-Sport Mobile Legends',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Pertandingan menggunakan Mobile Legends: Bang Bang</li>
        <li>Format Best of 3 (BO3), final opsional Best of 5 (BO5)</li>
        <li>Mode: Custom Mode + Draft Pick</li>
        <li>5 pemain inti + maksimal 2 cadangan per tim</li>
        <li>Pergantian pemain hanya sebelum masuk lobby atau sebelum match dimulai</li>
        <li>Semua peserta wajib menggunakan akun pribadi</li>
      </ul>

      <h3>Setting Pertandingan</h3>
      <ul>
        <li>Skin: ON | Chat Team: ON | Chat All: OFF</li>
        <li>Dilarang: cheat, script, map hack, bug abuse → langsung DQ</li>
        <li>Kesalahan draft pick, emblem, spell, atau koneksi menjadi tanggung jawab tim masing-masing</li>
        <li>Pause hanya dengan izin panitia atau kendala teknis serius</li>
      </ul>

      <h3>Keterlambatan & WO</h3>
      <ul>
        <li>Wajib hadir minimal 10 menit sebelum jadwal dan registrasi ulang beserta list pemain</li>
        <li>Toleransi keterlambatan maksimal 10 menit. Lewat batas → WO</li>
      </ul>

      <h3>Etika Bermain</h3>
      <ul>
        <li>Dilarang berkata kasar, toxic, atau menghina lawan/panitia</li>
        <li>Dilarang spam chat atau provokasi</li>
        <li>Sanksi: warning → pengurangan poin → diskualifikasi</li>
      </ul>

      <h3>Hasil Pertandingan</h3>
      <ul>
        <li>Captain wajib screenshot hasil pertandingan dan kirim ke panitia</li>
        <li>Keputusan panitia bersifat mutlak dan tidak dapat diganggu gugat</li>
      </ul>
    `
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
  futsal:       'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  basket:       'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  volly:        'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  bulutangkis:  'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  dance:        'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  tenismeja:    'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  karaoke:      'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
  esport:       'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551',
   catur:       'https://docs.google.com/spreadsheets/d/1EoVaZBShCSOaphSdqIu-Al6UzZm_XNAyvDvovAvQqo8/edit?gid=1714878551#gid=1714878551'
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
  const inputId = document.getElementById('inputSheetId');
  if (inputId) inputId.value = CONFIG.SHEET_ID;

  const gidFields = ['futsal','basket','volly','bulutangkis','dance','tenismeja','karaoke','esport','catur'];
  gidFields.forEach(sport => {
    const el = document.getElementById(`gid_${sport}`);
    if (el) el.value = CONFIG.SHEET_GIDS[sport];
  });

  if (CONFIG.SHEET_ID) {
    refreshAll();
  }

  setInterval(refreshAll, CONFIG.REFRESH_INTERVAL);
});
