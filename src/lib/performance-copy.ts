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

const FAIR_SCORE_MESSAGES = [
  "Fair - The engine started, not the journey",
  "Fair - Almost pilot, still mostly passenger",
  "Fair - You are warming up, very slowly",
  "Fair - Some answers landed, some are still circling",
  "Fair - Not bad, not bragging material either",
  "Fair - Your score is cautiously optimistic",
  "Fair - The effort was there, the precision took leave",
  "Fair - This run had potential and several wrong turns",
  "Fair - You are flirting with competence",
  "Fair - Half skill, half plot twist",
  "Fair - Respectable turbulence",
  "Fair - Enough to continue, not enough to celebrate",
  "Fair - The brain clocked in eventually",
  "Fair - One more practice and we stop calling this luck",
  "Fair - Not embarrassing, not impressive, very balanced",
];

const GOOD_SCORE_MESSAGES = [
  "Good - Calm down, captain, still room to climb",
  "Good - Nice work, but the top score is still laughing",
  "Good - Competent enough to be dangerous",
  "Good - Strong effort, weak bragging rights",
  "Good - The score smiled, not saluted",
  "Good - You cooked, but not the full meal",
  "Good - Almost sharp, still slightly rounded",
  "Good - Your brain finally found second gear",
  "Good - Solid run, modest ego only",
  "Good - Not elite yet, but the delusion can start gently",
  "Good - You did well, don’t make it weird",
  "Good - Impressive, in a manageable way",
  "Good - Close enough to flex, not enough to post",
  "Good - The quiz respects you a little now",
  "Good - Nice landing, still bounced once",
];

export function getPerformanceMessage(percentage: number) {
  if (percentage >= 90) {
    return "Excellent - Pilot Grade";
  }

  if (percentage >= 85) {
    return "Great Job!";
  }

  if (percentage >= 70) {
    return GOOD_SCORE_MESSAGES[
      Math.floor(Math.random() * GOOD_SCORE_MESSAGES.length)
    ];
  }

  if (percentage >= 50) {
    return FAIR_SCORE_MESSAGES[
      Math.floor(Math.random() * FAIR_SCORE_MESSAGES.length)
    ];
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
