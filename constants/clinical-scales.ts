export interface ScaleQuestion {
  id: number;
  text: string;
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
