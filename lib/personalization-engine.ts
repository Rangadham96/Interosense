import { Exercise, EXERCISES, ExerciseCategory, TargetCondition } from '@/constants/exercises';
import { CONDITIONS } from '@/constants/conditions';
import { CLINICAL_SCALES } from '@/constants/clinical-scales';
import { SessionRecord, CheckinRecord, AssessmentRecord, UserProfile, WearableDataPoint, BodyMark } from '@/lib/storage';
import { getBodyPatternSummary } from '@/lib/body-patterns';
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
  if (streak < 14) return `${streak} day streak - notice what is becoming more familiar`;
  if (streak < 30) return `${streak} day streak - remarkable consistency`;
  return `${streak} day streak - a sustained practice record`;
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
      return 'Your recent check-in included higher stress. Consider a brief, comfortable practice and stop if it feels unhelpful.';
    }
    if (recentCheckin.mood === 'sad' || recentCheckin.mood === 'down') {
      return 'Your recent check-in included low mood. A gentle movement or grounding practice may offer a manageable place to begin.';
    }
    if (recentCheckin.sleepQuality <= 3) {
      return 'You reported lower sleep quality. Consider a short, low-effort practice rather than pushing through a long session.';
    }
    if (recentCheckin.energyLevel <= 3) {
      return 'You reported lower energy. A short body check may help you notice what feels manageable right now.';
    }
  }

  if (conditions.includes('anxiety')) {
    return 'A comfortable breathing or grounding practice may be a useful place to start today.';
  }
  if (conditions.includes('ptsd')) {
    return 'Today\'s focus: trauma-informed somatic exercises that reconnect you safely with your body.';
  }
  if (conditions.includes('depression')) {
    return 'A brief movement practice may offer a gentle way to notice energy and body sensations.';
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
  wearableData: WearableDataPoint[],
  bodyMarks: BodyMark[],
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

  const recentCheckin = [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentMood = recentCheckin?.mood || '';
  const recentEnergy = recentCheckin?.energyLevel || 5;
  const recentSleep = recentCheckin?.sleepQuality || 5;
  const recentStress = recentCheckin?.stressLevel ?? 5;

  const hasPtsdCondition = conditions.includes('ptsd' as TargetCondition);

  const latestPcl5 = assessments
    .filter(a => a.scaleId === 'pcl-5')
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  const pcl5Score = latestPcl5?.totalScore ?? 0;
  const highPcl5 = pcl5Score >= 33;

  const highStress = recentStress >= 7 || recentMood === 'anxious' || recentMood === 'stressed';
  const bodyPattern = getBodyPatternSummary(bodyMarks, checkins);
  const tensionLikePattern = ['tension', 'pressure', 'heaviness'].includes(bodyPattern.topSensation?.value ?? '');
  const ratingByExercise = new Map<string, { total: number; count: number }>();
  for (const session of sessions) {
    if (!session.rating) continue;
    const current = ratingByExercise.get(session.exerciseId) ?? { total: 0, count: 0 };
    current.total += session.rating;
    current.count += 1;
    ratingByExercise.set(session.exerciseId, current);
  }

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

    if (highStress && ex.category === 'nervousSystem') score += 30;
    if ((hasPtsdCondition || highPcl5) && ex.category === 'traumaInformed') score += 35;
    if (highPcl5 && ex.targetConditions.includes('ptsd')) score += 20;

    if (tod === 'morning' && (ex.category === 'bodyScanning' || ex.category === 'breathing')) score += 10;
    if (tod === 'evening' && (ex.category === 'tension' || ex.id === '478-breathing')) score += 10;
    if (tod === 'night' && ex.targetConditions.includes('sleep')) score += 15;
    if (tod === 'afternoon' && ex.category === 'tension') score += 10;

    if (recentEnergy <= 3 && ex.durationMinutes <= 5) score += 10;
    if (recentEnergy >= 7 && ex.durationMinutes >= 8) score += 5;
    if (bodyPattern.topSensation && ex.category === 'bodyScanning') score += 12;
    if (tensionLikePattern && ex.category === 'tension') score += 24;

    const priorRating = ratingByExercise.get(ex.id);
    if (priorRating) {
      const averageRating = priorRating.total / priorRating.count;
      if (averageRating >= 4) score += 18;
      if (averageRating <= 2) score -= 25;
    }

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
    if (highStress && ex.category === 'nervousSystem') {
      reason = 'Your recent check-in included higher stress, so this offers a structured pause without requiring a particular outcome';
    }
    if (hasPtsdCondition && ex.category === 'traumaInformed') {
      reason = 'Trauma-informed practice: gentle somatic work designed for nervous system safety';
    }
    if (highPcl5 && ex.category === 'traumaInformed') {
      reason = 'Your PCL-5 results suggest trauma-informed exercises would be most supportive right now';
    }
    if (bodyPattern.topSensation && ex.category === 'bodyScanning') {
      reason = `You have recently reported ${bodyPattern.topSensation.value}. This practice can help you describe what you notice without interpreting it medically`;
    }
    if (tensionLikePattern && ex.category === 'tension') {
      const regionText = bodyPattern.topRegion ? ` around your ${bodyPattern.topRegion.value}` : '';
      reason = `You have repeatedly recorded ${bodyPattern.topSensation!.value}${regionText}. This practice offers a gentle way to explore that pattern`;
    }
    const priorRating = ratingByExercise.get(ex.id);
    if (priorRating && priorRating.total / priorRating.count >= 4) {
      reason = `You rated this practice as helpful before. It may be worth returning to based on your own response`;
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
      reason: 'A short practice can help you maintain the routine you chose',
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
      reason: `After ${sessions.length} sessions, record what you notice so you can compare your own patterns over time`,
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
  bodyMarks: BodyMark[],
): InsightCard[] {
  const insights: InsightCard[] = [];
  const bodyPattern = getBodyPatternSummary(bodyMarks, checkins);

  if (bodyPattern.topRegion || bodyPattern.topSensation) {
    const details: string[] = [];
    if (bodyPattern.topSensation) {
      details.push(`${bodyPattern.topSensation.value} was recorded ${bodyPattern.topSensation.count} times`);
    }
    if (bodyPattern.topRegion) {
      details.push(`${bodyPattern.topRegion.value} appeared ${bodyPattern.topRegion.count} times`);
    }
    insights.push({
      id: 'body-signal-pattern',
      title: 'A Pattern in Your Records',
      body: `Across the last ${bodyPattern.windowDays} days, ${details.join(' and ')}. This describes what you entered; it does not determine what the sensations mean medically.`,
      type: 'pattern',
      iconName: 'map-pin',
      color: '#E8B4B8',
    });
  }

  if (sessions.length === 0) {
    insights.push({
      id: 'welcome',
      title: 'Your Journey Begins',
      body: 'A short beginner practice can help you start noticing and describing body sensations without requiring them to change.',
      type: 'encouragement',
      iconName: 'compass',
      color: '#6B5B95',
    });
  }

  if (currentStreak >= 7) {
    insights.push({
      id: 'streak-science',
      title: `${currentStreak} Days of Practice`,
      body: `You have practiced on ${currentStreak} consecutive days. Consider what feels more familiar now and what still feels difficult.`,
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
      body: `You have recorded ${totalMinutes} minutes of practice. Your own ratings and check-ins are the best way to see which practices have felt useful.`,
      type: 'milestone',
      iconName: 'clock',
      color: '#88B3B5',
    });
  }

  if (checkins.length >= 5) {
    const chronologicalCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
    const recentCheckins = chronologicalCheckins.slice(-5);
    const avgAwareness = recentCheckins.reduce((s, c) => s + c.awarenessScore, 0) / recentCheckins.length;
    const firstCheckins = chronologicalCheckins.slice(0, Math.min(5, chronologicalCheckins.length));
    const firstAvg = firstCheckins.reduce((s, c) => s + c.awarenessScore, 0) / firstCheckins.length;
    if (avgAwareness > firstAvg + 1) {
      insights.push({
        id: 'awareness-improving',
        title: 'Your Awareness Ratings Changed',
        body: `Your recent self-reported awareness average is ${avgAwareness.toFixed(1)}, compared with ${firstAvg.toFixed(1)} in your earliest check-ins. This is a pattern in your own reports, not a clinical measurement.`,
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
      body: `You have explored ${categories.size} practice categories. Your ratings can help identify which formats feel most useful to you.`,
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
      if (scaleId === 'maia2') return;
      const sorted = records.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      if (last.totalScore < first.totalScore) {
        const decrease = first.totalScore - last.totalScore;
        insights.push({
          id: `improvement-${scaleId}`,
          title: `${last.scaleName} Score Changed`,
          body: `Your latest ${last.scaleName} self-report score is ${decrease} points lower than your first recorded score. Consider discussing meaningful changes or concerns with a qualified professional.`,
          type: 'pattern',
          iconName: 'trending-down',
          color: '#7FB069',
        });
      }
    });
  }

  const scienceFacts: InsightCard[] = [
    {
      id: 'science-insula',
      title: 'Practice Observation, Not Diagnosis',
      body: 'Interoception includes noticing signals such as breath, tension, temperature, and heartbeat. A sensation can have many possible influences, so begin by describing it rather than assigning a medical meaning.',
      type: 'science',
      iconName: 'book-open',
      color: '#6B5B95',
    },
    {
      id: 'science-vagus',
      title: 'Comfort Comes First',
      body: 'Breathing practices should feel manageable. You can shorten a practice, return to normal breathing, or stop if you feel dizzy, distressed, or uncomfortable.',
      type: 'science',
      iconName: 'zap',
      color: '#88B3B5',
    },
    {
      id: 'science-gut',
      title: 'Context Helps Patterns',
      body: 'Sleep, meals, movement, stress, medication, illness, and many other factors can affect body sensations. Repeated records provide context, but they do not establish a cause.',
      type: 'science',
      iconName: 'circle',
      color: '#C4A484',
    },
    {
      id: 'science-hrv',
      title: 'Wearables Need Context',
      body: 'Wearable readings vary between people and across days. Compare them cautiously with your own recent pattern rather than treating one number as a verdict about health or resilience.',
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
  bodyMarks: BodyMark[],
): AdvisorState {
  const name = profile?.name || 'there';
  const greeting = getGreeting(name);
  const streakMessage = getStreakMessage(currentStreak);
  const todayFocus = getTodayFocus(profile, sessions, checkins, assessments);

  const exerciseRecs = getExerciseRecommendations(profile, sessions, checkins, assessments, wearableData, bodyMarks);
  const systemRecs = getSystemRecommendations(profile, sessions, checkins, assessments, todayCheckedIn, currentStreak);
  const allRecs = [...systemRecs, ...exerciseRecs].sort((a, b) => b.priority - a.priority);

  const insights = generateInsights(profile, sessions, checkins, assessments, currentStreak, totalMinutes, wearableData, bodyMarks);

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
