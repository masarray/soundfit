export type SpeakerCategory =
  | 'ceiling'
  | 'wall_mount'
  | 'column_speaker'
  | 'universal_box_speaker'
  | 'wide_dispersion_box_speaker'
  | 'slim_line_array'
  | 'horn'
  | 'subwoofer';

export type SystemMode = '100v_line' | '70v_line' | 'low_impedance' | 'active_powered';
export type MarketTier = 'budget' | 'budget_plus' | 'mid' | 'premium' | 'pro';
export type PriceTier = 'cheap' | 'normal' | 'premium' | 'pro';

export type VenueFit =
  | 'mosque'
  | 'mushola'
  | 'church'
  | 'hall'
  | 'classroom'
  | 'meeting_room'
  | 'retail'
  | 'cafe'
  | 'outdoor'
  | 'office'
  | 'school';

export type UseCaseFit =
  | 'speech'
  | 'study'
  | 'paging'
  | 'bgm'
  | 'worship_music'
  | 'live_music'
  | 'presentation'
  | 'foreground_music'
  | 'outdoor_call';

export type SourceQuality =
  | 'official_product_page'
  | 'official_datasheet'
  | 'official_brochure'
  | 'reseller_only'
  | 'manual_estimate';

export interface SpeakerProduct {
  id: string;
  brand: string;
  model: string;
  series?: string;
  category: SpeakerCategory;
  marketTier: MarketTier;
  supportedModes: SystemMode[];
  ratedPowerW?: number;
  programPowerW?: number;
  maxPowerW?: number;
  lowImpedanceOhm?: number;
  taps100V?: number[];
  taps70V?: number[];
  sensitivityDb1W1M?: number;
  frequencyLowHz?: number;
  frequencyHighHz?: number;
  coverageHorizontalDeg?: number;
  coverageVerticalDeg?: number;
  ipRating?: string;
  recommendedVenues: VenueFit[];
  recommendedUseCases: UseCaseFit[];
  notRecommendedFor?: UseCaseFit[];
  imagePath?: string;
  productUrl?: string;
  availabilityStatus: 'current' | 'legacy_common' | 'discontinued' | 'unknown';
  sourceQuality: SourceQuality;
  notes: string[];
}

export interface AmplifierProduct {
  id: string;
  brand: string;
  model: string;
  series?: string;
  amplifierType: 'mixer_amplifier' | 'power_amplifier' | 'digital_mixer_amplifier' | 'multichannel_amplifier';
  supportedModes: SystemMode[];
  ratedOutputW: number;
  output100V?: boolean;
  output70V?: boolean;
  outputLowImpedanceOhm?: number[];
  micInputs?: number;
  auxInputs?: number;
  phantomPower?: boolean;
  priorityMute?: boolean;
  recommendedVenues: VenueFit[];
  recommendedUseCases: UseCaseFit[];
  imagePath?: string;
  productUrl?: string;
  marketTier: MarketTier;
  sourceQuality: SourceQuality;
  notes: string[];
}

export interface ProductPriceEstimate {
  productId: string;
  currency: 'IDR';
  market: 'Indonesia';
  minPrice: number;
  typicalPrice: number;
  maxPrice: number;
  priceTier: PriceTier;
  priceConfidence: 'low' | 'medium' | 'high';
  sourceType: 'marketplace_observation' | 'retailer_listing' | 'official_pricelist' | 'manual_estimate';
  lastChecked: string;
  notes: string[];
}

export interface SystemCostEstimate {
  speakerSubtotalMin: number;
  speakerSubtotalTypical: number;
  speakerSubtotalMax: number;
  amplifierSubtotalMin: number;
  amplifierSubtotalTypical: number;
  amplifierSubtotalMax: number;
  mainHardwareMin: number;
  mainHardwareTypical: number;
  mainHardwareMax: number;
  systemBudgetTier: PriceTier;
  excludedItems: string[];
  notes: string[];
}

export interface ProductScore {
  productId: string;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface ProductRecommendation {
  speaker: SpeakerProduct;
  amplifier: AmplifierProduct;
  speakerQuantity: number;
  selectedTapW: number;
  totalSpeakerLoadW: number;
  requiredAmplifierW: number;
  speakerScore: ProductScore;
  amplifierScore: ProductScore;
  cost: SystemCostEstimate;
  alternatives: SpeakerProduct[];
  summary: string;
  reasons: string[];
  warnings: string[];
}
