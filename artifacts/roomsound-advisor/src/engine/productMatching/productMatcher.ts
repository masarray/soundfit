import type { WizardData, AdvisoryResult, UseCase, VenueType, SolutionMode } from '../../logic/advisorEngine';
import { amplifierProducts } from '../../data/products/amplifierProducts';
import { productPriceEstimates } from '../../data/products/productPricing';
import { speakerProducts } from '../../data/products/speakerProducts';
import {
  AmplifierProduct,
  MarketTier,
  PriceTier,
  ProductPriceEstimate,
  ProductRecommendation,
  ProductScore,
  SpeakerCategory,
  SpeakerProduct,
  SystemCostEstimate,
  UseCaseFit,
  VenueFit,
} from '../../data/products/productTypes';

function mapVenue(venue: VenueType): VenueFit {
  const map: Record<VenueType, VenueFit> = {
    mosque: 'mosque',
    church: 'church',
    hall: 'hall',
    classroom: 'classroom',
    meeting: 'meeting_room',
    cafe: 'cafe',
    retail: 'retail',
    outdoor: 'outdoor',
  };
  return map[venue];
}

function mapUseCase(useCase: UseCase): UseCaseFit {
  const map: Record<UseCase, UseCaseFit> = {
    speech: 'speech',
    study: 'study',
    worship_music: 'worship_music',
    live_music: 'live_music',
    paging: 'paging',
    presentation: 'presentation',
    background_music: 'bgm',
    multipurpose: 'presentation',
  };
  return map[useCase];
}

function targetTier(mode: SolutionMode): MarketTier {
  if (mode === 'economy') return 'budget';
  if (mode === 'premium') return 'mid';
  return 'budget_plus';
}

function tierDistance(a: MarketTier, b: MarketTier): number {
  const rank: Record<MarketTier, number> = { budget: 0, budget_plus: 1, mid: 2, premium: 3, pro: 4 };
  return Math.abs(rank[a] - rank[b]);
}

function sourceScore(source: SpeakerProduct['sourceQuality'] | AmplifierProduct['sourceQuality']): number {
  if (source === 'official_datasheet') return 12;
  if (source === 'official_product_page') return 10;
  if (source === 'official_brochure') return 8;
  if (source === 'manual_estimate') return 2;
  return -8;
}

function categoryPreference(data: WizardData): SpeakerCategory[] {
  if (data.speakerPreference === 'ceiling') return ['ceiling'];
  if (data.speakerPreference === 'column') return ['column_speaker', 'slim_line_array'];
  if (data.speakerPreference === 'wall') return ['universal_box_speaker', 'wide_dispersion_box_speaker', 'wall_mount'];
  if (data.speakerPreference === 'horn') return ['horn'];
  if (data.speakerPreference === 'pa') return ['wide_dispersion_box_speaker', 'slim_line_array'];

  if (data.venueType === 'mosque') return ['column_speaker', 'universal_box_speaker', 'wide_dispersion_box_speaker', 'slim_line_array'];
  if (data.venueType === 'retail' || data.venueType === 'cafe' || data.venueType === 'meeting') return ['ceiling', 'universal_box_speaker'];
  if (data.venueType === 'outdoor') return ['horn', 'column_speaker', 'universal_box_speaker'];
  return ['column_speaker', 'universal_box_speaker', 'ceiling', 'wide_dispersion_box_speaker'];
}

function pickTap(product: SpeakerProduct, data: WizardData, result: AdvisoryResult): number {
  const taps = [...(product.taps100V ?? (product.ratedPowerW ? [product.ratedPowerW] : [10]))].sort((a, b) => a - b);
  const areaPerSpeaker = result.totalAreaM2 / Math.max(result.speakerCount, 1);
  let target = 10;
  if (data.solutionMode === 'economy') target = areaPerSpeaker > 45 ? 15 : 10;
  if (data.solutionMode === 'balanced') target = areaPerSpeaker > 40 ? 20 : 15;
  if (data.solutionMode === 'premium') target = areaPerSpeaker > 35 ? 30 : 20;
  if (data.useCase === 'background_music') target = Math.min(target, 10);
  if (product.category === 'ceiling') target = Math.min(target, product.ratedPowerW ?? target);
  if (product.category === 'column_speaker') target = product.ratedPowerW ?? target;
  return taps.find((tap) => tap >= target) ?? taps[taps.length - 1] ?? target;
}

