import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Home as HomeIcon,
  Info,
  Lightbulb,
  Map,
  Mic2,
  Music2,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Store,
  Trees,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AdvisoryResult,
  ProjectCondition,
  RoomShape,
  SolutionMode,
  SpeakerPreference,
  UseCase,
  VenueType,
  WizardData,
  calcAmpRequirements,
  generateAdvisoryResult,
} from '../logic/advisorEngine';

const STORAGE_KEY = 'soundfit_guided_wizard_v2';
const STEP_COUNT = 5;

type ViewState = 'landing' | 'wizard' | 'result';
type StepKey = 'need' | 'room' | 'problem' | 'solution' | 'review';
type OptionIcon = React.ComponentType<{ className?: string }>;

type Option<T extends string> = {
  value: T;
  title: string;
  desc: string;
  icon?: OptionIcon;
  badge?: string;
};

const DEFAULT_DATA: WizardData = {
  venueType: 'mosque',
  roomLengthM: 12,
  roomWidthM: 8,
  ceilingHeightM: 3.5,
  listenerPosture: 'floor',
  useCase: 'speech',
  projectCondition: 'new_system',
  solutionMode: 'balanced',
  speakerPreference: 'auto',
  complaints: [],
  roomShape: 'rectangle',
  zone2LengthM: 5,
  zone2WidthM: 4,
};

const steps: Array<{ key: StepKey; label: string; title: string }> = [
  { key: 'need', label: 'Kebutuhan', title: 'Apa kebutuhan utama ruangan Anda?' },
  { key: 'room', label: 'Ruangan', title: 'Seperti apa ukuran dan bentuk ruangannya?' },
  { key: 'problem', label: 'Masalah', title: 'Masalah suara apa yang paling terasa?' },
  { key: 'solution', label: 'Solusi', title: 'Pendekatan solusi seperti apa yang diinginkan?' },
  { key: 'review', label: 'Hasil', title: 'Periksa ringkasan sebelum SoundFit memberi rekomendasi.' },
];

const needOptions: Array<Option<ProjectCondition>> = [
  { value: 'new_system', title: 'Pasang sound system baru', desc: 'Mulai dari nol dengan prinsip aman: vokal jelas, merata, dan tidak berlebihan.', icon: Sparkles, badge: 'from zero' },
  { value: 'upgrade', title: 'Upgrade sistem lama', desc: 'Sudah ada speaker, tetapi ingin dibuat lebih nyaman dan lebih rata.', icon: Wand2 },
  { value: 'troubleshoot', title: 'Perbaiki masalah suara', desc: 'Ada keluhan seperti feedback, belakang kurang jelas, echo, atau suara tidak rata.', icon: SlidersHorizontal },
  { value: 'vendor_review', title: 'Evaluasi proposal vendor', desc: 'Butuh second opinion awal agar proposal lebih mudah dibaca panitia.', icon: CheckCircle2 },
  { value: 'quick_proposal', title: 'Rekomendasi cepat untuk rapat', desc: 'Butuh gambaran awal yang mudah dijelaskan ke DKM atau panitia.', icon: BookOpen },
];

const venueOptions: Array<Option<VenueType>> = [
  { value: 'mosque', title: 'Masjid / Mushola', desc: 'Fokus utama: ucapan jelas, nyaman, dan tidak menyakitkan telinga.', icon: HomeIcon, badge: 'recommended' },
  { value: 'church', title: 'Gereja / Rumah Ibadah', desc: 'Khotbah, ibadah, vokal, dan musik ringan yang tetap jelas.', icon: Music2 },
  { value: 'hall', title: 'Aula / Ruang Serbaguna', desc: 'Butuh fleksibel untuk ceramah, seminar, dan kegiatan komunitas.', icon: Map },
  { value: 'classroom', title: 'Ruang Kelas / Training', desc: 'Fokus pembicara jelas sampai belakang tanpa volume berlebihan.', icon: Mic2 },
  { value: 'meeting', title: 'Meeting Room', desc: 'Rapat dan presentasi dengan suara natural dan rapi.', icon: Volume2 },
  { value: 'cafe', title: 'Cafe / Resto', desc: 'Musik latar, event kecil, dan announcement ringan yang menyebar halus.', icon: Music2 },
  { value: 'retail', title: 'Retail / Minimarket / Swalayan', desc: 'Background music, paging kasir, promo, dan announcement toko.', icon: Store },
  { value: 'outdoor', title: 'Outdoor / Semi Outdoor', desc: 'Pengumuman dan paging untuk area terbuka atau semi terbuka.', icon: Trees },
];

const complaintOptions: Array<Option<string>> = [
  { value: 'rear_unclear', title: 'Suara belakang kurang jelas', desc: 'Biasanya bukan kurang volume saja, tetapi distribusi speaker kurang merata.', icon: Volume2 },
  { value: 'front_too_loud', title: 'Area depan terlalu keras', desc: 'Sering terjadi saat semua tenaga suara dipaksa dari speaker depan.', icon: Zap },
  { value: 'feedback', title: 'Sering feedback / nging', desc: 'Biasanya terkait arah speaker, posisi mic, dan pantulan ruangan.', icon: Mic2 },
  { value: 'echo', title: 'Suara menggema', desc: 'Bisa dipengaruhi material ruangan, volume, dan arah tembak speaker.', icon: Sparkles },
  { value: 'left_right_imbalance', title: 'Suara tidak rata kiri-kanan', desc: 'Area pinggir atau tengah bisa terasa tertinggal jika coverage tidak seimbang.', icon: Map },
  { value: 'unknown', title: 'Tidak tahu, ingin solusi aman', desc: 'SoundFit akan memakai pendekatan pemula: jelas, rata, dan rendah risiko.', icon: Lightbulb, badge: 'beginner' },
];

const solutionOptions: Array<Option<SolutionMode>> = [
  { value: 'economy', title: 'Hemat', desc: 'Speaker lebih sedikit, cocok untuk ruangan kecil atau dana terbatas.', icon: Check },
  { value: 'balanced', title: 'Seimbang', desc: 'Rekomendasi paling aman untuk mayoritas masjid, mushola, dan aula kecil.', icon: Sparkles, badge: 'best pick' },
  { value: 'premium', title: 'Nyaman & merata', desc: 'Lebih fokus pada coverage dan kenyamanan area tengah-belakang.', icon: Zap },
];

