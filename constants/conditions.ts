export interface Condition {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  color: string;
  prevalence: string;
  overview: string;
  neuroscience: string;
  interoceptionConnection: string;
  symptoms: string[];
  recommendedExerciseIds: string[];
  recommendedScaleId: string | null;
  selfCareStrategies: string[];
  warningSignsForProfessionalHelp: string[];
  resources: { name: string; description: string; url?: string }[];
  researchCitations: string[];
  disclaimer: string;
}

export const CONDITIONS: Condition[] = [
  {
    id: 'anxiety',
    name: 'Generalized Anxiety',
    subtitle: 'Understanding the anxiety-body signal cycle',
    iconName: 'alert-circle',
    color: '#E8B4B8',
    prevalence: 'Affects approximately 6.8% of adults worldwide. Research shows interoceptive training reduces anxiety by 30-40%.',
    overview: 'Generalized Anxiety Disorder (GAD) involves persistent, excessive worry about various aspects of life that is difficult to control. It creates a heightened state of physiological arousal that profoundly affects interoceptive processing.',
    neuroscience: 'Anxiety involves overactivation of the amygdala (threat detection center) and underactivation of the prefrontal cortex (rational assessment). The insular cortex, which processes body signals, becomes hypervigilant - interpreting normal body sensations as potential threats. This creates a feedback loop: body sensation triggers anxiety, which increases body arousal, which generates more alarming sensations.\n\nHRV (heart rate variability) is typically lower in anxious individuals, indicating reduced vagal tone and parasympathetic capacity. The good news: interoceptive training directly increases HRV and retrains the insula to process body signals accurately.',
    interoceptionConnection: 'People with anxiety have heightened interoceptive sensitivity (they notice body signals more) but reduced interoceptive accuracy (they misinterpret what those signals mean). A racing heart gets labeled "heart attack" instead of "I just climbed stairs." Interoceptive training closes this accuracy gap by teaching the brain to correctly interpret body signals through repeated, safe exposure to them.',
    symptoms: ['Persistent worry difficult to control', 'Restlessness or feeling keyed up', 'Muscle tension (especially shoulders, jaw)', 'Sleep disturbance', 'Difficulty concentrating', 'Irritability', 'Fatigue despite adequate rest', 'Physical symptoms: headaches, stomach issues, rapid heartbeat'],
    recommendedExerciseIds: ['box-breathing', 'diaphragmatic-breathing', '478-breathing', 'progressive-body-scan', 'tension-release', 'heartbeat-detection', 'cold-exposure-intro', 'shoulder-check'],
    recommendedScaleId: 'gad-7',
    selfCareStrategies: [
      'Practice box breathing at first sign of worry - 4 rounds takes 90 seconds',
      'Do a 2-minute body check hourly to catch tension before it builds',
      'Use the temperature awareness exercise to shift nervous system state',
      'Track anxiety patterns with daily check-ins to identify triggers',
      'Cold water face splash activates dive reflex for instant anxiety relief',
    ],
    warningSignsForProfessionalHelp: [
      'Anxiety prevents you from working, socializing, or daily activities',
      'Panic attacks occur frequently or unexpectedly',
      'You use alcohol or substances to cope with anxiety',
      'Anxiety has lasted more than 6 months with no improvement',
      'Physical symptoms (chest pain, breathing difficulty) cause repeated ER visits',
    ],
    resources: [
      { name: 'ADAA (Anxiety & Depression Association)', description: 'Evidence-based resources for understanding and treating anxiety disorders', url: 'https://adaa.org' },
      { name: 'NICE Clinical Guidelines', description: 'UK National Institute for Health and Care Excellence treatment recommendations', url: 'https://www.nice.org.uk/guidance/cg113' },
    ],
    researchCitations: [
      'Garfinkel et al. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive sensibility. Biological Psychology, 104, 65-74.',
      'Paulus & Stein (2010). Interoception in anxiety and depression. Brain Structure and Function, 214(5-6), 451-463.',
      'Khalsa et al. (2018). Interoception and mental health: A roadmap. Biological Psychiatry: CNNI, 3(6), 501-513.',
    ],
    disclaimer: 'This information is educational and not a substitute for professional medical advice, diagnosis, or treatment. If you believe you have an anxiety disorder, please consult a qualified healthcare provider.',
  },
  {
    id: 'panic',
    name: 'Panic Disorder',
    subtitle: 'Retraining your body\'s false alarm system',
    iconName: 'zap',
    color: '#E85D5D',
    prevalence: 'Affects 2-3% of adults. Interoceptive exposure is a first-line treatment component, reducing panic attacks by 70-80% in clinical trials.',
    overview: 'Panic Disorder involves recurrent, unexpected panic attacks - sudden surges of intense fear accompanied by physical symptoms. The core mechanism is catastrophic misinterpretation of normal body sensations.',
    neuroscience: 'During a panic attack, the amygdala fires a false alarm, triggering the fight-or-flight response. Adrenaline surges, heart rate spikes to 120-180 BPM, breathing becomes rapid and shallow. The insular cortex, overwhelmed by these intense body signals, amplifies the alarm. The prefrontal cortex (rational brain) goes offline temporarily.\n\nCritically, the body sensations of panic (racing heart, breathlessness, dizziness) are physically identical to vigorous exercise - but they are interpreted as life-threatening. Interoceptive exposure therapy retrains this interpretation system.',
    interoceptionConnection: 'Panic disorder represents the most extreme form of interoceptive misinterpretation. The treatment strategy is counterintuitive but highly effective: deliberately induce mild versions of panic sensations (breathlessness through straw breathing, dizziness through head turning, heart racing through exercise) in safe contexts. This teaches the brain that these sensations are uncomfortable but not dangerous. This is the essence of interoceptive exposure therapy.',
    symptoms: ['Sudden episodes of intense fear', 'Rapid heartbeat or pounding heart', 'Shortness of breath or smothering sensation', 'Chest pain or discomfort', 'Dizziness, lightheadedness, or faintness', 'Trembling or shaking', 'Fear of losing control or dying', 'Avoidance of situations where panic occurred'],
    recommendedExerciseIds: ['box-breathing', 'cold-exposure-intro', 'straw-breathing', 'diaphragmatic-breathing', 'heartbeat-detection', 'temperature-awareness'],
    recommendedScaleId: 'gad-7',
    selfCareStrategies: [
      'Splash cold water on face during a panic attack (activates dive reflex immediately)',
      'Practice straw breathing to build tolerance for breathlessness sensations',
      'Use heartbeat detection to learn your heart is not in danger during panic',
      'Box breathing for 4 cycles can interrupt panic onset within 2 minutes',
      'Regular exposure exercises reduce panic frequency by 70-80%',
    ],
    warningSignsForProfessionalHelp: [
      'Panic attacks occur multiple times per week',
      'You avoid leaving home or normal activities due to panic fear',
      'You have been to the emergency room for panic symptoms',
      'Panic attacks are worsening in frequency or intensity',
      'You feel unable to cope with the fear of future attacks',
    ],
    resources: [
      { name: 'Panic Disorder Treatment (APA)', description: 'American Psychological Association guidelines for panic disorder treatment', url: 'https://www.apa.org/topics/anxiety/panic-disorder' },
      { name: 'CBT for Panic Protocol', description: 'Cognitive-behavioral therapy with interoceptive exposure: the gold standard treatment', url: 'https://adaa.org/understanding-anxiety/panic-disorder-agoraphobia' },
    ],
    researchCitations: [
      'Craske et al. (2008). Interoceptive exposure versus breathing retraining within CBT for panic disorder. BJCP, 47(1), 1-14.',
      'Clark, D. M. (1986). A cognitive approach to panic. Behaviour Research and Therapy, 24(4), 461-470.',
    ],
    disclaimer: 'Panic disorder is a treatable condition. If you experience recurrent panic attacks, professional cognitive-behavioral therapy with interoceptive exposure is highly effective. This information does not replace clinical treatment.',
  },
  {
    id: 'ptsd',
    name: 'PTSD & Trauma',
    subtitle: 'Reconnecting safely with your body after trauma',
    iconName: 'shield',
    color: '#6B5B95',
    prevalence: 'Affects 6-8% of the general population. Body-based therapies show significant promise as PTSD treatment adjuncts.',
    overview: 'Post-Traumatic Stress Disorder (PTSD) develops after experiencing or witnessing traumatic events. Trauma fundamentally alters the body-brain connection, creating either hypervigilance (feeling everything too intensely) or dissociation (feeling nothing at all).',
    neuroscience: 'Trauma rewires the brain\'s threat detection system. The amygdala becomes hyperreactive, constantly scanning for danger. The medial prefrontal cortex, which normally calms the amygdala, becomes underactive. The insula shows altered processing - some trauma survivors experience body signals at extreme intensity, while others dissociate entirely from body awareness.\n\nThe vagus nerve, which regulates the stress response, often shows reduced tone (lower HRV) in PTSD. Polyvagal theory (Porges) explains how the autonomic nervous system shifts between ventral vagal (safe), sympathetic (fight/flight), and dorsal vagal (freeze/shutdown) states.',
    interoceptionConnection: 'PTSD creates a paradox: the body holds trauma memories (van der Kolk\'s "the body keeps the score"), but accessing body awareness can trigger flashbacks. Interoceptive training for PTSD must be trauma-sensitive - starting with safe, neutral body areas (hands, feet), building gradually, and always maintaining a window of tolerance. The goal is to reclaim the body as a source of safety rather than threat.',
    symptoms: ['Intrusive memories or flashbacks', 'Nightmares related to trauma', 'Hypervigilance and startle response', 'Emotional numbness or dissociation', 'Avoidance of trauma reminders', 'Negative beliefs about self or world', 'Difficulty experiencing positive emotions', 'Sleep disturbance and concentration issues'],
    recommendedExerciseIds: ['slow-walking', 'progressive-body-scan', 'diaphragmatic-breathing', 'temperature-awareness', 'shoulder-check', 'quick-body-check'],
    recommendedScaleId: 'pcl-5',
    selfCareStrategies: [
      'Start with movement-based exercises (slow walking) rather than stillness practices',
      'Begin body scans with neutral areas (hands, feet) before approaching the torso',
      'Use grounding techniques (cold water, name 5 things you see) if overwhelmed',
      'Practice in short sessions (2-5 minutes) and build gradually',
      'The window of tolerance matters: stop if distress exceeds 6/10, use grounding, resume when ready',
    ],
    warningSignsForProfessionalHelp: [
      'Flashbacks or nightmares interfere with daily functioning',
      'You use substances to cope with trauma symptoms',
      'Dissociative episodes are frequent or prolonged',
      'You have thoughts of self-harm',
      'Relationships are severely impacted by trauma responses',
      'Avoidance behaviors are limiting your life',
    ],
    resources: [
      { name: 'National Center for PTSD', description: 'U.S. Department of Veterans Affairs: comprehensive PTSD information and resources', url: 'https://www.ptsd.va.gov' },
      { name: 'EMDR International Association', description: 'Information about Eye Movement Desensitization and Reprocessing therapy', url: 'https://www.emdria.org' },
      { name: 'The Body Keeps the Score', description: 'Bessel van der Kolk\'s seminal work on trauma and the body' },
    ],
    researchCitations: [
      'van der Kolk, B. (2014). The body keeps the score: Brain, mind, and body in the healing of trauma. Viking.',
      'Porges, S. W. (2011). The polyvagal theory. Norton.',
      'Frontiers in Psychiatry (2024). Interoceptive awareness and PTSD: A scoping review.',
    ],
    disclaimer: 'PTSD is a serious condition requiring professional treatment. Interoceptive practices should complement, not replace, evidence-based trauma therapy (CPT, PE, EMDR). If you have PTSD, please work with a qualified therapist.',
  },
  {
    id: 'depression',
    name: 'Depression',
    subtitle: 'Reconnecting with body signals through the fog',
    iconName: 'cloud',
    color: '#6AABCF',
    prevalence: 'Affects approximately 280 million people worldwide. Interoceptive deficits are increasingly recognized as both a symptom and maintaining factor.',
    overview: 'Major Depression involves persistent feelings of sadness, hopelessness, and loss of interest. It profoundly affects the body - altering sleep, appetite, energy, and movement. Depression often creates a disconnection from body signals that perpetuates the condition.',
    neuroscience: 'Depression involves dysregulation of the default mode network (rumination), reduced activity in reward circuits (anhedonia), and altered serotonin/norepinephrine signaling. The insula shows reduced activation in depression, contributing to flattened emotional experience and reduced body awareness.\n\nCritically, 95% of serotonin is produced in the gut. The gut-brain axis is increasingly implicated in depression. Interoceptive gut awareness may support mood regulation through this pathway.',
    interoceptionConnection: 'Depression creates interoceptive blunting - a reduced ability to detect and interpret body signals. This manifests as difficulty knowing if you are hungry, tired, cold, or emotionally activated. The body feels muted or distant. Gentle interoceptive practices can gradually restore this connection, providing a bottom-up path to emotional re-engagement that complements cognitive approaches.',
    symptoms: ['Persistent sadness or empty feeling', 'Loss of interest in activities', 'Changes in appetite and weight', 'Sleep disturbance (too much or too little)', 'Fatigue and low energy', 'Difficulty concentrating', 'Feelings of worthlessness or guilt', 'Psychomotor slowing or agitation'],
    recommendedExerciseIds: ['slow-walking', 'quick-body-check', 'gut-feeling-scan', 'emotion-body-mapping', 'breath-counting', 'diaphragmatic-breathing'],
    recommendedScaleId: 'phq-9',
    selfCareStrategies: [
      'Start with the simplest practice: 2-minute quick body check. Depression makes starting hard, so start tiny.',
      'Movement-based exercises (slow walking) often work better than stillness when motivation is low',
      'Gut feeling awareness supports serotonin pathway - 95% of serotonin is made in the gut',
      'Track even small body signals: hunger, thirst, temperature. This rebuilds the interoceptive bridge.',
      'Be gentle with yourself. Any practice at all is a win. Consistency matters more than duration.',
    ],
    warningSignsForProfessionalHelp: [
      'Depressed mood persists for more than 2 weeks',
      'You have thoughts of suicide or self-harm',
      'You cannot perform daily activities (work, self-care, relationships)',
      'You are using substances to cope',
      'Sleep or appetite changes are severe',
    ],
    resources: [
      { name: 'NIMH Depression Information', description: 'National Institute of Mental Health: comprehensive depression resources', url: 'https://www.nimh.nih.gov/health/topics/depression' },
      { name: 'WHO Depression Fact Sheet', description: 'World Health Organization global depression information', url: 'https://www.who.int/news-room/fact-sheets/detail/depression' },
    ],
    researchCitations: [
      'Paulus & Stein (2010). Interoception in anxiety and depression. Brain Structure and Function, 214(5-6), 451-463.',
      'Harshaw, C. (2015). Interoceptive dysfunction: Toward an integrated framework for understanding somatic and affective disturbance in depression. Psychological Bulletin, 141(2), 311.',
    ],
    disclaimer: 'Depression is a medical condition that responds well to evidence-based treatment. If you are experiencing depressive symptoms, please consult a healthcare provider. If you are having thoughts of self-harm, contact a crisis helpline immediately.',
  },
  {
    id: 'eating-disorders',
    name: 'Eating Disorders',
    subtitle: 'Restoring the hunger-fullness connection',
    iconName: 'heart',
    color: '#C4A484',
    prevalence: 'Affect approximately 9% of the population across their lifetime. Interoceptive deficits are a core feature and treatment target.',
    overview: 'Eating disorders (anorexia nervosa, bulimia nervosa, binge eating disorder) involve disturbed eating behaviors and body image. A hallmark feature is impaired interoception - difficulty detecting and trusting hunger, fullness, and emotional signals from the body.',
    neuroscience: 'The insular cortex shows significantly reduced activation in eating disorder patients during interoceptive tasks. This contributes to impaired hunger-satiety signaling, disconnection from emotional body states, and distorted body perception. The EDI-2 (Eating Disorder Inventory) interoceptive awareness subscale is one of the strongest predictors of eating disorder severity.',
    interoceptionConnection: 'Eating disorders fundamentally disrupt the interoceptive hunger-fullness channel. Restriction overrides hunger signals until they are silenced. Binging disconnects from fullness signals. Purging scrambles digestive interoception entirely. Recovery requires rebuilding trust in body signals - learning to hear, believe, and respond to hunger and fullness again. This is painstaking but essential work.',
    symptoms: ['Distorted body image', 'Restriction, binging, or purging behaviors', 'Inability to recognize hunger or fullness', 'Preoccupation with food, weight, or shape', 'Using food to manage emotions', 'Social withdrawal around meals', 'Physical consequences (fatigue, dizziness, GI issues)'],
    recommendedExerciseIds: ['hunger-fullness-check', 'gut-feeling-scan', 'digestive-awareness', 'emotion-body-mapping', 'quick-body-check', 'breath-counting'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Practice hunger-fullness checks before, during, and after meals',
      'Use the 1-10 hunger scale to rebuild awareness of body signals',
      'Gut feeling awareness helps reconnect with your enteric nervous system',
      'Emotion-body mapping distinguishes physical hunger from emotional hunger',
      'Work with a therapist who specializes in eating disorders alongside self-practice',
    ],
    warningSignsForProfessionalHelp: [
      'Eating behaviors are causing physical health problems',
      'You cannot eat without extreme anxiety or guilt',
      'Binge-purge cycles are frequent or escalating',
      'You have rapid weight loss or gain',
      'You are isolating due to food or body shame',
      'Dizziness, fainting, or cardiac symptoms occur',
    ],
    resources: [
      { name: 'NEDA (National Eating Disorders Association)', description: 'Screening tools, treatment finder, and support resources', url: 'https://www.nationaleatingdisorders.org' },
      { name: 'BEAT (UK)', description: 'UK eating disorders charity with helpline and support groups', url: 'https://www.beateatingdisorders.org.uk' },
    ],
    researchCitations: [
      'Merwin et al. (2010). Interoceptive awareness in eating disorders. Eating Behaviors, 11(1), 1-5.',
      'Khalsa et al. (2015). Interoceptive awareness declines with age in eating disorders. PLoS ONE, 10(8).',
      'BMC Psychiatry (2024). Recognition of interoceptive states in eating disorders.',
    ],
    disclaimer: 'Eating disorders are serious mental health conditions. Interoceptive exercises should only be practiced as part of a comprehensive treatment plan under professional guidance. If you have an active eating disorder, please work with a specialized treatment team.',
  },
  {
    id: 'chronic-pain',
    name: 'Chronic Pain',
    subtitle: 'Changing your relationship with persistent pain',
    iconName: 'activity',
    color: '#F0C05A',
    prevalence: 'Affects 20% of adults globally. Mindfulness-based interoceptive approaches reduce pain intensity by 20-30% and pain-related distress by 40-50%.',
    overview: 'Chronic pain persists beyond normal healing time (typically 3+ months). It involves central sensitization - the nervous system amplifying pain signals. Interoceptive training offers a paradoxical but effective approach: mindful attention to pain can reduce its intensity and impact.',
    neuroscience: 'Chronic pain involves central sensitization - the spinal cord and brain amplify pain signals beyond what peripheral damage warrants. The insular cortex, which processes pain, can become hyper-responsive, creating pain without adequate peripheral input. The pain matrix (insula, anterior cingulate, somatosensory cortex) shows altered connectivity in chronic pain conditions.\n\nCritically, trying to suppress or ignore pain increases insula activation and amplifies the signal. Mindful attention activates the prefrontal cortex, which can modulate pain processing from the top down.',
    interoceptionConnection: 'The pain attention paradox: suppressing pain makes it worse, while mindful observation can reduce it. Interoceptive training for chronic pain teaches you to observe pain with curiosity (What is the exact location? Quality? Edge? Does it change?), which activates descending pain modulation pathways from the prefrontal cortex. It also expands awareness to non-pain body signals, giving the brain a more balanced internal picture.',
    symptoms: ['Persistent pain lasting 3+ months', 'Pain that varies in intensity but rarely fully resolves', 'Fatigue and sleep disruption', 'Mood changes (frustration, depression)', 'Reduced physical activity', 'Avoidance of pain-associated activities', 'Difficulty concentrating'],
    recommendedExerciseIds: ['progressive-body-scan', 'focused-body-scan', 'tension-release', 'diaphragmatic-breathing', 'warm-hands', 'warmth-coolness-scan', 'slow-walking'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Use focused body scan on pain areas: map the exact edges, quality, and changes over time',
      'PMR (progressive muscle relaxation) reduces surrounding muscle tension that amplifies pain',
      'Warm hands biofeedback can reduce pain by promoting blood flow and relaxation',
      'Spend 3 minutes daily noticing pain-free body areas to give your brain a balanced picture',
      'Temperature awareness exercises can shift attention and activate descending pain modulation',
    ],
    warningSignsForProfessionalHelp: [
      'Pain is new, sudden, or significantly worsening',
      'Pain prevents essential daily activities',
      'You are increasing medication doses without medical guidance',
      'Pain is accompanied by neurological symptoms (numbness, weakness, bowel/bladder changes)',
      'Depression or hopelessness related to pain is increasing',
    ],
    resources: [
      { name: 'American Chronic Pain Association', description: 'Self-management tools and support for chronic pain', url: 'https://theacpa.org' },
      { name: 'Pain Management Best Practices (HHS)', description: 'U.S. federal guidelines for comprehensive pain management', url: 'https://www.hhs.gov/ash/advisory-committees/pain/reports/index.html' },
    ],
    researchCitations: [
      'Zeidan et al. (2015). Mindfulness meditation-based pain relief employs different neural mechanisms than placebo. Journal of Neuroscience, 35(46), 15307-15325.',
      'Hilton et al. (2017). Mindfulness meditation for chronic pain: systematic review and meta-analysis. Annals of Behavioral Medicine, 51(2), 199-213.',
    ],
    disclaimer: 'Interoceptive practices for chronic pain should complement, not replace, medical pain management. Always consult your healthcare provider about your pain management plan.',
  },
  {
    id: 'alexithymia',
    name: 'Alexithymia',
    subtitle: 'When you can\'t name what you feel',
    iconName: 'help-circle',
    color: '#9BA3C2',
    prevalence: 'Affects approximately 10% of the general population, with higher rates in autism spectrum conditions. Strongly associated with interoceptive deficits.',
    overview: 'Alexithymia is difficulty identifying, describing, and distinguishing emotions. It is not a disorder itself but a trait that appears across many conditions. People with alexithymia often say "I don\'t know what I\'m feeling" or experience emotions as confusing physical sensations without emotional labels.',
    neuroscience: 'Alexithymia is associated with reduced insular cortex activation during emotional processing and reduced connectivity between the insula and the prefrontal cortex. This means body signals that carry emotional information (chest tightness = anxiety, warmth = joy) reach awareness but are not interpreted correctly.\n\nThe anterior insula is specifically implicated - it is the brain region that transforms raw body signals into conscious emotional experiences. In alexithymia, this translation step is impaired.',
    interoceptionConnection: 'Alexithymia is fundamentally an interoceptive translation problem. The body produces emotional signals, but the brain cannot decode them. Interoceptive training directly addresses this by systematically teaching: Step 1 (Notice) - detect body sensations; Step 2 (Describe) - label them with precise vocabulary; Step 3 (Connect) - link body sensations to emotional states. This is Kelly Mahler\'s evidence-based 3-step framework.',
    symptoms: ['Difficulty identifying feelings', 'Difficulty describing feelings to others', 'Confusion about whether sensations are emotions or physical symptoms', 'Limited imagination or fantasy life', 'Externally-oriented thinking style', 'Difficulty understanding others\' emotions', 'Emotional outbursts without understanding their cause', 'Tendency toward somatic complaints'],
    recommendedExerciseIds: ['emotion-body-mapping', 'heartbeat-emotion', 'progressive-body-scan', 'gut-feeling-scan', 'focused-body-scan', 'temperature-awareness', 'quick-body-check'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Emotion-body mapping is your primary exercise: deliberately connecting body sensations to emotion labels',
      'Build a personal sensation vocabulary: tight, loose, warm, cool, heavy, light, buzzing, pulsing, numb',
      'Use daily check-ins to practice naming what you feel, even if you start with "I notice my shoulders are tense"',
      'Heartbeat-emotion linking directly trains the insula translation pathway',
      'Keep a body-emotion journal: "When I felt [sensation], I was experiencing [situation/emotion]"',
    ],
    warningSignsForProfessionalHelp: [
      'Difficulty identifying emotions is causing relationship problems',
      'You experience frequent unexplained physical symptoms',
      'Emotional outbursts feel uncontrollable and confusing',
      'You feel fundamentally disconnected from yourself or others',
      'Alexithymia is accompanied by depression or anxiety',
    ],
    resources: [
      { name: 'Kelly Mahler\'s Interoception Resources', description: 'Evidence-based curriculum for developing interoceptive awareness and emotional identification', url: 'https://www.kelly-mahler.com' },
      { name: 'TAS-20 Self-Assessment', description: 'Toronto Alexithymia Scale: a validated 20-item self-report measure for alexithymia' },
    ],
    researchCitations: [
      'Brewer et al. (2016). Can neuroimaging studies of alexithymia inform a psychological model? Neuroscience & Biobehavioral Reviews, 61, 64-80.',
      'Murphy et al. (2017). Interoception and psychopathology. Trends in Cognitive Sciences, 21(8), 601-613.',
      'Mahler, K. (2017). Interoception: The Eighth Sensory System. AAPC Publishing.',
    ],
    disclaimer: 'Alexithymia is a trait, not a diagnosis. If difficulty identifying emotions is significantly impacting your quality of life, a psychologist can help with assessment and tailored interventions.',
  },
];

export function getConditionById(id: string): Condition | undefined {
  return CONDITIONS.find(c => c.id === id);
}