function scoreSpeaker(product: SpeakerProduct, data: WizardData, result: AdvisoryResult): ProductScore {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const venue = mapVenue(data.venueType);
  const useCase = mapUseCase(data.useCase);
  const preferredCategories = categoryPreference(data);

  if (product.recommendedVenues.includes(venue)) {
    score += 26;
    reasons.push(`Cocok untuk ${venue}.`);
  }
  if (data.venueType === 'mosque' && product.recommendedVenues.includes('mushola')) score += 8;
  if (product.recommendedUseCases.includes(useCase)) {
    score += 24;
    reasons.push(`Fit untuk ${useCase}.`);
  }
  if (preferredCategories.includes(product.category)) {
    score += 18;
    reasons.push(`Kategori ${product.category.replaceAll('_', ' ')} sesuai preferensi ruang.`);
  }
  if (product.supportedModes.includes('100v_line')) score += 12;
  score += Math.max(0, 15 - tierDistance(product.marketTier, targetTier(data.solutionMode)) * 6);
  score += sourceScore(product.sourceQuality);

  if (result.totalAreaM2 <= 80 && product.id === 'toa-zs-107-as') score += 18;
  if (result.totalAreaM2 > 80 && result.totalAreaM2 <= 180 && product.id === 'toa-zs-207-as') score += 18;
  if (result.totalAreaM2 > 160 && product.id === 'toa-zs-1030') score += 14;
  if ((data.complaints ?? []).includes('echo') && product.category === 'slim_line_array') score += 20;
  if ((data.complaints ?? []).includes('echo') && product.category === 'ceiling') score -= 12;
  if (data.useCase === 'live_music' && !product.recommendedUseCases.includes('live_music')) {
    score -= 20;
    warnings.push('Produk PA address ini bukan solusi utama untuk live music.');
  }
  if (product.availabilityStatus === 'current') score += 8;
  if (product.availabilityStatus === 'legacy_common') {
    score -= 10;
    warnings.push('Produk dikenal di lapangan, tetapi status ketersediaan perlu dicek.');
  }
  if (product.availabilityStatus === 'discontinued') score -= 30;

  return { productId: product.id, score, reasons, warnings };
}

function scoreAmplifier(product: AmplifierProduct, data: WizardData, requiredAmplifierW: number): ProductScore {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  const venue = mapVenue(data.venueType);
  const useCase = mapUseCase(data.useCase);

  if (product.ratedOutputW >= requiredAmplifierW) {
    score += 36;
    reasons.push(`Daya ${product.ratedOutputW}W memenuhi kebutuhan minimal ${requiredAmplifierW}W.`);
  } else {
    score -= 60;
    warnings.push(`Daya ${product.ratedOutputW}W kurang dari kebutuhan minimal ${requiredAmplifierW}W.`);
  }
  const headroomRatio = product.ratedOutputW / Math.max(requiredAmplifierW, 1);
  if (headroomRatio >= 1.15 && headroomRatio <= 2.4) score += 20;
  if (headroomRatio > 3) score -= 8;
  if (product.supportedModes.includes('100v_line')) score += 16;
  if (product.recommendedVenues.includes(venue)) score += 10;
  if (product.recommendedUseCases.includes(useCase)) score += 10;
  score += sourceScore(product.sourceQuality);

  return { productId: product.id, score, reasons, warnings };
}

function getPrice(productId: string): ProductPriceEstimate | undefined {
  return productPriceEstimates.find((item) => item.productId === productId);
}

export function classifySystemBudget(totalHardwareCost: number): PriceTier {
  if (totalHardwareCost < 7000000) return 'cheap';
  if (totalHardwareCost < 15000000) return 'normal';
  if (totalHardwareCost < 35000000) return 'premium';
  return 'pro';
}

