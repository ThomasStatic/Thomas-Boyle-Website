import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, NgZone, OnDestroy, PLATFORM_ID, ViewChild, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBarComponent } from './navigation-bar/navigation-bar.component';
import { AchievementToastComponent } from './achievements/achievement-toast.component';
import { AchievementService } from './achievements/achievement.service';
import { SectorStatusComponent } from './achievements/sector-status.component';
import { OverlayScrollLockService } from './shared/overlay-scroll-lock.service';

type CursorStateClass =
  | 'cursor-native-drag-link'
  | 'cursor-native-drag-text'
  | 'cursor-native-drag-unavailable'
  | 'cursor-autoscroll-all'
  | 'cursor-autoscroll-horizontal'
  | 'cursor-autoscroll-vertical'
  | 'cursor-autoscroll-dgn1'
  | 'cursor-autoscroll-dgn2';

type NativeDragKind = 'link' | 'selection';
type ScrollTarget = HTMLElement | Window;

interface ScrollAxes {
  x: boolean;
  y: boolean;
}

interface MiddleScrollState {
  axes: ScrollAxes;
  deltaX: number;
  deltaY: number;
  originX: number;
  originY: number;
  target: ScrollTarget;
}
type BootLineKind='boot'|'ready'|'countdown'|'prompt'|'copy';
interface BootTranscriptLine{kind:BootLineKind;text:string}

