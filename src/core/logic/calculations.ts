export const cocaScore = (checkins:number, topStreak:number, goalsCompleted:number, consistencyPct:number) =>
  (checkins * 10) + (topStreak * 50) + (goalsCompleted * 200) + Math.round(consistencyPct * 5);

export const goalStatus = (consistency:number) => {
  if (consistency >= 80) return 'On Track';
  if (consistency >= 60) return 'Needs Attention';
  return 'Critical';
};