export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  readTimeMinutes: number;
  content: string;
  iconName: string;
}

export type ArticleCategory = 'getting-started' | 'science' | 'conditions' | 'techniques' | 'wellness';

export const ARTICLE_CATEGORIES: Record<ArticleCategory, { label: string; icon: string }> = {
  'getting-started': { label: 'Getting Started', icon: 'compass' },
  'science': { label: 'Science', icon: 'book-open' },
  'conditions': { label: 'Conditions', icon: 'heart' },
  'techniques': { label: 'Techniques', icon: 'target' },
  'wellness': { label: 'Wellness', icon: 'sun' },
};

export const ARTICLES: Article[] = [
  {
    id: 'what-is-interoception',
    title: 'What Is Interoception?',
    subtitle: 'Your hidden eighth sense explained',
    category: 'getting-started',
    readTimeMinutes: 5,
    iconName: 'compass',
    content: `Interoception is your body's ability to sense what's happening inside. While most people know about the five senses (sight, hearing, touch, taste, smell), interoception is often called the "eighth sense" - the ability to perceive internal body signals like heartbeat, hunger, thirst, temperature, and muscle tension.\n\nUnlike external senses that tell you about the world around you, interoception tells you about the world within you. It's the feeling of butterflies in your stomach before a presentation, the heaviness in your chest when you're sad, or the warmth that spreads through you when you feel loved.\n\nResearch shows that interoceptive awareness - the ability to accurately detect and interpret these internal signals - is closely linked to emotional intelligence, decision-making, and mental health. People with better interoception tend to:\n\n- Recognize emotions earlier and more accurately\n- Make better intuitive decisions\n- Manage stress more effectively\n- Have stronger empathy for others\n- Experience better overall wellbeing\n\nThe good news? Interoception is a skill that can be trained and improved. Through regular practice, you can learn to better detect, understand, and respond to your body's signals - and in doing so, significantly improve your mental health and quality of life.`,
  },
  {
    id: 'science-behind-body-awareness',
    title: 'The Neuroscience of Body Awareness',
    subtitle: 'How your brain maps internal signals',
    category: 'science',
    readTimeMinutes: 7,
    iconName: 'book-open',
    content: `The insular cortex, a region deep within the brain, serves as the primary hub for interoceptive processing. This remarkable structure receives signals from every organ in your body and creates a unified "body map" of your internal state.\n\nWhen you practice interoception, you're literally strengthening the neural pathways between your body and your insula. Brain imaging studies have shown that experienced meditators have a thicker insular cortex and more precise body awareness compared to non-meditators.\n\nThe process works through several key pathways:\n\n1. Afferent nerve fibers carry signals from organs to the brainstem\n2. The brainstem relays information to the thalamus\n3. The thalamus routes signals to the insular cortex\n4. The insula integrates these signals into conscious awareness\n\nWhat's fascinating is that the anterior insula doesn't just process raw body data - it interprets it in the context of your emotions, memories, and expectations. This is why the same physical sensation (like a racing heart) can feel exciting at a concert but terrifying during a panic attack.\n\nRegular interoceptive practice helps your brain create more accurate interpretations of body signals, reducing the likelihood of misinterpreting normal sensations as dangerous. This is particularly valuable for people with anxiety disorders, where the brain often over-interprets body signals as threats.`,
  },
  {
    id: 'interoception-and-anxiety',
    title: 'Interoception & Anxiety',
    subtitle: 'Breaking the anxiety-body signal cycle',
    category: 'conditions',
    readTimeMinutes: 6,
    iconName: 'heart',
    content: `Anxiety has a complex relationship with interoception. People with anxiety disorders often have heightened interoceptive sensitivity - they notice body sensations more readily than others. However, they also tend to misinterpret these sensations, often perceiving normal body signals as signs of danger.\n\nThis creates a vicious cycle: you notice your heart beating faster, interpret it as something wrong, feel more anxious, which makes your heart beat even faster. Understanding this cycle is the first step to breaking it.\n\nInteroceptive training for anxiety works by:\n\n1. Teaching you that body sensations are information, not threats\n2. Building tolerance for uncomfortable but normal sensations\n3. Helping you distinguish between anxiety signals and genuine danger signals\n4. Giving you tools to regulate your nervous system through breath and body awareness\n\nStudies have shown that interoceptive exposure - deliberately inducing and sitting with anxiety-related body sensations in a safe environment - can significantly reduce anxiety sensitivity. For example, spinning to induce dizziness, or breathing through a straw to create mild breathlessness, teaches your brain that these sensations are uncomfortable but not dangerous.\n\nThe key is gradual, compassionate exposure combined with accurate body signal interpretation. Over time, your brain learns to respond to body sensations with curiosity rather than fear.`,
  },
  {
    id: 'body-scan-guide',
    title: 'Mastering the Body Scan',
    subtitle: 'A complete guide to systematic awareness',
    category: 'techniques',
    readTimeMinutes: 8,
    iconName: 'target',
    content: `The body scan is perhaps the most fundamental interoceptive practice. It systematically moves your attention through different body regions, training your ability to detect and describe internal sensations.\n\nHere's how to develop a deeper body scan practice:\n\nLevel 1: Detection\nSimply notice whether you feel anything in each body area. Can you detect any sensation at all? Some areas may feel "blank" at first - that's normal. With practice, these blank areas will start to come alive.\n\nLevel 2: Description\nOnce you can detect sensations, practice describing them. Use specific vocabulary: tingling, pulsing, heaviness, lightness, warmth, coolness, tightness, openness, buzzing, numbness, pressure, aching, flowing.\n\nLevel 3: Differentiation\nLearn to distinguish between different types of sensations in the same area. Your chest might simultaneously hold tension from stress, warmth from breathing, and a subtle pulse from your heartbeat.\n\nLevel 4: Dynamic Awareness\nNotice how sensations change moment-to-moment. They are rarely static. Tension may pulse, warmth may spread, tingling may intensify and fade. This dynamic quality tells you your body is alive and responsive.\n\nLevel 5: Whole-Body Integration\nThe ultimate goal is to maintain awareness of your entire body simultaneously - feeling it as one interconnected, sensing organism. This "embodied awareness" is the foundation of interoceptive mastery.\n\nPractice daily, even for just 5 minutes. Consistency matters more than duration. Your body scan will naturally deepen over weeks and months of regular practice.`,
  },
  {
    id: 'breathing-and-nervous-system',
    title: 'Breath: Your Nervous System Remote',
    subtitle: 'How breathing controls your stress response',
    category: 'science',
    readTimeMinutes: 6,
    iconName: 'book-open',
    content: `Your breath is the only autonomic function you can consciously control. This makes it a powerful tool for regulating your nervous system and, by extension, your emotional state.\n\nThe mechanism is elegantly simple: when you inhale, your heart rate increases slightly (sympathetic activation). When you exhale, your heart rate decreases (parasympathetic activation). By manipulating the ratio of inhale to exhale, you can shift your entire nervous system.\n\nCalming Pattern (longer exhale):\nInhale 4 counts, exhale 6-8 counts. This activates the vagus nerve and parasympathetic nervous system, reducing cortisol, lowering heart rate, and promoting calm.\n\nEnergizing Pattern (longer inhale):\nInhale 6 counts, exhale 3 counts. This creates sympathetic activation, increasing alertness and energy.\n\nBalancing Pattern (equal ratio):\nInhale 4 counts, exhale 4 counts (box breathing). This creates nervous system equilibrium, ideal for focus and emotional regulation.\n\nThe key insight from interoceptive science is that you can feel these shifts happening in real-time. As you practice different breathing patterns, notice: Does your heart rate change? Do your muscles soften or tense? Does your stomach relax? Does your mind quiet?\n\nThis awareness transforms breathing from a mechanical exercise into a sophisticated self-regulation tool. You're not just breathing differently - you're learning to feel how your breath reshapes your entire internal landscape.`,
  },
  {
    id: 'ptsd-and-body',
    title: 'PTSD & the Disconnected Body',
    subtitle: 'How trauma affects body awareness',
    category: 'conditions',
    readTimeMinutes: 7,
    iconName: 'heart',
    content: `Trauma often creates a disconnection between mind and body. People with PTSD may either become hyperaware of body sensations (interpreting everything as danger) or may shut down body awareness entirely (dissociation) as a protective mechanism.\n\nNeither extreme is healthy. Hyperawareness creates constant anxiety, while disconnection prevents you from receiving important body signals about your needs, emotions, and safety.\n\nInteroceptive training for trauma recovery focuses on:\n\n1. Establishing Safety First\nBefore exploring body sensations, it's essential to establish a sense of safety. This might mean having a grounding object, practicing in a comfortable space, or working with a therapist.\n\n2. Gentle Re-engagement\nSlowly reconnecting with body sensations, starting with neutral or pleasant areas (like noticing warmth in your hands) before approaching areas that may hold trauma.\n\n3. Window of Tolerance\nLearning to stay within your "window of tolerance" - the zone where you can experience body sensations without becoming overwhelmed. If a body scan triggers distress, it's okay to open your eyes, ground yourself, and try again later.\n\n4. Reclaiming Agency\nThe core healing in trauma recovery is reclaiming a sense of agency over your body. Interoceptive practices give you tools to notice, name, and navigate body sensations on your own terms.\n\nImportant: If you have PTSD or trauma history, please work with a qualified therapist alongside your interoceptive practice. These practices are complementary to professional treatment, not a replacement for it.`,
  },
  {
    id: 'daily-practice-tips',
    title: 'Building a Daily Practice',
    subtitle: 'Habits that make awareness stick',
    category: 'getting-started',
    readTimeMinutes: 5,
    iconName: 'compass',
    content: `The most effective interoceptive practice is the one you actually do. Here are evidence-based strategies for building a sustainable daily practice:\n\nStart Tiny\nBegin with just 2-3 minutes per day. This is short enough that your brain won't resist it. Once the habit is established, you can naturally extend the duration.\n\nAnchor to Existing Habits\nLink your practice to something you already do daily. Examples: body scan while waiting for coffee to brew, breath awareness during your morning commute, tension check during lunch break.\n\nSame Time, Same Place\nConsistency of context helps build automatic habits. When you practice at the same time and place, your brain starts to associate that context with body awareness.\n\nTrack Your Practice\nSimply recording that you practiced (not how well) reinforces the habit loop. This app's check-in feature is designed to help with this.\n\nCelebrate Small Wins\nNoticed your jaw was clenched and released it? That IS interoception. Felt butterflies before a meeting? You detected a body signal. These everyday moments count.\n\nBe Patient with Plateaus\nInteroceptive development isn't linear. You might notice rapid improvement in the first few weeks, then feel like you're plateauing. Keep going - the neural rewiring is happening beneath the surface.\n\nRemember: You're not trying to achieve a special state. You're simply learning to notice what's already happening in your body. It's always there, waiting for your attention.`,
  },
  {
    id: 'emotional-regulation',
    title: 'Body Signals & Emotional Regulation',
    subtitle: 'Using body awareness to manage emotions',
    category: 'wellness',
    readTimeMinutes: 6,
    iconName: 'sun',
    content: `Every emotion has a physical signature. Anger tightens the jaw and heats the face. Sadness weighs down the chest. Joy lightens the body and opens the posture. Fear quickens the breath and churns the stomach.\n\nBy learning to detect these physical signatures early, you gain a crucial advantage: you can respond to emotions before they overwhelm you.\n\nThe RAIN approach using body awareness:\n\nR - Recognize: "I notice my shoulders are tensing and my breathing is shallow."\nA - Allow: "This tension is here. I don't need to fight it or fix it immediately."\nI - Investigate: "Where exactly is the tension? What emotion might it be connected to?"\nN - Nurture: "I'll take three deep breaths and soften this area with compassion."\n\nThis body-first approach to emotional regulation is powerful because:\n\n1. Body signals arrive before conscious emotion (often by seconds)\n2. Physical interventions (breathing, relaxation) work faster than cognitive strategies\n3. You can practice body regulation anywhere, anytime, without anyone knowing\n4. It bypasses the thinking mind, which often makes emotions worse with rumination\n\nPractical techniques:\n- Belly breathing for 90 seconds can interrupt the anger response\n- Unclenching your jaw and hands sends a "safe" signal to your brain\n- Placing your hand on your heart activates self-soothing circuits\n- Splashing cold water on your face triggers the dive reflex, instantly calming your nervous system\n\nThe goal isn't to suppress emotions but to create space between the body signal and your response. In that space lives your freedom to choose how to react.`,
  },
  {
    id: 'sleep-and-interoception',
    title: 'Better Sleep Through Body Awareness',
    subtitle: 'Wind down with interoceptive techniques',
    category: 'wellness',
    readTimeMinutes: 5,
    iconName: 'sun',
    content: `Insomnia and poor sleep are often rooted in an overactive nervous system. Your body is stuck in "alert mode" when it needs to shift into "rest mode." Interoceptive practices are remarkably effective at facilitating this shift.\n\nPre-Sleep Body Scan Protocol:\n\n1. Progressive Release (5 minutes)\nLying in bed, systematically tense and release each muscle group from toes to head. This physical release signals your nervous system that it's safe to let go.\n\n2. Temperature Awareness (3 minutes)\nNotice the warmth of your body against the bed. Feel the coolness of the pillow. This gentle sensory focus displaces anxious thoughts.\n\n3. Gravity Meditation (3 minutes)\nFeel the weight of your body pressing into the mattress. With each exhale, imagine sinking deeper. Let gravity do the work of relaxation.\n\n4. Heartbeat Lullaby (2 minutes)\nLocate your heartbeat and follow its steady rhythm. This internal metronome is your body's own sleep music.\n\nWhy it works:\n- Interoceptive focus is incompatible with rumination (you can't worry AND feel your heartbeat)\n- The practices activate the parasympathetic nervous system\n- Body awareness creates a sense of safety needed for sleep\n- The routine itself becomes a powerful sleep cue over time\n\nConsistency is key. Practice this protocol every night for two weeks and your brain will start associating body awareness with sleepiness. You're essentially creating a body-based sleep trigger.`,
  },
  {
    id: 'chronic-pain-awareness',
    title: 'Interoception & Chronic Pain',
    subtitle: 'Changing your relationship with pain',
    category: 'conditions',
    readTimeMinutes: 7,
    iconName: 'heart',
    content: `Chronic pain is one of the most challenging interoceptive experiences. The pain signals are persistent, often overwhelming, and can dominate your awareness to the exclusion of everything else.\n\nParadoxically, interoceptive training can help - not by eliminating pain, but by changing your relationship with it.\n\nThe Pain Attention Paradox:\nResearch shows that trying to ignore pain often makes it worse. The brain interprets suppression as a sign that the pain must be dangerous, which amplifies the signal. Instead, mindful attention to pain - observing it with curiosity rather than fear - can actually reduce its intensity.\n\nPractical approaches:\n\n1. Pain Mapping: Precisely locate the pain. Where exactly are its borders? Is it in the surface or deep? Does it have a shape? This detailed observation often reveals that the "wall of pain" is actually more specific than you thought.\n\n2. Quality Assessment: What kind of pain is it? Sharp, dull, burning, aching, throbbing? Notice that it changes quality over time. Nothing is truly constant.\n\n3. Companion Sensations: Notice what exists alongside the pain. Warmth? Tingling? Areas of comfort? Expanding your awareness to include non-pain sensations gives your brain a more balanced picture.\n\n4. The 3-Minute Reset: Spend 3 minutes noticing a pain-free area of your body. This isn't ignoring pain - it's training your brain to maintain awareness of your whole body, not just the painful parts.\n\nImportant: Interoceptive practices for chronic pain should complement, not replace, medical treatment. Always consult your healthcare provider.`,
  },
  {
    id: 'gut-brain-connection',
    title: 'The Gut-Brain Axis',
    subtitle: 'Your second brain and mental health',
    category: 'science',
    readTimeMinutes: 6,
    iconName: 'book-open',
    content: `Your gut contains approximately 500 million neurons - more than your spinal cord. This "enteric nervous system" communicates bidirectionally with your brain through the vagus nerve, creating what scientists call the gut-brain axis.\n\nThis isn't just metaphorical. Your gut literally thinks and feels:\n\n- 95% of your body's serotonin (the "happiness" neurotransmitter) is produced in the gut\n- Gut bacteria produce neurotransmitters that influence mood, anxiety, and cognition\n- The vagus nerve sends 80% of its signals from gut to brain (not the other way around)\n- "Gut feelings" are real interoceptive signals that influence decision-making\n\nInteroceptive gut awareness involves:\n\n1. Hunger & Satiety: Can you distinguish true hunger from emotional hunger? True hunger builds gradually and responds to any food. Emotional hunger is sudden and craves specific foods.\n\n2. Digestive Signals: Notice how different foods affect your gut. Bloating, comfort, energy, or lethargy are all interoceptive data points.\n\n3. Emotional Gut Responses: Pay attention to "butterflies," knots, or sinking feelings. These are often your gut's early warning system for emotional experiences.\n\n4. Gut-Mood Connection: Track whether digestive comfort correlates with mood. Many people find that when their gut is calm, their mind is calmer too.\n\nCultivating gut awareness is one of the most practical forms of interoception because it directly informs daily decisions about eating, stress management, and emotional wellbeing.`,
  },
  {
    id: 'interoception-children',
    title: 'Teaching Body Awareness to Kids',
    subtitle: 'Age-appropriate interoception activities',
    category: 'getting-started',
    readTimeMinutes: 5,
    iconName: 'compass',
    content: `Children benefit enormously from interoceptive awareness, but they need age-appropriate activities. Here are proven approaches:\n\nAges 3-5: Sensation Naming\n- "Can you feel your heart after jumping?" (place their hand on their chest)\n- "Is your tummy hungry or full?"\n- "Are your hands warm or cold?"\n- Use simple vocabulary: fast/slow, hot/cold, tight/loose, full/empty\n\nAges 6-8: Body Detective\n- "Where do you feel excited in your body?"\n- "What happens in your body when you're angry?"\n- Drawing body outlines and coloring where they feel different emotions\n- Comparing body sensations before and after exercise\n\nAges 9-12: Emotional Literacy\n- Journaling about the connection between body feelings and emotions\n- Learning to use breath as a calming tool\n- Guided body scans (shortened to 3-5 minutes)\n- Tracking how different activities affect body state\n\nWhy it matters for kids:\n- Children with better interoception have better emotional regulation\n- Body awareness reduces behavioral issues\n- It builds a foundation for lifelong mental health\n- It helps identify when they're unwell, tired, or need help\n\nKey principle: Never force awareness. Make it playful. "Let's be body detectives today!" is more effective than "Sit still and focus on your breathing."\n\nInteroceptive awareness naturally develops, but guided practice can accelerate it - giving children emotional tools many adults wish they'd learned earlier.`,
  },
  {
    id: 'vagus-nerve',
    title: 'The Vagus Nerve: Your Calm Button',
    subtitle: 'Stimulating your body\'s relaxation pathway',
    category: 'techniques',
    readTimeMinutes: 6,
    iconName: 'target',
    content: `The vagus nerve is the longest cranial nerve in your body, running from your brainstem to your gut. It's the primary channel of your parasympathetic nervous system - your body's "rest and digest" mode.\n\nWhen the vagus nerve is activated, it:\n- Slows heart rate\n- Lowers blood pressure\n- Reduces cortisol levels\n- Improves digestion\n- Reduces inflammation\n- Creates a feeling of calm and safety\n\n"Vagal tone" - the strength of your vagus nerve's calming influence - is measurable through heart rate variability (HRV). Higher HRV generally indicates better vagal tone and greater stress resilience.\n\nNatural vagus nerve stimulation techniques:\n\n1. Cold Exposure: Splashing cold water on your face or placing a cold pack on the back of your neck activates the dive reflex, strongly stimulating the vagus nerve.\n\n2. Extended Exhale: Breathing with a longer exhale than inhale (e.g., inhale 4, exhale 8) directly stimulates vagal activity.\n\n3. Humming or Singing: The vagus nerve passes through the vocal cords. Vibration from humming or singing stimulates it.\n\n4. Gentle Massage: Light massage of the carotid sinus (side of the neck) can activate vagal response.\n\n5. Social Connection: Positive social interaction activates the ventral vagal complex, promoting feelings of safety.\n\nRegular vagus nerve stimulation through these practices can increase your baseline vagal tone over time, making you more resilient to stress and quicker to recover from it.`,
  },
  {
    id: 'mindful-eating',
    title: 'Mindful Eating & Interoception',
    subtitle: 'Transform your relationship with food',
    category: 'wellness',
    readTimeMinutes: 5,
    iconName: 'sun',
    content: `Eating is one of the most interoception-rich activities we do daily, yet most of us eat on autopilot. Mindful eating transforms meals into powerful interoceptive training sessions.\n\nBefore Eating:\n- Rate your hunger on a 1-10 scale. Can you feel it in your stomach?\n- Is this physical hunger or emotional hunger?\n- Notice: are you eating because it's "time to eat" or because your body asked?\n\nDuring Eating:\n- Take the first bite and pause. What flavors do you notice?\n- Feel the food in your mouth. Notice the urge to swallow.\n- Chew slowly. Can you detect when flavors change?\n- After 3-4 bites, pause. How has your hunger shifted?\n- Notice the temperature of the food and how it feels in your throat and stomach.\n\nAfter Eating:\n- Notice the feeling of satiety. Where do you feel it? Stomach? Chest? Mouth?\n- Rate your fullness 1-10. Did you stop at comfortable fullness (6-7) or over-fullness (8-10)?\n- Check in 30 minutes later. How does your energy feel? Digestive comfort?\n\nBenefits of mindful eating:\n- Natural portion control through body signal awareness\n- Reduced emotional eating by distinguishing hunger types\n- Better digestion from slower, more conscious eating\n- Greater food enjoyment and satisfaction\n- Improved gut-brain communication\n\nStart with one mindful meal per week. Even this small change begins rewiring your relationship with food through interoceptive awareness.`,
  },
  {
    id: 'workplace-awareness',
    title: 'Body Awareness at Work',
    subtitle: 'Micro-practices for busy schedules',
    category: 'techniques',
    readTimeMinutes: 4,
    iconName: 'target',
    content: `You don't need to meditate for 30 minutes to practice interoception. These micro-practices take 30-60 seconds and can be done at your desk, in meetings, or between tasks.\n\nThe Desk Scan (30 seconds):\nClose your eyes. Scan from head to seat. Where is tension? Usually: jaw, shoulders, lower back, hands (from typing). Consciously release each area.\n\nThe Meeting Check (15 seconds):\nDuring any meeting, briefly check: How is my posture? Am I clenching my jaw? Are my shoulders relaxed? Am I breathing? This takes seconds but prevents tension accumulation.\n\nThe Transition Breath (20 seconds):\nBetween tasks or meetings, take three conscious breaths. Inhale 4, exhale 6. This resets your nervous system and creates a clean transition.\n\nThe Screen Break Scan (45 seconds):\nEvery hour, look away from your screen and do a rapid body scan. Eyes, neck, shoulders, hands, back, hips. Where did the last hour's stress settle?\n\nThe Walking Awareness (ongoing):\nWhen walking to the bathroom, kitchen, or between meetings, feel your feet contacting the floor. Notice the rhythm of your gait. This is interoception in motion.\n\nThe Stress Detector (10 seconds):\nBefore responding to a stressful email or situation, pause and scan your body. What's happening? Name it. "Chest tight, breath shallow, jaw clenched." This brief awareness creates a gap between trigger and reaction.\n\nThese micro-moments add up. Over a workday, you might practice interoception 20-30 times - building neural pathways without disrupting your schedule.`,
  },
  {
    id: 'interoception-and-trauma',
    title: 'Interoception and Trauma Recovery',
    subtitle: 'How body awareness heals what words cannot reach',
    category: 'conditions',
    readTimeMinutes: 8,
    iconName: 'heart',
    content: `Bessel van der Kolk's foundational insight — "the body keeps the score" — describes what trauma researchers have confirmed: traumatic memory is stored not as a narrative in the thinking mind, but as sensation in the body. A smell, a sound, a touch can trigger a full physiological response long after the event has passed.\n\nThis is why traditional talk therapy, while valuable, is often insufficient for trauma recovery. You cannot think your way out of a body-based response. The healing must reach the same level where the trauma is stored.\n\nInteroception — the awareness of internal body signals — is the bridge between the thinking brain and the body's stored experience. Here is why it matters for trauma:\n\n**Trauma disrupts interoceptive accuracy**\nPeople with PTSD often develop one of two problematic patterns. They may become hyperaware of body sensations, interpreting every heartbeat or stomach flutter as danger. Or they may shut down body awareness entirely — dissociating from the body to escape overwhelming sensation. Both adaptations were once protective. Both become limiting over time.\n\n**Gradual re-engagement is the path**\nTrauma-informed interoceptive work does not begin with difficult sensations. It begins with neutral or pleasant ones: the warmth of hands, the steadiness of feet on the floor, the rhythm of gentle breath. The nervous system learns, through repeated safe experience, that body awareness is survivable — even pleasant.\n\n**The window of tolerance guides the process**\nDeveloped by Dan Siegel, the window of tolerance describes the optimal zone of arousal for processing experience. Interoceptive practice helps you recognise when you are inside or outside this window, and gives you tools — breathing, grounding, titration — to return to it.\n\n**What the research shows**\nMultiple clinical trials now show that somatic approaches — including Somatic Experiencing, EMDR, and MABT — produce significant reductions in PTSD symptoms, sometimes outperforming cognitive approaches. The common element is working with the body's stored experience directly.\n\nIf you have a trauma history, two principles guide safe practice. First, work at the edge of your window, never beyond it. Second, always move at the pace of the slowest part — your nervous system, not your mind's agenda.`,
  },
  {
    id: 'window-of-tolerance',
    title: 'Understanding Your Window of Tolerance',
    subtitle: 'The nervous system map that changes everything',
    category: 'science',
    readTimeMinutes: 7,
    iconName: 'book-open',
    content: `One of the most useful frameworks for understanding your emotional and physiological experience is the Window of Tolerance, developed by neuropsychologist Dan Siegel.\n\nThe concept is elegantly simple: there is an optimal zone of arousal within which we can function effectively. Inside this window, we can think and feel simultaneously — we have access to both our emotional experience and our rational mind. We are present, flexible, and able to engage with life.\n\n**Above the window: hyperarousal**\nWhen we move above the window, we enter hyperarousal. Signs include:\n- Racing heart, shallow rapid breathing\n- Heightened vigilance and startling easily\n- Racing or intrusive thoughts\n- Difficulty concentrating; impulsivity\n- Feeling overwhelmed, panicked, or reactive\n\nThis is the fight-or-flight zone. Adrenaline and cortisol are high. Your body is prepared to respond to a threat. The problem is when this becomes chronic — when you live in this zone even when no actual threat is present.\n\n**Below the window: hypo-arousal**\nWhen we move below the window, we enter hypo-arousal. Signs include:\n- Foggy thinking or "blank mind"\n- Emotional numbness or feeling flat\n- Heaviness, fatigue, or collapse\n- Disconnection from body or surroundings\n- Difficulty motivating or making decisions\n\nThis is the freeze or shutdown zone. The nervous system has concluded that neither fight nor flight is possible, and has collapsed to conserve resources. Dissociation often lives here.\n\n**Inside the window: optimal functioning**\nIn the window, you have what researchers call "dual awareness" — the ability to feel something without being overwhelmed by it. You can recall a difficult experience without re-experiencing it. You can be sad without losing hope. You can feel anxiety without it consuming you.\n\n**How interoception expands your window**\nThe window of tolerance is not fixed. With practice, it can widen. Interoceptive exercises work at the edge of the window — safely touching the edges of discomfort (titration) and moving between ease and challenge (pendulation) — gradually expanding what you can experience without losing function.\n\nThe goal is not to stay perfectly in the window. Life moves us in and out. The goal is to recognise where you are, and to know how to return.`,
  },
  {
    id: 'somatic-experiencing-basics',
    title: 'Somatic Experiencing: The Body Keeps the Score',
    subtitle: 'Peter Levine\'s approach to trauma through the body',
    category: 'techniques',
    readTimeMinutes: 8,
    iconName: 'target',
    content: `Somatic Experiencing (SE) is a body-centred approach to trauma healing developed by Dr. Peter Levine over 45 years. Its foundational insight: animals in the wild do not develop PTSD, even though they routinely face life-threatening situations. Levine asked why.\n\nHis answer: animals complete the survival response. A gazelle chased by a cheetah, if it escapes, will literally shake and tremble — discharging the enormous physiological energy mobilised for survival. This neurogenic discharge is the nervous system's natural reset mechanism.\n\nHumans, however, often interrupt this process. Societal injunctions against shaking or crying, cognitive interference ("I shouldn\'t feel this"), or being overwhelmed before discharge can occur — all prevent the natural completion of the survival cycle. The energy remains trapped in the body, emerging as trauma symptoms.\n\n**Core SE concepts:**\n\n**Pendulation**: Rhythmic movement between difficult sensation (contraction) and ease (expansion). Prevents fixation; builds nervous system flexibility.\n\n**Titration**: Approaching difficult experience in tiny, manageable doses rather than diving in. Prevents overwhelm; builds capacity gradually.\n\n**Resourcing**: Deliberately accessing positive somatic experiences to build a neural counterweight to trauma activation.\n\n**Discharge**: Allowing the body\'s natural completion of the survival cycle through trembling, shaking, yawning, or other spontaneous movements.\n\n**SIBAM tracking**: Sensation, Image, Behaviour, Affect, Meaning — the five channels of experience SE practitioners track simultaneously.\n\n**What the research shows**\nA randomised controlled trial (Brom et al., 2017) found SE produced significant reductions in PTSD symptoms in a sample of 63 participants, with effects maintained at follow-up. Neuroimaging studies show SE reduces amygdala reactivity and restores prefrontal regulation over time.\n\n**Practising safely at home**\nThe exercises in this app inspired by SE — titration, pendulation, resourcing, and TRE — are designed for general wellbeing rather than trauma processing. If you have a significant trauma history, SE with a certified practitioner remains the gold standard. These practices are complementary, not a replacement.`,
  },
  {
    id: 'hrv-emotional-regulation',
    title: 'HRV as a Window into Emotional Regulation',
    subtitle: 'What your heart\'s variability reveals about your wellbeing',
    category: 'science',
    readTimeMinutes: 6,
    iconName: 'book-open',
    content: `Heart rate variability (HRV) — the variation in time between consecutive heartbeats — is one of the most important physiological markers of wellbeing currently known. Unlike heart rate (beats per minute), HRV measures the nervous system\'s flexibility and adaptability.\n\nA common misconception: a steady, metronome-like heart rate sounds healthy, but it is not. High HRV — meaning the heart changes speed fluidly with each breath — is the marker of a well-regulated, resilient nervous system. Low HRV is associated with stress, cardiovascular disease, depression, anxiety, and reduced life expectancy.\n\n**Why HRV matters for emotional regulation**\nHigh HRV is associated with:\n- Greater emotional regulation capacity (Appelhans & Luecken, 2006)\n- More flexible response to stress (less reactive, faster recovery)\n- Greater empathy and social attunement\n- Better cognitive flexibility and decision-making\n- Reduced anxiety and depression symptoms\n\nHRV is mediated primarily by the vagus nerve — the same nerve targeted by slow breathing, humming, cold exposure, and other practices in this app. When you practise vagal activation, you are literally training your HRV.\n\n**Respiratory Sinus Arrhythmia (RSA)**\nDuring inhalation, your heart rate increases slightly. During exhalation, it decreases. This normal, healthy fluctuation is called respiratory sinus arrhythmia, and it is the largest contributor to HRV in healthy individuals. It\'s the mechanism behind why slow, extended-exhale breathing is such a powerful intervention.\n\n**How to measure your HRV**\nModern wearables (Apple Watch, Fitbit, Garmin, Whoop, Oura) measure HRV continuously or overnight. Apps like HRV4Training allow morning HRV measurement with a camera-based sensor. Tracking trends over weeks reveals how lifestyle factors — sleep, stress, exercise, alcohol — affect your nervous system.\n\n**What research shows about improving HRV**\nThe most evidence-backed HRV-improving practices include:\n1. Slow breathing at 5-6 breaths per minute (resonance frequency breathing)\n2. Regular aerobic exercise\n3. Consistent sleep schedules\n4. Cold exposure (brief)\n5. Mindfulness and meditation practice\n\nNotably, all of these are either built into this app or complementary to it. Your daily practice is building a more resilient, flexible nervous system — one heartbeat at a time.`,
  },
  {
    id: 'gut-brain-axis-deep',
    title: 'The Gut-Brain Axis: Your Second Brain',
    subtitle: 'The science of your most underrated intelligence',
    category: 'science',
    readTimeMinutes: 7,
    iconName: 'book-open',
    content: `The gut-brain axis is one of the most significant discoveries in modern neuroscience, and one that rewrites the story of mental health. For decades, we assumed the brain told the gut what to do. The reality is far more bidirectional — and in ways that challenge our assumptions about where mood, cognition, and emotion originate.\n\n**The numbers that change everything**\n- Your gut contains approximately 500 million neurons — more than your spinal cord\n- 95% of your body\'s serotonin (the key "mood" neurotransmitter) is produced in the gut\n- The vagus nerve sends approximately 80% of its signals from gut to brain, not the other way\n- The gut microbiome produces over 30 neurotransmitters and neuromodulators\n\n**The vagus nerve: the information superhighway**\nThe primary channel of the gut-brain axis is the vagus nerve, which wanders from your brainstem through your neck, chest, and all the way to your gut. Think of it less as a phone line (one signal, one direction) and more as a broadband internet connection sending constant, complex, bidirectional streams of information.\n\nWhen researchers cut the vagus nerve in animal studies, the anxiolytic (anxiety-reducing) effects of probiotic bacteria disappear. The gut talks to the brain through the vagus nerve — and the brain listens.\n\n**The microbiome-mood connection**\nYour gut microbiome — the trillions of bacteria, fungi, and other microorganisms living in your digestive system — is now understood to directly influence brain function and mental health:\n- Germ-free mice show more anxious, less social behaviour than mice with normal microbiomes\n- Probiotic supplementation produces measurable reductions in anxiety and depression in human trials\n- Microbiome dysbiosis (imbalance) is associated with depression, ADHD, autism, and Alzheimer\'s\n\n**Interoceptive gut awareness**\nGut interoception — conscious awareness of gut sensations — is trainable. The exercises in this app that focus on gut awareness are not simply relaxation practices: they are developing your access to a real information system that processes emotional experience, supports decision-making, and influences mood.\n\nWhat we colloquially call "gut feelings" are real interoceptive signals from the enteric nervous system, transmitted via the vagus nerve, and integrated in the insular cortex alongside emotional and social information.\n\nListening to your gut is, quite literally, accessing your second brain.`,
  },
];

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter(a => a.category === category);
}

export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find(a => a.id === id);
}
