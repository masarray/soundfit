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

function SoundFitLogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/soundfit-mark.svg`}
      alt="SoundFit"
      className={`${className} rounded-2xl shadow-lg shadow-slate-950/10`}
      draggable={false}
    />
  );
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
          <SoundFitLogoMark />
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
            <SoundFitLogoMark />
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
  const amp = calcAmpRequirements(result, 90, 8, data.useCase === 'live_music' || data.useCase === 'worship_music' ? 10 : 6, data.useCase, data);

  const shareText = [
    result.proposalText,
    '',
    'Saran Amplifier dan Kabel:',
    `- Sistem kabel      : ${amp.systemLabel}`,
    `- Rekomendasi amp   : ${amp.recommendedAmpType}`,
    `- Estimasi kabel    : approx. ${amp.estimatedCableM} m dari amplifier ke speaker terjauh`,
    `- Target SPL awal   : ${amp.targetSplDb} dB`,
    `- Catatan wiring    : ${amp.wiringDesc}`,
    '',
    'Catatan SoundFit:',
    ...amp.notes.slice(0, 5).map((note) => `- ${note}`),
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
            <SoundFitLogoMark className="h-11 w-11" />
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
          <AmplifierPanel amp={amp} />

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
  const roomL = Math.max(data.roomLengthM, 1);
  const roomW = Math.max(data.roomWidthM, 1);

  const BASE_W = 316;
  const svgW = BASE_W;
  const svgH = Math.max(220, Math.min(460, Math.round(BASE_W * (roomL / roomW) * 0.94)));

  const pL = 44, pR = 22, pT = 42, pB = 38;
  const drawW = svgW - pL - pR;
  const drawH = svgH - pT - pB;
  const sx = drawW / roomW;
  const sy = drawH / roomL;
  const rx = pL, ry = pT;

  const frontH = Math.max(26, Math.min(54, result.frontOffsetM * sy));

  // Coverage zone depth = what each speaker row covers (engineering throw distance)
  const zoneM = result.rowCount > 1 ? result.rowSpacingM : roomL * 0.72;
  const cR1 = Math.min(zoneM * sy * 0.55, drawH * 0.36);  // inner core (-3 dB)
  const cR2 = Math.min(zoneM * sy, drawH * 0.52);          // outer -6 dB boundary
  const cR3 = Math.min(zoneM * sy * 1.4, drawH * 0.68);   // falloff zone

  // 100° horizontal coverage ±50° (standard wall/column speaker spec)
  const half = 50;
  const gL = 'covGL', gR = 'covGR', clip = 'roomClipT';

  const sideOffsetM = Math.max(0.6, roomW * 0.07);

  return (
    <div className="sf-sim-card">
      <div className="sf-sim-card-head">
        <div>
          <h4>Top view layout</h4>
          <p>Coverage arc tiap speaker berdasarkan geometri akustik: radius sebaran, overlap antar zona, jarak baris.</p>
        </div>
        <span>{result.speakerCount} speaker</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0.5rem 0.5rem' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxWidth: svgW, display: 'block' }}>
          <defs>
            <radialGradient id={gL} cx="0%" cy="50%" r="100%" fx="0%" fy="50%">
              <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.48" />
              <stop offset="40%"  stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="72%"  stopColor="#0ea5e9" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={gR} cx="100%" cy="50%" r="100%" fx="100%" fy="50%">
              <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.48" />
              <stop offset="40%"  stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="72%"  stopColor="#0ea5e9" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <clipPath id={clip}>
              <rect x={rx} y={ry} width={drawW} height={drawH} />
            </clipPath>
          </defs>

          {/* Room floor */}
          <rect x={rx} y={ry} width={drawW} height={drawH} fill="#f8fafc" />

          {/* 1 m × 1 m grid */}
          {Array.from({ length: Math.ceil(roomW) + 1 }, (_, i) => (
            <line key={`gx${i}`} x1={rx + i * sx} y1={ry} x2={rx + i * sx} y2={ry + drawH} stroke="#e2e8f0" strokeWidth="0.7" />
          ))}
          {Array.from({ length: Math.ceil(roomL) + 1 }, (_, i) => (
            <line key={`gy${i}`} x1={rx} y1={ry + i * sy} x2={rx + drawW} y2={ry + i * sy} stroke="#e2e8f0" strokeWidth="0.7" />
          ))}

          {/* Front / mimbar zone */}
          <rect x={rx} y={ry} width={drawW} height={frontH} fill="#dbeafe" opacity="0.8" />
          <text x={rx + drawW / 2} y={ry + frontH / 2 + 4} textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="800">FRONT / MIMBAR / STAGE</text>

          {/* Coverage sectors — drawn before speaker boxes */}
          {result.speakerPositions.map((spk) => {
            const cx = rx + (spk.xPercent / 100) * drawW;
            const cy = ry + (spk.yPercent / 100) * drawH;
            const isL = spk.side === 'left';
            const base = isL ? 0 : 180;
            return (
              <g key={`cov${spk.id}`} clipPath={`url(#${clip})`}>
                <path d={arcSector(cx, cy, cR3, base - half, base + half)} fill="#38bdf8" opacity="0.06" />
                <path d={arcSector(cx, cy, cR2, base - half, base + half)} fill={`url(#${isL ? gL : gR})`} />
                <path d={arcSector(cx, cy, cR1, base - half, base + half)} fill="#0ea5e9" opacity="0.13" />
              </g>
            );
          })}

          {/* Room border (above coverage, below speaker boxes) */}
          <rect x={rx} y={ry} width={drawW} height={drawH} fill="none" stroke="#1e293b" strokeWidth="2" />

          {/* Centre line */}
          <line x1={rx + drawW / 2} y1={ry} x2={rx + drawW / 2} y2={ry + drawH} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3" />

          {/* Zone labels */}
          {(['FRONT', 'MIDDLE', 'REAR'] as const).map((z, i) => (
            <text key={z} x={rx + drawW / 2} y={ry + drawH * [0.30, 0.57, 0.82][i]}
              textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700" letterSpacing="0.1em">{z}</text>
          ))}

          {/* Speaker boxes */}
          {result.speakerPositions.map((spk) => {
            const cx = rx + (spk.xPercent / 100) * drawW;
            const cy = ry + (spk.yPercent / 100) * drawH;
            const isL = spk.side === 'left';
            const bW = 18, bH = 9;
            const bx = isL ? cx - 2 : cx - bW + 2;
            return (
              <g key={`sp${spk.id}`}>
                <rect x={bx} y={cy - bH / 2} width={bW} height={bH} rx="2.5" fill="#1e40af" />
                <rect x={isL ? bx + bW - 4 : bx} y={cy - bH / 2 + 1} width={4} height={bH - 2} rx="1" fill="#60a5fa" />
                <text x={cx + (isL ? 3 : -3)} y={cy - bH / 2 - 3}
                  textAnchor={isL ? 'start' : 'end'} fill="#1e40af" fontSize="8" fontWeight="800">{spk.id}</text>
              </g>
            );
          })}

          {/* ── Dimension: room width (bottom) */}
          <line x1={rx} y1={ry + drawH + 20} x2={rx + drawW} y2={ry + drawH + 20} stroke="#64748b" strokeWidth="1.5" />
          <line x1={rx} y1={ry + drawH + 14} x2={rx} y2={ry + drawH + 26} stroke="#64748b" strokeWidth="1.5" />
          <line x1={rx + drawW} y1={ry + drawH + 14} x2={rx + drawW} y2={ry + drawH + 26} stroke="#64748b" strokeWidth="1.5" />
          <text x={rx + drawW / 2} y={ry + drawH + 34} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="700">{roomW} m</text>

          {/* ── Dimension: room length (right side) */}
          <line x1={rx + drawW + 14} y1={ry} x2={rx + drawW + 14} y2={ry + drawH} stroke="#64748b" strokeWidth="1.5" />
          <line x1={rx + drawW + 9} y1={ry} x2={rx + drawW + 19} y2={ry} stroke="#64748b" strokeWidth="1.5" />
          <line x1={rx + drawW + 9} y1={ry + drawH} x2={rx + drawW + 19} y2={ry + drawH} stroke="#64748b" strokeWidth="1.5" />
          <text x={rx + drawW + 26} y={ry + drawH / 2} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="700"
            transform={`rotate(90,${rx + drawW + 26},${ry + drawH / 2})`}>{roomL} m</text>

          {/* ── Front offset dimension */}
          {result.speakerPositions.length > 0 && (() => {
            const firstY = ry + Math.min(...result.speakerPositions.map(s => s.yPercent)) / 100 * drawH;
            const lx = rx + drawW * 0.25;
            return (
              <g>
                <line x1={lx} y1={ry + frontH} x2={lx} y2={firstY} stroke="#1e40af" strokeWidth="1" strokeDasharray="3 2" />
                <line x1={lx - 4} y1={ry + frontH} x2={lx + 4} y2={ry + frontH} stroke="#1e40af" strokeWidth="1.5" />
                <line x1={lx - 4} y1={firstY} x2={lx + 4} y2={firstY} stroke="#1e40af" strokeWidth="1.5" />
                <text x={lx + 5} y={(ry + frontH + firstY) / 2 + 3} fill="#1e40af" fontSize="8" fontWeight="700">≈{result.frontOffsetM.toFixed(1)}m</text>
              </g>
            );
          })()}

          {/* ── Row spacing dimension */}
          {result.rowCount > 1 && (() => {
            const rows = [...new Set(result.speakerPositions.map(s => Math.round(s.yPercent)))].sort((a, b) => a - b);
            if (rows.length < 2) return null;
            const y1 = ry + rows[0] / 100 * drawH, y2 = ry + rows[1] / 100 * drawH;
            const lx = rx - 28;
            return (
              <g>
                <line x1={lx} y1={y1} x2={lx} y2={y2} stroke="#7c3aed" strokeWidth="1.5" />
                <line x1={lx - 4} y1={y1} x2={lx + 4} y2={y1} stroke="#7c3aed" strokeWidth="1.5" />
                <line x1={lx - 4} y1={y2} x2={lx + 4} y2={y2} stroke="#7c3aed" strokeWidth="1.5" />
                <text x={lx - 4} y={(y1 + y2) / 2 + 4} textAnchor="end" fill="#7c3aed" fontSize="8" fontWeight="700">≈{result.rowSpacingM.toFixed(1)}m</text>
              </g>
            );
          })()}

          {/* Coverage radius label pill */}
          <rect x={rx + 5} y={ry + drawH - 19} width={drawW - 10} height={15} rx="7.5" fill="rgba(14,165,233,0.09)" />
          <text x={rx + drawW / 2} y={ry + drawH - 9} textAnchor="middle" fill="#0369a1" fontSize="8.5" fontWeight="700">
            ⊙ radius coverage ≈{zoneM.toFixed(1)} m / speaker
          </text>
        </svg>
      </div>

      <div className="sf-sim-facts">
        <span>±{half}° horizontal per speaker (100° total)</span>
        <span>Overlap coverage di tengah: SPL naik +3 dB</span>
        {result.rowCount > 1 && <span>Jarak baris ≈ {result.rowSpacingM.toFixed(1)} m</span>}
        <span>Side offset dinding ≈ {sideOffsetM.toFixed(1)} m</span>
      </div>
    </div>
  );
}

