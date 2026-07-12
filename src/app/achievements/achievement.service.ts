import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ACHIEVEMENTS } from './achievement-definitions';
import { AchievementRouteCategory, AchievementToastEntry } from './achievement.model';

interface StoredProgress {
  version: 3;
  unlockedAt: Record<string, string>;
  viewedCardIds: string[];
  completedBlackjackHands: number;
  rgbEnabled: boolean;
  rootCelebrationShown: boolean;
  konamiSequenceShown?: boolean;
}
interface LegacyProgress { unlockedAt?: Record<string, string>; viewedCardIds?: string[]; completedBlackjackHands?: number; }
export interface BlackjackHandResult { won: boolean; pushed: boolean; totals: readonly number[]; naturalBlackjack: boolean; }

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private readonly storageKey = 'thomas-portfolio-achievements-v3';
  private readonly legacyStorageKeys = ['thomas-portfolio-achievements-v2','thomas-portfolio-achievements-v1'] as const;
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly unlockedAtState = signal<Record<string, string>>({});
  private readonly viewedCardIdsState = signal<string[]>([]);
  private readonly validAboutCardIdsState = signal<string[]>([]);
  private readonly handCountState = signal(0);
  private readonly notificationQueueState = signal<AchievementToastEntry[]>([]);
  private readonly rgbEnabledState = signal(false);
  private readonly rgbSweepState = signal(false);
  private readonly rootCelebrationShownState = signal(false);
  private readonly rootCelebrationActiveState = signal(false);
  private readonly konamiSequenceShownState = signal(false);
  private readonly konamiSequenceActiveState = signal(false);
  private readonly konamiReadyState = signal(false);
  private readonly timers: number[] = [];
  private konamiPosition = 0;
  private evaluating = false;
  private bootSequenceFinished = false;

  readonly definitions = ACHIEVEMENTS;
  readonly completionDefinitions = ACHIEVEMENTS.filter(item => item.countsTowardCompletion);
  readonly bonusDefinitions = ACHIEVEMENTS.filter(item => item.isBonus);
  readonly unlockedAt = this.unlockedAtState.asReadonly();
  readonly viewedCardIds = this.viewedCardIdsState.asReadonly();
  readonly completedBlackjackHands = this.handCountState.asReadonly();
  readonly notificationQueue = this.notificationQueueState.asReadonly();
  readonly rgbEnabled = this.rgbEnabledState.asReadonly();
  readonly rgbSweepActive = this.rgbSweepState.asReadonly();
  readonly rootCelebrationActive = this.rootCelebrationActiveState.asReadonly();
  readonly konamiSequenceActive = this.konamiSequenceActiveState.asReadonly();
  readonly konamiReady = this.konamiReadyState.asReadonly();
  readonly unlockedCount = computed(() => this.completionDefinitions.filter(item => this.isUnlocked(item.id)).length);
  readonly totalCount = this.completionDefinitions.length;
  readonly bonusUnlockedCount = computed(() => this.bonusDefinitions.filter(item => this.isUnlocked(item.id)).length);
  readonly completionPercentage = computed(() => Math.round(this.unlockedCount() / this.totalCount * 100));
  remainingForRoute(category: AchievementRouteCategory): number { return this.completionDefinitions.filter(item => item.routeCategory === category && !this.isUnlocked(item.id)).length; }

  constructor() {
    if (!this.browser) return;
    this.restore();
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.recordRoute(event.urlAfterRedirects));
    this.recordRoute(this.router.url);
    this.document.addEventListener('keydown', this.onKeydown);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', this.onKeydown);
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.timers.forEach(timer => this.document.defaultView?.clearTimeout(timer));
    });
  }

  isUnlocked(id: string): boolean { return Boolean(this.unlockedAtState()[id]); }

  unlock(id: string): boolean {
    const definition = ACHIEVEMENTS.find(item => item.id === id);
    if (!definition || this.isUnlocked(id)) return false;
    this.unlockedAtState.update(value => ({ ...value, [id]: new Date().toISOString() }));
    if (id !== 'konami-code' && id !== 'root-access') {
      const entry: AchievementToastEntry = { achievement: { ...definition, unlockedAt: this.unlockedAtState()[id] }, unlockedCount: this.unlockedCount(), totalCount: this.totalCount, ready: true };
      this.notificationQueueState.update(queue => [...queue, entry]);
    }
    if (id === 'konami-code') this.activateKonamiSequence();
    if (id === 'root-access' && !this.rootCelebrationShownState()) {
      const timer=this.document.defaultView?.setTimeout(()=>{this.notificationQueueState.set([]);this.startRootCelebration();},450); if(timer!==undefined)this.timers.push(timer);
    }
    this.persist();
    this.evaluateDerived();
    return true;
  }

  recordBootSequenceComplete(): void {
    this.bootSequenceFinished = true;
    const path = (this.router.url.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
    if (path === '/') this.unlock('boot-sequence');
  }

  unlockFromExternalLink(id: string): boolean {
    const unlocked = this.unlock(id);
    if (!unlocked) return false;
    this.notificationQueueState.update(queue => queue.map(entry => entry.achievement.id === id ? { ...entry, externalTrace: true, ready: false } : entry));
    const timer = this.document.defaultView?.setTimeout(() => {
      if (!this.document.hidden) this.releaseExternalToasts();
    }, 350);
    if (timer !== undefined) this.timers.push(timer);
    return true;
  }

  dismissNotification(id: string): void {
    const dismissed = this.notificationQueueState()[0];
    this.notificationQueueState.update(queue => queue[0]?.achievement.id === id ? queue.slice(1) : queue.filter(item => item.achievement.id !== id));
  }

  toggleRgbMode(): void {
    if (!this.isUnlocked('konami-code')) return;
    this.rgbEnabledState.update(enabled => !enabled);
    this.persist();
  }

  dismissRootCelebration(): void { this.rootCelebrationActiveState.set(false); }
  dismissKonamiSequence(): void { this.konamiSequenceActiveState.set(false); this.konamiReadyState.set(false); }

  configureAboutCards(ids:readonly string[]):void{const valid=[...new Set(ids.filter(id=>typeof id==='string'&&id.length>0))];this.validAboutCardIdsState.set(valid);this.viewedCardIdsState.update(viewed=>viewed.filter(id=>valid.includes(id)));this.persist();this.evaluateDerived();}

  recordAboutCardViewed(id: string): void {
    if (!this.validAboutCardIdsState().includes(id) || this.viewedCardIdsState().includes(id)) return;
    this.viewedCardIdsState.update(ids => [...ids, id]);
    this.unlock('card-reader'); this.persist(); this.evaluateDerived();
  }

  recordBlackjackHandCompleted(result: BlackjackHandResult): void {
    this.handCountState.update(count => count + 1);
    this.unlock('showdown');
    if (result.naturalBlackjack) this.unlock('natural-selection');
    this.persist(); this.evaluateDerived();
  }

  resetAllAchievements(): void {
    if (!this.browser) return;
    this.unlockedAtState.set({}); this.viewedCardIdsState.set([]); this.handCountState.set(0); this.notificationQueueState.set([]);
    this.rgbEnabledState.set(false); this.rgbSweepState.set(false); this.rootCelebrationShownState.set(false); this.rootCelebrationActiveState.set(false);
    this.konamiSequenceShownState.set(false); this.konamiSequenceActiveState.set(false); this.konamiReadyState.set(false);
    localStorage.removeItem(this.storageKey); this.legacyStorageKeys.forEach(key => localStorage.removeItem(key));
  }

  private recordRoute(url: string): void {
    const path = (url.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
    const routeMap: Record<string, string> = { '/get-to-know-me': 'personnel-file', '/capstone': 'research-access', '/order-book': 'market-order', '/blackjack': 'casino-royal' };
    if (routeMap[path]) this.unlock(routeMap[path]);
    if(path==='/'&&this.bootSequenceFinished)this.unlock('boot-sequence');
  }

  private evaluateDerived(): void {
    if (this.evaluating) return;
    this.evaluating = true;
    try {
      const hasAll = (ids: readonly string[]) => ids.every(id => this.isUnlocked(id));
      if (hasAll(['boot-sequence','personnel-file','research-access','market-order','casino-royal'])) this.unlock('full-system-scan');
      const validCards=this.validAboutCardIdsState();
      if (validCards.length>0 && validCards.every(id => this.viewedCardIdsState().includes(id))) this.unlock('classified-dossier');
      if (hasAll(['technical-version','enhance'])) this.unlock('research-complete');
      if (this.handCountState() >= 3) this.unlock('house-edge');
      if (this.completionDefinitions.every(item => this.isUnlocked(item.id))) this.unlock('root-access');
    } finally { this.evaluating = false; }
  }

  private restore(): void {
    try {
      const currentRaw = localStorage.getItem(this.storageKey);
      const legacyKey = this.legacyStorageKeys.find(key => localStorage.getItem(key));
      const legacyRaw = legacyKey ? localStorage.getItem(legacyKey) : null;
      const stored = JSON.parse(currentRaw ?? legacyRaw ?? 'null') as (Partial<StoredProgress> & LegacyProgress) | null;
      if (!stored) return;
      const validIds = new Set(ACHIEVEMENTS.map(item => item.id));
      const unlockedAt = stored.unlockedAt && typeof stored.unlockedAt === 'object'
        ? Object.fromEntries(Object.entries(stored.unlockedAt).filter(([id,date]) => validIds.has(id) && id !== 'home-directory' && (!legacyRaw || id !== 'root-access') && typeof date === 'string')) : {};
      this.unlockedAtState.set(unlockedAt);
      this.viewedCardIdsState.set(Array.isArray(stored.viewedCardIds) ? stored.viewedCardIds.filter(id => typeof id === 'string') : []);
      this.handCountState.set(typeof stored.completedBlackjackHands === 'number' && stored.completedBlackjackHands >= 0 ? Math.floor(stored.completedBlackjackHands) : 0);
      this.rgbEnabledState.set(Boolean(stored.rgbEnabled) && Boolean(unlockedAt['konami-code']));
      this.rootCelebrationShownState.set(Boolean(stored.rootCelebrationShown) || (!currentRaw && Boolean(unlockedAt['root-access'])));
      this.konamiSequenceShownState.set(Boolean(stored.konamiSequenceShown) || (!currentRaw && Boolean(unlockedAt['konami-code'])));
      this.evaluateDerived();
      this.persist();
      if (legacyRaw) this.legacyStorageKeys.forEach(key => localStorage.removeItem(key));
      if (currentRaw && unlockedAt['root-access'] && !this.rootCelebrationShownState()) queueMicrotask(() => this.startRootCelebration());
    } catch { localStorage.removeItem(this.storageKey); this.legacyStorageKeys.forEach(key => localStorage.removeItem(key)); }
  }

  private persist(): void {
    if (!this.browser) return;
    const progress: StoredProgress = { version: 3, unlockedAt: this.unlockedAtState(), viewedCardIds: this.viewedCardIdsState(), completedBlackjackHands: this.handCountState(), rgbEnabled: this.rgbEnabledState(), rootCelebrationShown: this.rootCelebrationShownState(), konamiSequenceShown: this.konamiSequenceShownState() };
    try { localStorage.setItem(this.storageKey, JSON.stringify(progress)); } catch { /* Storage may be unavailable. */ }
  }

  private activateKonamiSequence(): void {
    this.rgbSweepState.set(false);
    if (!this.konamiSequenceShownState()) {
      this.konamiSequenceShownState.set(true); this.konamiSequenceActiveState.set(true);
      this.rgbEnabledState.set(false);
      const readyTimer=this.document.defaultView?.setTimeout(()=>{this.completeKonamiInstall();this.konamiReadyState.set(true);},2600);if(readyTimer!==undefined)this.timers.push(readyTimer);
    }
  }
  completeKonamiInstall(): void { if(!this.konamiSequenceActiveState())return;this.rgbEnabledState.set(true);this.rgbSweepState.set(true);const timer=this.document.defaultView?.setTimeout(()=>this.rgbSweepState.set(false),1500);if(timer!==undefined)this.timers.push(timer);this.persist(); }

  private releaseExternalToasts(): void {
    this.notificationQueueState.update(queue => queue.map(entry => entry.externalTrace ? { ...entry, ready: true } : entry));
  }

  private readonly onVisibilityChange = (): void => { if (!this.document.hidden) this.releaseExternalToasts(); };

  private startRootCelebration(): void {
    this.rootCelebrationShownState.set(true); this.rootCelebrationActiveState.set(true); this.persist();
    const timer = this.document.defaultView?.setTimeout(() => this.rootCelebrationActiveState.set(false), 3800);
    if (timer !== undefined) this.timers.push(timer);
  }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    this.konamiPosition = key === sequence[this.konamiPosition] ? this.konamiPosition + 1 : key === sequence[0] ? 1 : 0;
    if (this.konamiPosition === sequence.length) { this.konamiPosition = 0; this.unlock('konami-code'); }
  };
}
