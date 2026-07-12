export type AchievementCategory = 'Exploration' | 'Home' | 'Personnel' | 'Research' | 'Order Book' | 'Blackjack' | 'System';
export type AchievementRouteCategory = 'Home' | 'Personnel' | 'Research' | 'Order Book' | 'Blackjack';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  hidden?: boolean;
  countsTowardCompletion: boolean;
  isBonus?: boolean;
  isMeta?: boolean;
  routeCategory?: AchievementRouteCategory;
  order: number;
  unlockedAt?: string;
}

export interface AchievementToastEntry {
  achievement: Achievement;
  unlockedCount: number;
  totalCount: number;
  externalTrace?: boolean;
  ready: boolean;
}

export interface AchievementProgress {
  unlocked: ReadonlySet<string>;
  viewedCardIds: ReadonlySet<string>;
  completedBlackjackHands: number;
}
