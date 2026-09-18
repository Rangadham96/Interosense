export type CrisisRegion = 'IN' | 'US' | 'OTHER';

export interface CrisisResource {
  icon: string;
  title: string;
  detail: string;
  url: string;
}

export interface CrisisRegionResources {
  label: string;
  emergencyNumber: string | null;
  emergencyLabel: string;
  secondaryLabel: string;
  secondaryUrl: string;
  localResources: CrisisResource[];
  additionalResources: CrisisResource[];
}

const INDIA_RESOURCES: CrisisResource[] = [
  { icon: 'phone', title: 'Kiran Mental Health Helpline', detail: '1800-599-0019', url: 'tel:18005990019' },
  { icon: 'phone-call', title: 'iCall', detail: '+91 9152987821', url: 'tel:+919152987821' },
  { icon: 'heart', title: 'Vandrevala Foundation', detail: '+91 9999666555', url: 'tel:+919999666555' },
];

const US_RESOURCES: CrisisResource[] = [
  { icon: 'phone', title: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988', url: 'tel:988' },
  { icon: 'phone-call', title: 'SAMHSA Helpline', detail: '1-800-662-4357 (24/7)', url: 'tel:18006624357' },
  { icon: 'shield', title: 'Veterans Crisis Line', detail: 'Dial 988, then press 1', url: 'tel:988' },
];

const INTERNATIONAL_RESOURCE: CrisisResource = {
  icon: 'globe',
  title: 'International Crisis Lines',
  detail: 'findahelpline.com',
  url: 'https://findahelpline.com',
};

export const CRISIS_REGION_OPTIONS: { code: CrisisRegion; label: string }[] = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'OTHER', label: 'Other location' },
];

export const CRISIS_RESOURCES: Record<CrisisRegion, CrisisRegionResources> = {
  IN: {
    label: 'India',
    emergencyNumber: '112',
    emergencyLabel: 'Call India emergency services (112)',
    secondaryLabel: 'Find more international support',
    secondaryUrl: 'https://findahelpline.com',
    localResources: INDIA_RESOURCES,
    additionalResources: [...US_RESOURCES, INTERNATIONAL_RESOURCE],
  },
  US: {
    label: 'United States',
    emergencyNumber: '911',
    emergencyLabel: 'Call US emergency services (911)',
    secondaryLabel: 'Crisis Text Line, text HOME to 741741',
    secondaryUrl: 'sms:741741',
    localResources: US_RESOURCES,
    additionalResources: [...INDIA_RESOURCES, INTERNATIONAL_RESOURCE],
  },
  OTHER: {
    label: 'your location',
    emergencyNumber: null,
    emergencyLabel: 'Find local emergency support',
    secondaryLabel: 'Find crisis support near you',
    secondaryUrl: 'https://findahelpline.com',
    localResources: [INTERNATIONAL_RESOURCE],
    additionalResources: [...INDIA_RESOURCES, ...US_RESOURCES],
  },
};

export function detectCrisisRegion(): CrisisRegion {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toUpperCase();
    if (locale.includes('-IN') || locale.endsWith('_IN')) return 'IN';
    if (locale.includes('-US') || locale.endsWith('_US')) return 'US';
  } catch {
    // Locale detection is only a default. The manual selector remains available.
  }
  return 'OTHER';
}