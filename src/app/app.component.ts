import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBarComponent } from './navigation-bar/navigation-bar.component';
import { HomePageComponent } from './home-page/home-page.component';

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
  imports: [RouterOutlet, NavigationBarComponent, HomePageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'personalProject';

  private activeDragKind: NativeDragKind | null = null;
  private middleScrollState: MiddleScrollState | null = null;
  private readonly removeListeners: Array<() => void> = [];
  private scrollAnimationFrame = 0;
  private suppressNextAuxClick = false;
  private readonly view: Window | null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly ngZone: NgZone
  ) {
    this.view = this.document.defaultView;

    if (isPlatformBrowser(platformId)) {
      this.ngZone.runOutsideAngular(() => this.bindCursorEvents());
    }
  }

  ngOnDestroy(): void {
    for (const removeListener of this.removeListeners) {
      removeListener();
    }

    this.clearMiddleScrollState();
    this.setCursorState(null);
  }

  private bindCursorEvents(): void {
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
