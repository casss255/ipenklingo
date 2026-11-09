# Ipenk Lingo

Aplikasi belajar bahasa Inggris dan Mandarin dengan kurikulum bertahap: catatan tata bahasa, kosakata, latihan soal, suara contoh, dan latihan bicara yang mengecek pengucapan.

## Isi kursus

| | Bahasa Inggris | Bahasa Mandarin |
|---|---|---|
| Pelajaran | 25 | 23 |
| Kosakata | 201 kata | 184 kata |
| Contoh kalimat | 200 | 184 |

Enam unit, dari pemula sampai percakapan kerja: dasar-dasar, sehari-hari, tata bahasa inti, keluarga dan rumah, bepergian (transportasi, arah, hotel, restoran, bandara), serta kesehatan dan pekerjaan (dokter, rapat, wawancara, telepon dan email).

Setiap pelajaran punya halaman ringkasan (catatan tata bahasa, kosakata, contoh kalimat) lalu 15 soal: pilihan arti, pasangkan kata, lengkapi kalimat, susun kalimat, menyimak, dan berbicara. Kata yang salah dijawab muncul di daftar "Perlu diulang". Tab **Kosakata** menyimpan semua kata dari pelajaran yang sudah selesai, lengkap dengan pencarian dan suara.

## Menjalankan

Buka `https://casss255.github.io/ipenklingo/` di **Safari**, tekan **Share**, lalu **Add to Home Screen**.

## Latihan bicara

- Butuh izin mikrofon dan koneksi internet (pengenalan suara diproses oleh browser/Apple).
- Kalau mikrofon tidak merespons dari icon Home Screen, buka app lewat Safari.
- Di Pengaturan iPhone, pastikan **Settings → Safari → Microphone** diizinkan.

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Kerangka halaman |
| `style.css` | Tampilan (terang dan gelap) |
| `courses-en.js`, `courses-zh.js` | Materi pelajaran |
| `courses.js` | Daftar kursus |
| `lesson.js` | Pembuat soal |
| `judge.js` | Penilaian jawaban dan ucapan |
| `state.js` | Progres tersimpan, hati, hari beruntun |
| `speech.js` | Suara contoh dan pengenalan suara |
| `views.js`, `app.js`, `icons.js` | Layar, alur pelajaran, ikon |
| `sw.js` | Service worker (offline) |

## Menambah materi

Semua materi ada di `courses-en.js` dan `courses-zh.js`.

- Inggris: `s('kalimat', 'arti', ...variasi)`.
- Mandarin: `zs('字/pīnyīn 字/pīnyīn ，/ ...', 'arti')`. Tanda baca memakai pinyin kosong, dan `_` di dalam pinyin berarti spasi.
- Pelajaran baru: id unik, `note`, minimal 8 kata dan 8 kalimat (Mandarin minimal 7). Jangan mengubah id atau urutan pelajaran lama, karena progres tersimpan memakai id.

Lalu jalankan tes: `node --test tests/*.test.js`. Tes memeriksa jumlah kata dan kalimat, pinyin, kalimat yang terlalu pendek atau panjang, dan memainkan semua soal dari semua pelajaran.

## Aturan update

Setiap kali ada file app yang berubah (`index.html`, `*.js`, `style.css`), naikkan juga `VERSION` di `sw.js` (`lingo-v3` menjadi `lingo-v4`, dst.), lalu commit dan push semuanya. Kalau menambah file baru, daftarkan juga di `SHELL` di `sw.js`. Di HP, tutup dan buka app satu atau dua kali supaya versi baru terpasang.
