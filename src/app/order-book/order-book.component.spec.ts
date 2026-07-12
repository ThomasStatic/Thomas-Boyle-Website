import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrderBookComponent } from './order-book.component';
import { AchievementService } from '../achievements/achievement.service';

describe('OrderBookComponent matching demo',()=>{
  const achievements=jasmine.createSpyObj<AchievementService>('AchievementService',['unlock']);
  beforeEach(()=>TestBed.configureTestingModule({imports:[OrderBookComponent],providers:[{provide:AchievementService,useValue:achievements}]}));
  it('unlocks only after the deterministic sequence and reset restores the initial view',fakeAsync(()=>{
    const fixture=TestBed.createComponent(OrderBookComponent);fixture.detectChanges();
    const execute=fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(fixture.nativeElement.textContent).not.toContain('INCOMING BUY');
    execute.click();fixture.detectChanges();expect(achievements.unlock).not.toHaveBeenCalled();
    tick(2600);fixture.detectChanges();expect(achievements.unlock).toHaveBeenCalledOnceWith('match-found');
    expect(fixture.nativeElement.textContent).toContain('4 remain on the ask @ 101.10');
  }));
});