const speakerOptions: Array<Option<SpeakerPreference>> = [
  { value: 'auto', title: 'Bantu rekomendasikan', desc: 'SoundFit memilih tipe speaker berdasar ruang dan kebutuhan.', icon: Wand2, badge: 'auto' },
  { value: 'wall', title: 'Wall speaker', desc: 'Umum untuk ruangan ibadah kecil-menengah.', icon: Volume2 },
  { value: 'column', title: 'Column speaker', desc: 'Sering lebih terkendali untuk vokal dan ruangan agak bergema.', icon: SlidersHorizontal },
  { value: 'ceiling', title: 'Ceiling speaker', desc: 'Rapi untuk plafon, cocok untuk coverage ringan dan merata.', icon: HomeIcon },
];

const shapeOptions: Array<Option<RoomShape>> = [
  { value: 'rectangle', title: 'Persegi panjang', desc: 'Ruangan utama tanpa sayap atau serambi tambahan.', icon: Map },
  { value: 'L', title: 'Bentuk L', desc: 'Ada satu area serambi atau sayap di salah satu sisi.', icon: Map },
  { value: 'U', title: 'Bentuk U', desc: 'Ada serambi kiri dan kanan yang ikut perlu coverage.', icon: Map },
];

function safeNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getNeedGuidance(condition: ProjectCondition): string {
  const map: Record<ProjectCondition, string> = {
    new_system: 'Baik. Untuk sistem baru, fokus kita adalah coverage merata, vokal jelas, dan risiko feedback rendah sejak awal.',
    upgrade: 'Baik. Untuk upgrade, jangan langsung tambah speaker. Kita lihat dulu apakah masalahnya arah, jumlah, atau distribusi.',
    troubleshoot: 'Baik. Untuk troubleshooting, SoundFit akan membaca keluhan sebagai petunjuk utama sebelum memberi layout.',
    vendor_review: 'Baik. SoundFit akan membantu membuat bahasa rekomendasi lebih mudah dibaca dan dicek secara teknis awal.',
    quick_proposal: 'Baik. Kita buat rekomendasi yang cukup jelas untuk bahan diskusi, tanpa terlalu teknis untuk panitia.',
  };
  return map[condition];
}

function getRoomGuidance(data: WizardData): string {
  const ratio = data.roomLengthM / Math.max(data.roomWidthM, 1);
  if (ratio > 1.8) return 'Ruangan ini memanjang. Biasanya kunci utamanya bukan speaker depan yang lebih keras, tetapi distribusi bertahap ke tengah atau belakang.';
  if (data.roomWidthM > data.roomLengthM) return 'Ruangan lebih melebar. Perhatikan coverage kiri-kanan agar area pinggir tidak tertinggal.';
  return 'Bentuk ruangan relatif proporsional. Ini biasanya lebih mudah dibuat nyaman, asal arah speaker tidak saling bertabrakan.';
}

function getProblemGuidance(complaints: string[] = []): string {
  if (complaints.includes('feedback')) return 'Feedback sering terjadi saat suara dari speaker kembali masuk ke mic. Arah speaker dan posisi mic harus dipikirkan bersama.';
  if (complaints.includes('rear_unclear')) return 'Belakang kurang jelas biasanya tidak selesai dengan menaikkan volume depan. Lebih aman menambah coverage bertahap.';
  if (complaints.includes('echo')) return 'Gema tidak selalu selesai dengan speaker tambahan. Kadang volume perlu diturunkan dan arah speaker dibuat lebih tepat.';
  if (complaints.includes('front_too_loud')) return 'Depan terlalu keras adalah tanda energi suara terlalu terkonsentrasi. Solusi terbaik sering berupa distribusi, bukan volume.';
  return 'Tidak apa-apa jika belum tahu masalah detailnya. SoundFit akan memakai pendekatan aman untuk pemula.';
}

function getSolutionGuidance(mode: SolutionMode): string {
  const map: Record<SolutionMode, string> = {
    economy: 'Mode hemat cocok sebagai tahap awal, tetapi tetap perlu arah speaker yang benar agar tidak memaksa volume terlalu tinggi.',
    balanced: 'Mode seimbang adalah titik paling aman: tidak terlalu mahal, tetapi cukup memperhatikan pemerataan suara.',
    premium: 'Mode nyaman lebih cocok jika ruangan sering dipakai dan jamaah bagian belakang perlu mendengar dengan jelas tanpa volume kasar.',
  };
  return map[mode];
}

function getSmartTips(data: WizardData, result?: AdvisoryResult): string[] {
  const tips = result?.smartInsight
    ? [
        result.smartInsight.roomShapeMessage,
        result.smartInsight.heightAdvice,
        result.smartInsight.frontSpeakerDecision,
      ]
    : [
        'Untuk masjid dan mushola, kejelasan vokal biasanya lebih penting daripada bass besar.',
        'Speaker sebaiknya lebih tinggi dari kepala jamaah, tetapi tetap diarahkan ke area dengar, bukan lurus ke plafon atau dinding belakang.',
      ];

  if (data.roomLengthM / Math.max(data.roomWidthM, 1) > 1.6) {
    tips.push('Untuk ruangan panjang, speaker depan saja sering membuat depan terlalu keras sementara belakang tetap kurang jelas.');
  }
  if ((data.complaints ?? []).includes('feedback')) {
    tips.push('Hindari speaker mengarah langsung ke area imam, khatib, atau mic utama karena itu dapat memicu feedback.');
  }
  if ((data.complaints ?? []).includes('echo')) {
    tips.push('Pada ruangan bergema, menambah volume biasanya memperparah kelelahan dengar. Perbaiki arah speaker terlebih dahulu.');
  }
  if (result && result.mountTiltDeg < 90) {
    tips.push(`Jika speaker tidak bisa ditundukkan, jangan paksa terlalu tinggi. Rekomendasi awal SoundFit sekitar ${result.mountHeightM.toFixed(1)} m dengan arah turun approx. ${result.mountTiltDeg} deg.`);
  } else {
    tips.push('Jika speaker tidak bisa menunduk, gunakan ketinggian yang masih membuat suara menuju jamaah, bukan melewati kepala jamaah.');
  }

  return Array.from(new Set(tips)).slice(0, 5);
}

