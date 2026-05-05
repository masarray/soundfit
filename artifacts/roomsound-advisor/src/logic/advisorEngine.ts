export type VenueType = 'mosque' | 'church' | 'hall' | 'classroom' | 'meeting' | 'cafe' | 'retail' | 'outdoor';
export type UseCase = 'speech' | 'study' | 'worship_music' | 'live_music' | 'paging' | 'presentation' | 'background_music' | 'multipurpose';
export type ProjectCondition = 'new_system' | 'upgrade' | 'troubleshoot' | 'vendor_review' | 'quick_proposal';
export type SolutionMode = 'economy' | 'balanced' | 'premium';
export type SpeakerPreference = 'auto' | 'wall' | 'ceiling' | 'column' | 'pa' | 'horn' | 'mixed';
export type RoomShape = 'rectangle' | 'L' | 'U';

export interface WizardData {
  venueType: VenueType;
  roomLengthM: number;
  roomWidthM: number;
  ceilingHeightM: number;
  listenerPosture: 'floor' | 'chair' | 'standing' | 'mixed';
  useCase: UseCase;
  projectCondition: ProjectCondition;
  complaints?: string[];
  solutionMode: SolutionMode;
  speakerPreference: SpeakerPreference;
  roomShape?: RoomShape;
  zone2LengthM?: number;
  zone2WidthM?: number;
}

export interface SpeakerPosition {
  id: string;
  side: 'left' | 'right';
  zone: 'front' | 'middle' | 'rear';
  xPercent: number;
  yPercent: number;
}

export interface WingSpeakerPosition {
  id: string;
  side: 'left' | 'right';
  yPercent: number;
  wingId: 1 | 2;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskItem {
  key: 'coverage' | 'feedback' | 'echo' | 'frontComfort' | 'delay';
  title: string;
  level: RiskLevel;
  score: number;
  summary: string;
}

export interface SmartInsight {
  roomShapeLabel: string;
  roomShapeMessage: string;
  placementStrategy: string;
  frontSpeakerDecision: string;
  heightAdvice: string;
  noTiltAdvice: string;
  riskProfile: RiskItem[];
  recommendedZones: string[];
  educationalNotes: string[];
  upgradePath: string[];
}

export interface AdvisoryResult {
  speakerCount: number;
  mainHallSpeakerCount: number;
  wing1SpeakerCount: number;
  wing2SpeakerCount: number;
  totalAreaM2: number;
  layoutDescription: string;
  speakerType: string;
  mountHeightM: number;
  mountTiltDeg: number;
  mountMethod: string;
  listenerHeightM: number;
  areaM2: number;
  areaCategory: string;
  aspectRatio: number;
  aspectCategory: string;
  speakerPositions: SpeakerPosition[];
  wingPositions: WingSpeakerPosition[];
  rowCount: number;
  columnCount: number;
  rowSpacingM: number;
  frontOffsetM: number;
  executiveSummary: string;
  reasons: string[];
  warnings: string[];
  installationNotes: string[];
  needsDelayZone: boolean;
  delayZoneNote?: string;
  alternatives: {
    economy: { speakerCount: number; description: string };
    balanced: { speakerCount: number; description: string };
    premium: { speakerCount: number; description: string };
  };
  smartInsight: SmartInsight;
  proposalText: string;
}

const ZONE_DEPTHS = {
  economy: { default: 9, speech: 8 },
  balanced: { default: 7, speech: 6.5 },
  premium: { default: 5.5, speech: 5 }
};

const SPEECH_LIKE_USES = ['speech', 'study', 'presentation', 'paging'];

function calcCountForArea(lengthM: number, widthM: number, mode: SolutionMode, useCase: UseCase, venueType: VenueType): number {
  const isSpeech = SPEECH_LIKE_USES.includes(useCase);
  const depth = isSpeech ? ZONE_DEPTHS[mode].speech : ZONE_DEPTHS[mode].default;
  const lengthZones = Math.max(1, Math.ceil(lengthM / depth));
  let widthCols = 3;
  if (widthM <= 6) widthCols = 1;
  else if (widthM <= 14) widthCols = 2;
  if ((venueType === 'mosque' || venueType === 'church') && widthM >= 8) {
    widthCols = Math.max(widthCols, 2);
  }
  const rawCount = lengthZones * widthCols;
  const countMap: Record<number, number> = {
    1: 2, 2: 2, 3: 4, 4: 4, 5: 6, 6: 6, 7: 8, 8: 8, 9: 10, 10: 10, 11: 12, 12: 12
  };
  return countMap[rawCount] || rawCount;
}

function calcWingCount(wingLengthM: number, wingWidthM: number, mainAreaM2: number, mainCount: number): number {
  const wingArea = wingLengthM * wingWidthM;
  const coveragePerSpeaker = mainAreaM2 / Math.max(mainCount, 1);
  const raw = Math.ceil(wingArea / coveragePerSpeaker);
  const even = Math.max(2, raw % 2 === 0 ? raw : raw + 1);
  return Math.min(even, 8);
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 72) return 'High';
  if (score >= 42) return 'Medium';
  return 'Low';
}

function buildRisk(key: RiskItem['key'], title: string, score: number, summary: string): RiskItem {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  return { key, title, score: bounded, level: toRiskLevel(bounded), summary };
}

