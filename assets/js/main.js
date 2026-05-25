/* ============================================
   KCH FIGHTER 2026 — MAIN JAVASCRIPT
   Features: Theme Toggle, Scroll Reveal,
   Google Sheets Integration, Schedule Display
   ============================================ */

'use strict';

// ─── CONFIG ─────────────────────────────────
const CONFIG = {
  // Ganti dengan Google Sheets ID kamu dan nama sheet setelah dipublish
  SHEET_ID: localStorage.getItem('kch_sheet_id') || '',
  API_KEY: localStorage.getItem('kch_api_key') || '',
  REFRESH_INTERVAL: 30000, // 30 detik
  
  // Nama sheet (tab) di Google Spreadsheet
  SHEETS: {
    futsal:    'Futsal',
    basket:    'Basket',
    volly:     'Volly',
    bulutangkis: 'BuluTangkis',
    dance:     'Dance',
    tenismeja: 'TenisMeja',
    karaoke:   'Karaoke',
    esport:    'ESport',
    pendaftaran: 'Pendaftaran'
  }
};

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

// Close menu when link clicked
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
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── SMOOTH ANCHOR ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
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
        <li>Tim yang terlambat >10 menit dianggap WO</li>
        <li>Keputusan wasit bersifat mutlak dan final</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 300.000/tim</li>
        <li>Pendaftaran ditutup 3 hari sebelum pelaksanaan</li>
        <li>Kuota maksimal 16 tim</li>
      </ul>
    `
  },
  basket: {
    title: 'Term & Condition — Basket',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 5 pemain inti + 7 cadangan</li>
        <li>Usia peserta 15–35 tahun</li>
        <li>Format 3on3 atau 5on5 (sesuai peserta)</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan FIBA resmi</li>
        <li>Durasi: 4×10 menit (5on5) atau system point (3on3)</li>
        <li>Pakaian seragam wajib bernomor</li>
        <li>Sepatu olahraga wajib digunakan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 250.000/tim</li>
        <li>Kuota maksimal 12 tim</li>
      </ul>
    `
  },
  volly: {
    title: 'Term & Condition — Volley Ball',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 6 pemain inti + 6 cadangan</li>
        <li>Dapat diikuti pria dan wanita (kategori terpisah)</li>
        <li>Usia peserta tidak dibatasi</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan FIVB resmi</li>
        <li>Format terbaik dari 3 set (best of 3)</li>
        <li>Pakaian seragam wajib</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 200.000/tim</li>
        <li>Kuota maksimal 16 tim per kategori</li>
      </ul>
    `
  },
  bulutangkis: {
    title: 'Term & Condition — Bulu Tangkis',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Kategori: Tunggal Pria, Tunggal Wanita, Ganda Campuran</li>
        <li>Usia peserta 12 tahun ke atas</li>
        <li>Wajib mendaftar sesuai kategori</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Menggunakan peraturan BWF resmi</li>
        <li>Sistem gugur (eliminasi langsung)</li>
        <li>Game: best of 3 (21 poin)</li>
        <li>Shuttlecock disediakan panitia</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya pendaftaran: Rp 50.000/orang/kategori</li>
        <li>Dapat mendaftar lebih dari satu kategori</li>
      </ul>
    `
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
        <li>Kostum sopan dan sesuai tema</li>
        <li>Penilaian: Koreografi, Kostum, Ekspresi, Kekompakan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 75.000/orang</li>
        <li>Kuota terbatas</li>
      </ul>
    `
  },
  tenismeja: {
    title: 'Term & Condition — Tenis Meja',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Kategori: Tunggal Pria, Tunggal Wanita</li>
        <li>Usia peserta tidak dibatasi</li>
        <li>Bet/raket pribadi diperbolehkan (sesuai standar ITTF)</li>
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
      </ul>
    `
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
        <li>Sound system dan backdrop disediakan panitia</li>
        <li>Penilaian: Intonasi, Teknik, Penghayatan, Penampilan</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 50.000/peserta</li>
        <li>Kuota maksimal 30 peserta</li>
      </ul>
    `
  },
  esport: {
    title: 'Term & Condition — E-Sport Mobile Legend',
    content: `
      <h3>Ketentuan Umum</h3>
      <ul>
        <li>Tim terdiri dari 5 pemain + 1 cadangan</li>
        <li>Akun Mobile Legend minimal Advanced Server</li>
        <li>Menggunakan device masing-masing (HP/tablet)</li>
        <li>Semua server game (Asia/Original)</li>
      </ul>
      <h3>Peraturan Pertandingan</h3>
      <ul>
        <li>Format: Custom Room, Draft Pick</li>
        <li>Mode: Classic 5v5</li>
        <li>Sistem gugur, best of 3 (final best of 5)</li>
        <li>Disconnect/lag bukan alasan remake kecuali di menit 3 pertama</li>
        <li>Dilarang menggunakan cheat, hack, atau bug</li>
      </ul>
      <h3>Pendaftaran</h3>
      <ul>
        <li>Biaya: Rp 150.000/tim</li>
        <li>Kuota maksimal 16 tim</li>
        <li>Koneksi WiFi disediakan panitia</li>
      </ul>
    `
  }
};

function openModal(sport) {
  const data = TNC_DATA[sport];
  if (!data || !modalOverlay || !modalTitle || !modalBody) return;
  modalTitle.textContent = data.title;
  modalBody.innerHTML = data.content;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

modalOverlay?.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.getElementById('modalClose')?.addEventListener('click', closeModal);

// Expose globally for inline onclick
window.openModal = openModal;
window.closeModal = closeModal;

// ─── SCHEDULE TABS ───────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const panels  = document.querySelectorAll('.schedule-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${target}`)?.classList.add('active');
  });
});

