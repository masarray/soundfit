export const venueTypeOptions = [
  { value: 'mosque', label: 'Masjid / Mushola', desc: 'Ibadah, ceramah rutin.' },
  { value: 'church', label: 'Gereja / Rumah Ibadah', desc: 'Ibadah, musik, khotbah.' },
  { value: 'hall', label: 'Aula / Ruang Serbaguna', desc: 'Acara, seminar, resepsi.' },
  { value: 'classroom', label: 'Ruang Kelas / Training', desc: 'Pendidikan, presentasi.' },
  { value: 'meeting', label: 'Meeting Room / Kantor', desc: 'Rapat, presentasi bisnis.' },
  { value: 'cafe', label: 'Cafe / Resto / Retail', desc: 'Musik latar, pengumuman.' },
  { value: 'outdoor', label: 'Outdoor / Area Terbuka', desc: 'Lapangan, taman, parkiran.' }
];

export const useCaseOptions = [
  { value: 'speech', label: 'Ceramah / Khutbah / Pidato', desc: 'Fokus: suara jelas dan mudah dipahami.' },
  { value: 'study', label: 'Kajian / Pengajian / Kelas', desc: 'Fokus: nyaman untuk durasi lama.' },
  { value: 'worship_music', label: 'Ibadah dengan Musik', desc: 'Fokus: vokal dan musik seimbang.' },
  { value: 'paging', label: 'Pengumuman / Paging', desc: 'Fokus: terdengar jelas dan menjangkau area luas.' },
  { value: 'presentation', label: 'Seminar / Presentasi', desc: 'Fokus: pembicara jelas sampai belakang.' },
  { value: 'background_music', label: 'Musik Ringan / BG Music', desc: 'Fokus: menyebar halus dan tidak mengganggu.' },
  { value: 'multipurpose', label: 'Serbaguna', desc: 'Fokus: fleksibel untuk banyak kegiatan.' }
];

export const projectConditionOptions = [
  { value: 'new_system', label: 'Bangun sistem baru dari nol', desc: 'Belum ada sistem speaker, mulai dari awal.' },
  { value: 'upgrade', label: 'Upgrade sistem lama', desc: 'Sudah ada sistem, ingin dibuat lebih baik.' },
  { value: 'troubleshoot', label: 'Perbaiki masalah suara', desc: 'Ada keluhan seperti feedback, belakang kurang jelas, echo.' },
  { value: 'vendor_review', label: 'Evaluasi proposal vendor', desc: 'Sudah ada penawaran, ingin second opinion awal.' },
  { value: 'quick_proposal', label: 'Rekomendasi cepat untuk rapat', desc: 'Butuh gambaran awal untuk DKM/panitia.' }
];

export const complaintOptions = [
  { value: 'rear_unclear', label: 'Suara belakang kurang jelas' },
  { value: 'front_too_loud', label: 'Area depan terlalu keras' },
  { value: 'feedback', label: 'Sering feedback / nging' },
  { value: 'echo', label: 'Suara menggema' },
  { value: 'thin_sound', label: 'Suara cempreng / tipis' },
  { value: 'mic_unstable', label: 'Mic sering tidak stabil' },
  { value: 'many_speakers_but_unclear', label: 'Speaker sudah banyak tapi tetap tidak jelas' },
  { value: 'distortion', label: 'Suara pecah saat volume dinaikkan' },
  { value: 'left_right_imbalance', label: 'Suara tidak merata kiri-kanan' },
  { value: 'unknown', label: 'Tidak tahu masalahnya di mana' }
];