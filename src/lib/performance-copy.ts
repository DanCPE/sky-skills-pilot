const LOW_SCORE_MESSAGES = [
  "Poor - Monkey can do better",
  "Poor - Not your finance, but your skill",
  "Poor - Even autopilot looked worried",
  "Poor - Confidence landed, skill did not",
  "Poor - The tutorial is asking for a rematch",
  "Poor - Your calculator wants distance",
  "Poor - Even the loading spinner expected more",
  "Poor - The question marks are judging you",
  "Poor - This score needs a witness protection program",
  "Poor - The grid searched for talent and found vibes",
  "Poor - Your answer had confidence, not accuracy",
  "Poor - Even random guessing feels offended",
  "Poor - The scoreboard blinked twice",
  "Poor - Mission unclear, answers disappeared",
  "Poor - Your brain filed for turbulence",
  "Poor - Practice mode took that personally",
  "Poor - The pattern escaped you successfully",
  "Poor - This run was brave, not correct",
  "Poor - The shapes would like an apology",
  "Poor - Your score arrived upside down",
  "Poor - Accuracy went on vacation",
  "Poor - The result is giving emergency landing",
  "Poor - Strong takeoff, missing landing",
  "Poor - The quiz was easy. Your score was creative",
];

export function getPerformanceMessage(percentage: number) {
  if (percentage >= 90) {
    return "Excellent - Pilot Grade";
  }

  if (percentage >= 75) {
    return "Great Job!";
  }

  if (percentage >= 70) {
    return "Good - Above Average";
  }

  if (percentage >= 60) {
    return "Good Effort!";
  }

  if (percentage >= 50) {
    return "Fair - Needs Improvement";
  }

  if (percentage >= 40) {
    return "Keep Practicing!";
  }

  return LOW_SCORE_MESSAGES[
    Math.floor(Math.random() * LOW_SCORE_MESSAGES.length)
  ];
}

export function getPerformanceStarCount(percentage: number) {
  if (percentage >= 90) return 5;
  if (percentage >= 75) return 4;
  if (percentage >= 60) return 3;
  if (percentage >= 40) return 2;
  return 1;
}
