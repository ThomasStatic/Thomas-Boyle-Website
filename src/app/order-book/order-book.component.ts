import { Component } from '@angular/core';

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

@Component({
  selector: 'app-order-book',
  standalone: true,
  templateUrl: './order-book.component.html',
  styleUrl: './order-book.component.scss'
})
export class OrderBookComponent {
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
