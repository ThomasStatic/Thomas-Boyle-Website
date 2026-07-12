import { Achievement } from './achievement.model';

type AchievementOptions = Pick<Achievement, 'hidden' | 'countsTowardCompletion' | 'isBonus' | 'isMeta' | 'routeCategory'>;
const achievement = (id: string, title: string, description: string, category: Achievement['category'], order: number, options: Partial<AchievementOptions> = {}): Achievement =>
  ({ id, title, description, category, order, countsTowardCompletion: true, ...options });

export const ACHIEVEMENTS: readonly Achievement[] = [
  achievement('boot-sequence', 'BOOT SEQUENCE COMPLETE', 'Portfolio login accepted.', 'Exploration', 1),
  achievement('personnel-file', 'PERSONNEL FILE', 'Opened the human-readable documentation.', 'Exploration', 3),
  achievement('research-access', 'RESEARCH ACCESS', 'Entered the machine learning archive.', 'Exploration', 4),
  achievement('market-order', 'MARKET... ORDER?', 'Inspected the order book project.', 'Exploration', 5),
  achievement('casino-royal', 'CASINO ROYAL', 'Entered a statistically questionable environment.', 'Exploration', 6),
  achievement('full-system-scan', 'FULL SYSTEM SCAN', 'Visited every major section of the site.', 'Exploration', 7),
  achievement('read-between-the-lines', 'READ BETWEEN THE LINES', 'Investigated one of the reasons Thomas claims to be interesting.', 'Home', 8, { routeCategory:'Home' }),
  achievement('source-available', 'SOURCE AVAILABLE', 'Inspected the code behind the claims.', 'System', 9),
  achievement('network-effect', 'NETWORK EFFECT', 'Professional networking protocol initiated.', 'Home', 10, { routeCategory:'Home' }),
  achievement('card-reader', 'PERSONNEL QUERY', 'Requested additional personnel data.', 'Personnel', 11, { routeCategory:'Personnel' }),
  achievement('classified-dossier', 'CLASSIFIED DOSSIER', 'Reviewed every available personnel record.', 'Personnel', 12, { routeCategory:'Personnel' }),
  achievement('technical-version', 'TECHNICAL VERSION', 'Voluntarily requested additional mathematics.', 'Research', 13, { routeCategory:'Research' }),
  achievement('enhance', 'ENHANCE', 'Zoomed in. The pixels did their best.', 'Research', 14, { routeCategory:'Research' }),
  achievement('research-complete', 'RESEARCH COMPLETE', 'Inspected both the explanation and the evidence.', 'Research', 15, { routeCategory:'Research' }),
  achievement('match-found', 'MATCH FOUND', 'Successfully crossed the spread.', 'Order Book', 16, { routeCategory:'Order Book' }),
  achievement('first-bet', 'FIRST BET', 'Capital has officially been placed at risk.', 'Blackjack', 16, { routeCategory:'Blackjack' }),
  achievement('showdown', 'SHOWDOWN', 'Completed a hand against the house.', 'Blackjack', 17, { routeCategory:'Blackjack' }),
  achievement('house-edge', 'HOUSE EDGE', 'Played three hands and remained statistically optimistic.', 'Blackjack', 18, { routeCategory:'Blackjack' }),
  achievement('natural-selection', 'NATURAL SELECTION', 'Dealt a natural blackjack. Probability approved.', 'Blackjack', 19, { countsTowardCompletion: false, isBonus: true }),
  achievement('split-decision', 'SPLIT DECISION', 'One questionable decision became two.', 'Blackjack', 20, { countsTowardCompletion: false, isBonus: true }),
  achievement('double-trouble', 'DOUBLE TROUBLE', 'Doubled the bet. Confidence not included.', 'Blackjack', 21, { countsTowardCompletion: false, isBonus: true }),
  achievement('konami-code', 'CHEAT CODE ACCEPTED', 'Legacy input protocol authenticated.', 'System', 24, { hidden: true, countsTowardCompletion: false, isBonus: true }),
  achievement('root-access', 'ROOT ACCESS', 'Every core achievement has been unlocked.', 'System', 25, { countsTowardCompletion: false, isMeta: true })
];

export const ABOUT_CARD_IDS = ['show-up','problem-taste','learning-mode','current-grind','guitar-arc','book-shelf','very-me','people-i-value','best-saturday','travel-scene','small-hill','interview-wish','proud-of','tiny-confession'] as const;
