import { Component } from '@angular/core';
import { ExpandableImageDirective } from '../shared/expandable-image.directive';
import { CapstoneTerminalHeroComponent } from './capstone-terminal-hero.component';
import { AchievementService } from '../achievements/achievement.service';

@Component({
  selector: 'app-capstone',
  standalone: true,
  imports: [ExpandableImageDirective, CapstoneTerminalHeroComponent],
  templateUrl: './capstone.component.html',
  styleUrl: './capstone.component.scss'
})
export class CapstoneComponent {
  constructor(private readonly achievements: AchievementService) {}
  protected recordTechnicalVersion(isGithub = false): void {
    this.achievements.unlockFromExternalLink('technical-version');
    if (isGithub) this.achievements.unlockFromExternalLink('source-available');
  }
}
