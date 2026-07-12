import { Component, DestroyRef, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AchievementService } from './achievement.service';
import { AchievementRouteCategory } from './achievement.model';
const ROUTES:readonly {path:string;category:AchievementRouteCategory;label:string}[]=[{path:'/',category:'Home',label:'HOME'},{path:'/get-to-know-me',category:'Personnel',label:'PERSONNEL'},{path:'/capstone',category:'Research',label:'RESEARCH'},{path:'/order-book',category:'Order Book',label:'ORDER BOOK'},{path:'/blackjack',category:'Blackjack',label:'BLACKJACK'}];
export const SECTOR_STATUS_VISIBLE_MS=3700;
@Component({selector:'app-sector-status',standalone:true,imports:[RouterLink],template:`
@if(visible()){
<aside class="sector" role="status">
@if(cleared()){
<strong>&gt; SECTOR CLEARED<br>&gt; ALL LOCAL RECORDS DECRYPTED</strong>
@if(next();as target){<p>NEXT SIGNAL: {{target.label}}</p><a [routerLink]="target.path">[OPEN SECTOR]</a>}
}@else{
<strong>&gt; LOCAL SECTOR SCAN...</strong><p>&gt; {{remaining()}} UNRESOLVED {{remaining()===1?'ENTRY':'ENTRIES'}} DETECTED</p>
}
</aside>
}`,styles:[`:host{display:block;height:0;position:relative;z-index:900}.sector{background:#101818;border:1px solid rgba(126,231,216,.55);color:#f9fbf2;font-family:"VT323",monospace;max-width:25rem;padding:.55rem .75rem;position:fixed;right:1rem;top:var(--shared-nav-height);width:calc(100vw - 3.5rem)}.sector strong{color:#7ee7d8}.sector p{margin:.25rem 0}.sector a{color:#f8d66d}@media(prefers-reduced-motion:no-preference){.sector{animation:scan-in .3s steps(3)}}@keyframes scan-in{from{opacity:0;transform:translateY(-.3rem)}}`]})
export class SectorStatusComponent implements OnDestroy{
 private readonly router=inject(Router);private readonly achievements=inject(AchievementService);private readonly session=globalThis.sessionStorage;
 protected readonly visible=signal(false);protected readonly category=signal<AchievementRouteCategory>('Home');protected readonly cleared=signal(false);
 protected readonly remaining=computed(()=>this.achievements.remainingForRoute(this.category()));
 protected readonly next=computed(()=>{const index=ROUTES.findIndex(r=>r.category===this.category());const ordered=[...ROUTES.slice(index+1),...ROUTES.slice(0,index)];return ordered.find(r=>this.achievements.remainingForRoute(r.category)>0);});
 private timers:ReturnType<typeof setTimeout>[]=[];
 constructor(){this.show(this.router.url);this.router.events.pipe(filter((e):e is NavigationEnd=>e instanceof NavigationEnd),takeUntilDestroyed(inject(DestroyRef))).subscribe(e=>this.show(e.urlAfterRedirects));effect(()=>{if(this.remaining()===0)this.show(this.router.url);},{allowSignalWrites:true});}
 ngOnDestroy(){this.clearTimers();}
 private clearTimers(){this.timers.forEach(clearTimeout);this.timers=[];this.visible.set(false);}
 private show(url:string){this.clearTimers();const path=(url.split(/[?#]/)[0]||'/').replace(/\/+$/,'')||'/';const route=ROUTES.find(r=>r.path===path);if(!route)return;this.category.set(route.category);const remaining=this.achievements.remainingForRoute(route.category);const kind=remaining===0?'cleared':'scan';let seen:string[]=[];try{seen=JSON.parse(this.session?.getItem(`sector-${kind}-v1`)??'[]');if(!Array.isArray(seen))seen=[];}catch{seen=[]}if(seen.includes(path)||(remaining===0&&!this.next()))return;seen.push(path);this.session?.setItem(`sector-${kind}-v1`,JSON.stringify(seen));this.cleared.set(remaining===0);this.timers.push(setTimeout(()=>{this.visible.set(true);this.timers.push(setTimeout(()=>this.visible.set(false),SECTOR_STATUS_VISIBLE_MS));},remaining===0?700:500));}
}
