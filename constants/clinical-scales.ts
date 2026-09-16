export interface ScaleQuestion {
  id: number;
  text: string;
  subscale?: string;
  reverseScored?: boolean;
}

export interface Maia2Subscale {
  key: string;
  name: string;
  description: string;
  clinicalContext: string;
  questionIds: number[];
}

export interface Maia2Scale {
  id: 'maia2';
  name: string;
  shortName: string;
  description: string;
  citation: string;
  disclaimer: string;
  estimatedMinutes: number;
  totalQuestions: number;
  responseOptions: { label: string; value: number }[];
  questions: ScaleQuestion[];
  subscales: Maia2Subscale[];
}

export interface ScaleInterpretation {
  minScore: number;
  maxScore: number;
  severity: string;
  description: string;
  recommendation: string;
  color: string;
}

export interface ClinicalScale {
  id: string;
  name: string;
  shortName: string;
  description: string;
  purpose: string;
  timeframe: string;
  frequency: string;
  estimatedMinutes: number;
  totalQuestions: number;
  maxScore: number;
  responseOptions: { label: string; value: number }[];
  questions: ScaleQuestion[];
  interpretations: ScaleInterpretation[];
  clinicalCutoff: number;
  disclaimer: string;
  citation: string;
}

export const CLINICAL_SCALES: ClinicalScale[] = [
  {
    id: 'gad-7',
    name: 'Generalized Anxiety Disorder Scale',
    shortName: 'GAD-7',
    description: 'A validated 7-item screening tool for generalized anxiety disorder. Widely used in clinical settings to assess anxiety severity and monitor treatment response.',
    purpose: 'Screen for and measure severity of generalized anxiety symptoms',
    timeframe: 'Over the past 2 weeks',
    frequency: 'Weekly or biweekly',
    estimatedMinutes: 3,
    totalQuestions: 7,
    maxScore: 21,
    responseOptions: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      { id: 1, text: 'Feeling nervous, anxious, or on edge' },
      { id: 2, text: 'Not being able to stop or control worrying' },
      { id: 3, text: 'Worrying too much about different things' },
      { id: 4, text: 'Trouble relaxing' },
      { id: 5, text: 'Being so restless that it\'s hard to sit still' },
      { id: 6, text: 'Becoming easily annoyed or irritable' },
      { id: 7, text: 'Feeling afraid, as if something awful might happen' },
    ],
    interpretations: [
      { minScore: 0, maxScore: 4, severity: 'Minimal', description: 'Your anxiety levels are within the normal range. Continue your current wellness practices.', recommendation: 'Maintain daily check-ins and preventive exercises', color: '#7FB069' },
      { minScore: 5, maxScore: 9, severity: 'Mild', description: 'You are experiencing mild anxiety symptoms. Regular interoceptive practice can help manage these effectively.', recommendation: 'Daily breathing exercises and body scanning recommended', color: '#88B3B5' },
      { minScore: 10, maxScore: 14, severity: 'Moderate', description: 'Your anxiety is at a moderate level. Consider increasing your practice frequency and exploring condition-specific exercises.', recommendation: 'Structured daily practice + consider professional support', color: '#F0C05A' },
      { minScore: 15, maxScore: 21, severity: 'Severe', description: 'Your anxiety levels are elevated. While interoceptive practice can help, professional support is strongly recommended.', recommendation: 'Seek professional mental health support alongside practice', color: '#E85D5D' },
    ],
    clinicalCutoff: 10,
    disclaimer: 'This is a screening tool, not a diagnostic instrument. Only a qualified healthcare provider can diagnose an anxiety disorder. Scores should be interpreted alongside clinical judgment. If you are in crisis, please contact emergency services.',
    citation: 'Spitzer, R. L., Kroenke, K., Williams, J. B., & Lowe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of Internal Medicine, 166(10), 1092-1097.',
  },
  {
    id: 'phq-9',
    name: 'Patient Health Questionnaire',
    shortName: 'PHQ-9',
    description: 'A validated 9-item scale aligned with DSM-5 criteria for Major Depressive Disorder. Used globally for depression screening and severity monitoring.',
    purpose: 'Screen for and measure severity of depressive symptoms',
    timeframe: 'Over the past 2 weeks',
    frequency: 'Weekly or biweekly',
    estimatedMinutes: 4,
    totalQuestions: 9,
    maxScore: 27,
    responseOptions: [
      { label: 'Not at all', value: 0 },
      { label: 'Several days', value: 1 },
      { label: 'More than half the days', value: 2 },
      { label: 'Nearly every day', value: 3 },
    ],
    questions: [
      { id: 1, text: 'Little interest or pleasure in doing things' },
      { id: 2, text: 'Feeling down, depressed, or hopeless' },
      { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 4, text: 'Feeling tired or having little energy' },
      { id: 5, text: 'Poor appetite or overeating' },
      { id: 6, text: 'Feeling bad about yourself, or that you are a failure, or have let yourself or your family down' },
      { id: 7, text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { id: 8, text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite: being so fidgety or restless that you have been moving around a lot more than usual' },
      { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself in some way' },
    ],
    interpretations: [
      { minScore: 0, maxScore: 4, severity: 'Minimal', description: 'Your depression symptom levels are within the normal range.', recommendation: 'Continue wellness practices and monitor', color: '#7FB069' },
      { minScore: 5, maxScore: 9, severity: 'Mild', description: 'You are experiencing mild depressive symptoms. Gentle daily practices and social connection can help.', recommendation: 'Daily movement exercises + social engagement', color: '#88B3B5' },
      { minScore: 10, maxScore: 14, severity: 'Moderate', description: 'Your depressive symptoms are at a moderate level. A treatment plan combining self-practice with professional support is recommended.', recommendation: 'Professional consultation recommended', color: '#F0C05A' },
      { minScore: 15, maxScore: 19, severity: 'Moderately Severe', description: 'Your symptoms suggest moderately severe depression. Active professional treatment is strongly recommended.', recommendation: 'Active treatment with professional support recommended', color: '#E8B4B8' },
      { minScore: 20, maxScore: 27, severity: 'Severe', description: 'Your symptom levels are elevated. Please reach out to a mental health professional as soon as possible.', recommendation: 'Immediate professional support recommended', color: '#E85D5D' },
    ],
    clinicalCutoff: 10,
    disclaimer: 'This is a screening tool, not a diagnostic instrument. Question 9 specifically screens for suicidal ideation - any positive response warrants immediate follow-up with a healthcare provider. If you are having thoughts of self-harm, please contact a crisis helpline immediately.',
    citation: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606-613.',
  },
  {
    id: 'pcl-5',
    name: 'PTSD Checklist for DSM-5',
    shortName: 'PCL-5',
    description: 'A 20-item self-report measure that assesses the 20 DSM-5 symptoms of PTSD. Developed by the National Center for PTSD.',
    purpose: 'Screen for and monitor PTSD symptom severity',
    timeframe: 'Over the past month',
    frequency: 'Monthly',
    estimatedMinutes: 8,
    totalQuestions: 20,
    maxScore: 80,
    responseOptions: [
      { label: 'Not at all', value: 0 },
      { label: 'A little bit', value: 1 },
      { label: 'Moderately', value: 2 },
      { label: 'Quite a bit', value: 3 },
      { label: 'Extremely', value: 4 },
    ],
    questions: [
      { id: 1, text: 'Repeated, disturbing, and unwanted memories of a stressful experience' },
      { id: 2, text: 'Repeated, disturbing dreams of a stressful experience' },
      { id: 3, text: 'Suddenly feeling or acting as if a stressful experience were actually happening again (as if you were actually back there reliving it)' },
      { id: 4, text: 'Feeling very upset when something reminded you of a stressful experience' },
      { id: 5, text: 'Having strong physical reactions when something reminded you of a stressful experience (for example, heart pounding, trouble breathing, sweating)' },
      { id: 6, text: 'Avoiding memories, thoughts, or feelings related to a stressful experience' },
      { id: 7, text: 'Avoiding external reminders of a stressful experience (for example, people, places, conversations, activities, objects, or situations)' },
      { id: 8, text: 'Trouble remembering important parts of a stressful experience' },
      { id: 9, text: 'Having strong negative beliefs about yourself, other people, or the world' },
      { id: 10, text: 'Blaming yourself or someone else for a stressful experience or what happened after it' },
      { id: 11, text: 'Having strong negative feelings such as fear, horror, anger, guilt, or shame' },
      { id: 12, text: 'Loss of interest in activities that you used to enjoy' },
      { id: 13, text: 'Feeling distant or cut off from other people' },
      { id: 14, text: 'Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)' },
      { id: 15, text: 'Irritable behavior, angry outbursts, or acting aggressively' },
      { id: 16, text: 'Taking too many risks or doing things that could cause you harm' },
      { id: 17, text: 'Being "superalert" or watchful or on guard' },
      { id: 18, text: 'Feeling jumpy or easily startled' },
      { id: 19, text: 'Having difficulty concentrating' },
      { id: 20, text: 'Trouble falling or staying asleep' },
    ],
    interpretations: [
      { minScore: 0, maxScore: 10, severity: 'Minimal', description: 'Your PTSD symptom levels are low. Continue monitoring and practicing protective wellness strategies.', recommendation: 'Maintain awareness practices and check in monthly', color: '#7FB069' },
      { minScore: 11, maxScore: 27, severity: 'Below Threshold', description: 'You are experiencing some trauma-related symptoms but below the clinical threshold.', recommendation: 'Consider trauma-sensitive exercises and grounding practices', color: '#88B3B5' },
      { minScore: 28, maxScore: 32, severity: 'Approaching Clinical', description: 'Your symptoms are approaching the clinical threshold for PTSD. Professional evaluation may be helpful.', recommendation: 'Professional evaluation recommended', color: '#F0C05A' },
      { minScore: 33, maxScore: 50, severity: 'Probable PTSD', description: 'Your symptom level suggests probable PTSD. Please consider seeking professional assessment and treatment.', recommendation: 'Professional PTSD assessment strongly recommended', color: '#E8B4B8' },
      { minScore: 51, maxScore: 80, severity: 'Severe', description: 'Your PTSD symptoms are elevated. Professional trauma treatment is important for your wellbeing.', recommendation: 'Seek trauma-specialized treatment', color: '#E85D5D' },
    ],
    clinicalCutoff: 33,
    disclaimer: 'This is a screening tool developed by the National Center for PTSD. It is not a diagnostic instrument. A score above the cutoff suggests a need for professional evaluation, but only a qualified clinician can diagnose PTSD. If you are experiencing a trauma-related crisis, please contact a crisis helpline.',
    citation: 'Weathers, F. W., et al. (2013). The PTSD Checklist for DSM-5 (PCL-5). National Center for PTSD.',
  },
];

export function getScaleById(id: string): ClinicalScale | undefined {
  return CLINICAL_SCALES.find(s => s.id === id);
}

export function interpretScore(scale: ClinicalScale, score: number): ScaleInterpretation {
  return scale.interpretations.find(i => score >= i.minScore && score <= i.maxScore) || scale.interpretations[scale.interpretations.length - 1];
}

export const MAIA2_SCALE: Maia2Scale = {
  id: 'maia2',
  name: 'Multidimensional Assessment of Interoceptive Awareness',
  shortName: 'MAIA-2',
  description: 'A validated 37-item self-report questionnaire measuring 8 dimensions of interoceptive awareness. Its subscales can help you reflect on how you relate to body sensations over time.',
  citation: 'Mehling, W. E., et al. (2018). The Multidimensional Assessment of Interoceptive Awareness, Version 2 (MAIA-2). PLOS ONE, 13(12), e0208034. Freely available for research and clinical use.',
  disclaimer: 'MAIA-2 measures interoceptive awareness, not clinical symptoms. Results reflect your current level of body awareness and are not diagnostic. Higher scores indicate stronger body awareness in each dimension.',
  estimatedMinutes: 10,
  totalQuestions: 37,
  responseOptions: [
    { label: 'Never', value: 0 },
    { label: 'Rarely', value: 1 },
    { label: 'Sometimes', value: 2 },
    { label: 'Often', value: 3 },
    { label: 'Very Often', value: 4 },
    { label: 'Always', value: 5 },
  ],
  subscales: [
    {
      key: 'noticing',
      name: 'Noticing',
      description: 'Awareness of uncomfortable, comfortable, and neutral body sensations',
      clinicalContext: 'Noticing reflects your baseline sensitivity to bodily signals. Higher scores mean you naturally pick up on what your body is communicating, a foundation for all other dimensions.',
      questionIds: [1, 2, 3, 4],
    },
    {
      key: 'notDistracting',
      name: 'Not-Distracting',
      description: 'Tendency not to ignore or distract oneself from sensations of pain or discomfort',
      clinicalContext: 'Not-Distracting measures whether you stay present with uncomfortable sensations rather than pushing them away. Growth here means developing a healthier relationship with physical discomfort.',
      questionIds: [5, 6, 7, 8, 9, 10],
    },
    {
      key: 'notWorrying',
      name: 'Not-Worrying',
      description: 'Tendency not to worry or experience emotional distress with sensations of pain or discomfort',
      clinicalContext: 'Not-Worrying reflects emotional equanimity toward body sensations. Higher scores suggest you can notice discomfort without catastrophising, a key skill in pain management and anxiety.',
      questionIds: [11, 12, 13, 14, 15],
    },
    {
      key: 'attentionRegulation',
      name: 'Attention Regulation',
      description: 'Ability to sustain and control attention to body sensations',
      clinicalContext: 'Attention Regulation is the capacity to deliberately focus on, sustain, and redirect attention within the body. It underpins all formal mindfulness and interoceptive training.',
      questionIds: [16, 17, 18, 19, 20, 21, 22],
    },
    {
      key: 'emotionalAwareness',
      name: 'Emotional Awareness',
      description: 'Awareness of the connection between body sensations and emotional states',
      clinicalContext: 'Emotional Awareness captures the mind-body bridge, recognising that emotions live in the body. Strengthening this dimension improves emotional regulation and self-understanding.',
      questionIds: [23, 24, 25, 26, 27],
    },
    {
      key: 'selfRegulation',
      name: 'Self-Regulation',
      description: 'Ability to regulate distress by attention to body sensations',
      clinicalContext: 'Self-Regulation measures whether you can actively use body awareness to calm emotional or physical distress. It is central to resilience and stress recovery.',
      questionIds: [28, 29, 30, 31],
    },
    {
      key: 'bodyListening',
      name: 'Body Listening',
      description: 'Active listening to the body for insight',
      clinicalContext: 'Body Listening reflects the degree to which you attend to body sensations when reflecting on your emotional state and choices.',
      questionIds: [32, 33, 34],
    },
    {
      key: 'trusting',
      name: 'Trusting',
      description: 'Experience of one\'s body as safe and trustworthy',
      clinicalContext: 'Trusting reflects the extent to which your body feels safe and reliable to you. Changes can be useful to discuss with a qualified professional alongside your wider context.',
      questionIds: [35, 36, 37],
    },
  ],
  questions: [
    { id: 1, subscale: 'noticing', text: 'When I am tense I notice where the tension is located in my body.' },
    { id: 2, subscale: 'noticing', text: 'I notice when I am uncomfortable in my body.' },
    { id: 3, subscale: 'noticing', text: 'I notice where in my body I am comfortable.' },
    { id: 4, subscale: 'noticing', text: 'I notice changes in my breathing, such as whether it slows down or speeds up.' },
    { id: 5, subscale: 'notDistracting', reverseScored: true, text: 'I ignore physical tension or discomfort until they become more severe.' },
    { id: 6, subscale: 'notDistracting', reverseScored: true, text: 'I distract myself from sensations of discomfort.' },
    { id: 7, subscale: 'notDistracting', reverseScored: true, text: 'When I feel pain or discomfort, I try to power through it.' },
    { id: 8, subscale: 'notDistracting', reverseScored: true, text: 'I try to ignore pain.' },
    { id: 9, subscale: 'notDistracting', reverseScored: true, text: 'I push feelings of discomfort away by focusing on something else.' },
    { id: 10, subscale: 'notDistracting', reverseScored: true, text: 'When I feel unpleasant body sensations, I occupy myself with something else so I do not have to feel them.' },
    { id: 11, subscale: 'notWorrying', reverseScored: true, text: 'When I feel physical pain, I become upset.' },
    { id: 12, subscale: 'notWorrying', reverseScored: true, text: 'I start to worry that something is wrong if I feel any discomfort.' },
    { id: 13, subscale: 'notWorrying', text: 'I can notice an unpleasant body sensation without worrying about it.' },
    { id: 14, subscale: 'notWorrying', text: 'I can stay calm and not worry when I have feelings of discomfort or pain.' },
    { id: 15, subscale: 'notWorrying', reverseScored: true, text: 'When I am in discomfort or pain I cannot get it out of my mind.' },
    { id: 16, subscale: 'attentionRegulation', text: 'I can pay attention to my breath without being distracted by things happening around me.' },
    { id: 17, subscale: 'attentionRegulation', text: 'I can maintain awareness of my inner body sensations even when there is a lot going on around me.' },
    { id: 18, subscale: 'attentionRegulation', text: 'When I am in conversation with someone, I can pay attention to my body sensations at the same time.' },
    { id: 19, subscale: 'attentionRegulation', text: 'I can return awareness to my body if I am distracted.' },
    { id: 20, subscale: 'attentionRegulation', text: 'I can refocus my attention from thinking to sensing my body.' },
    { id: 21, subscale: 'attentionRegulation', text: 'I can maintain awareness of my whole body even when a part of me is in pain or discomfort.' },
    { id: 22, subscale: 'attentionRegulation', text: 'I am able to consciously focus on my body as a whole.' },
    { id: 23, subscale: 'emotionalAwareness', text: 'I notice how my body changes when I am angry.' },
    { id: 24, subscale: 'emotionalAwareness', text: 'When something is wrong in my life, I can feel it in my body.' },
    { id: 25, subscale: 'emotionalAwareness', text: 'I notice that my body feels different after a peaceful experience.' },
    { id: 26, subscale: 'emotionalAwareness', text: 'I notice that my breathing becomes free and easy when I feel comfortable.' },
    { id: 27, subscale: 'emotionalAwareness', text: 'I notice how my body changes when I feel happy.' },
    { id: 28, subscale: 'selfRegulation', text: 'When I feel overwhelmed I can find a calm place inside.' },
    { id: 29, subscale: 'selfRegulation', text: 'When I bring awareness to my body I feel a sense of calm.' },
    { id: 30, subscale: 'selfRegulation', text: 'I can use my breath to reduce tension.' },
    { id: 31, subscale: 'selfRegulation', text: 'When I am caught up in thoughts, I can calm my mind by focusing on my body/breathing.' },
    { id: 32, subscale: 'bodyListening', text: 'I listen for information from my body about my emotional state.' },
    { id: 33, subscale: 'bodyListening', text: 'When I am upset, I take time to explore how my body feels.' },
    { id: 34, subscale: 'bodyListening', text: 'I listen to my body to inform me about what to do in difficult situations.' },
    { id: 35, subscale: 'trusting', text: 'I am at home in my body.' },
    { id: 36, subscale: 'trusting', text: 'I feel my body is a safe place.' },
    { id: 37, subscale: 'trusting', text: 'I trust my body sensations.' },
  ],
};

export function calculateMaia2Subscales(answers: number[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const subscale of MAIA2_SCALE.subscales) {
    const subscaleAnswers = subscale.questionIds.map(qid => {
      const q = MAIA2_SCALE.questions.find(q => q.id === qid)!;
      const rawAnswer = answers[qid - 1];
      if (rawAnswer === undefined || rawAnswer < 0) return 0;
      return q.reverseScored ? 5 - rawAnswer : rawAnswer;
    });
    const avg = subscaleAnswers.reduce((s, a) => s + a, 0) / subscaleAnswers.length;
    scores[subscale.key] = Math.round(avg * 100) / 100;
  }
  return scores;
}

export function getMaia2OverallAverage(subscaleScores: Record<string, number>): number {
  const values = Object.values(subscaleScores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length * 100) / 100;
}

export const MAIA2_REQUIRED_SUBSCALE_KEYS = [
  'noticing',
  'notDistracting',
  'notWorrying',
  'attentionRegulation',
  'emotionalAwareness',
  'selfRegulation',
  'bodyListening',
  'trusting',
] as const;

export function hasCompleteSubscaleScores(scores: Record<string, number> | undefined | null): boolean {
  if (!scores) return false;
  return MAIA2_REQUIRED_SUBSCALE_KEYS.every(
    key => key in scores && typeof scores[key] === 'number' && !isNaN(scores[key]),
  );
}

export interface Maia2ClinicalFlag {
  key: string;
  type: 'professional' | 'distress' | 'encouragement';
  title: string;
  message: string;
}

export function getMaia2ClinicalFlags(subscaleScores: Record<string, number>): Maia2ClinicalFlag[] {
  if (!hasCompleteSubscaleScores(subscaleScores)) return [];
  const flags: Maia2ClinicalFlag[] = [];
  const trusting = subscaleScores['trusting'];
  const noticing = subscaleScores['noticing'];
  const notWorrying = subscaleScores['notWorrying'];
  const avg = getMaia2OverallAverage(subscaleScores);

  if (trusting < 2.0) {
    flags.push({
      key: 'low-trusting',
      type: 'professional',
      title: 'Consider speaking with a professional',
      message: 'Your Trusting score suggests you may find it difficult to feel safe or at home in your body. This is common after trauma, chronic illness, or prolonged stress. A therapist familiar with somatic approaches may offer meaningful support alongside your practice.',
    });
  }

  if (noticing >= 3.5 && notWorrying < 2.0) {
    flags.push({
      key: 'high-noticing-low-notworrying',
      type: 'distress',
      title: 'Body awareness with worry, a pattern worth noting',
      message: 'You are highly attuned to body signals (Noticing) but find them distressing (Not-Worrying). Heightened awareness paired with anxiety about sensations is a recognised pattern. Regulation exercises, particularly breathing and grounding, can help shift this balance over time.',
    });
  }

  if (avg < 2.0 && flags.length === 0) {
    flags.push({
      key: 'low-overall',
      type: 'encouragement',
      title: 'You are at the start of your journey',
      message: 'Your scores reflect where you are right now, not where you are headed. Interoceptive awareness is a trainable skill, consistent practice with breathing, body scanning, and movement exercises has been shown to improve all 8 dimensions over time.',
    });
  }

  return flags;
}

export interface PastMaia2Assessment {
  date: string;
  subscaleScores: Record<string, number>;
}

export function generateClinicianReport(
  subscaleScores: Record<string, number>,
  assessmentDate: string,
  userName?: string,
  pastAssessments?: PastMaia2Assessment[],
): string {
  const lines: string[] = [];
  lines.push('MAIA-2, Multidimensional Assessment of Interoceptive Awareness');
  lines.push(`Assessment date: ${assessmentDate}`);
  if (userName) lines.push(`Client: ${userName}`);
  lines.push('');
  lines.push('SUBSCALE SCORES (0–5 scale)');
  lines.push('─────────────────────────────────────────');

  for (const subscale of MAIA2_SCALE.subscales) {
    const score = subscaleScores[subscale.key] ?? 0;
    const bar = '█'.repeat(Math.round(score)) + '░'.repeat(5 - Math.round(score));
    lines.push(`${subscale.name.padEnd(22)} ${bar}  ${score.toFixed(1)}/5`);
    lines.push(`  ${subscale.description}`);
    lines.push('');
  }

  if (pastAssessments && pastAssessments.length > 0) {
    const history = pastAssessments.slice(0, 3);
    lines.push('─────────────────────────────────────────');
    lines.push('LONGITUDINAL HISTORY (up to 3 prior assessments)');
    lines.push('');
    for (const past of history) {
      lines.push(`Assessment date: ${past.date}`);
      for (const subscale of MAIA2_SCALE.subscales) {
        const pastScore = past.subscaleScores[subscale.key] ?? 0;
        const currScore = subscaleScores[subscale.key] ?? 0;
        const diff = currScore - pastScore;
        const trend = diff > 0.1 ? `+${diff.toFixed(1)}` : diff < -0.1 ? diff.toFixed(1) : '-';
        const bar = '█'.repeat(Math.round(pastScore)) + '░'.repeat(5 - Math.round(pastScore));
        lines.push(`  ${subscale.name.padEnd(22)} ${bar}  ${pastScore.toFixed(1)}/5  (${trend} to current)`);
      }
      lines.push('');
    }
  }

  lines.push('─────────────────────────────────────────');
  lines.push('CLINICAL NOTE');
  lines.push('The MAIA-2 (Mehling et al., 2018, PLOS ONE) is a validated 37-item');
  lines.push('instrument. Authors explicitly caution against computing a composite');
  lines.push('score; interpret the pattern across the 8 subscales instead.');
  lines.push('');
  lines.push('Citation: Mehling WE et al. (2018). The Multidimensional Assessment of');
  lines.push('Interoceptive Awareness, Version 2 (MAIA-2). PLOS ONE 13(12): e0208034.');
  lines.push('');
  lines.push('Generated via Interosense, interosense.app');

  return lines.join('\n');
}
