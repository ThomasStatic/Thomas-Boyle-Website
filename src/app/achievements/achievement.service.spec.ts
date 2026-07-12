import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ABOUT_CARD_IDS, ACHIEVEMENTS } from './achievement-definitions';
import { AchievementService } from './achievement.service';

describe('AchievementService', () => {
  const storageKey = 'thomas-portfolio-achievements-v3';
  const legacyKey = 'thomas-portfolio-achievements-v1';
  const createService = (): AchievementService => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.inject(AchievementService);
  };
  beforeEach(() => { localStorage.clear(); TestBed.resetTestingModule(); });
  afterEach(() => TestBed.resetTestingModule());

  it('stores once and snapshots queued progress independently', () => {
    const service = createService();
    service.unlock('technical-version');
    service.unlock('enhance'); // also queues research-complete
    service.unlock('technical-version');
    const entries = service.notificationQueue();
    const technical = entries.find(entry => entry.achievement.id === 'technical-version');
    const enhance = entries.find(entry => entry.achievement.id === 'enhance');
    const derived = entries.find(entry => entry.achievement.id === 'research-complete');
    expect(technical?.unlockedCount).toBeLessThan(enhance?.unlockedCount ?? 0);
    expect(enhance?.unlockedCount).toBeLessThan(derived?.unlockedCount ?? 0);
    expect(Object.keys(service.unlockedAt()).filter(id => id === 'technical-version').length).toBe(1);
  });

  it('defers an external toast briefly and releases it when the page remains visible', fakeAsync(() => {
    const service = createService();
    service.unlockFromExternalLink('network-effect');
    expect(service.notificationQueue()[0].ready).toBeFalse();
    tick(350);
    expect(service.notificationQueue()[0].ready).toBeTrue();
  }));

  it('does not leak external trace origin into later normal or derived unlocks', () => {
    const service=createService();
    service.unlockFromExternalLink('source-available');
    service.unlock('read-between-the-lines');
    service.unlock('enhance');
    service.unlockFromExternalLink('technical-version');
    const entries=service.notificationQueue();
    expect(entries.find(entry=>entry.achievement.id==='source-available')?.externalTrace).toBeTrue();
    expect(entries.find(entry=>entry.achievement.id==='read-between-the-lines')?.externalTrace).toBeUndefined();
    expect(entries.find(entry=>entry.achievement.id==='research-complete')?.externalTrace).toBeUndefined();
  });

  it('migrates v1 storage, removes home-directory, and preserves valid progress', () => {
    localStorage.setItem(legacyKey, JSON.stringify({ version:1, unlockedAt:{ 'home-directory':'old', enhance:'2026-01-01T00:00:00.000Z' }, viewedCardIds:[], completedBlackjackHands:2 }));
    const service = createService();
    expect(service.isUnlocked('home-directory')).toBeFalse();
    expect(service.isUnlocked('enhance')).toBeTrue();
    expect(service.completedBlackjackHands()).toBe(2);
    expect(localStorage.getItem(legacyKey)).toBeNull();
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}').version).toBe(3);
  });

  it('handles malformed storage safely', () => {
    localStorage.setItem(storageKey, '{broken');
    expect(() => createService()).not.toThrow();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('unlocks exploration, personnel, and thesis derived achievements', () => {
    const service = createService();
    ['boot-sequence','personnel-file','research-access','market-order','casino-royal'].forEach(id => service.unlock(id));
    expect(service.isUnlocked('full-system-scan')).toBeTrue();
    service.configureAboutCards(ABOUT_CARD_IDS);
    ABOUT_CARD_IDS.forEach(id => service.recordAboutCardViewed(id));
    expect(service.isUnlocked('classified-dossier')).toBeTrue();
    service.unlock('technical-version'); service.unlock('enhance');
    expect(service.isUnlocked('research-complete')).toBeTrue();
  });

  it('unlocks the dossier immediately on the final unique card in any order', () => {
    const service=createService();const ids=['alpha','beta','gamma'];service.configureAboutCards(ids);
    ['gamma','alpha','alpha'].forEach(id=>service.recordAboutCardViewed(id));
    expect(service.isUnlocked('classified-dossier')).toBeFalse();
    service.recordAboutCardViewed('beta');
    expect(service.isUnlocked('classified-dossier')).toBeTrue();
    expect(service.viewedCardIds()).toEqual(['gamma','alpha','beta']);
    expect(service.notificationQueue().filter(entry=>entry.achievement.id==='classified-dossier').length).toBe(1);
  });

  it('derives personnel total from configured cards and removes stale persisted ids', () => {
    localStorage.setItem(storageKey,JSON.stringify({version:3,unlockedAt:{},viewedCardIds:['current','removed'],completedBlackjackHands:0,rgbEnabled:false,rootCelebrationShown:false,konamiSequenceShown:false}));
    const service=createService();service.configureAboutCards(['current','new-card']);
    expect(service.viewedCardIds()).toEqual(['current']);
    service.recordAboutCardViewed('new-card');expect(service.isUnlocked('classified-dossier')).toBeTrue();
  });

  it('excludes bonus and meta achievements from completion totals', () => {
    const service = createService();
    const expected = ACHIEVEMENTS.filter(item => item.countsTowardCompletion).length;
    expect(service.totalCount).toBe(expected);
    expect(ACHIEVEMENTS.find(item => item.id === 'konami-code')?.countsTowardCompletion).toBeFalse();
    expect(ACHIEVEMENTS.find(item => item.id === 'root-access')?.countsTowardCompletion).toBeFalse();
    service.unlock('konami-code');
    expect(service.unlockedCount()).toBe(0);
    expect(service.totalCount).toBe(18);
    expect(['winner-winner','twenty-one','push-notification','blackjack-regular'].some(id => service.definitions.some(item => item.id === id))).toBeFalse();
  });

  it('categorizes source available as System and calculates route-local remaining entries', () => {
    const service=createService();
    expect(service.definitions.find(item=>item.id==='source-available')?.category).toBe('System');
    expect(service.remainingForRoute('Order Book')).toBe(1);
    service.unlock('match-found');
    expect(service.remainingForRoute('Order Book')).toBe(0);
    expect(service.remainingForRoute('Home')).toBe(2);
  });

  it('unlocks root without requiring itself or the bonus', () => {
    const service = createService();
    ACHIEVEMENTS.filter(item => item.countsTowardCompletion).forEach(item => service.unlock(item.id));
    expect(service.isUnlocked('root-access')).toBeTrue();
    expect(service.isUnlocked('konami-code')).toBeFalse();
    expect(service.completionPercentage()).toBe(100);
  });
});