function getStepGuidance(step: number, data: WizardData): string {
  if (step === 1) return getNeedGuidance(data.projectCondition);
  if (step === 2) return getRoomGuidance(data);
  if (step === 3) return getProblemGuidance(data.complaints);
  if (step === 4) return getSolutionGuidance(data.solutionMode);
  return 'Hasil SoundFit adalah rekomendasi awal. Untuk instalasi final, tetap sesuaikan dengan kondisi lapangan, bracket, posisi mic, dan akustik ruangan.';
}

export default function Home() {
  const [view, setView] = useState<ViewState>('landing');
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [result, setResult] = useState<AdvisoryResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setData({ ...DEFAULT_DATA, ...JSON.parse(saved) as Partial<WizardData> });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const startWizard = () => {
    setView('wizard');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const makeResult = () => {
    const clean: WizardData = {
      ...data,
      roomLengthM: Math.max(data.roomLengthM || 1, 1),
      roomWidthM: Math.max(data.roomWidthM || 1, 1),
      ceilingHeightM: Math.max(data.ceilingHeightM || 2.4, 2.2),
    };
    const generated = generateAdvisoryResult(clean);
    setData(clean);
    setResult(generated);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    if (step < STEP_COUNT) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    makeResult();
  };

  const prev = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(DEFAULT_DATA);
    setResult(null);
    setStep(1);
    setView('landing');
  };

  return (
    <main className="soundfit-shell min-h-[100dvh] overflow-x-hidden text-slate-950">
      <div className="sf-orb sf-orb-one" />
      <div className="sf-orb sf-orb-two" />
      <div className="relative z-10">
        {view === 'landing' && <LandingView onStart={startWizard} />}
        {view === 'wizard' && (
          <WizardView
            data={data}
            updateData={updateData}
            step={step}
            setStep={setStep}
            onNext={next}
            onPrev={prev}
            onReset={reset}
          />
        )}
        {view === 'result' && result && (
          <ResultView
            data={data}
            result={result}
            onEdit={() => {
              setView('wizard');
              setStep(5);
            }}
            onRestart={reset}
          />
        )}
      </div>
    </main>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  const miniCards = [
    { icon: Volume2, title: 'Jumlah & posisi', desc: 'Rekomendasi layout awal.' },
    { icon: Zap, title: 'Tinggi speaker', desc: 'Saran tinggi dan arah tilt.' },
    { icon: Lightbulb, title: 'Smart tips', desc: 'Ilmu praktis untuk awam.' },
  ];

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-400 text-white shadow-lg shadow-blue-500/25">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">SoundFit</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Room Sound Planning Assistant</div>
          </div>
        </div>
        <Badge className="rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10">Amal jariyah project</Badge>
      </header>

      <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="sf-reveal space-y-7">
          <Badge className="rounded-full border border-blue-200 bg-white/65 px-4 py-2 text-blue-700 shadow-sm backdrop-blur-xl hover:bg-white/70">
            <Sparkles className="mr-2 h-4 w-4" /> Smart assistant for clearer room sound
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Rancang suara ruangan yang lebih jelas dan merata.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              SoundFit memandu user awam memilih layout speaker, tinggi pemasangan, dan tips dasar agar suara masjid, mushola, aula, atau kelas lebih nyaman didengar.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="sf-primary-button" onClick={onStart} data-testid="btn-start-soundfit">
              Mulai Diagnosa Ruangan <ArrowRight className="h-5 w-5" />
            </button>
            <button className="sf-ghost-button" onClick={onStart}>
              Saya mau pasang dari nol
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {miniCards.map((item) => (
              <div key={item.title} className="sf-mini-card">
                <item.icon className="h-5 w-5 text-blue-600" />
                <div className="font-bold text-slate-900">{item.title}</div>
                <p className="text-sm leading-5 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sf-reveal sf-reveal-delay-1">
          <div className="sf-preview-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-700">Live guidance preview</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Bukan hanya hitung speaker.</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Lightbulb className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-7 space-y-3">
              {[
                'Jika speaker tidak bisa menunduk, jangan pasang terlalu tinggi.',
                'Untuk ruangan panjang, distribusi lebih penting daripada volume depan.',
                'Hindari speaker mengarah langsung ke area mic utama.',
              ].map((text, index) => (
                <div
                  key={text}
                  className="sf-reveal rounded-3xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-xl"
                  style={{ animationDelay: `${0.18 + index * 0.07}s` }}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-700">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold leading-6 text-slate-700">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-600 to-emerald-500 p-5 text-white shadow-xl shadow-blue-500/20">
              <div className="text-sm font-semibold opacity-85">Example output</div>
              <div className="mt-2 text-3xl font-black">2 depan + 2 tengah</div>
              <p className="mt-2 text-sm leading-6 text-white/85">Untuk menjaga suara tetap jelas tanpa membuat area depan terlalu keras.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WizardView({ data, updateData, step, setStep, onNext, onPrev, onReset }: {
  data: WizardData;
  updateData: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  step: number;
  setStep: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}) {
  const stepInfo = steps[step - 1];
  const guidance = getStepGuidance(step, data);
  const preview = useMemo(() => generateAdvisoryResult(data), [data]);
  const progress = Math.round((step / STEP_COUNT) * 100);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-6xl px-3 pb-36 pt-3 sm:px-6 sm:pt-6 lg:px-8">
      <header className="sf-wizard-header sticky top-2 z-40 rounded-[1.75rem] border border-white/70 bg-white/60 p-3 shadow-lg shadow-blue-950/5 backdrop-blur-2xl sm:top-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-400 text-white shadow-lg shadow-blue-500/25">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black tracking-tight">SoundFit</div>
              <div className="text-xs font-semibold text-slate-500">{progress}% guided plan</div>
            </div>
          </div>
          <nav className="sf-pill-nav" aria-label="SoundFit steps">
            {steps.map((item, index) => {
              const number = index + 1;
              const active = number === step;
              const done = number < step;
              return (
                <button key={item.key} className={`sf-step-pill ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`} onClick={() => setStep(number)}>
                  <span>{done ? <Check className="h-3.5 w-3.5" /> : number}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="grid gap-5 py-5 lg:grid-cols-[1fr_360px] lg:gap-6 lg:py-7">
        <section className="sf-glass-card min-h-[520px] p-4 sm:p-7">
            <div
              key={step}
              className="sf-step-reveal space-y-7"
            >
              <div className="space-y-2">
                <Badge className="rounded-full border-0 bg-blue-600/10 px-3 py-1 text-blue-700 hover:bg-blue-600/10">Step {step} of {STEP_COUNT}</Badge>
                <h1 className="text-[1.7rem] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl">{stepInfo.title}</h1>
                <p className="max-w-2xl text-[0.95rem] leading-7 text-slate-600 sm:text-base">{guidance}</p>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <OptionGrid options={needOptions} selected={data.projectCondition} onSelect={(value) => updateData('projectCondition', value)} />
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Jenis ruangan</Label>
                    <OptionGrid options={venueOptions} selected={data.venueType} onSelect={(value) => updateData('venueType', value)} compact />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <NumberField label="Panjang ruangan" suffix="m" value={data.roomLengthM} onChange={(value) => updateData('roomLengthM', value)} />
                    <NumberField label="Lebar ruangan" suffix="m" value={data.roomWidthM} onChange={(value) => updateData('roomWidthM', value)} />
                    <NumberField label="Tinggi plafon" suffix="m" value={data.ceilingHeightM} onChange={(value) => updateData('ceilingHeightM', value)} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Bentuk ruangan</Label>
                    <OptionGrid options={shapeOptions} selected={data.roomShape ?? 'rectangle'} onSelect={(value) => updateData('roomShape', value)} compact />
                  </div>
                  {data.roomShape !== 'rectangle' && (
                    <div className="grid gap-4 rounded-[2rem] border border-dashed border-blue-200 bg-blue-50/50 p-4 sm:grid-cols-2">
                      <NumberField label="Panjang serambi/sayap" suffix="m" value={data.zone2LengthM ?? 0} onChange={(value) => updateData('zone2LengthM', value)} />
                      <NumberField label="Lebar serambi/sayap" suffix="m" value={data.zone2WidthM ?? 0} onChange={(value) => updateData('zone2WidthM', value)} />
                    </div>
                  )}
                  <RoomPreview data={data} result={preview} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Fungsi utama</Label>
                    <OptionGrid
                      options={[
                        { value: 'speech', title: 'Ceramah / khutbah / pidato', desc: 'Fokus suara vokal jelas dan mudah dipahami.', icon: Mic2, badge: 'vocal first' },
                        { value: 'study', title: 'Kajian / pengajian / kelas', desc: 'Nyaman untuk durasi lama dan tidak melelahkan.', icon: BookOpen },
                        { value: 'worship_music', title: 'Ibadah dengan musik', desc: 'Untuk gereja atau ibadah yang butuh vokal dan musik tetap seimbang.', icon: Music2 },
                        { value: 'live_music', title: 'Live music / acara musik', desc: 'Butuh headroom lebih besar untuk vokal, instrumen, dan dinamika acara.', icon: Zap },
                        { value: 'paging', title: 'Paging / announcement', desc: 'Untuk panggilan, pengumuman toko, area outdoor, atau informasi rutin.', icon: Volume2 },
                        { value: 'presentation', title: 'Seminar / presentasi', desc: 'Pembicara jelas sampai area belakang.', icon: Volume2 },
                        { value: 'background_music', title: 'Background music', desc: 'Musik latar yang halus dan merata untuk cafe, resto, retail, atau lobby.', icon: Music2 },
                        { value: 'multipurpose', title: 'Serbaguna', desc: 'Fleksibel untuk banyak kegiatan ruangan.', icon: SlidersHorizontal },
                      ] as Array<Option<UseCase>>}
                      selected={data.useCase}
                      onSelect={(value) => updateData('useCase', value)}
                      compact
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Keluhan yang terasa</Label>
                    <div className="sf-option-grid">
                      {complaintOptions.map((option) => {
                        const selected = (data.complaints ?? []).includes(option.value);
                        return (
                          <ChoiceButton
                            key={option.value}
                            selected={selected}
                            option={option}
                            onClick={() => {
                              const current = data.complaints ?? [];
                              const next = selected ? current.filter((item) => item !== option.value) : [...current, option.value];
                              updateData('complaints', next);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-7">
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Level solusi</Label>
                    <OptionGrid options={solutionOptions} selected={data.solutionMode} onSelect={(value) => updateData('solutionMode', value)} />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-black text-slate-800">Preferensi speaker</Label>
                    <OptionGrid options={speakerOptions} selected={data.speakerPreference} onSelect={(value) => updateData('speakerPreference', value)} compact />
                  </div>
                </div>
              )}

              {step === 5 && <ReviewPanel data={data} result={preview} onJump={setStep} />}
            </div>
        </section>

        <aside className="sf-wizard-aside space-y-4">
          <SmartGuideCard data={data} result={preview} step={step} />
          <MiniResultCard result={preview} />
        </aside>
      </div>

      <StickyActionBar
        step={step}
        onPrev={onPrev}
        onNext={onNext}
        onReset={onReset}
        data={data}
      />
    </div>
  );
}

function OptionGrid<T extends string>({ options, selected, onSelect, compact = false }: {
  options: Array<Option<T>>;
  selected: T;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={`sf-option-grid ${compact ? 'is-compact' : ''}`}>
      {options.map((option) => (
        <ChoiceButton key={option.value} selected={selected === option.value} option={option} onClick={() => onSelect(option.value)} compact={compact} />
      ))}
    </div>
  );
}

function ChoiceButton<T extends string>({ selected, option, onClick, compact = false }: {
  selected: boolean;
  option: Option<T>;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = option.icon ?? Sparkles;
  return (
    <button className={`sf-choice-card ${selected ? 'is-selected' : ''} ${compact ? 'is-compact' : ''}`} onClick={onClick} type="button">
      <div className="flex items-start gap-3 text-left">
        <div className="sf-choice-icon"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black tracking-tight text-slate-900">{option.title}</h3>
            {option.badge && <span className="sf-badge-soft">{option.badge}</span>}
          </div>
          <p className="mt-1 text-[0.82rem] leading-5 text-slate-600 sm:text-sm sm:leading-6">{option.desc}</p>
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />}
      </div>
    </button>
  );
}

function NumberField({ label, suffix, value, onChange }: { label: string; suffix: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2 rounded-[1.5rem] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur-xl">
      <Label className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          className="h-12 rounded-2xl border-blue-100 bg-white/80 text-lg font-black shadow-inner focus-visible:ring-blue-400"
          type="number"
          min="1"
          step="0.5"
          value={Number.isFinite(value) ? value : ''}
          onChange={(event) => onChange(safeNumber(event.target.value, value || 1))}
        />
        <span className="font-bold text-slate-500">{suffix}</span>
      </div>
    </div>
  );
}

function RoomPreview({ data, result }: { data: WizardData; result: AdvisoryResult }) {
  const length = Math.max(data.roomLengthM, 1);
  const width = Math.max(data.roomWidthM, 1);
  const isVertical = length >= width;
  const ratio = isVertical ? length / width : width / length;
  const previewWidth = isVertical ? Math.max(150, Math.min(260, 240 / Math.min(ratio, 2.2))) : 280;
  const previewHeight = isVertical ? 300 : Math.max(150, Math.min(240, 230 / Math.min(ratio, 2.2)));

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black tracking-tight text-slate-900">Preview denah ruangan</h3>
          <p className="text-sm text-slate-600">Proporsi dibuat mengikuti panjang dan lebar input.</p>
        </div>
        <Badge className="rounded-full bg-blue-600/10 text-blue-700 hover:bg-blue-600/10">{length}m x {width}m</Badge>
      </div>
      <div className="flex justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-blue-50 p-5">
        <div className="room-canvas" style={{ width: previewWidth, height: previewHeight }}>
          <div className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-[10px] font-bold text-white">FRONT / MIMBAR</div>
          {result.speakerPositions.map((speaker) => (
            <div
              key={speaker.id}
              className={`speaker-dot ${speaker.side === 'left' ? 'speaker-left' : 'speaker-right'}`}
              style={{ top: `${speaker.yPercent}%` }}
              title={speaker.id}
            >
              <Volume2 className="h-3.5 w-3.5" />
            </div>
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{result.layoutDescription}</div>
        </div>
      </div>
    </div>
  );
}

function SmartGuideCard({ data, result, step }: { data: WizardData; result: AdvisoryResult; step: number }) {
  return (
    <Card className="sf-side-card sticky top-28">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400/15 text-amber-700">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black tracking-tight text-slate-900">SoundFit Tips</div>
            <div className="text-xs font-semibold text-slate-500">Ilmu singkat sesuai input</div>
          </div>
        </div>
        <div className="space-y-3">
          {getSmartTips(data, result).map((tip, index) => (
            <div key={`${step}-${index}`} className="rounded-2xl border border-white/70 bg-white/60 p-3 text-sm font-medium leading-6 text-slate-600 shadow-sm">
              {tip}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniResultCard({ result }: { result: AdvisoryResult }) {
  return (
    <Card className="sf-side-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black tracking-tight text-slate-900">Preview hasil</div>
            <div className="text-xs font-semibold text-slate-500">Berubah otomatis</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Speaker" value={`${result.speakerCount}`} />
          <Metric label="Luas" value={`${result.totalAreaM2.toFixed(0)}m²`} />
          <Metric label="Tinggi" value={`${result.mountHeightM.toFixed(1)}m`} />
          <Metric label="Tilt" value={result.mountTiltDeg < 90 ? `${result.mountTiltDeg} deg down` : 'Ceiling'} />
        </div>
        <p className="rounded-2xl bg-blue-600/10 p-3 text-sm font-semibold leading-6 text-blue-800">{result.executiveSummary}</p>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3">
          <div className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Room intelligence</div>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">{result.smartInsight.roomShapeLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const displayValue = value.replace(/m.+$/, 'm2');
  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-3 shadow-sm">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{displayValue}</div>
    </div>
  );
}

function ReviewPanel({ data, result, onJump }: { data: WizardData; result: AdvisoryResult; onJump: (step: number) => void }) {
  const rows = [
    { label: 'Kebutuhan', value: needOptions.find((item) => item.value === data.projectCondition)?.title ?? '-', step: 1 },
    { label: 'Ruangan', value: `${data.roomLengthM}m x ${data.roomWidthM}m - plafon ${data.ceilingHeightM}m`, step: 2 },
    { label: 'Bentuk', value: data.roomShape === 'rectangle' ? 'Persegi panjang' : `Bentuk ${data.roomShape}`, step: 2 },
    { label: 'Masalah', value: (data.complaints ?? []).length ? `${(data.complaints ?? []).length} keluhan dipilih` : 'Belum ada keluhan khusus', step: 3 },
    { label: 'Solusi', value: solutionOptions.find((item) => item.value === data.solutionMode)?.title ?? '-', step: 4 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <button key={row.label} className="sf-review-row" onClick={() => onJump(row.step)} type="button">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </button>
        ))}
      </div>
      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-black text-emerald-950">Siap dibuatkan rekomendasi</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-emerald-800">Estimasi awal: {result.speakerCount} speaker, {result.layoutDescription}, tinggi approx. {result.mountHeightM.toFixed(1)}m.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StickyActionBar({ step, onPrev, onNext, onReset, data }: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  data: WizardData;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="sf-mobile-action-shell mx-auto flex max-w-5xl items-center gap-3 rounded-[2rem] border border-white/70 bg-white/65 p-3 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl">
        <button className="sf-action-button secondary hidden sm:inline-flex" onClick={onReset} type="button">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <div className="min-w-0 flex-1 px-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-slate-500">
            <span>Step {step}/{STEP_COUNT}</span>
            <span className="hidden sm:inline">-</span>
            <span className="hidden truncate sm:inline">{data.roomLengthM}x{data.roomWidthM}m - {data.solutionMode}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all duration-300" style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
          </div>
        </div>
        <button className={`sf-action-button secondary sf-back-action ${step === 1 ? 'pointer-events-none opacity-30' : ''}`} onClick={onPrev} type="button">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Kembali</span>
        </button>
        <button className="sf-action-button primary sf-next-action" onClick={onNext} type="button">
          {step === STEP_COUNT ? 'Lihat Rekomendasi' : 'Lanjut'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ResultView({ data, result, onEdit, onRestart }: { data: WizardData; result: AdvisoryResult; onEdit: () => void; onRestart: () => void }) {
  const tips = getSmartTips(data, result);
  const [copied, setCopied] = useState(false);
  const amp = calcAmpRequirements(result, 90, 8, data.useCase === 'live_music' || data.useCase === 'worship_music' ? 10 : 6, data.useCase);

  const shareText = [
    'SoundFit Recommendation',
    result.executiveSummary,
    `Speaker: ${result.speakerCount} unit`,
    `Layout: ${result.layoutDescription}`,
    `Tinggi: approx. ${result.mountHeightM.toFixed(1)}m`,
  ].join('\n');

  const copy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-lg shadow-blue-950/5 backdrop-blur-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-400 text-white shadow-lg shadow-blue-500/25">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-blue-700">SoundFit Recommendation</div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Rekomendasi layout speaker awal</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-2xl" variant="outline" onClick={onEdit}><ArrowLeft className="mr-2 h-4 w-4" /> Edit</Button>
            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700" onClick={copy}><Share2 className="mr-2 h-4 w-4" /> {copied ? 'Tersalin' : 'Salin'}</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-emerald-500 p-7 text-white shadow-2xl shadow-blue-600/20">
            <Badge className="rounded-full border-white/20 bg-white/15 text-white hover:bg-white/15">Beginner friendly advisory</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{result.speakerCount} speaker - {result.layoutDescription}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/90">{result.executiveSummary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Metric label="Total speaker" value={`${result.speakerCount}`} />
            <Metric label="Area" value={`${result.totalAreaM2.toFixed(0)}m²`} />
            <Metric label="Tinggi" value={`${result.mountHeightM.toFixed(1)}m`} />
            <Metric label="Arah" value={result.mountTiltDeg < 90 ? `${result.mountTiltDeg} deg down` : 'ceiling'} />
          </div>

          <ResultInsightPanel result={result} />
          <RiskMeter result={result} />

          <SimulationPanel data={data} result={result} />
          <AmplifierPanel data={data} result={result} amp={amp} />

          <InfoBlock title="Kenapa layout ini dipilih?" icon={Lightbulb} items={result.reasons.length ? result.reasons : [result.executiveSummary]} />
          <InfoBlock title="Tips pemasangan speaker" icon={Zap} items={tips} />
          <InfoBlock title="Ilmu tambahan untuk panitia" icon={BookOpen} items={result.smartInsight.educationalNotes} />
          <InfoBlock title="Kesalahan umum yang perlu dihindari" icon={Info} items={[
            'Jangan menaikkan volume depan terlalu besar hanya untuk mengejar suara belakang.',
            'Jangan arahkan speaker langsung ke area mic utama.',
            'Jangan memasang speaker terlalu tinggi jika bracket tidak bisa menunduk.',
            'Jangan menambah terlalu banyak speaker tanpa pengaturan arah dan level yang jelas.',
          ]} />
        </section>

        <aside className="space-y-4">
          <Card className="sf-side-card">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-black text-slate-950">Opsi upgrade bertahap</h3>
              <UpgradeLine title="Hemat" text={result.alternatives.economy.description} count={result.alternatives.economy.speakerCount} />
              <UpgradeLine title="Seimbang" text={result.alternatives.balanced.description} count={result.alternatives.balanced.speakerCount} />
              <UpgradeLine title="Nyaman" text={result.alternatives.premium.description} count={result.alternatives.premium.speakerCount} />
            </CardContent>
          </Card>
          <Card className="sf-side-card">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-black text-slate-950">Jalur upgrade yang aman</h3>
              {result.smartInsight.upgradePath.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/70 bg-white/60 p-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="sf-side-card">
            <CardContent className="space-y-3 p-5">
              <h3 className="font-black text-slate-950">Catatan aman</h3>
              {(result.warnings.length ? result.warnings : ['Rekomendasi ini adalah tahap awal. Kondisi lapangan, posisi mic, material ruangan, dan kualitas speaker tetap perlu dicek.']).map((warning) => (
                <p key={warning} className="rounded-2xl bg-amber-400/12 p-3 text-sm font-semibold leading-6 text-amber-900">{warning}</p>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-[2rem] border border-white/70 bg-white/65 p-3 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl">
          <button className="sf-action-button secondary" onClick={onEdit} type="button"><ArrowLeft className="h-4 w-4" /> Ubah Input</button>
          <div className="hidden flex-1 text-sm font-semibold text-slate-600 sm:block">SoundFit result siap dibagikan ke panitia atau teknisi.</div>
          <button className="sf-action-button secondary" onClick={onRestart} type="button"><RotateCcw className="h-4 w-4" /> Reset</button>
          <button className="sf-action-button primary" onClick={copy} type="button"><Share2 className="h-4 w-4" /> Salin Hasil</button>
        </div>
      </div>
    </div>
  );
}


function ResultInsightPanel({ result }: { result: AdvisoryResult }) {
  const insight = result.smartInsight;
  const cards = [
    { title: insight.roomShapeLabel, text: insight.roomShapeMessage, icon: Map },
    { title: 'Strategi posisi', text: insight.placementStrategy, icon: Volume2 },
    { title: 'Speaker depan?', text: insight.frontSpeakerDecision, icon: Mic2 },
    { title: 'Tinggi pemasangan', text: insight.heightAdvice, icon: Zap },
  ];

  return (
    <Card className="sf-glass-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Smart diagnosis SoundFit</h3>
            <p className="text-sm font-semibold text-slate-500">App membaca bentuk ruangan, risiko, dan keputusan pemasangan utama.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[1.5rem] border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 font-black text-slate-950">
                <card.icon className="h-4 w-4 text-blue-600" />
                {card.title}
              </div>
              <p className="text-sm font-medium leading-6 text-slate-600">{card.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {insight.recommendedZones.map((zone) => (
            <Badge key={zone} className="rounded-full bg-blue-600/10 px-3 py-1 text-blue-700 hover:bg-blue-600/10">{zone}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskMeter({ result }: { result: AdvisoryResult }) {
  const panelClassFor = (level: string) => {
    if (level === 'High') return 'bg-rose-50 border-rose-200';
    if (level === 'Medium') return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };
  const barClassFor = (level: string) => {
    if (level === 'High') return 'from-rose-500 to-amber-400';
    if (level === 'Medium') return 'from-amber-400 to-yellow-300';
    return 'from-emerald-500 to-cyan-400';
  };

  return (
    <Card className="sf-glass-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600/10 text-blue-700">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Risk meter</h3>
            <p className="text-sm font-semibold text-slate-500">Bukan untuk menakut-nakuti, tapi membantu prioritas saat instalasi.</p>
          </div>
        </div>
        <div className="space-y-3">
          {result.smartInsight.riskProfile.map((risk) => (
            <div key={risk.key} className={`rounded-[1.35rem] border p-4 ${panelClassFor(risk.level)}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-slate-950">{risk.title}</div>
                <Badge className="rounded-full border-0 bg-white/70 text-slate-800 hover:bg-white/70">{risk.level}</Badge>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/75">
                <div className={`h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-500 ${barClassFor(risk.level)}`} style={{ width: `${risk.score}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{risk.summary}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SimulationPanel({ data, result }: { data: WizardData; result: AdvisoryResult }) {
  return (
    <Card className="sf-glass-card">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-black text-blue-700">Visual coverage estimate</div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Denah dan tinggi pemasangan</h3>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Visual ini membantu user awam memahami posisi, jarak antar baris speaker, arah sebaran, dan tinggi pemasangan. Ini bukan simulasi SPL presisi.</p>
          </div>
          <Badge className="w-fit rounded-full bg-blue-600/10 px-3 py-1 text-blue-700 hover:bg-blue-600/10">{data.roomLengthM}m x {data.roomWidthM}m x {data.ceilingHeightM}m</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <TopViewSimulation data={data} result={result} />
          <SideViewInstallation data={data} result={result} />
        </div>
      </CardContent>
    </Card>
  );
}

function TopViewSimulation({ data, result }: { data: WizardData; result: AdvisoryResult }) {
  const length = Math.max(data.roomLengthM, 1);
  const width = Math.max(data.roomWidthM, 1);
  const ratio = length / width;
  const canvasWidth = ratio >= 1 ? Math.max(220, Math.min(360, 330 / Math.min(ratio, 2.4))) : 360;
  const canvasHeight = ratio >= 1 ? 390 : Math.max(230, Math.min(330, 310 * Math.min(ratio, 1)));
  const speakerRows = Array.from(new Set(result.speakerPositions.map((speaker) => Math.round(speaker.yPercent))));
  const rowSpacing = result.rowCount > 1 ? result.rowSpacingM.toFixed(1) : length.toFixed(1);
  const rowDimStart = speakerRows[0] ?? 15;
  const rowDimEnd = speakerRows[1] ?? Math.min(rowDimStart + 22, 85);
  const sideOffset = Math.max(0.8, width * 0.08).toFixed(1);
  const toeInAdvice = width >= 10 || data.venueType === 'mosque' || data.venueType === 'church' || data.venueType === 'hall';
  const frontAssistAdvice = (data.venueType === 'mosque' || data.venueType === 'church') && width >= 12 && result.speakerCount >= 4;

  return (
    <div className="sf-sim-card">
      <div className="sf-sim-card-head">
        <div>
          <h4>Top view layout</h4>
          <p>Denah teknis ringan: dinding siku, dimensi ruang, jarak antar row, arah coverage, dan orientasi box speaker.</p>
        </div>
        <span>{result.speakerCount} speaker</span>
      </div>
      <div className="sf-topview-wrap">
        <div className="sf-plan-board">
          <div className="sf-plan-dim sf-plan-dim-length"><span>{length} m</span></div>
          <div className="sf-plan-dim sf-plan-dim-width"><span>{width} m</span></div>
          <div
            className="sf-row-dim"
            style={{
              '--row-dim-top': `${rowDimStart}%`,
              '--row-dim-height': `${Math.max(8, rowDimEnd - rowDimStart)}%`,
            } as React.CSSProperties & Record<string, string>}
          >
            <span>S1-S3 approx. {rowSpacing} m</span>
          </div>
          <div className="sf-topview-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
            <div className="sf-mihrab-box">FRONT / MIMBAR / STAGE</div>
            <div className="sf-zone sf-zone-front">front</div>
            <div className="sf-zone sf-zone-mid">middle</div>
            <div className="sf-zone sf-zone-rear">rear</div>
            <div className="sf-center-line" />
            {frontAssistAdvice && (
              <>
                <div className="sf-front-assist is-left">assist</div>
                <div className="sf-front-assist is-right">assist</div>
              </>
            )}
            {result.speakerPositions.map((speaker) => {
              const angle = toeInAdvice ? speaker.side === 'left' ? 6 : -6 : 0;
              const style = {
                top: `${speaker.yPercent}%`,
                '--speaker-angle': `${angle}deg`,
              } as React.CSSProperties & Record<string, string>;

              return (
                <div
                  key={speaker.id}
                  className={`sf-sim-speaker ${speaker.side === 'left' ? 'is-left' : 'is-right'}`}
                  style={style}
                >
                  <span className="sf-coverage-cone" />
                  <strong>{speaker.id}</strong>
                </div>
              );
            })}
          </div>
          <div className="sf-front-offset-dim"><span>front offset approx. {result.frontOffsetM.toFixed(1)} m</span></div>
        </div>
      </div>
      <div className="sf-sim-facts">
        <span>Wall corners: square technical plan</span>
        <span>Side offset approx. {sideOffset} m from wall before final aiming</span>
        <span>Speaker angle: {toeInAdvice ? 'slight toe-in toward listener area' : 'mostly straight coverage'}</span>
        <span>{speakerRows.length} speaker row</span>
        {frontAssistAdvice && <span>Wide worship room: consider slim front assist near mimbar</span>}
      </div>
    </div>
  );
}

function PersonFigure({ className, label }: { className: string; label: string }) {
  return (
    <div className={`sf-person ${className}`}>
      <span className="sf-person-head" />
      <span className="sf-person-body" />
      <span className="sf-person-label">{label}</span>
    </div>
  );
}

function SideViewInstallation({ data, result }: { data: WizardData; result: AdvisoryResult }) {
  const ceilingHeight = Math.max(data.ceilingHeightM, 2.2);
  const speakerTop = Math.max(10, Math.min(76, 100 - (result.mountHeightM / ceilingHeight) * 100));
  const earTop = Math.max(24, Math.min(88, 100 - (result.listenerHeightM / ceilingHeight) * 100));
  const throwDistance = result.rowCount > 1 ? result.rowSpacingM : data.roomLengthM * 0.65;
  const tiltAngle = result.mountTiltDeg >= 90 ? 0 : Math.max(10, Math.min(22, result.mountTiltDeg));

  return (
    <div className="sf-sim-card">
      <div className="sf-sim-card-head">
        <div>
          <h4>Side view installation</h4>
          <p>Box speaker dibuat menunduk ke area dengar, dengan figur duduk dan berdiri sebagai referensi tinggi telinga.</p>
        </div>
        <span>{result.mountHeightM.toFixed(1)} m</span>
      </div>
      <div className="sf-sideview-canvas">
        <div className="sf-ceiling-line">plafon {ceilingHeight.toFixed(1)} m</div>
        <div className="sf-floor-line">lantai</div>
        <div className="sf-ear-line" style={{ top: `${earTop}%` }}>ear reference approx. {result.listenerHeightM.toFixed(1)} m</div>
        <div className="sf-height-dim sf-height-ceiling"><span>{ceilingHeight.toFixed(1)} m</span></div>
        <div className="sf-height-dim sf-height-speaker" style={{ top: `${speakerTop}%` }}><span>{result.mountHeightM.toFixed(1)} m</span></div>
        <div
          className="sf-speaker-box-side"
          style={{
            top: `${speakerTop}%`,
            '--tilt-angle': `${tiltAngle}deg`,
          } as React.CSSProperties & Record<string, string>}
        >
          <span className="sf-speaker-face" />
          <span className="sf-speaker-label">speaker box</span>
        </div>
        <div
          className="sf-throw-beam"
          style={{
            top: `${speakerTop + 12}%`,
            '--beam-tilt': `${Math.max(4, Math.min(12, tiltAngle * 0.45))}deg`,
          } as React.CSSProperties & Record<string, string>}
        />
        <PersonFigure className="is-seated" label="duduk" />
        <PersonFigure className="is-standing" label="berdiri" />
      </div>
      <div className="sf-sim-facts">
        <span>Tilt approx. {result.mountTiltDeg < 90 ? `${result.mountTiltDeg} deg down` : 'ceiling down'}</span>
        <span>Throw approx. {Math.max(throwDistance, 1.5).toFixed(1)} m</span>
        <span>Speaker height considers seated, standing, and floor listener zones</span>
      </div>
    </div>
  );
}

function AmplifierPanel({ data, result, amp }: { data: WizardData; result: AdvisoryResult; amp: ReturnType<typeof calcAmpRequirements> }) {
  const estimatedCableM = Math.ceil((data.roomLengthM + data.roomWidthM * 0.5) * 1.25);
  const shouldUse100V = result.speakerCount >= 6 || estimatedCableM > 25 || data.venueType === 'outdoor' || result.wing1SpeakerCount + result.wing2SpeakerCount > 0;
  const systemLabel = shouldUse100V ? '100V line system' : 'Low impedance 4-8 ohm';
  const ampType = shouldUse100V
    ? `Mixer amplifier 100V line minimal ${Math.max(120, Math.ceil((result.speakerCount * amp.requiredPowerPerSpeakerW * 1.5) / 10) * 10)}W total`
    : amp.ampConfig;

  const notes = [
    shouldUse100V
      ? 'Untuk user awam, 100V line lebih aman jika speaker banyak, kabel jauh, atau area dibagi beberapa zona karena wiring lebih sederhana dan impedansi tidak mudah salah.'
      : 'Untuk ruangan kecil dengan sedikit speaker dan kabel pendek, sistem 4-8 ohm masih masuk akal selama impedansi total amplifier sesuai.',
    `Estimasi kabel terjauh dari amplifier ke speaker terakhir: approx. ${estimatedCableM} m. Tempatkan amplifier di area operator yang kering, berventilasi, dan mudah dijangkau.`,
    'Pilih amplifier dengan input mic, line input, tone control/EQ sederhana, proteksi panas, dan output zona jika ruangan punya area serambi atau paging.',
    ...amp.notes,
  ];

  return (
    <Card className="sf-glass-card">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">Amplifier and wiring advisory</div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Saran amplifier untuk user awam</h3>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Estimasi awal watt, channel, sistem kabel, dan kapan sebaiknya memakai 100V line.</p>
          </div>
          <Badge className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10">{systemLabel}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Target SPL" value={`${amp.targetSplDb} dB`} />
          <Metric label="Amp" value={`${amp.recommendedAmpWPerChannel}W/ch`} />
          <Metric label="Channel" value={`${amp.channelCount}`} />
          <Metric label="Kabel" value={`${estimatedCableM}m`} />
        </div>
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Rekomendasi tipe</div>
          <p className="mt-2 text-lg font-black leading-7 text-emerald-950">{ampType}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">{amp.wiringDesc}. Beban minimum: {amp.totalImpedanceOhm} ohm.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {notes.slice(0, 6).map((note) => (
            <div key={note} className="flex gap-3 rounded-2xl border border-white/70 bg-white/60 p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ title, icon: Icon, items }: { title: string; icon: OptionIcon; items: string[] }) {
  return (
    <Card className="sf-glass-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600/10 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-white/55 p-4 text-sm font-medium leading-6 text-slate-700">
              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpgradeLine({ title, text, count }: { title: string; text: string; count: number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="font-black text-slate-950">{title}</div>
        <Badge className="rounded-full bg-blue-600/10 text-blue-700 hover:bg-blue-600/10">{count} speaker</Badge>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </div>
  );
}
