import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AchievementLogComponent } from './achievement-log.component';

describe('AchievementLogComponent touch warning',()=>{
  const media=(matches:boolean)=>({matches,media:'',onchange:null,addListener:()=>{},removeListener:()=>{},addEventListener:()=>{},removeEventListener:()=>{},dispatchEvent:()=>false}) as MediaQueryList;
  afterEach(()=>{localStorage.clear();sessionStorage.clear();TestBed.resetTestingModule();});
  function render(touchFirst:boolean):HTMLElement{
    spyOn(window,'matchMedia').and.returnValue(media(touchFirst));
    TestBed.configureTestingModule({imports:[AchievementLogComponent],providers:[provideRouter([])]});
    const fixture=TestBed.createComponent(AchievementLogComponent);fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sys-log-trigger') as HTMLButtonElement).click();fixture.detectChanges();return fixture.nativeElement;
  }
  it('shows keyboard-required copy for touch-first input',()=>expect(render(true).textContent).toContain('KEYBOARD INPUT REQUIRED'));
  it('omits keyboard-required copy for desktop input',()=>expect(render(false).textContent).not.toContain('KEYBOARD INPUT REQUIRED'));
});
