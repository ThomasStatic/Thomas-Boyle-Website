import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { RouterLink } from '@angular/router';
import { AchievementService } from '../achievements/achievement.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HeaderComponent, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  constructor(private readonly achievements: AchievementService) {}
  protected recordInterestingLink(): void { this.achievements.unlock('read-between-the-lines'); }
  protected recordGithub(): void { this.achievements.unlockFromExternalLink('source-available'); this.recordInterestingLink(); }
}
