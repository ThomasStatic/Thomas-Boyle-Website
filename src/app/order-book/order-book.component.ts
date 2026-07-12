import { Component, OnDestroy, computed, signal } from '@angular/core';
import { AchievementService } from '../achievements/achievement.service';

type OrderBookLevel = {
  bidSize: string;
  bidPrice: string;
  askPrice: string;
  askSize: string;
};

type BuildLogLine = {
  status: 'done' | 'active' | 'queued';
  text: string;
};

type FeatureCard = {
  label: string;
  title: string;
  text: string;
  accent: string;
};
type MatchingDemoStage='idle'|'resting-book'|'incoming-order'|'matching-best-ask'|'matching-next-ask'|'execution-complete';
interface DemoLevel{price:number;quantity:number}
interface DemoFill{price:number;quantity:number}
const MATCHING_DEMO={restingBids:[{price:100.95,quantity:12},{price:100.90,quantity:15}],restingAsks:[{price:101.05,quantity:8},{price:101.10,quantity:6},{price:101.20,quantity:10}],incomingBuy:{limitPrice:101.10,quantity:10},fills:[{price:101.05,quantity:8},{price:101.10,quantity:2}]} as const;

@Component({
  selector: 'app-order-book',
  standalone: true,
  templateUrl: './order-book.component.html',
  styleUrl: './order-book.component.scss'
})
export class OrderBookComponent implements OnDestroy {
  protected readonly demo=MATCHING_DEMO;
  protected readonly matchState=signal<MatchingDemoStage>('idle');
  protected readonly completedStageCount=signal(0);
  protected readonly visibleLog=computed(()=>this.demoLog.slice(0,this.completedStageCount()));
  protected readonly isRunning=computed(()=>!['idle','execution-complete'].includes(this.matchState()));
  private readonly demoLog=[
    '> RESTING BOOK LOADED',
    `> BUY ${MATCHING_DEMO.incomingBuy.quantity} @ ${MATCHING_DEMO.incomingBuy.limitPrice.toFixed(2)} RECEIVED`,
    `> FILLED ${MATCHING_DEMO.fills[0].quantity} @ ${MATCHING_DEMO.fills[0].price.toFixed(2)}`,
    `> FILLED ${MATCHING_DEMO.fills[1].quantity} @ ${MATCHING_DEMO.fills[1].price.toFixed(2)}`,
    `> ORDER FILLED ${MATCHING_DEMO.incomingBuy.quantity} / ${MATCHING_DEMO.incomingBuy.quantity}`,
    `> REMAINING ASK ${MATCHING_DEMO.restingAsks[1].quantity-MATCHING_DEMO.fills[1].quantity} @ ${MATCHING_DEMO.restingAsks[1].price.toFixed(2)}`
  ];
  private readonly matchTimers:ReturnType<typeof setTimeout>[]=[];
  constructor(private readonly achievements: AchievementService) {}
  protected executeMatch(): void {
    if (this.matchState() !== 'idle') return;
    const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
    const stage=(delay:number,fn:()=>void)=>this.matchTimers.push(setTimeout(fn,reduced?0:delay));
    this.setDemoStage('resting-book',1);
    stage(650,()=>this.setDemoStage('incoming-order',2));
    stage(1300,()=>this.setDemoStage('matching-best-ask',3));
    stage(1950,()=>this.setDemoStage('matching-next-ask',4));
    stage(2600,()=>{this.setDemoStage('execution-complete',6);this.achievements.unlock('match-found');});
  }
  protected askQuantity(level:DemoLevel):number{const fill=this.demo.fills.find(item=>item.price===level.price);const firstApplied=['matching-best-ask','matching-next-ask','execution-complete'].includes(this.matchState())&&level.price===this.demo.restingAsks[0].price;const secondApplied=['matching-next-ask','execution-complete'].includes(this.matchState())&&level.price===this.demo.restingAsks[1].price;return level.quantity-(firstApplied||secondApplied?(fill?.quantity??0):0)}
  protected resetMatch(): void { this.matchTimers.forEach(clearTimeout);this.matchTimers.length=0;this.matchState.set('idle');this.completedStageCount.set(0); }
  private setDemoStage(stage:MatchingDemoStage,logCount:number){this.matchState.set(stage);this.completedStageCount.set(logCount);}
  ngOnDestroy(): void { this.matchTimers.forEach(clearTimeout); }
  protected readonly progressSegments = Array.from({ length: 10 }, (_, index) => index === 0);

  protected readonly orderBookLevels: OrderBookLevel[] = [
    { bidSize: '420', bidPrice: '101.24', askPrice: '101.25', askSize: '180' },
    { bidSize: '310', bidPrice: '101.23', askPrice: '101.26', askSize: '260' },
    { bidSize: '780', bidPrice: '101.22', askPrice: '101.27', askSize: '640' },
    { bidSize: '150', bidPrice: '101.21', askPrice: '101.28', askSize: '390' },
    { bidSize: '900', bidPrice: '101.20', askPrice: '101.29', askSize: '710' }
  ];

  protected readonly buildLogLines: BuildLogLine[] = [
    { status: 'done', text: 'boot price-time priority core' },
    { status: 'done', text: 'teach limit orders to stand in line politely' },
    { status: 'active', text: 'wire cancel/modify paths without angering the cache' },
    { status: 'queued', text: 'benchmark the spicy parts' },
    { status: 'queued', text: 'add replay tools and market data feeds' },
    { status: 'queued', text: 'stare at perf traces until enlightenment happens' }
  ];

  protected readonly featureCards: FeatureCard[] = [
    {
      label: 'ENGINE',
      title: 'Matching logic first',
      text: 'The core goal is an electronic limit order book that processes limit, market, cancel, and modify orders while maintaining price-time priority.',
      accent: '#7ee7d8'
    },
    {
      label: 'SYSTEMS',
      title: 'Latency-minded C++',
      text: 'This is less get-rich-quick and more why-is-this-pointer-chasing-making-my-CPU-sad: memory layout, cache behavior, and low-latency design are the fun bits.',
      accent: '#f8d66d'
    },
    {
      label: 'TOOLING',
      title: 'Benchmarks incoming',
      text: 'The project will grow into unit tests, profiling, benchmarks, replay tooling, and performance experiments that make the engine easier to trust.',
      accent: '#ff8f7a'
    },
    {
      label: 'WHY',
      title: 'Market plumbing is cool',
      text: 'I am not building a trading strategy. I am building the infrastructure side quest: the machinery that lets modern markets exist without everyone yelling numbers across a room.',
      accent: '#c7f07c'
    }
  ];
}
