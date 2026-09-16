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
    prevalence: 'A common anxiety condition involving persistent worry and changes in arousal, attention, and body awareness.',
    overview: 'Generalized Anxiety Disorder (GAD) involves persistent, excessive worry about various aspects of life that is difficult to control. It can also affect arousal, attention, and the way body sensations are noticed.',
    neuroscience: 'Anxiety can involve changes in threat attention, arousal, and the way ambiguous body sensations are interpreted. A sensation such as a racing heart may be noticed as alarming, which can add to arousal and make further sensations easier to notice. These patterns vary across people and are not diagnoses that can be made from a wearable or a single exercise.',
    interoceptionConnection: 'Some people with anxiety notice body signals intensely, while others find them difficult to access. Practice can create space to describe a sensation before deciding what it means, such as considering movement, emotion, stress, or other everyday context.',
    symptoms: ['Persistent worry difficult to control', 'Restlessness or feeling keyed up', 'Muscle tension (especially shoulders, jaw)', 'Sleep disturbance', 'Difficulty concentrating', 'Irritability', 'Fatigue despite adequate rest', 'Physical symptoms: headaches, stomach issues, rapid heartbeat'],
    recommendedExerciseIds: ['box-breathing', 'diaphragmatic-breathing', '478-breathing', 'progressive-body-scan', 'tension-release', 'heartbeat-detection', 'cold-exposure-intro', 'shoulder-check'],
    recommendedScaleId: 'gad-7',
    selfCareStrategies: [
      'Try a few comfortable rounds of paced breathing when worry rises, and stop if it feels uncomfortable',
      'Do a brief body check at a time that fits your day, without treating sensations as warnings',
      'Use temperature awareness as a grounding exercise if it feels comfortable',
      'Track anxiety patterns with daily check-ins to identify triggers',
      'Try a neutral grounding cue, such as naming a few things you can see, when attention feels pulled into worry',
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
    subtitle: 'Understanding your body\'s alarm responses',
    iconName: 'zap',
    color: '#E85D5D',
    prevalence: 'A condition involving recurrent, unexpected panic attacks and concern about having more of them.',
    overview: 'Panic Disorder involves recurrent, unexpected panic attacks - sudden surges of intense fear accompanied by physical symptoms. The core mechanism is catastrophic misinterpretation of normal body sensations.',
    neuroscience: 'Panic can bring a rapid combination of fear, changes in breathing and heart rate, dizziness, and intense attention to the body. The sensations can feel dangerous even when a medical emergency is not present. New or severe physical symptoms should be assessed by a healthcare professional rather than assumed to be panic.',
    interoceptionConnection: 'A clinician may use carefully planned interoceptive exposure within CBT for panic. Outside that setting, the safer starting point is to notice sensations, orient to the present, and choose a grounding strategy without deliberately provoking intense symptoms.',
    symptoms: ['Sudden episodes of intense fear', 'Rapid heartbeat or pounding heart', 'Shortness of breath or smothering sensation', 'Chest pain or discomfort', 'Dizziness, lightheadedness, or faintness', 'Trembling or shaking', 'Fear of losing control or dying', 'Avoidance of situations where panic occurred'],
    recommendedExerciseIds: ['box-breathing', 'orienting-response', 'somatic-grounding', 'diaphragmatic-breathing', 'heartbeat-detection', 'temperature-awareness'],
    recommendedScaleId: 'gad-7',
    selfCareStrategies: [
      'Use a comfortable grounding practice, such as orienting to the room, when panic rises',
      'Try gentle breathing only if focusing on breath feels safe and does not increase distress',
      'Describe sensations using neutral words instead of deciding immediately what they mean',
      'Seek professional guidance before attempting exercises that intentionally change breathing or heart rate',
      'Track situations and responses to discuss with a qualified clinician if panic keeps returning',
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
      { name: 'CBT for Panic Protocol', description: 'Information about cognitive-behavioral therapy and clinician-guided interoceptive exposure', url: 'https://adaa.org/understanding-anxiety/panic-disorder-agoraphobia' },
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
    prevalence: 'A trauma-related condition that can affect threat responses, attention, memory, mood, and body awareness.',
    overview: 'Post-Traumatic Stress Disorder (PTSD) develops after experiencing or witnessing traumatic events. Trauma fundamentally alters the body-brain connection, creating either hypervigilance (feeling everything too intensely) or dissociation (feeling nothing at all).',
    neuroscience: 'After trauma, systems involved in threat detection, memory, attention, and body awareness can respond differently. Some people experience heightened vigilance, while others experience numbness or dissociation. These responses are individual, and body sensations or wearable data cannot establish a trauma diagnosis.',
    interoceptionConnection: 'Body-focused attention can feel supportive for some people and activating for others after trauma. If you choose to practice, begin with external orientation or neutral sensations, keep sessions brief, and stop when distress rises. Trauma-focused care should be guided by a qualified professional.',
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
    prevalence: 'A common mood condition that can affect energy, sleep, appetite, motivation, attention, and body awareness.',
    overview: 'Major Depression involves persistent feelings of sadness, hopelessness, and loss of interest. It can affect sleep, appetite, energy, movement, and the way body signals are noticed.',
    neuroscience: 'Depression can involve changes in attention, reward, sleep, energy, and the way emotions are experienced in the body. Research on brain and gut signaling is ongoing, but no single pathway explains depression and body awareness practice is not a substitute for treatment.',
    interoceptionConnection: 'Some people experiencing depression describe body signals as muted or distant, while others notice discomfort intensely. Gentle practices can offer a brief way to check in with hunger, thirst, temperature, tension, or breathing alongside professional and social support.',
    symptoms: ['Persistent sadness or empty feeling', 'Loss of interest in activities', 'Changes in appetite and weight', 'Sleep disturbance (too much or too little)', 'Fatigue and low energy', 'Difficulty concentrating', 'Feelings of worthlessness or guilt', 'Psychomotor slowing or agitation'],
    recommendedExerciseIds: ['slow-walking', 'quick-body-check', 'gut-feeling-scan', 'emotion-body-mapping', 'breath-counting', 'diaphragmatic-breathing'],
    recommendedScaleId: 'phq-9',
    selfCareStrategies: [
      'Start with the simplest practice: 2-minute quick body check. Depression makes starting hard, so start tiny.',
      'Movement-based exercises (slow walking) often work better than stillness when motivation is low',
      'Notice hunger, thirst, temperature, or tension without treating one sensation as a complete explanation of mood',
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
    prevalence: 'Serious mental health conditions that can affect eating, body image, health, and the experience of hunger or fullness.',
    overview: 'Eating disorders (anorexia nervosa, bulimia nervosa, binge eating disorder) involve disturbed eating behaviors and body image. A hallmark feature is impaired interoception - difficulty detecting and trusting hunger, fullness, and emotional signals from the body.',
    neuroscience: 'Research has found differences in body processing and body image across eating disorder presentations, but experiences vary widely. Hunger and fullness signals can also be affected by restriction, bingeing, purging, stress, medication, and physical health.',
    interoceptionConnection: 'Body-focused exercises around food can be difficult or triggering. Do not use this app to override a meal plan, judge your body, or make eating decisions. Work with an eating-disorder specialist for any hunger, fullness, or body-image practice.',
    symptoms: ['Distorted body image', 'Restriction, binging, or purging behaviors', 'Inability to recognize hunger or fullness', 'Preoccupation with food, weight, or shape', 'Using food to manage emotions', 'Social withdrawal around meals', 'Physical consequences (fatigue, dizziness, GI issues)'],
    recommendedExerciseIds: ['orienting-response', 'somatic-grounding', 'emotion-body-mapping', 'quick-body-check', 'breath-counting'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Use body-focused practices only when they support your clinician-approved care plan',
      'Pause any exercise that increases urges, body checking, or distress',
      'Choose neutral grounding practices that do not focus on food or body shape',
      'Use emotion-body mapping only if it feels safe and is supported by your care team',
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
    prevalence: 'A common long-lasting health experience that can affect movement, sleep, attention, mood, and daily activities.',
    overview: 'Chronic pain can continue beyond an expected healing period and may involve changes in the nervous system, the body, and the context around pain. Body awareness practices may help some people observe patterns, but they do not explain the cause of pain or replace medical care.',
    neuroscience: 'Long-lasting pain can involve changes in how signals are processed across the body and brain. Pain is real even when a scan does not show a simple explanation, and its causes differ across people. Avoiding, suppressing, or focusing on pain can each feel different at different times.',
    interoceptionConnection: 'If your clinician agrees that body awareness is appropriate, you might describe a sensation with curiosity, including its location, quality, and changes over time. You can also notice comfortable or neutral areas. Stop if attention makes symptoms worse and discuss changes with your care team.',
    symptoms: ['Persistent pain lasting 3+ months', 'Pain that varies in intensity but rarely fully resolves', 'Fatigue and sleep disruption', 'Mood changes (frustration, depression)', 'Reduced physical activity', 'Avoidance of pain-associated activities', 'Difficulty concentrating'],
    recommendedExerciseIds: ['progressive-body-scan', 'focused-body-scan', 'tension-release', 'diaphragmatic-breathing', 'warm-hands', 'warmth-coolness-scan', 'slow-walking'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Use focused body scan on pain areas: map the exact edges, quality, and changes over time',
      'PMR (progressive muscle relaxation) may ease surrounding muscle tension for some people',
      'Use warmth or temperature awareness only if it has been cleared as safe for you',
      'Spend a short period noticing neutral or comfortable body areas if that feels supportive',
      'Discuss any new, worsening, or unusual pain with a healthcare professional',
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
    prevalence: 'A trait involving difficulty identifying, describing, or distinguishing emotions. It can appear alongside many different experiences and conditions.',
    overview: 'Alexithymia is difficulty identifying, describing, and distinguishing emotions. It is not a disorder itself but a trait that appears across many conditions. People with alexithymia often say "I don\'t know what I\'m feeling" or experience emotions as confusing physical sensations without emotional labels.',
    neuroscience: 'Studies have linked alexithymia with differences in emotional processing and body awareness, but the underlying patterns vary. A sensation such as chest tightness can occur with many emotions and physical states, so it should be explored rather than assigned a fixed meaning.',
    interoceptionConnection: 'A Notice, Describe, Connect sequence can provide a practical way to explore body sensations and emotions: detect a sensation, describe its qualities, and consider possible feelings or context. Treat the connection as a personal reflection, not a clinical interpretation.',
    symptoms: ['Difficulty identifying feelings', 'Difficulty describing feelings to others', 'Confusion about whether sensations are emotions or physical symptoms', 'Limited imagination or fantasy life', 'Externally-oriented thinking style', 'Difficulty understanding others\' emotions', 'Emotional outbursts without understanding their cause', 'Tendency toward somatic complaints'],
    recommendedExerciseIds: ['emotion-body-mapping', 'heartbeat-emotion', 'progressive-body-scan', 'gut-feeling-scan', 'focused-body-scan', 'temperature-awareness', 'quick-body-check'],
    recommendedScaleId: null,
    selfCareStrategies: [
      'Emotion-body mapping is your primary exercise: deliberately connecting body sensations to emotion labels',
      'Build a personal sensation vocabulary: tight, loose, warm, cool, heavy, light, buzzing, pulsing, numb',
      'Use daily check-ins to practice naming what you feel, even if you start with "I notice my shoulders are tense"',
      'Explore whether a heartbeat sensation is connected with a feeling or context, without assuming one fixed meaning',
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
