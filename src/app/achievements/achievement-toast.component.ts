import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { AchievementService } from './achievement.service';
import { AchievementToastEntry } from './achievement.model';

@Component({
  selector: 'app-achievement-toast', standalone: true,
  template: `
    @if (current(); as entry) {
      <aside class="achievement-toast" [class.bonus-toast]="entry.achievement.isBonus" role="status" aria-live="polite" aria-atomic="true">
        @if (entry.externalTrace) { <span class="external-trace">EXTERNAL TRACE COMPLETE</span> }
        <strong>{{ entry.achievement.isBonus ? 'BONUS ACHIEVEMENT UNLOCKED' : 'ACHIEVEMENT UNLOCKED' }}</strong>
        <h2>{{ entry.achievement.title }}</h2><p>{{ entry.achievement.description }}</p>
        @if (entry.achievement.isBonus) { <p class="rgb-message">CHROMATIC OVERRIDE INSTALLED<br>RGB MODE: ONLINE</p> }
        @else { <small>{{ entry.unlockedCount }} / {{ entry.totalCount }} DISCOVERED</small> }
      </aside>
    }`,
  styleUrl: './achievement-toast.component.scss'
})
export class AchievementToastComponent implements OnDestroy {
  protected readonly service = inject(AchievementService);
  protected readonly current = signal<AchievementToastEntry | undefined>(this.service.notificationQueue()[0]);
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    effect(() => {
      const queued = this.service.notificationQueue()[0];
      const next = queued?.ready ? queued : undefined;
      this.current.set(next);
      clearTimeout(this.timer);
      if (next) this.timer = setTimeout(() => this.service.dismissNotification(next.achievement.id), 2850);
    }, { allowSignalWrites: true });
  }
  ngOnDestroy(): void { clearTimeout(this.timer); }
}
