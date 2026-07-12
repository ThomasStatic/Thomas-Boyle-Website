import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AchievementLogComponent } from '../achievements/achievement-log.component';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AchievementLogComponent],
  templateUrl: './navigation-bar.component.html',
  styleUrl: './navigation-bar.component.scss'
})
export class NavigationBarComponent {
  constructor(
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  refreshIfCurrentRoute(event: MouseEvent, route: string): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    if (this.normalizePath(this.router.url) !== this.normalizePath(route)) {
      return;
    }

    event.preventDefault();
    this.document.defaultView?.location.reload();
  }

  private normalizePath(path: string): string {
    const pathOnly = path.split(/[?#]/)[0] || '/';
    const pathWithLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

    return pathWithLeadingSlash.length > 1
      ? pathWithLeadingSlash.replace(/\/+$/, '')
      : '/';
  }
}
