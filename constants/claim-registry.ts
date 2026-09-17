export type ClaimReviewStatus = 'reviewed' | 'instructional';
export type ClaimEvidenceLevel = 'review' | 'primary-study' | 'consensus-context' | 'not-applicable';

export interface ReviewedClaim {
  id: string;
  label: string;
  text: string;
  evidenceLevel: ClaimEvidenceLevel;
  uncertainty: string;
  sourceCitation: string | null;
  sourceUrl: string | null;
  reviewedAt: string;
  status: ClaimReviewStatus;
}

export const CLAIM_REGISTRY: Record<string, ReviewedClaim> = {
  'body-awareness-description': {
    id: 'body-awareness-description',
    label: 'BODY AWARENESS',
    text: 'Interoceptive practice helps you pay closer attention to body signals and describe what you notice.',
    evidenceLevel: 'review',
    uncertainty: 'Practice effects vary by method, duration, population, and the body signal being observed.',
    sourceCitation: 'Khalsa et al. (2018). Interoception and Mental Health: A Roadmap. Biological Psychiatry: Cognitive Neuroscience and Neuroimaging.',
    sourceUrl: 'https://doi.org/10.1016/j.bpsc.2017.12.004',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
  'breathing-comfort-variability': {
    id: 'breathing-comfort-variability',
    label: 'BREATHING COMFORT',
    text: 'Slow breathing feels settling for some people and uncomfortable for others. Use a natural pace, and stop if you feel dizzy or distressed.',
    evidenceLevel: 'review',
    uncertainty: 'Responses differ, and this wording does not promise a physiological or emotional result.',
    sourceCitation: 'Hopper et al. (2019). Effectiveness of diaphragmatic breathing for reducing physiological and psychological stress in adults.',
    sourceUrl: 'https://doi.org/10.1111/jocn.14665',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
  'hrv-context': {
    id: 'hrv-context',
    label: 'WEARABLE CONTEXT',
    text: 'Heart rate variability changes for many reasons. Compare readings with your own recent pattern rather than treating one number as a resilience score.',
    evidenceLevel: 'consensus-context',
    uncertainty: 'Consumer-device readings and short-term changes are not diagnostic and can be affected by measurement conditions.',
    sourceCitation: 'Laborde et al. (2017). Heart Rate Variability and Cardiac Vagal Tone in Psychophysiological Research.',
    sourceUrl: 'https://doi.org/10.3389/fpsyg.2017.00213',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
  'practice-consistency-instruction': {
    id: 'practice-consistency-instruction',
    label: 'CONSISTENCY',
    text: 'Regular practice gives you repeated opportunities to notice patterns and learn which responses feel useful.',
    evidenceLevel: 'not-applicable',
    uncertainty: 'This is instructional wording and does not claim a treatment effect.',
    sourceCitation: null,
    sourceUrl: null,
    reviewedAt: '2026-09-17',
    status: 'instructional',
  },
  'gut-brain-context': {
    id: 'gut-brain-context',
    label: 'GUT-BRAIN CONTEXT',
    text: 'The gut and brain communicate through several pathways. Abdominal sensations can be noticed without assuming they explain mood or health.',
    evidenceLevel: 'review',
    uncertainty: 'A noticed sensation cannot establish its cause or indicate a medical or mental health condition.',
    sourceCitation: 'Mayer (2011). Gut feelings: the emerging biology of gut-brain communication.',
    sourceUrl: 'https://doi.org/10.1038/nrn3071',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
  'interoception-signal-context': {
    id: 'interoception-signal-context',
    label: 'INTEROCEPTION',
    text: 'Interoception includes noticing signals such as breath, heartbeat, temperature, hunger, and tension. Accuracy and comfort can vary by signal and situation.',
    evidenceLevel: 'review',
    uncertainty: 'Self-reported awareness and objective detection accuracy are related but distinct constructs.',
    sourceCitation: 'Garfinkel et al. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive sensibility.',
    sourceUrl: 'https://doi.org/10.1016/j.biopsycho.2014.11.004',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
  'breath-emotion-variability': {
    id: 'breath-emotion-variability',
    label: 'BREATH & EMOTION',
    text: 'Breathing and emotion can influence each other, but responses differ. Treat each practice as an observation rather than a promised result.',
    evidenceLevel: 'review',
    uncertainty: 'Direction, size, and duration of effects differ across people and protocols.',
    sourceCitation: 'Zaccaro et al. (2018). How Breath-Control Can Change Your Life: A Systematic Review.',
    sourceUrl: 'https://doi.org/10.3389/fnhum.2018.00353',
    reviewedAt: '2026-09-17',
    status: 'reviewed',
  },
};

export const HOME_SCIENCE_CLAIM_IDS = [
  'body-awareness-description',
  'breathing-comfort-variability',
  'hrv-context',
  'practice-consistency-instruction',
  'gut-brain-context',
  'interoception-signal-context',
  'breath-emotion-variability',
] as const;

export const HOME_SCIENCE_CLAIMS = HOME_SCIENCE_CLAIM_IDS.map(id => CLAIM_REGISTRY[id]);