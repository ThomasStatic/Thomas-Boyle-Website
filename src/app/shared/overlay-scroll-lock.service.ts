import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn:'root' })
export class OverlayScrollLockService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private count = 0;
  private scrollY = 0;
  private previous = { position:'', top:'', width:'', overflowY:'', paddingRight:'', boxSizing:'', htmlOverflow:'' };
  lock(): void {
    if (!this.browser || ++this.count !== 1) return;
    const body = this.document.body; const view = this.document.defaultView!;
    this.scrollY = view.scrollY;
    this.previous = { position:body.style.position, top:body.style.top, width:body.style.width, overflowY:body.style.overflowY, paddingRight:body.style.paddingRight, boxSizing:body.style.boxSizing, htmlOverflow:this.document.documentElement.style.overflow };
    const gap = Math.max(0, view.innerWidth - this.document.documentElement.clientWidth);
    const stableGutter=view.getComputedStyle(this.document.documentElement).scrollbarGutter.includes('stable');
    body.style.position='fixed'; body.style.top=`-${this.scrollY}px`; body.style.width='100%'; body.style.boxSizing='border-box'; body.style.overflowY='hidden';this.document.documentElement.style.overflow='hidden';
    if (gap&&!stableGutter) body.style.paddingRight=`${gap}px`;
  }
  unlock(): void {
    if (!this.browser || this.count === 0 || --this.count !== 0) return;
    const body=this.document.body;body.style.position=this.previous.position;body.style.top=this.previous.top;body.style.width=this.previous.width;body.style.overflowY=this.previous.overflowY;body.style.paddingRight=this.previous.paddingRight;body.style.boxSizing=this.previous.boxSizing;this.document.documentElement.style.overflow=this.previous.htmlOverflow;this.document.defaultView?.scrollTo(0,this.scrollY);
  }
}
