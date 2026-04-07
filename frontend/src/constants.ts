// crisis keywords — used to detect if the user might need immediate help
// not comprehensive, but better than nothing for now
// TODO: move this to a backend config so it can be updated without a redeploy
export const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "die", "end it all", "hurt myself", "want to die"
];

export const HELPLINE_NUMBER = "988";
export const HELPLINE_TEXT = "If you're in immediate danger, please call emergency services or a crisis line.";