// ─── Arc sector path helper ───────────────────────────────────────────────────
function arcSector(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toR = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toR(startDeg)), y1 = cy + r * Math.sin(toR(startDeg));
  const x2 = cx + r * Math.cos(toR(endDeg)),   y2 = cy + r * Math.sin(toR(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r},0,0,1,${x2},${y2} Z`;
}

// ─── SVG Human silhouettes (engineering-proportioned) ────────────────────────
function StandingFigureSVG({ cx, floorY, sc }: { cx: number; floorY: number; sc: number }) {
  const H = 1.7 * sc;
  const hr = Math.max(4.5, H * 0.075);
  const bw = Math.max(8, H * 0.132);
  const lw = bw * 0.44;
  const c = '#334155';
  return (
    <g fill={c}>
      <circle cx={cx} cy={floorY - H + hr} r={hr} />
      <rect x={cx - bw * 0.62} y={floorY - H * 0.80} width={bw * 1.24} height={Math.max(2.5, H * 0.033)} rx="1.2" />
      <rect x={cx - bw * 0.50} y={floorY - H * 0.77} width={bw} height={H * 0.28} rx="2" />
      <rect x={cx - bw * 0.48} y={floorY - H * 0.47} width={lw} height={H * 0.47} rx="1.5" />
      <rect x={cx + bw * 0.48 - lw} y={floorY - H * 0.47} width={lw} height={H * 0.47} rx="1.5" />
    </g>
  );
}

function SeatedFigureSVG({ cx, floorY, sc }: { cx: number; floorY: number; sc: number }) {
  const sH = 0.44 * sc;
  const tH = 0.42 * sc;
  const hr = Math.max(4.5, tH * 0.265);
  const bw = Math.max(7, tH * 0.38);
  const thL = bw * 1.55;
  const lw = bw * 0.40;
  const c = '#334155';
  return (
    <g fill={c}>
      <circle cx={cx} cy={floorY - sH - tH - hr * 0.7} r={hr} />
      <rect x={cx - bw * 0.5} y={floorY - sH - tH + hr * 0.2} width={bw} height={tH * 0.82} rx="2" />
      <rect x={cx - bw * 0.5} y={floorY - sH - lw + 1} width={thL} height={lw} rx="2" />
      <rect x={cx - bw * 0.5 + thL - lw} y={floorY - sH + 1} width={lw} height={sH * 0.88} rx="1.5" />
    </g>
  );
}

function SideViewInstallation({ data, result }: { data: WizardData; result: AdvisoryResult }) {
  const W = 338, H = 236;
  const pL = 52, pR = 14, pT = 22, pB = 26;
  const drawW = W - pL - pR;
  const drawH = H - pT - pB;

  const cH = Math.max(data.ceilingHeightM, 2.2);
  const throwM = Math.max(result.rowCount > 1 ? result.rowSpacingM : data.roomLengthM * 0.65, 3.0);

  const scY = drawH / cH;

  const floorY = pT + drawH;
  const ceilY = pT;
  const spkX = pL;
  const spkY = floorY - result.mountHeightM * scY;
  const earY = floorY - result.listenerHeightM * scY;

  // Speaker tilt: degrees below horizontal (0=horizontal, 90=straight down)
  const tiltDeg = result.mountTiltDeg < 90 ? Math.max(5, result.mountTiltDeg) : 45;
  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Coverage ±45° = 90° total (standard wall/column speaker dispersion)
  const halfCone = (45 * Math.PI) / 180;
  const upperRad = tiltRad - halfCone;
  const lowerRad = tiltRad + halfCone;

  // Clip ray from speaker face to first room boundary hit
  const clipRay = (rad: number): [number, number] => {
    const dx = Math.cos(rad), dy = Math.sin(rad);
    let t = 9999;
    if (dy > 0.001)  t = Math.min(t, (floorY - spkY) / dy);
    if (dy < -0.001) t = Math.min(t, (ceilY  - spkY) / dy);
    if (dx > 0.001)  t = Math.min(t, (pL + drawW - spkX) / dx);
    return [spkX + dx * Math.max(0, t), spkY + dy * Math.max(0, t)];
  };

  const [upX, upY] = clipRay(upperRad);
  const [loX, loY] = clipRay(lowerRad);

  const boxW = 9, boxH = 16;
  const seatX = pL + drawW * 0.40;
  const standX = pL + drawW * 0.70;
  const gId = 'sideBeam', clipId = 'sideClip';

  return (
    <div className="sf-sim-card">
      <div className="sf-sim-card-head">
        <div>
          <h4>Side view installation</h4>
          <p>Cone suara berangkat tepat dari muka speaker, ±45° dari sumbu tilt. Referensi telinga duduk dan berdiri.</p>
        </div>
        <span>{result.mountHeightM.toFixed(1)} m</span>
      </div>

      <div style={{ padding: '0.5rem 0.75rem 0.25rem' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block' }}>
          <defs>
            <linearGradient id={gId} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.65" />
              <stop offset="38%"  stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="72%"  stopColor="#10b981" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={pL} y={ceilY} width={drawW} height={drawH + 1} />
            </clipPath>
          </defs>

          {/* Room background */}
          <rect x={pL} y={ceilY} width={drawW} height={drawH} fill="#f0fdf4" />

          {/* Horizontal meter grid */}
          {Array.from({ length: Math.ceil(cH) }, (_, i) => i + 1).map(i => (
            <line key={`hg${i}`} x1={pL} y1={floorY - i * scY} x2={pL + drawW} y2={floorY - i * scY}
              stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="4 4" />
          ))}

          {/* ── Sound cone — apex exactly at speaker face ─────────────────── */}
          <polygon
            points={`${spkX},${spkY} ${upX},${upY} ${loX},${loY}`}
            fill={`url(#${gId})`}
            clipPath={`url(#${clipId})`}
          />

          {/* ── Left wall ────────────────────────────────────────────────────── */}
          <rect x={pL - 8} y={ceilY} width={8} height={drawH} fill="#e2e8f0" />
          <line x1={pL} y1={ceilY} x2={pL} y2={floorY} stroke="#94a3b8" strokeWidth="1.5" />

          {/* ── Ceiling ──────────────────────────────────────────────────────── */}
          <line x1={pL - 8} y1={ceilY} x2={pL + drawW} y2={ceilY} stroke="#94a3b8" strokeWidth="2.5" />
          <text x={pL + drawW - 3} y={ceilY + 12} textAnchor="end" fill="#94a3b8" fontSize="9" fontWeight="700">plafon {cH.toFixed(1)} m</text>

          {/* ── Floor ────────────────────────────────────────────────────────── */}
          <line x1={pL - 8} y1={floorY} x2={pL + drawW} y2={floorY} stroke="#475569" strokeWidth="2.5" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`fh${i}`} x1={pL + i * 36} y1={floorY} x2={pL + i * 36 - 10} y2={floorY + 8}
              stroke="#94a3b8" strokeWidth="1" />
          ))}
          <text x={pL + 4} y={floorY + 16} fill="#475569" fontSize="9" fontWeight="700">lantai</text>

          {/* ── Ear reference line ───────────────────────────────────────────── */}
          <line x1={pL} y1={earY} x2={pL + drawW} y2={earY} stroke="#16a34a" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x={pL + 5} y={earY - 4} fill="#15803d" fontSize="9" fontWeight="800">ear ≈ {result.listenerHeightM.toFixed(1)} m</text>

          {/* ── Height dimension: mount height ───────────────────────────────── */}
          <line x1={pL - 20} y1={spkY} x2={pL - 20} y2={floorY} stroke="#2563eb" strokeWidth="1.5" />
          <line x1={pL - 25} y1={spkY}  x2={pL - 15} y2={spkY}  stroke="#2563eb" strokeWidth="1.5" />
          <line x1={pL - 25} y1={floorY} x2={pL - 15} y2={floorY} stroke="#2563eb" strokeWidth="1.5" />
          <text x={pL - 31} y={(spkY + floorY) / 2} textAnchor="middle" fill="#1d4ed8" fontSize="9" fontWeight="800"
            transform={`rotate(-90,${pL - 31},${(spkY + floorY) / 2})`}>{result.mountHeightM.toFixed(1)} m</text>

          {/* ── Speaker height label (right side) ───────────────────────────── */}
          <text x={pL + drawW - 3} y={spkY - 4} textAnchor="end" fill="#1d4ed8" fontSize="9" fontWeight="700">{result.mountHeightM.toFixed(1)} m</text>

          {/* ── Speaker box (tilted rectangle, apex = speaker face) ──────────── */}
          <g transform={`translate(${spkX},${spkY}) rotate(${tiltDeg})`}>
            <rect x={-boxW / 2} y={-boxH / 2} width={boxW} height={boxH} rx="1.5" fill="#1e40af" />
            <rect x={boxW / 2 - 3.5} y={-boxH / 2 + 1} width={3.5} height={boxH - 2} rx="1" fill="#3b82f6" />
            <circle cx={boxW / 2 - 1.8} cy={0} r={2.2} fill="#93c5fd" />
          </g>
          <text x={spkX + 14} y={spkY - 10} fill="#1e40af" fontSize="8.5" fontWeight="800">speaker box</text>
          <text x={spkX + 14} y={spkY + 5}  fill="#1e40af" fontSize="8"   fontWeight="600">↓{tiltDeg}°</text>

          {/* ── Tilt arc indicator ───────────────────────────────────────────── */}
          {tiltDeg > 5 && (() => {
            const r = 26;
            return (
              <path
                d={`M ${spkX + r} ${spkY} A ${r} ${r} 0 0 1 ${spkX + r * Math.cos(tiltRad)} ${spkY + r * Math.sin(tiltRad)}`}
                fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.85"
              />
            );
          })()}

          {/* ── Human figures ────────────────────────────────────────────────── */}
          <StandingFigureSVG cx={standX} floorY={floorY} sc={scY} />
          <text x={standX} y={floorY + 14} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="700">berdiri</text>

          <SeatedFigureSVG cx={seatX} floorY={floorY} sc={scY} />
          <text x={seatX} y={floorY + 14} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="700">duduk</text>
        </svg>
      </div>

      <div className="sf-sim-facts">
        <span>Tilt ≈ {result.mountTiltDeg < 90 ? `${result.mountTiltDeg}° ke bawah` : 'ceiling down'}</span>
        <span>Throw zone ≈ {throwM.toFixed(1)} m</span>
        <span>Cone ±45° dari sumbu tilt (90° total coverage)</span>
      </div>
    </div>
  );
}