function buildSmartInsight(params: {
  data: WizardData;
  aspectRatio: number;
  areaCategory: string;
  speakerCount: number;
  mainHallSpeakerCount: number;
  rowCount: number;
  mountHeightM: number;
  mountTiltDeg: number;
  speakerType: string;
  needsDelayZone: boolean;
  hasWing: boolean;
}): SmartInsight {
  const { data, aspectRatio, speakerCount, mainHallSpeakerCount, rowCount, mountHeightM, mountTiltDeg, speakerType, needsDelayZone, hasWing } = params;
  const complaints = data.complaints ?? [];
  const isWide = data.roomWidthM > data.roomLengthM * 1.15;
  const isLong = aspectRatio >= 1.65;
  const isVeryLong = aspectRatio >= 2.2 || data.roomLengthM >= 22;
  const isSmall = data.roomLengthM <= 10 && data.roomWidthM <= 8;
  const isLowCeiling = data.ceilingHeightM <= 3;
  const isHighCeiling = data.ceilingHeightM >= 5;

  const roomShapeLabel = isWide
    ? 'Ruangan melebar'
    : isVeryLong
      ? 'Ruangan sangat memanjang'
      : isLong
        ? 'Ruangan memanjang'
        : 'Ruangan proporsional';

  const roomShapeMessage = isWide
    ? 'Fokus utama adalah coverage kiri-kanan. Pastikan area pinggir tidak tertinggal dan speaker tidak hanya menumpuk di tengah.'
    : isVeryLong
      ? 'Fokus utama adalah distribusi depan-tengah-belakang. Speaker depan saja biasanya membuat depan terlalu keras, tetapi belakang tetap kurang jelas.'
      : isLong
        ? 'Ruangan cenderung memanjang, sehingga distribusi speaker bertahap lebih aman daripada menaikkan volume speaker depan.'
        : 'Bentuk ruangan cukup seimbang. Rekomendasi bisa fokus pada vokal jelas, arah speaker rapi, dan risiko feedback rendah.';

  const placementStrategy = mainHallSpeakerCount <= 2
    ? 'Gunakan pasangan speaker depan kiri-kanan, diarahkan ke area jamaah, bukan lurus sejajar dinding.'
    : rowCount <= 2
      ? 'Gunakan distribusi depan dan tengah/belakang dengan level lebih rendah pada area fill agar suara tidak menekan baris depan.'
      : 'Gunakan beberapa baris speaker dengan level bertahap. Area belakang lebih baik dibantu fill speaker daripada memaksa speaker depan terlalu keras.';

  const frontSpeakerDecision = complaints.includes('feedback')
    ? 'Speaker depan tetap boleh dipakai, tetapi jangan mengarah langsung ke area mic imam/khatib. Prioritaskan arah menyilang ringan ke jamaah dan level moderat.'
    : isSmall
      ? 'Untuk ruangan kecil, speaker kanan-kiri depan biasanya cukup selama arahnya benar dan volume tidak berlebihan.'
      : isLong
        ? 'Untuk ruangan panjang, jangan hanya mengandalkan speaker depan. Tambahkan speaker tengah atau belakang dengan volume lebih rendah untuk menjaga kejelasan.'
        : isWide
          ? 'Untuk ruangan lebar, speaker depan kanan-kiri bisa menjadi basis, tetapi coverage ke sisi pinggir perlu diperhatikan.'
          : 'Speaker depan kanan-kiri cukup sebagai titik awal, lalu evaluasi apakah area tengah-belakang masih perlu fill speaker.';

  const heightAdvice = isLowCeiling
    ? `Plafon relatif rendah. Pasang speaker sedikit di atas tinggi kepala jamaah, sekitar ${mountHeightM.toFixed(1)} m, lalu jaga agar tidak terlalu dekat dengan area mic.`
    : isHighCeiling
      ? `Plafon cukup tinggi. Jangan otomatis memasang speaker setinggi plafon. Rekomendasi awal sekitar ${mountHeightM.toFixed(1)} m agar suara tetap menuju area dengar.`
      : `Tinggi pemasangan awal sekitar ${mountHeightM.toFixed(1)} m sudah masuk akal untuk menjaga suara melewati kepala jamaah depan tetapi tetap menuju area dengar.`;

  const noTiltAdvice = mountTiltDeg >= 90
    ? 'Untuk ceiling speaker, arah suara memang ke bawah. Pastikan jarak antar speaker merata agar tidak ada area yang terlalu keras atau kosong.'
    : isHighCeiling
      ? 'Jika bracket tidak bisa menunduk, hindari pemasangan terlalu tinggi. Speaker yang lurus dari titik terlalu tinggi bisa lewat di atas jamaah dan membuat vokal kurang jelas.'
      : 'Jika speaker tidak bisa menunduk, pilih ketinggian yang masih membuat arah suara menuju jamaah. Jangan arahkan lurus ke dinding belakang atau plafon.';

  const coverageScore = (isLong ? 46 : 18) + (complaints.includes('rear_unclear') ? 28 : 0) + (speakerCount <= 2 && !isSmall ? 18 : 0) + (hasWing ? 14 : 0);
  const feedbackScore = (complaints.includes('feedback') ? 55 : 18) + (data.venueType === 'mosque' ? 8 : 0) + (mainHallSpeakerCount <= 2 && data.roomLengthM > 14 ? 8 : 0);
  const echoScore = (complaints.includes('echo') ? 55 : 20) + (isHighCeiling ? 12 : 0) + (data.roomShape !== 'rectangle' ? 8 : 0);
  const comfortScore = (complaints.includes('front_too_loud') ? 58 : 20) + (speakerCount <= 2 && data.roomLengthM > 12 ? 16 : 0);
  const delayScore = needsDelayZone ? 78 : isVeryLong ? 54 : 22;

  const riskProfile: RiskItem[] = [
    buildRisk('coverage', 'Coverage belakang', coverageScore, isLong ? 'Perlu distribusi bertahap agar belakang tetap jelas.' : 'Coverage relatif aman jika arah speaker benar.'),
    buildRisk('feedback', 'Risiko feedback', feedbackScore, complaints.includes('feedback') ? 'Arah speaker dan posisi mic harus menjadi prioritas.' : 'Risiko masih terkendali, tetap hindari speaker mengarah ke mic.'),
    buildRisk('echo', 'Risiko gema', echoScore, complaints.includes('echo') ? 'Jangan mengejar solusi dengan volume besar; arah dan akustik perlu diperhatikan.' : 'Gema belum menjadi keluhan utama, tetapi material ruangan tetap berpengaruh.'),
    buildRisk('frontComfort', 'Kenyamanan area depan', comfortScore, complaints.includes('front_too_loud') ? 'Kurangi dominasi speaker depan dan bantu dengan fill speaker.' : 'Jaga volume depan agar tidak terlalu menekan jamaah baris awal.'),
    buildRisk('delay', 'Kebutuhan delay zone', delayScore, needsDelayZone ? 'Area tengah/belakang mungkin perlu delay agar suara tidak dobel.' : 'Delay zone belum wajib untuk rekomendasi awal.'),
  ];

  const recommendedZones = mainHallSpeakerCount <= 2
    ? ['Front left', 'Front right']
    : mainHallSpeakerCount <= 4
      ? ['Front left/right', 'Middle or rear fill left/right']
      : ['Front left/right', 'Middle left/right', 'Rear or last-row fill left/right'];

  const educationalNotes = [
    'Untuk masjid dan mushola, target utama adalah kejelasan vokal. Bass besar bukan prioritas utama.',
    'Volume besar di depan sering membuat jamaah depan tidak nyaman, sementara belakang tetap kurang jelas. Distribusi speaker biasanya lebih sehat.',
    `Tipe ${speakerType} dipilih sebagai pendekatan awal. Kualitas akhir tetap dipengaruhi arah speaker, level volume, posisi mic, dan akustik ruangan.`,
    noTiltAdvice,
  ];

  if (complaints.includes('feedback')) educationalNotes.push('Feedback terjadi ketika suara dari speaker kembali tertangkap mic. Solusinya bukan hanya turunkan gain, tetapi juga perbaiki arah speaker dan posisi mic.');
  if (complaints.includes('echo')) educationalNotes.push('Pada ruangan keras dan bergema, terlalu banyak speaker atau volume berlebihan bisa membuat ucapan makin tidak jelas.');
  if (hasWing) educationalNotes.push('Area serambi atau sayap sebaiknya dianggap sebagai zona sendiri agar level suaranya bisa diatur lebih pelan dan nyaman.');

  const upgradePath = data.solutionMode === 'economy'
    ? ['Mulai dari titik speaker paling penting dulu.', 'Rapikan arah speaker dan level volume.', 'Tambahkan fill speaker tengah/belakang jika area belakang masih kurang jelas.']
    : data.solutionMode === 'premium'
      ? ['Gunakan distribusi speaker lebih rapat.', 'Pisahkan area depan, tengah, belakang sebagai zona level.', 'Pertimbangkan DSP/delay jika ruangan panjang.']
      : ['Gunakan konfigurasi seimbang sebagai baseline.', 'Setel level depan secukupnya, lalu bantu area tengah/belakang.', 'Upgrade ke zona delay hanya jika suara terasa dobel atau ruangan sangat panjang.'];

  return {
    roomShapeLabel,
    roomShapeMessage,
    placementStrategy,
    frontSpeakerDecision,
    heightAdvice,
    noTiltAdvice,
    riskProfile,
    recommendedZones,
    educationalNotes,
    upgradePath,
  };
}

