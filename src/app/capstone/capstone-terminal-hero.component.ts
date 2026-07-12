import { Component } from '@angular/core';

type TrainingMetric = {
  label: string;
  value: number;
  tone: 'reward' | 'stability' | 'exploration';
};

type LabTerminalRow = {
  label: string;
  value: string;
};

type ResearchLogItem = {
  done: boolean;
  label: string;
};

@Component({
  selector: 'app-capstone-terminal-hero',
  standalone: true,
  templateUrl: './capstone-terminal-hero.component.html',
  styleUrl: './capstone-terminal-hero.component.scss'
})
export class CapstoneTerminalHeroComponent {
  protected readonly tickerItems = [
    'LMP ^ 48.23',
    'LOAD v',
    'REWARD ^',
    'Q VALUES UPDATED',
    'ERCOT SIM READY',
    'POLICY CHECKPOINT SAVED',
    'MERIT ORDER ONLINE'
  ];

  protected readonly labTerminalRows: LabTerminalRow[] = [
    { label: 'User', value: 'tboyle' },
    { label: 'Experiment', value: 'ercot_qlearning_v12' },
    { label: 'Status', value: 'Idle' },
    { label: 'Last Saved', value: '2 minutes ago' }
  ];

  protected readonly trainingMetrics: TrainingMetric[] = [
    { label: 'Average Reward', value: 67, tone: 'reward' },
    { label: 'Policy Stability', value: 58, tone: 'stability' },
    { label: 'Exploration', value: 14, tone: 'exploration' }
  ];

  protected readonly researchLogItems: ResearchLogItem[] = [
    { done: true, label: 'Environment built' },
    { done: true, label: 'Historical data ingested' },
    { done: true, label: 'Baseline policies' },
    { done: true, label: 'Reward function redesigned' },
    { done: true, label: 'Multi-agent support' },
    { done: false, label: 'DQN' },
    { done: false, label: 'PPO' }
  ];

}
