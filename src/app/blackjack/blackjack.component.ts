import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CardName, Deck, ICard, PlayingCard, Suit } from 'typedeck';
import { MatDialog } from '@angular/material/dialog';
import { EndOfGameDialogComponent } from './end-of-game-dialog/end-of-game-dialog.component';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './blackjack.component.html',
  styleUrl: './blackjack.component.scss'
})
export class BlackjackComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  
  validCardNumbers: CardName[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  validCardSuits: Suit[] = [0, 1, 2, 3]; // Suit is an enum with values 0-3
  deck: Deck | null = null;
  cards: ICard[] = [];

  dealersHand: WritableSignal<PlayingCard[]> = signal([]);
  playersHand: WritableSignal<PlayingCard[]> = signal([]);

  playersTotal: WritableSignal<number> = signal(0);
  dealersTotal: WritableSignal<number> = signal(0);

  userStanding: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.initNewGame();
  }

  refreshDeck(): void {
   for(const cardName of this.validCardNumbers) {
      for(const suit of this.validCardSuits) {
        this.cards.push(new PlayingCard(cardName, suit));
      }
    }
    this.deck = new Deck(this.cards);
  }

  protected getImagePath(card: PlayingCard): string {
    let cardNum = this.getCardNum(card.cardName);
    let cardSuit = this.getCardSuit(card.suit);
    return `playing-cards/${cardNum}_of_${cardSuit}.png`;    
  }

  private getCardNum(cardNum: number): string {
    switch(cardNum) {
      case CardName.Ace:
        return "ace";
      case CardName.Two:
        return "two";
      case CardName.Three:
        return "three";
      case CardName.Four:
        return "four";
      case CardName.Five:
        return "five";
      case CardName.Six:
        return "six";
      case CardName.Seven:
        return "seven";
      case CardName.Eight:
        return "eight";
      case CardName.Nine:
        return "nine";
      case CardName.Ten:
        return "ten";
      case CardName.Jack:
        return "jack";
      case CardName.Queen:
        return "queen";
      default:
        return "king";
    }
  }

  private getCardSuit(cardSuit: number): string {
    switch(cardSuit) {
      case Suit.Clubs:
        return "clubs";
      case Suit.Diamonds:
        return "diamonds";
      case Suit.Hearts:
        return "hearts";
      default:
        return "spades";
    }
  }

  private initNewGame(): void {
    this.userStanding.set(false);
    this.refreshDeck();
    this.deck?.shuffle();
    this.dealersHand.set([this.deck?.takeCard() as PlayingCard, this.deck?.takeCard() as PlayingCard]);
    this.playersHand.set([this.deck?.takeCard() as PlayingCard, this.deck?.takeCard() as PlayingCard]);

    this.playersTotal.set(this.calcHandTotal(this.playersHand()));
    this.dealersTotal.set(this.calcHandTotal([this.dealersHand()[1]])); // Only show the player the dealer's face-up card

    // If the player has blackjack, they shouldn't be able to hit
    if(this.playersTotal() === 21) {
      this.stand();
    }
  }

  protected hit(whoHit: 'Player' | 'Dealer' = 'Dealer'): void {
    if(whoHit === 'Player') {
      this.playersHand.update(hand => [...hand, this.deck?.takeCard() as PlayingCard]);
      this.playersTotal.set(this.calcHandTotal(this.playersHand()));
    } else {
      this.dealersHand.update(hand => [...hand, this.deck?.takeCard() as PlayingCard]);
      this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));
    }
    if(this.playersTotal() === 21) { 
      this.stand();
      return;
    }
    if(this.playersTotal() > 21) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'Player Bust!', message: `You busted with ${this.playersTotal()}... dealer wins!` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.initNewGame();
      });
    }
  }

  protected async stand(): Promise<void> {
    this.userStanding.set(true);
    this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));
    this.playersTotal.set(this.calcHandTotal(this.playersHand()));
    while(this.calcHandTotal(this.dealersHand()) < 17) {
      await this.sleep(500);
      this.hit('Dealer');
    }

    if(this.dealersTotal() > 21) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'Dealer Bust!', message: `The dealer busted with ${this.dealersTotal()}... you win!` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.initNewGame();
      });
    }
    else if(this.dealersTotal() > this.playersTotal()) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'Dealer Wins!', message: `The dealer beat your ${this.playersTotal()} with ${this.dealersTotal()}!` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.initNewGame();
      });
    }
    else if(this.dealersTotal() === this.playersTotal()) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'Push!', message: `It's a push! Both you and the dealer have ${this.playersTotal()}.` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.initNewGame();
      });
    }
    else if(this.dealersTotal() < this.playersTotal()) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'You Win!', message: `You beat the dealer with ${this.playersTotal()} to their ${this.dealersTotal()}!` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.initNewGame();
      });
    }
  }

  private calcHandTotal(hand: PlayingCard[]): number {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      const cardValue = this.getCardValue(card.cardName);
      total += cardValue;

      if (cardValue === 11) {
        aces++;
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  private getCardValue(cardName: CardName): number {
    switch (cardName) {
      case CardName.Ace:
        return 11;
      case CardName.Jack:
      case CardName.Queen:
      case CardName.King:
        return 10;
      default:
        return cardName + 1;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
