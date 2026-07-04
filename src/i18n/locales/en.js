// English UI catalog. Source of truth — other locales fall back to this.
// Keep entries short and chrome-only (no lesson content here).
export const en = {
  // Tabs
  'tab.learn': 'Learn',
  'tab.roadmap': 'Roadmap',
  'tab.library': 'Library',
  'tab.projects': 'Projects',
  'tab.beast': 'Byte Beast',
  'tab.settings': 'Settings',

  // Home
  'home.welcome': '🚀 Welcome back, {name}',
  'home.tagline': 'DevOps fundamentals → MLOps in production.',
  'home.path.kicker': 'Your path · {icon} {name}',
  'home.continue': 'Continue: {title}',
  'home.weak.title': '{count} questions to revisit',
  'home.weak.title.one': '1 question to revisit',
  'home.weak.subtitle': "Math-quiz answers you've missed — clear them by retaking the lesson's quiz.",
  'home.weak.kicker': 'REVIEW · WEAK SPOTS',
  'home.daily.kicker': '⚡ DAILY PRACTICE',
  'home.daily.done': "Today's practice complete — see you tomorrow.",

  // Lesson nav
  'lesson.back': 'BACK',
  'lesson.continue': 'CONTINUE',
  'lesson.done': 'DONE',
  'lesson.complete': '✓ LESSON COMPLETE',
  'lesson.path.complete': '✦ {path} PATH COMPLETE',
  'lesson.backToMap': 'Back to the map',
  'lesson.startOfPath': 'Start of path',
  'lesson.takeQuiz': 'Take the quiz →',
  'lesson.quizKicker': '∑ MATH FOR ML · 5Q · SKIPPABLE',

  // Labs
  'lab.kicker': '⚒ LAB MILESTONES',
  'lab.next': 'NEXT',
  'lab.allDone': '✓ ALL MILESTONES COMPLETE — scroll to the bottom to finish the lab.',
  'lab.buildLocally':
    'Build this on your own machine — VS Code, your terminal, your tools. Check off each milestone as you finish it; progress saves locally.',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.language.hint': 'Affects the UI chrome only. Lesson content stays in English.',
  'settings.accent': 'Accent color',
  'settings.background': 'Background theme',
  'settings.deviceMode': 'Layout',
  'settings.activePath': 'Active path',
  'settings.export': 'Export backup',
  'settings.import': 'Import backup',
  'settings.reset': 'Reset all data',

  // Companion switcher
  'companion.switch': '🐉 Switch companion',
  'companion.switch.title': 'SWITCH COMPANION',
  'companion.switch.hint':
    'Each species keeps its own evolution progress per path. Switching is non-destructive — you can switch back.',
  'companion.cancel': 'Cancel',
  'companion.now': 'NOW',
  'companion.tier': 'TIER {tier}/4 ON THIS PATH',

  // Review Weak Spots
  'weak.title': 'REVIEW · WEAK SPOTS',
  'weak.headline.zero': 'Nothing to review — yet',
  'weak.headline': '{count} questions to revisit',
  'weak.empty':
    'When you miss a math-quiz question, it shows up here for review until you get it right.',
  'weak.openLesson': 'Open lesson →',

  // Error boundary
  'error.kicker': 'Something broke while rendering',
  'error.title': 'InfraLearn hit an error.',
  'error.body':
    'The screen would normally render here. Below is the error so you can fix it (or share it). If the app looks broken on every reload, the persisted state may be at fault — clearing it forces a fresh start.',
  'error.showStack': 'Show stack',
  'error.tryAgain': 'Try again',
  'error.clearAndReload': 'Clear stored state + reload',

  // Generic
  'generic.skip': 'Skip',
  'generic.next': 'Next →',
  'generic.prev': '← Prev',
  'generic.finish': 'Finish ✓',
  'generic.cancel': 'Cancel',
  'generic.close': 'Close',
  'generic.confirm': 'Confirm',
};
