import { Component } from '@angular/core';
import { ExpandableImageDirective } from '../../shared/expandable-image.directive';
import { AchievementService } from '../../achievements/achievement.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ExpandableImageDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private readonly achievements: AchievementService) {}
  protected recordLinkedIn(): void { this.achievements.unlockFromExternalLink('network-effect'); }
  protected recordGithub(): void { this.achievements.unlockFromExternalLink('source-available'); }
}