const CURSOR_STATE_CLASSES: readonly CursorStateClass[] = [
  'cursor-native-drag-link',
  'cursor-native-drag-text',
  'cursor-native-drag-unavailable',
  'cursor-autoscroll-all',
  'cursor-autoscroll-horizontal',
  'cursor-autoscroll-vertical',
  'cursor-autoscroll-dgn1',
  'cursor-autoscroll-dgn2'
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavigationBarComponent, AchievementToastComponent, SectorStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'personalProject';
  private readonly bootSequenceLines = [
    'Initializing...',
    'Retuning The Guitar...',
    'Adding Shameless Self-Promotion...',
    'Brewing Coffee...',
    'Git Reverting That Last Commit...',
    'Done!'
  ];
  protected readonly bootSequenceVisible = signal(false);
  protected readonly bootSequenceExiting = signal(false);
  protected readonly bootReady = signal(false);
  protected readonly bootCountdown = signal(20);
  protected readonly bootTranscriptLines=signal<BootTranscriptLine[]>([]);
  protected readonly touchFirst = signal(false);
  @ViewChild('bootTranscript') private bootTranscript?:ElementRef<HTMLElement>;

  private activeDragKind: NativeDragKind | null = null;
  private middleScrollState: MiddleScrollState | null = null;
  private bootController?:AbortController;
  private bootScrollFrame=0;
  private readonly removeListeners: Array<() => void> = [];
  private scrollAnimationFrame = 0;
  private suppressNextAuxClick = false;
  private readonly view: Window | null;
  private konamiLocked=false; private rootLocked=false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly ngZone: NgZone,
    protected readonly achievements: AchievementService,
    private readonly scrollLock: OverlayScrollLockService
  ) {
    this.view = this.document.defaultView;
    effect(()=>{const active=this.achievements.konamiSequenceActive();if(active&&!this.konamiLocked){this.scrollLock.lock();this.konamiLocked=true}else if(!active&&this.konamiLocked){this.scrollLock.unlock();this.konamiLocked=false}});
    effect(()=>{const active=this.achievements.rootCelebrationActive();if(active&&!this.rootLocked){this.scrollLock.lock();this.rootLocked=true}else if(!active&&this.rootLocked){this.scrollLock.unlock();this.rootLocked=false}});
    effect(()=>{this.bootTranscriptLines().map(line=>line.text).join('');this.scheduleBootScroll();});

    if (isPlatformBrowser(platformId)) {
      this.startBootSequence();
      this.touchFirst.set(this.view?.matchMedia('(hover: none), (pointer: coarse)').matches ?? false);
      this.ngZone.runOutsideAngular(() => this.bindCursorEvents());
    }
  }

  ngOnDestroy(): void {
    this.bootController?.abort();
    if(this.bootScrollFrame&&this.view)this.view.cancelAnimationFrame(this.bootScrollFrame);

    for (const removeListener of this.removeListeners) {
      removeListener();
    }

    this.clearMiddleScrollState();
    this.setCursorState(null);
    if (this.bootSequenceVisible()) this.scrollLock.unlock();
    if(this.konamiLocked)this.scrollLock.unlock();if(this.rootLocked)this.scrollLock.unlock();
  }

  private startBootSequence(): void {
    if (!this.view) {
      return;
    }

    this.bootSequenceVisible.set(true);
    this.bootSequenceExiting.set(false);this.bootTranscriptLines.set([]);this.bootReady.set(false);
    this.scrollLock.lock();
    this.bootController=new AbortController();void this.runBootSequence(this.bootController.signal);
  }

  private async runBootSequence(signal:AbortSignal):Promise<void>{
    if(!this.view)return;const reduced=this.view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){this.bootReady.set(true);this.bootCountdown.set(12);this.bootTranscriptLines.set([...this.bootSequenceLines.map(text=>({kind:'boot' as const,text})),{kind:'ready',text:'SYSTEM READY'},{kind:'countdown',text:''},{kind:'prompt',text:`> ${this.touchFirst()?'TAP':'PRESS ANY KEY'} TO ENTER`},{kind:'copy',text:'For real. Go ahead. This site does stuff.'},{kind:'copy',text:'I may have gotten carried away with the interactive elements...'},{kind:'copy',text:'Things escalated quickly.'},{kind:'copy',text:'I regret nothing.'}]);await this.runBootCountdown(12,signal);return;}
    for(const [index,text] of this.bootSequenceLines.entries()){if(!await this.typeBootLine(text,'boot',signal))return;if(index<this.bootSequenceLines.length-1&&!await this.bootDelay(500,signal))return;}
    if(!await this.bootDelay(100,signal))return;this.bootReady.set(true);this.bootCountdown.set(20);void this.runBootCountdown(20,signal);
    if(!await this.typeBootLine('SYSTEM READY','ready',signal))return;
    this.appendBootLine('', 'countdown');
    if(!await this.bootDelay(225,signal))return;
    if(!await this.typeBootLine(`> ${this.touchFirst()?'TAP':'PRESS ANY KEY'} TO ENTER`,'prompt',signal))return;
    const copy=['For real. Go ahead. This site does stuff.','I may have gotten carried away with the interactive elements...','Things escalated quickly.','I regret nothing.'];
    for(const text of copy){if(!await this.bootDelay(550,signal))return;if(!await this.typeBootLine(text,'copy',signal))return;}
  }
  private async typeBootLine(text:string,kind:BootLineKind,signal:AbortSignal):Promise<boolean>{const index=this.appendBootLine('',kind);for(const character of text){if(!await this.bootDelay(28,signal))return false;this.bootTranscriptLines.update(lines=>lines.map((line,i)=>i===index?{...line,text:line.text+character}:line));}return true;}
  private appendBootLine(text:string,kind:BootLineKind):number{const index=this.bootTranscriptLines().length;this.bootTranscriptLines.update(lines=>[...lines,{kind,text}]);return index;}
  private async runBootCountdown(seconds:number,signal:AbortSignal):Promise<void>{const deadline=Date.now()+seconds*1000;while(!signal.aborted){const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));this.bootCountdown.set(remaining);if(remaining===0){this.enterBoot();return;}if(!await this.bootDelay(200,signal))return;}}
  private bootDelay(ms:number,signal:AbortSignal):Promise<boolean>{return new Promise(resolve=>{if(signal.aborted){resolve(false);return}const timer=this.view!.setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve(true);},ms);const cancel=()=>{this.view!.clearTimeout(timer);resolve(false)};signal.addEventListener('abort',cancel,{once:true});});}
  private scheduleBootScroll():void{if(!this.view||this.bootScrollFrame||!this.bootSequenceVisible())return;this.bootScrollFrame=this.view.requestAnimationFrame(()=>{this.bootScrollFrame=0;const element=this.bootTranscript?.nativeElement;if(!element)return;const required=Math.max(0,element.scrollHeight-element.clientHeight);if(element.scrollTop<required)element.scrollTop=required;});}

  protected enterBoot(event?:Event): void {
    if(!this.bootReady()||!this.bootSequenceVisible())return;event?.preventDefault();event?.stopPropagation();
    this.bootController?.abort();this.bootSequenceVisible.set(false);this.scrollLock.unlock();this.achievements.recordBootSequenceComplete();
  }

  protected continueKonami(event?:Event):void{if(!this.achievements.konamiReady())return;event?.preventDefault();event?.stopPropagation();this.achievements.dismissKonamiSequence();}

  private bindCursorEvents(): void {
    this.listen(this.document, 'keydown', this.handleTerminalContinue, { capture: true });
    this.listen(this.document, 'dragstart', this.handleDragStart, { capture: true });
    this.listen(this.document, 'dragenter', this.handleDragOver, { capture: true });
    this.listen(this.document, 'dragover', this.handleDragOver, { capture: true });
    this.listen(this.document, 'drop', this.handleDragEnd, { capture: true });
    this.listen(this.document, 'dragend', this.handleDragEnd, { capture: true });
    this.listen(this.document, 'mousedown', this.handleMouseDown, { capture: true });
    this.listen(this.document, 'mousemove', this.handleMouseMove, { capture: true });
    this.listen(this.document, 'mouseup', this.handleMouseUp, { capture: true });
    this.listen(this.document, 'auxclick', this.handleAuxClick, { capture: true });

    if (this.view) {
      this.listen(this.view, 'blur', this.handleWindowBlur);
    }
  }

  private readonly handleTerminalContinue:EventListener=(raw):void=>{const event=raw as KeyboardEvent;if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||['Alt','Control','Meta','Shift'].includes(event.key))return;if(this.bootReady()&&this.bootSequenceVisible()){this.enterBoot(event);return}if(this.achievements.konamiSequenceActive()&&this.achievements.konamiReady())this.continueKonami(event);};

  private listen(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.removeListeners.push(() => target.removeEventListener(type, listener, options));
  }

  private readonly handleDragStart: EventListener = (rawEvent: Event): void => {
    const event = rawEvent as DragEvent;
    const targetElement = this.getElement(event.target);

    if (!targetElement) {
      return;
    }

    if (targetElement.closest('a[href], img, [draggable="true"]')) {
      this.activeDragKind = 'link';
      this.setCursorState('cursor-native-drag-link');
      return;
    }

    const selection = this.document.getSelection();

    if (selection && !selection.isCollapsed) {
      this.activeDragKind = 'selection';
      this.setCursorState('cursor-native-drag-unavailable');
    }
  };

  private readonly handleDragOver: EventListener = (rawEvent: Event): void => {
    if (!this.activeDragKind) {
      return;
    }

    const event = rawEvent as DragEvent;

    if (this.activeDragKind === 'link') {
      this.setCursorState('cursor-native-drag-link');
      return;
    }

    if (this.isEditableDropTarget(event.target)) {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }

      this.setCursorState('cursor-native-drag-text');
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none';
    }

    this.setCursorState('cursor-native-drag-unavailable');
  };

  private readonly handleDragEnd: EventListener = (): void => {
    this.activeDragKind = null;

    if (!this.middleScrollState) {
      this.setCursorState(null);
    }
  };

  private readonly handleMouseDown: EventListener = (rawEvent: Event): void => {
    const event = rawEvent as MouseEvent;

    if (event.button !== 1 || this.activeDragKind) {
      return;
    }

    const targetElement = this.getElement(event.target);

    if (this.shouldPreserveMiddleClick(targetElement)) {
      return;
    }

    const scrollTarget = this.getScrollTarget(targetElement);

    if (!scrollTarget) {
      return;
    }

    const axes = this.getScrollableAxes(scrollTarget);

    if (!axes.x && !axes.y) {
      return;
    }

    event.preventDefault();
    this.suppressNextAuxClick = true;
    this.middleScrollState = {
      axes,
      deltaX: 0,
      deltaY: 0,
      originX: event.clientX,
      originY: event.clientY,
      target: scrollTarget
    };
    this.setCursorState(this.getAutoscrollCursorClass(0, 0, axes));
    this.ensureAutoscrollLoop();
  };

  private readonly handleMouseMove: EventListener = (rawEvent: Event): void => {
    if (!this.middleScrollState) {
      return;
    }

    const event = rawEvent as MouseEvent;

    event.preventDefault();
    this.middleScrollState.deltaX = event.clientX - this.middleScrollState.originX;
    this.middleScrollState.deltaY = event.clientY - this.middleScrollState.originY;
    this.setCursorState(
      this.getAutoscrollCursorClass(
        this.middleScrollState.deltaX,
        this.middleScrollState.deltaY,
        this.middleScrollState.axes
      )
    );
  };

  private readonly handleMouseUp: EventListener = (rawEvent: Event): void => {
    const event = rawEvent as MouseEvent;

    if (event.button === 1 && this.middleScrollState) {
      event.preventDefault();
      this.clearMiddleScrollState();
    }
  };

  private readonly handleAuxClick: EventListener = (rawEvent: Event): void => {
    const event = rawEvent as MouseEvent;

    if (event.button === 1 && this.suppressNextAuxClick) {
      event.preventDefault();
      this.suppressNextAuxClick = false;
    }
  };

  private readonly handleWindowBlur: EventListener = (): void => {
    this.activeDragKind = null;
    this.clearMiddleScrollState();
    this.setCursorState(null);
  };

  private readonly autoscrollStep = (): void => {
    const state = this.middleScrollState;

    if (!state || !this.view) {
      this.scrollAnimationFrame = 0;
      return;
    }

    const left = state.axes.x ? this.getScrollSpeed(state.deltaX) : 0;
    const top = state.axes.y ? this.getScrollSpeed(state.deltaY) : 0;

    if (state.target === this.view) {
      this.view.scrollBy(left, top);
    } else {
      state.target.scrollBy({ left, top });
    }

    this.scrollAnimationFrame = this.view.requestAnimationFrame(this.autoscrollStep);
  };

  private ensureAutoscrollLoop(): void {
    if (this.scrollAnimationFrame || !this.view) {
      return;
    }

    this.scrollAnimationFrame = this.view.requestAnimationFrame(this.autoscrollStep);
  }

  private clearMiddleScrollState(): void {
    if (this.scrollAnimationFrame && this.view) {
      this.view.cancelAnimationFrame(this.scrollAnimationFrame);
    }

    this.scrollAnimationFrame = 0;
    this.middleScrollState = null;

    if (!this.activeDragKind) {
      this.setCursorState(null);
    }
  }

  private getScrollSpeed(distanceFromOrigin: number): number {
    const deadZone = 10;
    const adjustedDistance = Math.max(0, Math.abs(distanceFromOrigin) - deadZone);

    if (adjustedDistance === 0) {
      return 0;
    }

    return Math.sign(distanceFromOrigin) * Math.min(28, adjustedDistance / 4);
  }

  private getAutoscrollCursorClass(
    deltaX: number,
    deltaY: number,
    axes: ScrollAxes
  ): CursorStateClass {
    if (axes.x && axes.y) {
      const threshold = 10;
      const hasHorizontalIntent = Math.abs(deltaX) > threshold;
      const hasVerticalIntent = Math.abs(deltaY) > threshold;

      if (hasHorizontalIntent && hasVerticalIntent) {
        return Math.sign(deltaX) === Math.sign(deltaY)
          ? 'cursor-autoscroll-dgn1'
          : 'cursor-autoscroll-dgn2';
      }

      if (hasHorizontalIntent) {
        return 'cursor-autoscroll-horizontal';
      }

      if (hasVerticalIntent) {
        return 'cursor-autoscroll-vertical';
      }

      return 'cursor-autoscroll-all';
    }

    return axes.x ? 'cursor-autoscroll-horizontal' : 'cursor-autoscroll-vertical';
  }

  private getScrollTarget(startElement: Element | null): ScrollTarget | null {
    let currentElement: Element | null = startElement;

    while (currentElement) {
      if (currentElement instanceof HTMLElement) {
        const axes = this.getElementScrollableAxes(currentElement);

        if (axes.x || axes.y) {
          return currentElement;
        }
      }

      currentElement = currentElement.parentElement;
    }

    if (!this.view) {
      return null;
    }

    const windowAxes = this.getWindowScrollableAxes();
    return windowAxes.x || windowAxes.y ? this.view : null;
  }

  private getScrollableAxes(target: ScrollTarget): ScrollAxes {
    if (target instanceof HTMLElement) {
      return this.getElementScrollableAxes(target);
    }

    return this.getWindowScrollableAxes();
  }

  private getElementScrollableAxes(element: HTMLElement): ScrollAxes {
    const style = this.view?.getComputedStyle(element);

    return {
      x:
        element.scrollWidth > element.clientWidth &&
        this.allowsScroll(style?.overflowX),
      y:
        element.scrollHeight > element.clientHeight &&
        this.allowsScroll(style?.overflowY)
    };
  }

  private getWindowScrollableAxes(): ScrollAxes {
    if (!this.view) {
      return { x: false, y: false };
    }

    const documentElement = this.document.documentElement;
    const body = this.document.body;

    return {
      x: Math.max(documentElement.scrollWidth, body.scrollWidth) > this.view.innerWidth,
      y: Math.max(documentElement.scrollHeight, body.scrollHeight) > this.view.innerHeight
    };
  }

  private allowsScroll(overflowValue: string | undefined): boolean {
    return overflowValue === 'auto' || overflowValue === 'scroll' || overflowValue === 'overlay';
  }

  private shouldPreserveMiddleClick(element: Element | null): boolean {
    return Boolean(
      element?.closest(
        'a[href], button, input, textarea, select, [role="button"], .mat-mdc-button-base, .mat-mdc-select'
      )
    );
  }

  private isEditableDropTarget(target: EventTarget | null): boolean {
    const element = this.getElement(target);
    const editableElement = element?.closest(
      'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'
    );

    return Boolean(
      editableElement &&
        !editableElement.hasAttribute('disabled') &&
        editableElement.getAttribute('aria-disabled') !== 'true'
    );
  }

  private getElement(target: EventTarget | null): Element | null {
    return target instanceof Element ? target : null;
  }

  private setCursorState(cursorStateClass: CursorStateClass | null): void {
    const rootClassList = this.document.documentElement.classList;

    for (const stateClass of CURSOR_STATE_CLASSES) {
      rootClassList.toggle(stateClass, stateClass === cursorStateClass);
    }
  }
}