function AmplifierPanel({ amp }: { amp: ReturnType<typeof calcAmpRequirements> }) {
  const show100VLoad = amp.systemKind === '100v_line' && amp.recommended100VTotalW;

  return (
    <Card className="sf-glass-card">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">Amplifier and wiring advisory</div>
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Saran amplifier untuk user awam</h3>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Estimasi awal watt, channel, sistem kabel, dan kapan sebaiknya memakai 100V line.</p>
          </div>
          <Badge className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10">{amp.systemLabel}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Target SPL" value={`${amp.targetSplDb} dB`} />
          <Metric label="Amp" value={show100VLoad ? `${amp.recommended100VTotalW}W total` : `${amp.recommendedAmpWPerChannel}W/ch`} />
          <Metric label="Channel" value={`${amp.channelCount}`} />
          <Metric label="Kabel" value={`${amp.estimatedCableM}m`} />
        </div>
        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Rekomendasi tipe</div>
          <p className="mt-2 text-lg font-black leading-7 text-emerald-950">{amp.recommendedAmpType}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
            {amp.wiringDesc}{amp.systemKind === 'low_impedance' ? `. Beban minimum: ${amp.totalImpedanceOhm} ohm.` : '.'}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {amp.notes.slice(0, 6).map((note) => (
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
