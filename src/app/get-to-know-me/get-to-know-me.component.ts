import { Component } from '@angular/core';
import { AchievementService } from '../achievements/achievement.service';
import { ABOUT_CARD_IDS } from '../achievements/achievement-definitions';

type KnowMeItem = {
  tag: string;
  question: string;
  answer: string;
  accent: string;
};

@Component({
  selector: 'app-get-to-know-me',
  standalone: true,
  templateUrl: './get-to-know-me.component.html',
  styleUrl: './get-to-know-me.component.scss'
})
export class GetToKnowMeComponent {
  protected readonly cardIds = ABOUT_CARD_IDS;
  constructor(private readonly achievements: AchievementService) {
    this.achievements.configureAboutCards(this.cardIds);
  }
  protected readonly knowMeItems: KnowMeItem[] = [
    {
      tag: 'How I show up',
      question: 'What do people usually learn after working with me?',
      answer: 'People usually learn that I care. I really do. I want to get involved, understand the context, and feel like part of the team. My dad gave me advice that has stuck with me: solve more problems than you create. That is a pretty good summary of how I try to show up.',
      accent: '#7ee7d8'
    },
    {
      tag: 'Problem taste',
      question: 'What kind of problems make me lose track of time?',
      answer: 'I lose track of time on problems that are genuinely open-ended, where there is not a single right answer hiding at the back of the textbook. I like having to weigh tradeoffs, make assumptions, test ideas, and figure out what good even means in context.',
      accent: '#f8d66d'
    },
    {
      tag: 'Learning mode',
      question: 'What is my relationship with learning new things?',
      answer: 'I love learning new things, especially when I can apply them in practice. I try hard to read and study enough context before jumping in, but it is always a battle not to start building immediately. I learn best when theory turns into something I can test, break, fix, and actually use.',
      accent: '#ff8f7a'
    },
    {
      tag: 'Current grind',
      question: 'What am I trying to get better at right now?',
      answer: 'Right now I am putting a lot of time into improving my C++ skills. I am also trying to deepen my understanding of Model Context Protocol tooling and cloud infrastructure. There is so much to learn in that space that you could probably spend a lifetime studying it and still not run out of new corners, which is honestly part of the fun.',
      accent: '#9ec5ff'
    },
    {
      tag: 'Guitar arc',
      question: 'What is a non-work thing I am back into?',
      answer: 'I have started playing guitar a lot more again, mostly shoegaze, grunge, and metal on my Ibanez. School and life got busy for a while, then I spent a month in Europe without my guitar, and somehow that reset the obsession. Now that I have it back, I cannot really put it down.',
      accent: '#ffb86b'
    },
    {
      tag: 'Book shelf',
      question: 'What books changed how I think?',
      answer: 'Two books have genuinely changed how I think: Tuesdays with Morrie and The Myth of Sisyphus. Tuesdays with Morrie shifted my perspective on getting older, relationships, and the value of lived experience over simply chasing more knowledge. The Myth of Sisyphus pushed me to think harder about purpose, and to build a life around what feels meaningful to me instead of blindly following a path just because it looks correct from the outside.',
      accent: '#c7f07c'
    },
    {
      tag: 'Very me',
      question: 'What project felt extremely me?',
      answer: 'My machine learning thesis felt very, very me. It sat at the intersection of math, computer science, and a real-world problem, so it combined the three work parts of my brain into one project. I like projects where theory, implementation, and practical stakes all have to talk to each other.',
      accent: '#f2a7de'
    },
    {
      tag: 'People I value',
      question: 'What do I value in teammates and friends?',
      answer: 'I value teammates who bring real passion and make the people around them better. I like the iron sharpens iron idea: people who lift each other up, challenge each other honestly, and make the work stronger. I think I value the same thing in friendships too. Honesty and accountability matter a lot to me; I appreciate people who can admit when they are wrong, and who can call me out when I need it, with the shared goal of becoming better humans.',
      accent: '#7ee7d8'
    },
    {
      tag: 'Best Saturday',
      question: 'What is my ideal free Saturday?',
      answer: 'My ideal free Saturday probably includes seeing a band play, grabbing a couple beers with friends, writing some code, playing guitar, maybe watching some anime, and definitely getting a workout in. Ideally not legs. I respect leg day in theory.',
      accent: '#f8d66d'
    },
    {
      tag: 'Travel scene',
      question: 'What place has stuck with me?',
      answer: 'Budapest really stuck with me. At night, the lights reflecting off the Danube felt almost poetic, like all this beautiful light was filling the darkness around the city. I do not think I expected a place to feel that cinematic in real life.',
      accent: '#9ec5ff'
    },
    {
      tag: 'Small hill',
      question: 'What harmless opinion am I prepared to defend?',
      answer: 'My small hill: I think The Lord of the Rings movies and The Hobbit films are overrated. The pacing is way too slow for me, they are extremely long, and I think people sometimes overanalyze them instead of just enjoying them for what they are. I respect the craft. I also reserve the right to not spend half a calendar day in Middle-earth.',
      accent: '#ff8f7a'
    },
    {
      tag: 'Interview wish',
      question: 'What do I wish more interviewers asked?',
      answer: 'When can you start? Just kidding. I wish more interviewers asked deeper soft-skill questions instead of only the standard tell me about a time you had conflict at work format. I like interviews that feel like actual conversations, where both people are trying to understand how the other thinks, rather than two people reading from scripts at each other.',
      accent: '#ffb86b'
    },
    {
      tag: 'Proud of',
      question: 'What am I proud of outside of school or work?',
      answer: 'Two years ago I won my fantasy football league\'s regular season, which remains pretty rad. More seriously, I am proud of rebuilding my relationship with health. I lost over 100 lbs and now try to live what I would call an 80% healthy, 20% fun lifestyle. I think most people call that balanced, but as a math person I cannot honestly call an 80/20 split balanced.',
      accent: '#c7f07c'
    },
    {
      tag: 'Tiny confession',
      question: 'What makes me laugh more than I should admit?',
      answer: 'Instagram Reels make me laugh more reliably than I would like to admit. I am also aware that my life would probably improve if I spent less time proving that.',
      accent: '#f2a7de'
    }
  ];

  protected selectedKnowMeIndex = 0;

  protected get selectedKnowMeItem(): KnowMeItem {
    return this.knowMeItems[this.selectedKnowMeIndex];
  }

  protected selectKnowMeItem(index: number): void {
    this.selectedKnowMeIndex = index;
    this.achievements.recordAboutCardViewed(this.cardIds[index]);
  }

  protected showNextKnowMeItem(): void {
    this.achievements.recordAboutCardViewed(this.cardIds[this.selectedKnowMeIndex]);
    this.selectedKnowMeIndex = (this.selectedKnowMeIndex + 1) % this.knowMeItems.length;
    this.achievements.recordAboutCardViewed(this.cardIds[this.selectedKnowMeIndex]);
  }
}
