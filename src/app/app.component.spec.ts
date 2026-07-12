import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent boot transcript',()=>{
  beforeEach(()=>TestBed.configureTestingModule({imports:[AppComponent],providers:[provideRouter([])]}));

  it('keeps boot and ready output in one ordered transcript with one countdown line',fakeAsync(()=>{
    const fixture=TestBed.createComponent(AppComponent);fixture.detectChanges();
    tick(7200);fixture.detectChanges();
    const transcript=fixture.nativeElement.querySelector('.boot-lines') as HTMLElement;
    const text=transcript.textContent??'';
    expect(text.indexOf('Done!')).toBeLessThan(text.indexOf('SYSTEM READY'));
    expect(text.indexOf('SYSTEM READY')).toBeLessThan(text.indexOf('AUTO-ENTERING IN'));
    expect(transcript.querySelectorAll('.boot-line').length).toBeGreaterThan(6);
    expect((text.match(/AUTO-ENTERING IN/g)??[]).length).toBe(1);
  }));

  it('cancels pending transcript work after early entry',fakeAsync(()=>{
    const fixture=TestBed.createComponent(AppComponent);fixture.detectChanges();tick(7200);fixture.detectChanges();
    const overlay=fixture.nativeElement.querySelector('.boot-sequence') as HTMLElement;overlay.click();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.boot-sequence')).toBeNull();
    tick(10000);fixture.detectChanges();expect(fixture.nativeElement.querySelector('.boot-sequence')).toBeNull();
  }));
});