function estimateCost(speaker: SpeakerProduct, amplifier: AmplifierProduct, quantity: number): SystemCostEstimate {
  const speakerPrice = getPrice(speaker.id);
  const ampPrice = getPrice(amplifier.id);
  const speakerSubtotalMin = (speakerPrice?.minPrice ?? 0) * quantity;
  const speakerSubtotalTypical = (speakerPrice?.typicalPrice ?? 0) * quantity;
  const speakerSubtotalMax = (speakerPrice?.maxPrice ?? 0) * quantity;
  const amplifierSubtotalMin = ampPrice?.minPrice ?? 0;
  const amplifierSubtotalTypical = ampPrice?.typicalPrice ?? 0;
  const amplifierSubtotalMax = ampPrice?.maxPrice ?? 0;
  const mainHardwareTypical = speakerSubtotalTypical + amplifierSubtotalTypical;

  return {
    speakerSubtotalMin,
    speakerSubtotalTypical,
    speakerSubtotalMax,
    amplifierSubtotalMin,
    amplifierSubtotalTypical,
    amplifierSubtotalMax,
    mainHardwareMin: speakerSubtotalMin + amplifierSubtotalMin,
    mainHardwareTypical,
    mainHardwareMax: speakerSubtotalMax + amplifierSubtotalMax,
    systemBudgetTier: classifySystemBudget(mainHardwareTypical),
    excludedItems: [
      'speaker cable',
      'conduit / pipa / trunking',
      'bracket tambahan',
      'microphone',
      'mixer atau DSP jika dibutuhkan',
      'jasa instalasi',
      'transport, pajak, dan margin vendor',
    ],
    notes: [
      'Estimasi hanya hardware utama speaker dan amplifier.',
      'Harga pasar berubah; cek vendor sebelum pembelian.',
    ],
  };
}

export function recommendProducts(data: WizardData, result: AdvisoryResult): ProductRecommendation {
  const rankedSpeakers = speakerProducts
    .map((speaker) => ({ speaker, score: scoreSpeaker(speaker, data, result) }))
    .sort((a, b) => b.score.score - a.score.score);

  const selectedSpeaker = rankedSpeakers[0].speaker;
  const speakerScore = rankedSpeakers[0].score;
  const selectedTapW = pickTap(selectedSpeaker, data, result);
  const totalSpeakerLoadW = selectedTapW * result.speakerCount;
  const requiredAmplifierW = Math.ceil(totalSpeakerLoadW * 1.4);

  const rankedAmplifiers = amplifierProducts
    .map((amplifier) => ({ amplifier, score: scoreAmplifier(amplifier, data, requiredAmplifierW) }))
    .sort((a, b) => b.score.score - a.score.score);

  const selectedAmplifier = rankedAmplifiers[0].amplifier;
  const amplifierScore = rankedAmplifiers[0].score;
  const cost = estimateCost(selectedSpeaker, selectedAmplifier, result.speakerCount);
  const alternatives = rankedSpeakers.slice(1, 4).map((item) => item.speaker);

  const warnings = [
    ...speakerScore.warnings,
    ...amplifierScore.warnings,
  ];
  if (totalSpeakerLoadW > selectedAmplifier.ratedOutputW) {
    warnings.push('Total tap speaker melebihi rated output amplifier; gunakan amplifier lebih besar atau turunkan tap.');
  }
  if (selectedSpeaker.availabilityStatus !== 'current') {
    warnings.push('Cek ketersediaan produk karena statusnya bukan current default.');
  }

  return {
    speaker: selectedSpeaker,
    amplifier: selectedAmplifier,
    speakerQuantity: result.speakerCount,
    selectedTapW,
    totalSpeakerLoadW,
    requiredAmplifierW,
    speakerScore,
    amplifierScore,
    cost,
    alternatives,
    summary: `${result.speakerCount} pcs ${selectedSpeaker.brand} ${selectedSpeaker.model} @ ${selectedTapW}W + ${selectedAmplifier.brand} ${selectedAmplifier.model} ${selectedAmplifier.ratedOutputW}W.`,
    reasons: [
      ...speakerScore.reasons.slice(0, 3),
      ...amplifierScore.reasons.slice(0, 2),
      `Total load 100V sekitar ${totalSpeakerLoadW}W; amplifier dipilih dengan target headroom approx. 1.4x.`,
    ],
    warnings,
  };
}