export function generateAdvisoryResult(data: WizardData): AdvisoryResult {
  const {
    venueType, roomLengthM, roomWidthM, ceilingHeightM, listenerPosture,
    useCase, solutionMode, speakerPreference, complaints,
    roomShape = 'rectangle', zone2LengthM = 0, zone2WidthM = 0
  } = data;

  const areaM2 = roomLengthM * roomWidthM;
  const aspectRatio = roomLengthM / Math.max(roomWidthM, 1);

  const hasWing = roomShape === 'L' || roomShape === 'U';
  const wing2 = roomShape === 'U';
  const effectiveZone2L = hasWing ? Math.max(zone2LengthM || 0, 0) : 0;
  const effectiveZone2W = hasWing ? Math.max(zone2WidthM || 0, 0) : 0;
  const wingAreaM2 = effectiveZone2L * effectiveZone2W;
  const totalAreaM2 = areaM2 + wingAreaM2 * (wing2 ? 2 : 1);

  let areaCategory = 'sangat besar';
  if (totalAreaM2 < 60) areaCategory = 'kecil';
  else if (totalAreaM2 < 150) areaCategory = 'kecil-menengah';
  else if (totalAreaM2 < 300) areaCategory = 'menengah';
  else if (totalAreaM2 < 600) areaCategory = 'besar';

  let aspectCategory = 'sangat memanjang';
  if (aspectRatio < 1.4) aspectCategory = 'relatif proporsional';
  else if (aspectRatio < 2.2) aspectCategory = 'cukup memanjang';

  const listenerHeightM = listenerPosture === 'floor' ? 0.7 :
    listenerPosture === 'chair' ? 1.2 :
    listenerPosture === 'standing' ? 1.5 : 1.2;

  const getCountForMode = (mode: SolutionMode) => {
    const mainCount = calcCountForArea(roomLengthM, roomWidthM, mode, useCase, venueType);
    if (!hasWing || effectiveZone2L === 0 || effectiveZone2W === 0) return mainCount;
    const wingCount = calcWingCount(effectiveZone2L, effectiveZone2W, areaM2, mainCount);
    return mainCount + wingCount * (wing2 ? 2 : 1);
  };

  const mainHallSpeakerCount = calcCountForArea(roomLengthM, roomWidthM, solutionMode, useCase, venueType);

  let wing1SpeakerCount = 0;
  let wing2SpeakerCount = 0;
  if (hasWing && effectiveZone2L > 0 && effectiveZone2W > 0) {
    wing1SpeakerCount = calcWingCount(effectiveZone2L, effectiveZone2W, areaM2, mainHallSpeakerCount);
    if (wing2) wing2SpeakerCount = wing1SpeakerCount;
  }

  const speakerCount = mainHallSpeakerCount + wing1SpeakerCount + wing2SpeakerCount;

  let columnCount = 2;
  if (roomWidthM <= 6 && mainHallSpeakerCount <= 2) columnCount = 1;
  const rowCount = Math.max(1, Math.ceil(mainHallSpeakerCount / columnCount));

  // ── Step 1: resolve speaker type ──────────────────────────────────────────
  let speakerType = 'Wall Speaker / Column Speaker';
  if (speakerPreference !== 'auto') {
    const typeMap: Record<string, string> = {
      wall: 'Wall Speaker Indoor',
      ceiling: 'Ceiling Speaker',
      column: 'Column Speaker Indoor',
      pa: 'PA Speaker',
      horn: 'Horn Speaker',
      mixed: 'Sistem Kombinasi'
    };
    speakerType = typeMap[speakerPreference] ?? speakerType;
  } else {
    if (useCase === 'live_music') speakerType = 'PA Speaker + Monitor / Fill Speaker';
    else if (useCase === 'worship_music') speakerType = 'PA Speaker + Fill Speaker';
    else if (useCase === 'paging' && venueType === 'outdoor') speakerType = 'Horn Speaker / Outdoor PA';
    else if (useCase === 'paging' && (venueType === 'retail' || venueType === 'cafe' || venueType === 'meeting')) speakerType = 'Ceiling Speaker / Paging Speaker';
    else if (useCase === 'background_music' && (venueType === 'retail' || venueType === 'cafe' || venueType === 'meeting')) speakerType = 'Ceiling Speaker / Distributed BGM Speaker';
    else if (venueType === 'outdoor') speakerType = 'Horn Speaker / Outdoor PA';
    else if (venueType === 'retail') speakerType = 'Ceiling Speaker / Distributed Retail Speaker';
    else if (venueType === 'meeting' || venueType === 'cafe') speakerType = 'Ceiling Speaker';
    else if (venueType === 'mosque' || venueType === 'church') speakerType = 'Wall Speaker / Column Speaker Indoor';
    else if (venueType === 'classroom') speakerType = 'Ceiling Speaker / Wall Speaker';
    else if (venueType === 'hall' && useCase === 'presentation') speakerType = 'PA Speaker + Wall Fill';
  }

  // ── Step 2: classify speaker family ──────────────────────────────────────
  const spkLower = speakerType.toLowerCase();
  const isCeiling = spkLower.includes('ceiling');
  const isPA = (speakerPreference === 'pa') || (spkLower.includes('pa') && !spkLower.includes('ceiling'));
  const isHorn = (speakerPreference === 'horn') || spkLower.includes('horn');
  const isColumn = (speakerPreference === 'column') || spkLower.includes('column');
  // everything else = distributed wall/column

  // ── Step 3: compute zone depth (horizontal throw each speaker row covers) ─
  // zone depth = room length / number of rows (simplified but accurate enough)
  const zoneDepthM = roomLengthM / rowCount;

  // ── Step 4: physics-based mount height ───────────────────────────────────
  // AVIXA CTS / PA system advisory standard:
  //   H = listenerEarHeight + zoneDepth * tan(optimalTiltAngle)
  //   Wall speaker: 30 deg downward tilt for speech clarity
  //   Column speaker: 25 deg (tighter vertical beam, more controlled)
  //   PA (FOH point source): aim at 60% depth, ~15 deg tilt
  //   Horn: as high as practical
  //   Ceiling: flush at ceiling height
  let mountHeightM: number;
  let mountTiltDeg: number;
  let mountMethod: string;

  const maxH = Math.min(ceilingHeightM - 0.3, 5.5); // clearance from ceiling, practical max
  const minH = Math.max(listenerHeightM + 1.0, 2.0);  // minimum clearance above ear

  if (isCeiling) {
    mountHeightM = ceilingHeightM;
    mountTiltDeg = 90;
    mountMethod = 'Flush ceiling mount - speaker mengarah vertikal ke bawah';
  } else if (isHorn) {
    mountHeightM = Math.round(Math.min(ceilingHeightM - 0.3, 5.0) * 10) / 10;
    mountTiltDeg = 15;
    mountMethod = 'Dipasang setinggi mungkin, dengan tilt ke bawah approx. 15 deg';
  } else if (isPA) {
    // PA FOH: speaker aimed at ~60% of room depth at ear height
    // H is typically 2.5-4.0m regardless of ceiling
    const throwToMid = roomLengthM * 0.6;
    const paGeomH = listenerHeightM + throwToMid * Math.tan(15 * Math.PI / 180);
    mountHeightM = Math.round(Math.min(Math.max(paGeomH, 2.5), Math.min(4.0, maxH)) * 10) / 10;
    mountTiltDeg = Math.round(Math.atan((mountHeightM - listenerHeightM) / throwToMid) * 180 / Math.PI);
    mountMethod = `PA front-of-house - ditilt ke bawah approx. ${mountTiltDeg} deg mengarah ke area tengah jemaah`;
  } else {
    // Distributed wall / column speakers - coverage angle geometry
    const tiltDeg = isColumn ? 25 : 30;
    const tanTilt = Math.tan(tiltDeg * Math.PI / 180);
    const geometricH = listenerHeightM + zoneDepthM * tanTilt;
    mountHeightM = Math.round(Math.min(Math.max(geometricH, minH), maxH) * 10) / 10;
    // Actual tilt from clamped height
    mountTiltDeg = Math.round(Math.atan((mountHeightM - listenerHeightM) / zoneDepthM) * 180 / Math.PI);
    mountMethod = isColumn
      ? `Column speaker - tilt ke bawah approx. ${mountTiltDeg} deg (geometri coverage ${zoneDepthM.toFixed(1)}m/baris)`
      : `Wall speaker - tilt ke bawah approx. ${mountTiltDeg} deg (geometri coverage ${zoneDepthM.toFixed(1)}m/baris)`;
  }

  let layoutDescription = `${speakerCount} Tersebar`;
  if (mainHallSpeakerCount === 2) layoutDescription = "1 Depan - 1 Belakang (Kiri-Kanan)";
  else if (mainHallSpeakerCount === 4) layoutDescription = "2 Depan - 2 Belakang";
  else if (mainHallSpeakerCount === 6) layoutDescription = "2 Depan - 2 Tengah - 2 Belakang";
  else if (mainHallSpeakerCount === 8) layoutDescription = "2 Depan - 2 Tengah-Depan - 2 Tengah-Belakang - 2 Belakang";
  if (hasWing && wing1SpeakerCount > 0) {
    layoutDescription += roomShape === 'U'
      ? ` + ${wing1SpeakerCount} Serambi Kiri + ${wing2SpeakerCount} Serambi Kanan`
      : ` + ${wing1SpeakerCount} Serambi`;
  }

  const frontOffsetM = roomLengthM / (rowCount * 2 + 1);
  const rowSpacingM = (roomLengthM - frontOffsetM * 2) / Math.max(rowCount - 1, 1);

  const speakerPositions: SpeakerPosition[] = [];
  for (let i = 0; i < rowCount; i++) {
    const yPercent = 15 + (i * 70 / Math.max(rowCount - 1, 1));
    let zone: 'front' | 'middle' | 'rear' = 'middle';
    if (i === 0) zone = 'front';
    else if (i === rowCount - 1 && rowCount > 1) zone = 'rear';
    speakerPositions.push({ id: `S${i * 2 + 1}`, side: 'left', zone, xPercent: 3, yPercent });
    if (mainHallSpeakerCount > 1) {
      speakerPositions.push({ id: `S${i * 2 + 2}`, side: 'right', zone, xPercent: 97, yPercent });
    }
  }

  const wingPositions: WingSpeakerPosition[] = [];
  const buildWingPositions = (wingId: 1 | 2, count: number, startIndex: number) => {
    const rows = Math.max(1, count / 2);
    for (let i = 0; i < rows; i++) {
      const yPercent = 15 + (i * 70 / Math.max(rows - 1, 1));
      wingPositions.push({ id: `W${wingId}-${i * 2 + 1}`, side: 'left', yPercent, wingId });
      wingPositions.push({ id: `W${wingId}-${i * 2 + 2}`, side: 'right', yPercent, wingId });
    }
  };
  if (wing1SpeakerCount > 0) buildWingPositions(1, wing1SpeakerCount, mainHallSpeakerCount);
  if (wing2SpeakerCount > 0) buildWingPositions(2, wing2SpeakerCount, mainHallSpeakerCount + wing1SpeakerCount);

  const venueLabel = venueType === 'mosque' ? 'Masjid / Mushola' :
    venueType === 'church' ? 'Gereja' :
    venueType === 'hall' ? 'Aula' :
    venueType === 'classroom' ? 'Kelas' :
    venueType === 'meeting' ? 'Ruang Meeting' :
    venueType === 'cafe' ? 'Cafe / Resto' :
    venueType === 'retail' ? 'Retail / Minimarket' : 'Outdoor';

  const useCaseLabel = useCase === 'speech' ? 'Ceramah/Pidato' :
    useCase === 'study' ? 'Kajian/Kelas' :
    useCase === 'worship_music' ? 'Ibadah Musik' :
    useCase === 'live_music' ? 'Live Music' :
    useCase === 'paging' ? 'Pengumuman' :
    useCase === 'presentation' ? 'Presentasi' :
    useCase === 'background_music' ? 'BGM' : 'Serbaguna';

  const modeLabel = solutionMode === 'economy' ? 'Hemat' : solutionMode === 'balanced' ? 'Seimbang' : 'Premium';

  const shapeLabel = roomShape === 'L' ? 'Bentuk-L (dengan serambi)' :
    roomShape === 'U' ? 'Bentuk-U (dua serambi)' : 'Persegi Panjang';

  const areaDesc = hasWing && wing1SpeakerCount > 0
    ? `${areaM2.toFixed(0)} m2 (utama) + ${wing2 ? wingAreaM2 * 2 : wingAreaM2} m2 serambi = ${totalAreaM2.toFixed(0)} m2 total`
    : `${areaM2.toFixed(0)} m2`;

  const executiveSummary = hasWing && wing1SpeakerCount > 0
    ? `Untuk ${venueLabel.toLowerCase()} ${shapeLabel} dengan total luas approx. ${totalAreaM2.toFixed(0)} m2, diperlukan ${speakerCount} speaker: ${mainHallSpeakerCount} unit untuk ruang utama dan ${wing1SpeakerCount + wing2SpeakerCount} unit untuk serambi. Distribusi ini memastikan suara merata ke seluruh zona.`
    : `Untuk ${venueLabel.toLowerCase()} ukuran ${areaM2.toFixed(0)} m2 dengan panjang ${roomLengthM} m, sistem ${speakerCount} speaker terdistribusi lebih dianjurkan daripada speaker besar di depan saja. Tinggi pemasangan approx. ${mountHeightM.toFixed(1)} m dipilih agar suara tidak terhalang.`;

  const reasons: string[] = [];
  if (aspectRatio > 1.4) reasons.push(`Ruangan cukup memanjang (${roomLengthM} m), sehingga distribusi speaker lebih efektif daripada hanya mengandalkan speaker depan.`);
  if (hasWing && wing1SpeakerCount > 0) reasons.push(`Serambi / sayap perlu speaker tersendiri agar jemaah di area tersebut mendapatkan kualitas suara yang sama dengan ruang utama.`);
  if (solutionMode === 'balanced') reasons.push(`Mode seimbang dipilih untuk hasil terbaik antara kualitas suara dan jumlah speaker yang masuk akal.`);
  reasons.push(`Untuk ${venueLabel.toLowerCase()}, speaker ${speakerType} umumnya memberikan kejelasan suara yang lebih baik untuk ${useCaseLabel}.`);
  reasons.push(`Tinggi pemasangan ${mountHeightM.toFixed(1)} m dihitung dari geometri coverage - ${mountMethod.split('-')[1]?.trim() ?? mountMethod}. Sudut tilt approx. ${mountTiltDeg} deg ke bawah mengoptimalkan distribusi suara ke telinga pendengar.`);

  const warnings: string[] = [];
  if (complaints?.includes('feedback')) warnings.push("Hindari arah speaker langsung ke mikrofon imam/khatib/pembicara. Feedback/nging sering terjadi karena suara speaker masuk kembali ke mikrofon.");
  if (complaints?.includes('echo')) warnings.push("Ruangan dengan permukaan keras lebih mudah menggema. Pertimbangkan treatment akustik ringan.");
  if (complaints?.includes('rear_unclear')) warnings.push("Masalah belakang kurang jelas biasanya tidak selesai dengan menaikkan volume. Solusi lebih baik adalah speaker fill di area tengah/belakang.");
  if (complaints?.includes('front_too_loud')) warnings.push("Jika area depan terlalu keras, kurangi level speaker depan dan tambah fill speaker.");
  if (aspectRatio > 2) warnings.push("Ruangan sangat memanjang. Pertimbangkan zona delay agar suara tidak terasa dobel di beberapa posisi.");
  if (totalAreaM2 > 600) warnings.push("Ruangan ini cukup besar. Rekomendasi ini adalah estimasi awal. Sangat disarankan survei teknis dan simulasi lebih detail.");
  if (hasWing && wing1SpeakerCount > 0) warnings.push("Speaker serambi sebaiknya menggunakan mixer/amplifier terpisah agar level suara dapat diatur independen dari ruang utama.");

  const needsDelayZone = roomLengthM > 22 || aspectRatio > 2.2 || !!(complaints?.includes('rear_unclear') && complaints?.includes('echo'));
  const delayZoneNote = needsDelayZone ? "Karena ruangan cukup panjang, speaker area tengah/belakang sebaiknya dipertimbangkan sebagai fill/delay zone. Tanpa pengaturan delay yang tepat, suara dari depan dan belakang bisa terasa dobel pada beberapa posisi." : undefined;

  const installationNotes: string[] = [
    `Pasang speaker di ketinggian approx. ${mountHeightM.toFixed(1)} m dari lantai. ${mountMethod}.`,
    `Tilt (kemiringan) speaker ke bawah approx. ${mountTiltDeg} deg mengarah ke area pendengar - ini hasil perhitungan geometri coverage, bukan estimasi kasar.`,
    "Hindari speaker mengarah langsung ke mikrofon imam/khatib/pembicara.",
    "Gunakan level (volume) secukupnya - speaker yang diatur dengan level rendah dan terdistribusi lebih baik dari satu speaker keras."
  ];
  if (venueType === 'mosque' || venueType === 'church') {
    installationNotes.push("Untuk sistem permanen, kabel speaker yang rapi dan tersembunyi akan memudahkan perawatan jangka panjang.");
  }
  if (venueType === 'retail') {
    installationNotes.push("Untuk retail atau minimarket, pisahkan area kasir, lorong, dan pintu masuk bila perlu agar paging tetap jelas tanpa membuat musik latar terlalu keras.");
  }
  if (hasWing && wing1SpeakerCount > 0) {
    installationNotes.push(`Speaker serambi (${wing1SpeakerCount + wing2SpeakerCount} unit) dipasang di dinding serambi, diarahkan ke dalam area serambi.`);
  }
  if (needsDelayZone) {
    installationNotes.push("Jika sistem menggunakan zona delay, pastikan delay diatur dengan tepat (biasanya sekitar 1ms per 30 cm jarak).");
  }

  const smartInsight = buildSmartInsight({
    data,
    aspectRatio,
    areaCategory,
    speakerCount,
    mainHallSpeakerCount,
    rowCount,
    mountHeightM,
    mountTiltDeg,
    speakerType,
    needsDelayZone,
    hasWing,
  });

  const wingLine = hasWing && wing1SpeakerCount > 0
    ? `\n- Bentuk ruangan     : ${shapeLabel}
- Area ruangan       : ${areaDesc}
- Speaker ruang utama: ${mainHallSpeakerCount} unit
- Speaker serambi    : ${wing1SpeakerCount + wing2SpeakerCount} unit (${roomShape === 'U' ? `${wing1SpeakerCount} kiri + ${wing2SpeakerCount} kanan` : `1 serambi`})`
    : '';

  const proposalText = `Rekomendasi Awal Sistem Speaker Ruangan
========================================
Jenis Tempat    : ${venueLabel}
Ukuran Ruangan  : ${roomLengthM} m x ${roomWidthM} m (${areaM2.toFixed(0)} m2)
Tinggi Plafon   : ${ceilingHeightM} m
Fungsi Utama    : ${useCaseLabel}
Mode Solusi     : ${modeLabel}
${wingLine}
Rekomendasi:
- Jumlah speaker    : ${speakerCount} unit total
- Layout pemasangan : ${layoutDescription}
- Tipe speaker      : ${speakerType}
- Tinggi pemasangan : approx. ${mountHeightM.toFixed(1)} m dari lantai (tilt ke bawah approx. ${mountTiltDeg} deg)

Alasan Rekomendasi:
${reasons.map(r => `- ${r}`).join('\n')}

Insight SoundFit:
- ${smartInsight.roomShapeLabel}: ${smartInsight.roomShapeMessage}
- Strategi posisi: ${smartInsight.placementStrategy}
- Keputusan speaker depan: ${smartInsight.frontSpeakerDecision}
- Saran tinggi: ${smartInsight.heightAdvice}

Catatan Instalasi:
${installationNotes.map(n => `- ${n}`).join('\n')}

---
Rekomendasi ini merupakan estimasi awal berbasis data ruangan.
Sebaiknya dikonfirmasi dengan survei langsung sebelum pembelian.
Dibuat dengan SoundFit Room Sound Planning Assistant.`;

  return {
    speakerCount,
    mainHallSpeakerCount,
    wing1SpeakerCount,
    wing2SpeakerCount,
    totalAreaM2,
    layoutDescription,
    speakerType,
    mountHeightM,
    mountTiltDeg,
    mountMethod,
    listenerHeightM,
    areaM2,
    areaCategory,
    aspectRatio,
    aspectCategory,
    speakerPositions,
    wingPositions,
    rowCount,
    columnCount,
    rowSpacingM,
    frontOffsetM,
    executiveSummary,
    reasons,
    warnings,
    installationNotes,
    needsDelayZone,
    delayZoneNote,
    alternatives: {
      economy: { speakerCount: getCountForMode('economy'), description: "Fokus anggaran minimal: mulai dari titik speaker paling penting, lalu evaluasi area belakang." },
      balanced: { speakerCount: getCountForMode('balanced'), description: "Pilihan standar optimal: coverage lebih rata tanpa membuat sistem terlalu kompleks." },
      premium: { speakerCount: getCountForMode('premium'), description: "Distribusi terbaik: lebih nyaman untuk ruangan panjang, ramai, atau sering dipakai." }
    },
    smartInsight,
    proposalText
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Amplifier Power Calculator
// Based on: acoustic SPL physics, EIA-426B / AES2-1984 power standards
// ─────────────────────────────────────────────────────────────────────────────

export interface AmpRequirements {
  targetSplDb: number;
  throwDistanceM: number;
  requiredPowerPerSpeakerW: number;
  recommendedAmpWPerChannel: number;
  speakersPerChannel: number;
  channelCount: number;
  totalImpedanceOhm: number;
  estimatedCableM: number;
  systemKind: '100v_line' | 'low_impedance' | 'performance_pa';
  systemLabel: string;
  recommendedAmpType: string;
  recommended100VTotalW?: number;
  wiringDesc: string;
  ampConfig: string;
  decisionReason: string;
  notes: string[];
}

/**
 * Calculate amplifier power requirements for a speaker system.
 *
 * SPL formula: SPL_at_d = sensitivity + 10*log10(P) - 20*log10(d)
 * Solving for P: P = 10^((SPL_target - sensitivity + 20*log10(d)) / 10)
 *
 * @param result          Output from generateAdvisoryResult
 * @param sensitivityDb   Speaker sensitivity in dB/W/m (e.g. 90)
 * @param impedanceOhm    Speaker nominal impedance in ohm (4 | 8 | 16)
 * @param headroomDb      Amplifier headroom in dB above average programme (6 | 10)
 * @param useCase         Room use case (affects target SPL)
 * @param data            User room data for cable and 100V-vs-low-impedance decision
 */
export function calcAmpRequirements(
  result: AdvisoryResult,
  sensitivityDb: number,
  impedanceOhm: number,
  headroomDb: number,
  useCase: UseCase,
  data: WizardData
): AmpRequirements {
  // ── Target SPL at listening position (dB SPL) ──────────────────────────────
  // Based on ITU-R BS.1116, IEC 60268-16 recommendations for venue types
  const targetSplDb =
    useCase === 'live_music' ? 90 :
    useCase === 'worship_music' ? 86 :
    useCase === 'background_music' ? 70 :
    useCase === 'paging' ? 76 :
    useCase === 'presentation' ? 79 :
    useCase === 'study' ? 72 : 76; // speech default

  // ── Throw distance: farthest listener from that speaker ───────────────────
  // rowSpacingM = distance each row covers; if 1 row, entire room length
  const throwDistanceM = Math.max(
    result.rowSpacingM > 0 && result.rowCount > 1 ? result.rowSpacingM : result.areaM2 ** 0.5,
    1.5
  );

  // ── Required acoustic power (W) per speaker ───────────────────────────────
  // Inverse-square law + sensitivity
  const requiredPowerPerSpeakerW = Math.pow(
    10,
    (targetSplDb - sensitivityDb + 20 * Math.log10(throwDistanceM)) / 10
  );

  // ── Add amplifier headroom ────────────────────────────────────────────────
  // Headroom ensures amp is not driven to clipping under peaks
  const powerWithHeadroomW = requiredPowerPerSpeakerW * Math.pow(10, headroomDb / 10);

  // ── Wiring: try 2 speakers per channel (L+R pair per row) ────────────────
  // Parallel wiring halves impedance - must stay >= 4 ohm for most amps
  const parallelImpedance2 = impedanceOhm / 2;
  const canParallel = parallelImpedance2 >= 4;

  const speakersPerChannel = canParallel ? 2 : 1;
  const totalImpedanceOhm = canParallel ? parallelImpedance2 : impedanceOhm;
  const wiringDesc = canParallel
    ? `2 speaker/channel paralel -> beban ${totalImpedanceOhm} ohm per channel`
    : `1 speaker/channel langsung -> beban ${totalImpedanceOhm} ohm per channel`;

  // ── Amplifier channel & wattage sizing ────────────────────────────────────
  const channelCount = Math.ceil(result.speakerCount / speakersPerChannel);
  // Round up to next "standard" wattage: 30, 50, 80, 100, 150, 200, 300, 500, etc.
  const rawWattsNeeded = powerWithHeadroomW * speakersPerChannel;
  const standardWatts = [30, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 700, 1000];
  const recommendedAmpWPerChannel =
    standardWatts.find(w => w >= rawWattsNeeded) ?? Math.ceil(rawWattsNeeded / 50) * 50;

  // ── Human-readable configuration ─────────────────────────────────────────
  const stereoUnits = Math.ceil(channelCount / 2);
  const ampConfig = channelCount <= 2
    ? `1 unit amplifier stereo ${recommendedAmpWPerChannel}W/ch`
    : `${stereoUnits} unit amplifier stereo ${recommendedAmpWPerChannel}W/ch (${channelCount} channel total)`;

  const estimatedCableM = Math.ceil((data.roomLengthM + data.roomWidthM * 0.5) * 1.25);
  const hasExtraZone = result.wing1SpeakerCount > 0 || result.wing2SpeakerCount > 0;
  const isPerformancePA = useCase === 'live_music' || useCase === 'worship_music';
  const isDistributedUse = useCase === 'paging' || useCase === 'background_music' || data.venueType === 'retail' || data.venueType === 'outdoor';
  const shouldUse100V = !isPerformancePA && (result.speakerCount >= 6 || estimatedCableM > 25 || hasExtraZone || isDistributedUse);
  const tapOptions = [3, 6, 10, 15, 30, 60];
  const recommendedTapW = tapOptions.find((w) => w >= Math.max(3, requiredPowerPerSpeakerW * 1.8)) ?? 60;
  const total100VLoadW = Math.ceil(result.speakerCount * recommendedTapW);
  const total100VStandards = [60, 120, 240, 360, 480, 600, 1000];
  const recommended100VTotalW = total100VStandards.find((w) => w >= total100VLoadW * 1.25) ?? Math.ceil((total100VLoadW * 1.25) / 100) * 100;
  const systemKind: AmpRequirements['systemKind'] = isPerformancePA
    ? 'performance_pa'
    : shouldUse100V
      ? '100v_line'
      : 'low_impedance';
  const systemLabel = systemKind === '100v_line'
    ? '100V line system'
    : systemKind === 'performance_pa'
      ? 'Performance PA'
      : 'Low impedance 4-8 ohm';
  const recommendedAmpType = systemKind === '100v_line'
    ? `Mixer amplifier 100V line minimal ${recommended100VTotalW}W total, idealnya dengan output zona`
    : systemKind === 'performance_pa'
      ? `${ampConfig} atau active PA set dengan mixer kecil, EQ, dan proteksi limiter`
      : ampConfig;
  const decisionReason = systemKind === '100v_line'
    ? 'Dipilih karena speaker tersebar, kabel relatif panjang, paging/BGM, atau ada zona tambahan. Untuk user awam, 100V line lebih aman karena wiring paralel lebih sederhana dan tidak mudah salah hitung impedansi.'
    : systemKind === 'performance_pa'
      ? 'Dipilih karena kebutuhan musik/ibadah musik butuh headroom dinamis dan kontrol mixer lebih baik daripada distributed 100V biasa.'
      : 'Dipilih karena jumlah speaker masih sedikit dan kabel relatif pendek, sehingga sistem 4-8 ohm masih sederhana selama impedansi amplifier sesuai.';
  const advisoryWiringDesc = systemKind === '100v_line'
    ? `Speaker diparalel pada jalur 100V. Total tap speaker approx. ${total100VLoadW}W, amplifier disarankan minimal ${recommended100VTotalW}W`
    : systemKind === 'performance_pa'
      ? `${wiringDesc}; untuk active PA, ikuti konfigurasi output mixer dan input speaker aktif`
      : wiringDesc;

  // ── Advisory notes ────────────────────────────────────────────────────────
  const notes: string[] = [];
  notes.push(decisionReason);
  notes.push(`Estimasi kabel terjauh dari amplifier ke speaker terakhir: approx. ${estimatedCableM} m. Tempatkan amplifier di area operator yang kering, berventilasi, dan mudah dijangkau.`);
  if (systemKind === '100v_line') {
    notes.push(`Gunakan tap speaker sekitar ${recommendedTapW}W per speaker sebagai titik awal, lalu total beban diberi headroom ke amplifier ${recommended100VTotalW}W.`);
    notes.push("Pilih amplifier dengan input mic, line input, tone control/EQ sederhana, proteksi panas, dan output zona jika ruangan punya serambi atau area paging.");
  }
  if (systemKind === 'low_impedance') {
    notes.push(`Pastikan amplifier mendukung beban minimum ${totalImpedanceOhm} ohm dan jangan menambah speaker paralel tanpa hitung impedansi ulang.`);
  }
  if (systemKind === 'performance_pa') {
    notes.push("Untuk musik, prioritaskan mixer, EQ, gain staging, dan headroom. Jangan samakan kebutuhan musik dengan paging 100V biasa.");
  }
  if (headroomDb === 10) {
    notes.push("Headroom 10 dB (standar profesional) artinya amplifier hanya bekerja di 10% kapasitas saat level normal - umur komponen jauh lebih panjang.");
  }
  if (headroomDb === 6) {
    notes.push("Headroom 6 dB sudah memadai untuk acara rutin. Untuk event atau ibadah dengan konten musik dinamis, pertimbangkan naik ke 10 dB.");
  }
  if (result.needsDelayZone) {
    notes.push("Zona delay memerlukan amplifier dengan DSP built-in atau prosesor delay terpisah agar suara antar zona tidak terdengar dobel.");
  }
  if (result.wing1SpeakerCount > 0 || result.wing2SpeakerCount > 0) {
    notes.push(`Speaker serambi (${result.wing1SpeakerCount + result.wing2SpeakerCount} unit) sebaiknya menggunakan amplifier terpisah agar volume tiap zona bisa diatur sendiri.`);
  }

  return {
    targetSplDb,
    throwDistanceM: Math.round(throwDistanceM * 10) / 10,
    requiredPowerPerSpeakerW: Math.round(requiredPowerPerSpeakerW * 10) / 10,
    recommendedAmpWPerChannel,
    speakersPerChannel,
    channelCount,
    totalImpedanceOhm,
    estimatedCableM,
    systemKind,
    systemLabel,
    recommendedAmpType,
    recommended100VTotalW: systemKind === '100v_line' ? recommended100VTotalW : undefined,
    wiringDesc: advisoryWiringDesc,
    ampConfig,
    decisionReason,
    notes,
  };
}
