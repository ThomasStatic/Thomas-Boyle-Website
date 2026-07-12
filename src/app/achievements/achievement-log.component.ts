import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AchievementService } from './achievement.service';
import { AchievementCategory } from './achievement.model';
import { OverlayScrollLockService } from '../shared/overlay-scroll-lock.service';
interface Preferences { manuallyExpandedCategoryIds:AchievementCategory[]; manuallyCollapsedCategoryIds:AchievementCategory[]; }
@Component({selector:'app-achievement-log',standalone:true,templateUrl:'./achievement-log.component.html',styleUrl:'./achievement-log.component.scss'})
export class AchievementLogComponent implements OnDestroy {
  protected readonly service=inject(AchievementService); protected readonly open=signal(false);
  protected readonly categories:readonly AchievementCategory[]=['Exploration','Home','Personnel','Research','Order Book','Blackjack','System'];
  private readonly router=inject(Router); private readonly document=inject(DOCUMENT); private readonly session=this.document.defaultView?.sessionStorage; private readonly scrollLock=inject(OverlayScrollLockService);
  protected readonly touchFirst=signal(false);
  private readonly key='thomas-portfolio-achievement-panel-v2'; private readonly manualExpanded=new Set<AchievementCategory>(); private readonly manualCollapsed=new Set<AchievementCategory>(); private autoExpanded:AchievementCategory|undefined; private trigger?:HTMLElement;
  @ViewChild('closeButton') private closeButton?:ElementRef<HTMLButtonElement>;
  constructor(){this.touchFirst.set(this.document.defaultView?.matchMedia?.('(hover: none), (pointer: coarse)').matches??false);this.restore();this.updateAuto();this.router.events.pipe(filter((e):e is NavigationEnd=>e instanceof NavigationEnd),takeUntilDestroyed(inject(DestroyRef))).subscribe(()=>this.updateAuto());}
  ngOnDestroy():void{if(this.open())this.scrollLock.unlock();}
  protected entries(c:AchievementCategory){return this.service.definitions.filter(i=>i.category===c&&!i.isBonus&&(!i.hidden||this.service.isUnlocked(i.id)));}
  protected categoryTotal(c:AchievementCategory){return this.service.definitions.filter(i=>i.category===c&&!i.isBonus).length;}
  protected categoryUnlocked(c:AchievementCategory){return this.service.definitions.filter(i=>i.category===c&&!i.isBonus&&this.service.isUnlocked(i.id)).length;}
  protected isExpanded(c:AchievementCategory){return this.manualExpanded.has(c)||this.autoExpanded===c&&!this.manualCollapsed.has(c);}
  protected toggleCategory(c:AchievementCategory):void{if(this.isExpanded(c)){this.manualExpanded.delete(c);this.manualCollapsed.add(c);}else{this.manualCollapsed.delete(c);this.manualExpanded.add(c);}this.save();}
  protected openPanel(e:Event):void{this.trigger=e.currentTarget as HTMLElement;this.updateAuto();this.open.set(true);this.scrollLock.lock();queueMicrotask(()=>this.closeButton?.nativeElement.focus());}
  protected closePanel():void{if(!this.open())return;this.open.set(false);this.scrollLock.unlock();queueMicrotask(()=>this.trigger?.focus());}
  @HostListener('document:keydown.escape') protected escape(){this.closePanel();}
  protected backdrop(e:MouseEvent){if(e.target===e.currentTarget)this.closePanel();}
  private updateAuto():void{const p=(this.router.url.split(/[?#]/)[0]||'/').replace(/\/+$/,'')||'/';this.autoExpanded=({'/':'Home','/get-to-know-me':'Personnel','/capstone':'Research','/order-book':'Order Book','/blackjack':'Blackjack'} as Record<string,AchievementCategory>)[p];}
  private restore(){try{const p=JSON.parse(this.session?.getItem(this.key)??'null') as Partial<Preferences>|null;const valid=(v:unknown)=>Array.isArray(v)?v.filter((x):x is AchievementCategory=>this.categories.includes(x as AchievementCategory)):[];valid(p?.manuallyExpandedCategoryIds).forEach(c=>this.manualExpanded.add(c));valid(p?.manuallyCollapsedCategoryIds).forEach(c=>this.manualCollapsed.add(c));}catch{this.session?.removeItem(this.key)}}
  private save(){try{this.session?.setItem(this.key,JSON.stringify({manuallyExpandedCategoryIds:[...this.manualExpanded],manuallyCollapsedCategoryIds:[...this.manualCollapsed]} satisfies Preferences));}catch{/* unavailable */}}
}