// ─── GOOGLE SHEETS INTEGRATION ───────────────

function buildSheetsUrl(sheetName) {
  if (!CONFIG.SHEET_ID || !CONFIG.API_KEY) return null;
  const encoded = encodeURIComponent(sheetName);
  return `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encoded}?key=${CONFIG.API_KEY}`;
}

async function fetchSheetData(sheetName) {
  const url = buildSheetsUrl(sheetName);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.values || [];
  } catch (err) {
    console.warn(`Gagal fetch sheet "${sheetName}":`, err.message);
    return null;
  }
}

/**
 * Format data dari Google Sheets ke format jadwal.
 * Baris pertama = header
 * Kolom expected:
 * [0] Tanggal | [1] Waktu | [2] Tim A | [3] Tim B | [4] Skor A | [5] Skor B | [6] Status | [7] Pemenang
 */
function parseScheduleRows(rows) {
  if (!rows || rows.length < 2) return [];
  const [headers, ...data] = rows;
  return data.map(row => ({
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

function statusBadge(status) {
  const map = {
    'Selesai':      'badge-selesai',
    'Berlangsung':  'badge-berlangsung',
    'Belum':        'badge-belum',
    'WO':           'badge-selesai'
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

function renderTable(matches) {
  if (!matches || matches.length === 0) {
    return `
      <div class="no-data">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>Belum ada data jadwal. Silakan isi spreadsheet terlebih dahulu.</p>
      </div>`;
  }

  const rows = matches.map(m => {
    const scoreHTML = (m.skorA !== '' || m.skorB !== '')
      ? `<div class="score-display">${m.skorA}<span class="score-separator">:</span>${m.skorB}</div>`
      : `<span style="color:var(--text-muted)">–</span>`;

    return `
      <tr>
        <td>${m.tanggal}</td>
        <td>${m.waktu}</td>
        <td>
          <div class="match-vs">
            <span class="team-name">${m.timA}</span>
            <span class="vs-badge">VS</span>
            <span class="team-name">${m.timB}</span>
          </div>
        </td>
        <td>${scoreHTML}</td>
        <td>${statusBadge(m.status)}</td>
        <td>${winnerCell(m.pemenang)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="schedule-table-wrap">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Waktu</th>
            <th>Pertandingan</th>
            <th>Skor</th>
            <th>Status</th>
            <th>Pemenang</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function loadSchedule(sport, sheetName, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const container = panel.querySelector('.schedule-content');
  if (!container) return;

  // Show shimmer
  container.innerHTML = `<div class="shimmer" style="height:200px; border-radius:12px;"></div>`;

  const rows = await fetchSheetData(sheetName);
  const matches = parseScheduleRows(rows);
  container.innerHTML = renderTable(matches);

  // Update last refresh time
  const lastUpdate = panel.querySelector('.last-update');
  if (lastUpdate) {
    const now = new Date();
    lastUpdate.textContent = `Update: ${now.toLocaleTimeString('id-ID')}`;
  }

  // Update status dot
  const dot = panel.querySelector('.status-dot');
  if (dot) {
    if (rows !== null) {
      dot.classList.remove('offline');
    } else {
      dot.classList.add('offline');
    }
  }
}

async function refreshAll() {
  const sports = Object.keys(CONFIG.SHEETS);
  for (const sport of sports) {
    await loadSchedule(sport, CONFIG.SHEETS[sport], `panel-${sport}`);
  }
}

// ─── CONFIG SAVE ─────────────────────────────
function saveConfig() {
  const sheetId = document.getElementById('inputSheetId')?.value?.trim();
  const apiKey  = document.getElementById('inputApiKey')?.value?.trim();

  if (!sheetId || !apiKey) {
    alert('Masukkan Sheet ID dan API Key terlebih dahulu.');
    return;
  }

  CONFIG.SHEET_ID = sheetId;
  CONFIG.API_KEY  = apiKey;
  localStorage.setItem('kch_sheet_id', sheetId);
  localStorage.setItem('kch_api_key', apiKey);

  const btn = document.getElementById('btnSaveConfig');
  if (btn) {
    btn.textContent = 'Tersimpan!';
    btn.style.background = 'var(--electric-blue)';
    setTimeout(() => {
      btn.textContent = 'Simpan & Muat';
      btn.style.background = '';
    }, 2000);
  }

  refreshAll();
}

window.saveConfig = saveConfig;

// Restore saved config to inputs
window.addEventListener('DOMContentLoaded', () => {
  const inputId  = document.getElementById('inputSheetId');
  const inputKey = document.getElementById('inputApiKey');
  if (inputId)  inputId.value  = CONFIG.SHEET_ID;
  if (inputKey) inputKey.value = CONFIG.API_KEY;

  // Initial load
  if (CONFIG.SHEET_ID && CONFIG.API_KEY) {
    refreshAll();
  }

  // Auto-refresh
  setInterval(refreshAll, CONFIG.REFRESH_INTERVAL);

  // Update status indicator text
  document.querySelectorAll('.status-live-text').forEach(el => {
    el.textContent = CONFIG.SHEET_ID ? 'Live' : 'Konfigurasi diperlukan';
  });
});

// ─── COUNTER ANIMATION ───────────────────────
function animateCount(el, target, duration = 1500) {
  const start = performance.now();
  const startVal = 0;
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + (target - startVal) * eased);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      if (!isNaN(target)) {
        animateCount(el, target);
        counterObserver.unobserve(el);
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ─── TICKER DUPLICATION ──────────────────────
const tickerTrack = document.querySelector('.ticker-track');
if (tickerTrack) {
  tickerTrack.innerHTML += tickerTrack.innerHTML;
}

// ─── HERO PARALLAX ───────────────────────────
const heroBgImg = document.querySelector('.hero-bg-img');
window.addEventListener('scroll', () => {
  if (heroBgImg) {
    heroBgImg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
  }
}, { passive: true });

// ─── REGISTRATION LINKS ──────────────────────
// Ganti URL di bawah sesuai link Google Form / pendaftaran masing-masing cabang
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
    alert(`Link pendaftaran untuk ${sport} belum dikonfigurasi.\nEdit file assets/js/main.js pada bagian REG_LINKS.`);
  }
};

// ─── GALLERY LIGHTBOX SIMPLE ─────────────────
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;
      display:flex;align-items:center;justify-content:center;cursor:zoom-out;
      animation:fadeIn 0.3s ease;
    `;
    const image = document.createElement('img');
    image.src = img.src;
    image.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;';
    overlay.appendChild(image);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  });
});
