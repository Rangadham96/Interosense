import { Exercise, EXERCISES, ExerciseCategory, TargetCondition } from '@/constants/exercises';
import { CONDITIONS } from '@/constants/conditions';
import { CLINICAL_SCALES } from '@/constants/clinical-scales';
import { SessionRecord, CheckinRecord, AssessmentRecord, UserProfile, WearableDataPoint } from '@/lib/storage';
import { parseISO, differenceInDays, isToday, format } from 'date-fns';

export interface Recommendation {
  id: string;
  type: 'exercise' | 'checkin' | 'assessment' | 'article' | 'bodymap' | 'insight' | 'streak' | 'condition' | 'wearable';
  title: string;
  subtitle: string;
  reason: string;
  priority: number;
  actionId?: string;
  iconName: string;
  color: string;
}

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  type: 'pattern' | 'milestone' | 'science' | 'encouragement' | 'warning';
  iconName: string;
  color: string;
}

export interface AdvisorState {
  recommendations: Recommendation[];
  insights: InsightCard[];
  nextExercise: Exercise | null;
  greeting: string;
  streakMessage: string;
  todayFocus: string;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function getGreeting(name: string): string {
  const tod = getTimeOfDay();
  const greetings: Record<string, string[]> = {
    morning: [
      `Good morning, ${name}`,
      `Rise and sense, ${name}`,
      `A new day of awareness, ${name}`,
    ],
    afternoon: [
      `Good afternoon, ${name}`,
      `Afternoon check-in, ${name}`,
      `How is your body this afternoon, ${name}`,
    ],
    evening: [
      `Good evening, ${name}`,
      `Wind-down time, ${name}`,
      `Evening awareness, ${name}`,
    ],
    night: [
      `Good night, ${name}`,
      `Time to rest, ${name}`,
      `Preparing for sleep, ${name}`,
    ],
  };
  const options = greetings[tod];
  return options[Math.floor(Math.random() * options.length)];
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today with a quick exercise';
  if (streak === 1) return '1 day streak - great start, keep it going';
  if (streak < 7) return `${streak} day streak - building momentum`;
  if (streak < 14) return `${streak} day streak - your neural pathways are strengthening`;
  if (streak < 30) return `${streak} day streak - remarkable consistency`;
  return `${streak} day streak - you are rewiring your brain`;
}

function getTodayFocus(profile: UserProfile | null, sessions: SessionRecord[], checkins: CheckinRecord[], assessments: AssessmentRecord[]): string {
  const tod = getTimeOfDay();
  const conditions = profile?.conditions || [];
  const recentCheckin = checkins.filter(c => {
    const d = differenceInDays(new Date(), parseISO(c.date));
    return d <= 1;
  })[0];

  if (recentCheckin) {
    if (recentCheckin.mood === 'anxious' || recentCheckin.mood === 'stressed') {
      return 'Your recent check-in shows elevated stress. Breathing exercises can help regulate your nervous system.';
    }
    if (recentCheckin.mood === 'sad' || recentCheckin.mood === 'down') {
      return 'Gentle movement and gut awareness exercises support mood through the serotonin pathway.';
    }
    if (recentCheckin.sleepQuality <= 3) {
      return 'Poor sleep affects interoception. Try the 4-7-8 breathing or progressive muscle relaxation tonight.';
    }
    if (recentCheckin.energyLevel <= 3) {
      return 'Low energy detected. A quick body check can help you reconnect and recharge.';
    }
  }

  if (conditions.includes('anxiety')) {
    return 'Focus on breathing exercises today - they reduce anxiety by activating the vagus nerve.';
  }
  if (conditions.includes('ptsd')) {
    return 'Today\'s focus: grounding exercises that reconnect you safely with your body.';
  }
  if (conditions.includes('depression')) {
    return 'Movement-based practices help lift mood through the body-brain connection.';
  }

  if (tod === 'morning') return 'Morning is ideal for body scanning - start your day with full-body awareness.';
  if (tod === 'afternoon') return 'Afternoon tension check: your shoulders and jaw accumulate stress throughout the day.';
  if (tod === 'evening') return 'Evening is perfect for relaxation: try progressive muscle relaxation or 4-7-8 breathing.';
  return 'Bedtime body awareness promotes better sleep. Try a gentle body scan.';
}

function getExerciseRecommendations(
  profile: UserProfile | null,
  sessions: SessionRecord[],
  checkins: CheckinRecord[],
  assessments: AssessmentRecord[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const completedIds = new Set(sessions.map(s => s.exerciseId));
  const recentIds = new Set(
    sessions
      .filter(s => differenceInDays(new Date(), parseISO(s.completedAt)) <= 7)
      .map(s => s.exerciseId)
  );
  const conditions = (profile?.conditions || []) as TargetCondition[];
  const level = profile?.experienceLevel || 'beginner';
  const tod = getTimeOfDay();

  const recentCheckin = checkins.sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentMood = recentCheckin?.mood || '';
  const recentEnergy = recentCheckin?.energyLevel || 5;
  const recentSleep = recentCheckin?.sleepQuality || 5;

  const scored = EXERCISES.map(ex => {
    let score = 0;

    if (conditions.length > 0) {
      const conditionMatch = ex.targetConditions.filter(tc => conditions.includes(tc)).length;
      score += conditionMatch * 30;
    }

    if (ex.targetConditions.includes('general')) score += 5;

    if (ex.difficulty === level) score += 15;
    else if (ex.difficulty === 'beginner' && level === 'intermediate') score += 8;
    else if (ex.difficulty === 'intermediate' && level === 'advanced') score += 8;

    if (!completedIds.has(ex.id)) score += 20;
    if (!recentIds.has(ex.id)) score += 10;

    if ((recentMood === 'anxious' || recentMood === 'stressed') && ex.targetConditions.includes('anxiety')) score += 25;
    if ((recentMood === 'sad' || recentMood === 'down') && ex.targetConditions.includes('depression')) score += 25;
    if (recentSleep <= 3 && ex.targetConditions.includes('sleep')) score += 20;
    if (recentEnergy <= 3 && ex.category === 'movement') score += 15;

    if (tod === 'morning' && (ex.category === 'bodyScanning' || ex.category === 'breathing')) score += 10;
    if (tod === 'evening' && (ex.category === 'tension' || ex.id === '478-breathing')) score += 10;
    if (tod === 'night' && ex.targetConditions.includes('sleep')) score += 15;
    if (tod === 'afternoon' && ex.category === 'tension') score += 10;

    if (recentEnergy <= 3 && ex.durationMinutes <= 5) score += 10;
    if (recentEnergy >= 7 && ex.durationMinutes >= 8) score += 5;

    return { exercise: ex, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const topExercises = scored.slice(0, 5);
  topExercises.forEach((item, i) => {
    const ex = item.exercise;
    let reason = 'Recommended for your practice level';
    if (conditions.length > 0) {
      const matching = ex.targetConditions.filter(tc => conditions.includes(tc));
      if (matching.length > 0) {
        const condName = CONDITIONS.find(c => c.id === matching[0])?.name || matching[0];
        reason = `Supports ${condName} - ${ex.methodology} methodology`;
      }
    }
    if (recentMood === 'anxious' && ex.targetConditions.includes('anxiety')) {
      reason = 'Based on your recent check-in: helps with anxiety';
    }
    if (!completedIds.has(ex.id)) {
      reason = `New exercise: ${reason}`;
    }

    recs.push({
      id: `ex-${ex.id}`,
      type: 'exercise',
      title: ex.title,
      subtitle: `${ex.durationMinutes} min | ${ex.difficulty}`,
      reason,
      priority: 100 - i * 10,
      actionId: ex.id,
      iconName: ex.iconName,
      color: '#6B5B95',
    });
  });

  return recs;
}

function getSystemRecommendations(
  profile: UserProfile | null,
  sessions: SessionRecord[],
  checkins: CheckinRecord[],
  assessments: AssessmentRecord[],
  todayCheckedIn: boolean,
  currentStreak: number,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const conditions = profile?.conditions || [];

  if (!todayCheckedIn) {
    recs.push({
      id: 'daily-checkin',
      type: 'checkin',
      title: 'Daily Body Check-in',
      subtitle: 'Track your body signals today',
      reason: 'Daily tracking builds interoceptive awareness over time',
      priority: 95,
      iconName: 'clipboard',
      color: '#88B3B5',
    });
  }

  if (currentStreak > 0 && !sessions.some(s => isToday(parseISO(s.completedAt)))) {
    recs.push({
      id: 'keep-streak',
      type: 'streak',
      title: `Protect Your ${currentStreak}-Day Streak`,
      subtitle: 'Complete any exercise today',
      reason: 'Consistency is the key to neural rewiring',
      priority: 90,
      iconName: 'trending-up',
      color: '#F0C05A',
    });
  }

  const conditionsWithScales = conditions.filter(c => {
    const cond = CONDITIONS.find(co => co.id === c);
    return cond?.recommendedScaleId;
  });
  conditionsWithScales.forEach(condId => {
    const cond = CONDITIONS.find(c => c.id === condId);
    if (!cond?.recommendedScaleId) return;
    const scale = CLINICAL_SCALES.find(s => s.id === cond.recommendedScaleId);
    if (!scale) return;
    const lastAssessment = assessments
      .filter(a => a.scaleId === scale.id)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    const daysSince = lastAssessment
      ? differenceInDays(new Date(), parseISO(lastAssessment.completedAt))
      : 999;
    const freq = scale.frequency.includes('Monthly') ? 30 : 14;
    if (daysSince >= freq) {
      recs.push({
        id: `assessment-${scale.id}`,
        type: 'assessment',
        title: `${scale.shortName} Assessment Due`,
        subtitle: `Track your ${cond.name.toLowerCase()} symptoms`,
        reason: lastAssessment
          ? `Last completed ${daysSince} days ago. Recommended: every ${freq} days.`
          : `You haven't taken this assessment yet. It takes ${scale.estimatedMinutes} minutes.`,
        priority: 80,
        actionId: scale.id,
        iconName: 'file-text',
        color: cond.color,
      });
    }
  });

  if (sessions.length > 0 && sessions.length % 10 === 0) {
    recs.push({
      id: 'bodymap-check',
      type: 'bodymap',
      title: 'Update Your Body Map',
      subtitle: 'Mark current sensations',
      reason: `After ${sessions.length} sessions, map how your body awareness has changed`,
      priority: 60,
      iconName: 'map',
      color: '#E8B4B8',
    });
  }

  return recs;
}

function generateInsights(
  profile: UserProfile | null,
  sessions: SessionRecord[],
  checkins: CheckinRecord[],
  assessments: AssessmentRecord[],
  currentStreak: number,
  totalMinutes: number,
  wearableData: WearableDataPoint[],
): InsightCard[] {
  const insights: InsightCard[] = [];

  if (sessions.length === 0) {
    insights.push({
      id: 'welcome',
      title: 'Your Journey Begins',
      body: 'Interoceptive awareness develops with consistent practice. Research shows meaningful changes in just 2 weeks of daily practice. Start with a beginner exercise today.',
      type: 'encouragement',
      iconName: 'compass',
      color: '#6B5B95',
    });
    return insights;
  }

  if (currentStreak >= 7) {
    insights.push({
      id: 'streak-science',
      title: `${currentStreak} Days of Neural Rewiring`,
      body: `After ${currentStreak} days of consistent practice, your insular cortex is measurably stronger. MRI studies show increased cortical thickness with regular interoceptive practice.`,
      type: 'milestone',
      iconName: 'trending-up',
      color: '#7FB069',
    });
  }

  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    insights.push({
      id: 'time-invested',
      title: `${hours}+ Hours of Body Awareness`,
      body: `You have invested ${totalMinutes} minutes in interoceptive training. Garfinkel et al. (2015) found that this level of practice significantly improves cardiac interoceptive accuracy.`,
      type: 'milestone',
      iconName: 'clock',
      color: '#88B3B5',
    });
  }

  if (checkins.length >= 5) {
    const recentCheckins = checkins.slice(-5);
    const avgAwareness = recentCheckins.reduce((s, c) => s + c.awarenessScore, 0) / recentCheckins.length;
    const firstCheckins = checkins.slice(0, Math.min(5, checkins.length));
    const firstAvg = firstCheckins.reduce((s, c) => s + c.awarenessScore, 0) / firstCheckins.length;
    if (avgAwareness > firstAvg + 1) {
      insights.push({
        id: 'awareness-improving',
        title: 'Your Awareness Is Growing',
        body: `Your average awareness score has improved from ${firstAvg.toFixed(1)} to ${avgAwareness.toFixed(1)}. This reflects real neuroplastic changes in your insular cortex.`,
        type: 'pattern',
        iconName: 'trending-up',
        color: '#7FB069',
      });
    }
  }

  const categories = new Set(sessions.map(s => s.category));
  if (categories.size >= 4) {
    insights.push({
      id: 'category-diversity',
      title: 'Diverse Practice',
      body: `You have explored ${categories.size} categories. Research shows diverse interoceptive training builds broader body awareness than focusing on a single modality.`,
      type: 'science',
      iconName: 'layers',
      color: '#6B5B95',
    });
  }

  if (assessments.length >= 2) {
    const scaleGroups = new Map<string, AssessmentRecord[]>();
    assessments.forEach(a => {
      const existing = scaleGroups.get(a.scaleId) || [];
      existing.push(a);
      scaleGroups.set(a.scaleId, existing);
    });
    scaleGroups.forEach((records, scaleId) => {
      if (records.length < 2) return;
      const sorted = records.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (last.totalScore < first.totalScore) {
        const decrease = first.totalScore - last.totalScore;
        insights.push({
          id: `improvement-${scaleId}`,
          title: `${last.scaleName} Score Improving`,
          body: `Your ${last.scaleName} score has decreased by ${decrease} points since your first assessment. Lower scores indicate symptom improvement.`,
          type: 'pattern',
          iconName: 'trending-down',
          color: '#7FB069',
        });
      }
    });
  }

  if (wearableData.length >= 3) {
    const recent = wearableData.filter(w => w.hrv !== undefined).slice(-7);
    if (recent.length >= 3) {
      const avgHrv = recent.reduce((s, w) => s + (w.hrv || 0), 0) / recent.length;
      insights.push({
        id: 'hrv-insight',
        title: 'Heart Rate Variability',
        body: `Your average HRV is ${avgHrv.toFixed(0)} ms. Higher HRV indicates better vagal tone and stress resilience. Regular breathing exercises directly increase HRV.`,
        type: 'science',
        iconName: 'heart',
        color: '#E8B4B8',
      });
    }
  }

  const scienceFacts: InsightCard[] = [
    {
      id: 'science-insula',
      title: 'The Insula: Your Awareness Hub',
      body: 'The insular cortex processes all interoceptive signals. Regular practice literally thickens this brain region, improving your ability to read your body.',
      type: 'science',
      iconName: 'book-open',
      color: '#6B5B95',
    },
    {
      id: 'science-vagus',
      title: 'Vagus Nerve Power',
      body: 'Your vagus nerve carries 80% of signals from gut to brain. Breathing exercises directly stimulate it, activating your "rest and digest" system within 90 seconds.',
      type: 'science',
      iconName: 'zap',
      color: '#88B3B5',
    },
    {
      id: 'science-gut',
      title: 'Your Second Brain',
      body: '500 million neurons in your gut produce 95% of your body\'s serotonin. Gut awareness exercises tap into this happiness pathway.',
      type: 'science',
      iconName: 'circle',
      color: '#C4A484',
    },
    {
      id: 'science-hrv',
      title: 'HRV: Your Resilience Score',
      body: 'Heart Rate Variability measures vagal tone - your stress resilience. Just 5 minutes of box breathing can increase HRV by 10-15% within a single session.',
      type: 'science',
      iconName: 'activity',
      color: '#E8B4B8',
    },
  ];

  const dayIndex = new Date().getDay();
  if (insights.length < 3 && scienceFacts[dayIndex % scienceFacts.length]) {
    insights.push(scienceFacts[dayIndex % scienceFacts.length]);
  }

  return insights.slice(0, 5);
}

export function generateAdvisorState(
  profile: UserProfile | null,
  sessions: SessionRecord[],
  checkins: CheckinRecord[],
  assessments: AssessmentRecord[],
  todayCheckedIn: boolean,
  currentStreak: number,
  totalMinutes: number,
  wearableData: WearableDataPoint[],
): AdvisorState {
  const name = profile?.name || 'there';
  const greeting = getGreeting(name);
  const streakMessage = getStreakMessage(currentStreak);
  const todayFocus = getTodayFocus(profile, sessions, checkins, assessments);

  const exerciseRecs = getExerciseRecommendations(profile, sessions, checkins, assessments);
  const systemRecs = getSystemRecommendations(profile, sessions, checkins, assessments, todayCheckedIn, currentStreak);
  const allRecs = [...systemRecs, ...exerciseRecs].sort((a, b) => b.priority - a.priority);

  const insights = generateInsights(profile, sessions, checkins, assessments, currentStreak, totalMinutes, wearableData);

  const nextExercise = exerciseRecs.length > 0
    ? EXERCISES.find(e => e.id === exerciseRecs[0].actionId) || null
    : EXERCISES.find(e => e.difficulty === 'beginner') || null;

  return {
    recommendations: allRecs,
    insights,
    nextExercise,
    greeting,
    streakMessage,
    todayFocus,
  };
}
