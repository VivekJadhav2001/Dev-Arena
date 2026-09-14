/** Plain-language explainer copy for every DNA field. Keep in sync with backend weights. */
export const DNA_TIPS: Record<string, string> = {
  persona:
    'Your headline archetype. It comes from trait combinations (for example high Builder + high Competitor = Shipper-Duelist), not one single rule. Same stats always give the same persona.',
  flavor: 'A one-line read of your trait mix. Cosmetic only — it never changes your scores.',
  builder:
    'Builder (0–100) measures shipping from GitHub: 40% commits + repos, 25% coding rhythm, 20% open-source influence, 15% language breadth. 400 commits or ~17 repos saturates shipping.',
  solver:
    'Solver (0–100) measures problem-solving from LeetCode: 45% solved volume (hard counts 5× an easy), 30% difficulty mix, 15% contest rating, 10% regularity. Stays 0 until you connect LeetCode — never guessed.',
  competitor:
    'Competitor (0–100) measures live battles: 25% experience (10 battles saturates), 35% win rate smoothed toward 50% until you play enough, 15% streak, 25% scoring blended with quiz accuracy vs code solve rate. Stays 0 until your first battle.',
  versatility:
    'Versatility (0–100) measures balance: 100 minus the spread between your highest and lowest trait. A balanced 20/20/20 scores high here but still needs level to become an All-Rounder.',
  energy:
    'Energy is visual tempo only, not a score. Recent syncs or battles spin the helix faster; long inactivity lets it drift almost still.',
  rungs:
    'Each rung stands for real volume: 12 rungs plus commits ÷ 25, solves ÷ 6, and battles × 2 (capped at 110). More rungs means more stored history.',
  strands:
    'Strand width shows trait strength: the teal strand widens with Builder, the violet strand with Solver, rung glow with Competitor. An off-center helix means an unbalanced profile.',
  coverage:
    'Which of the 3 sources feed your DNA right now: GitHub, LeetCode, battles. Missing sources show as 0 in that trait with a next-step hint.',
  language:
    'Share of your owned-repo code bytes per language, from stored GitHub data. 5+ languages saturates the Builder breadth slice.',
  breakdown:
    'The exact sub-scores behind each trait, in the same order as the formula. Raw numbers so you can verify the math.',
  history:
    'Snapshots saved whenever your persona or any trait moves. Newest last, capped at 20, so you can watch your DNA evolve.',
  evolving:
    'DNA recalculates from stored stats on every visit and whenever you sync GitHub/LeetCode or finish a battle.',
}

export type DnaTipKey = keyof typeof DNA_TIPS
