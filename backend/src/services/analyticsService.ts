import { db } from '../config/database.js';
import { AdherenceAnalytics, TimeOfDayPeriod } from '../types/index.js';

export function calculateAdherenceAnalytics(patientId: string): AdherenceAnalytics {
  const allLogs = Array.from(db.doseLogs.values()).filter((l) => l.patientId === patientId);

  // Consider last 7 days of logs
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const cutoffStr = sevenDaysAgo.toISOString().split('T')[0];

  const recentLogs = allLogs.filter((l) => l.dateKey >= cutoffStr);

  if (recentLogs.length === 0) {
    return {
      adherenceRate: 100,
      totalDoses: 0,
      takenCount: 0,
      skippedCount: 0,
      escalatedCount: 0,
      disruptionSlot: 'EVENING',
      avgConfirmationDelayMinutes: 0,
    };
  }

  let takenCount = 0;
  let skippedCount = 0;
  let escalatedCount = 0;
  let totalDelayMinutes = 0;
  let delaysRecorded = 0;

  const disruptionCounts: Record<TimeOfDayPeriod, number> = {
    MORNING: 0,
    AFTERNOON: 0,
    EVENING: 0,
    NIGHT: 0,
  };

  recentLogs.forEach((log) => {
    const sched = db.schedules.get(log.scheduleId);
    const period: TimeOfDayPeriod = sched?.periodLabel || 'MORNING';

    if (log.status === 'TAKEN' || log.status === 'ACKNOWLEDGED') {
      takenCount++;
      if (log.confirmedAt && log.scheduledAt) {
        const diffMs = new Date(log.confirmedAt).getTime() - new Date(log.scheduledAt).getTime();
        const diffMins = Math.max(0, Math.round(diffMs / 60000));
        totalDelayMinutes += diffMins;
        delaysRecorded++;
      }
    } else if (log.status === 'SKIPPED') {
      skippedCount++;
      disruptionCounts[period]++;
    } else if (log.status === 'UNABLE' || log.status === 'UNCONFIRMED_ESCALATED') {
      escalatedCount++;
      disruptionCounts[period]++;
    }
  });

  const totalEvaluated = takenCount + skippedCount + escalatedCount;
  const adherenceRate = totalEvaluated > 0 ? Math.round((takenCount / totalEvaluated) * 100) : 100;

  // Determine highest disruption slot
  let maxDisrupt = -1;
  let disruptionSlot: TimeOfDayPeriod = 'EVENING';

  (Object.keys(disruptionCounts) as TimeOfDayPeriod[]).forEach((slot) => {
    if (disruptionCounts[slot] > maxDisrupt) {
      maxDisrupt = disruptionCounts[slot];
      disruptionSlot = slot;
    }
  });

  const avgConfirmationDelayMinutes = delaysRecorded > 0 ? Math.round(totalDelayMinutes / delaysRecorded) : 3;

  return {
    adherenceRate,
    totalDoses: recentLogs.length,
    takenCount,
    skippedCount,
    escalatedCount,
    disruptionSlot,
    avgConfirmationDelayMinutes,
  };
}
