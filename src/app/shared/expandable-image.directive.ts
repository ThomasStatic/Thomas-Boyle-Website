import { Directive, ElementRef, HostBinding, HostListener, Input, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageLightboxDialogComponent, ImageLightboxData } from './image-lightbox-dialog.component';
import { AchievementService } from '../achievements/achievement.service';
import { Router } from '@angular/router';
import { OverlayScrollLockService } from './overlay-scroll-lock.service';

@Directive({
  selector: 'img[appExpandableImage]',
  standalone: true
})
export class ExpandableImageDirective {
  private readonly dialog = inject(MatDialog);
  private readonly image = inject(ElementRef<HTMLImageElement>);
  private readonly achievements = inject(AchievementService);
  private readonly router = inject(Router);
  private readonly scrollLock = inject(OverlayScrollLockService);
  @Input() achievementOnOpen?: string;

  @HostBinding('class.expandable-image')
  protected readonly expandableImageClass = true;

  @HostBinding('attr.role')
  protected readonly role = 'button';

  @HostBinding('attr.tabindex')
  protected readonly tabindex = '0';

  @HostBinding('attr.draggable')
  protected readonly draggable = 'false';

  @HostBinding('attr.aria-label')
  protected get ariaLabel(): string {
    const altText = this.image.nativeElement.alt.trim();
    return altText ? `Open expanded image: ${altText}` : 'Open expanded image';
  }

  @HostListener('click', ['$event'])
  protected openFromClick(event: MouseEvent): void {
    this.open(event);
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  protected openFromKeyboard(event: KeyboardEvent): void {
    this.open(event);
  }

  private open(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const imageElement = this.image.nativeElement;
    const src = imageElement.currentSrc || imageElement.src || imageElement.getAttribute('src') || '';
    const bounds = imageElement.getBoundingClientRect();

    if (!src) {
      return;
    }

    const data: ImageLightboxData = {
      src,
      alt: imageElement.alt,
      naturalWidth: imageElement.naturalWidth,
      naturalHeight: imageElement.naturalHeight,
      renderedWidth: bounds.width,
      renderedHeight: bounds.height
    };

    this.scrollLock.lock();
    this.dialog.open(ImageLightboxDialogComponent, {
      autoFocus: 'dialog',
      backdropClass: 'image-lightbox-backdrop',
      data,
      height: '94vh',
      maxHeight: '94vh',
      maxWidth: '96vw',
      panelClass: 'image-lightbox-panel',
      restoreFocus: true,
      width: '96vw'
    }).afterClosed().subscribe(()=>this.scrollLock.unlock());
    const achievementId = this.achievementOnOpen ?? (this.router.url.split(/[?#]/)[0] === '/capstone' ? 'enhance' : undefined);
    if (achievementId) this.achievements.unlock(achievementId);
  }
}
