import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CardName, Deck, ICard, PlayingCard, Suit } from 'typedeck';
import { MatDialog } from '@angular/material/dialog';
import { EndOfGameDialogComponent } from './end-of-game-dialog/end-of-game-dialog.component';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatIconModule],
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

  userBank: WritableSignal<number> = signal(0);
  userBet: WritableSignal<number> = signal(10);
  betPlaced: WritableSignal<boolean> = signal(false);

  // setting to true on init so button is disabled until after first round
  disableResetButton: WritableSignal<boolean> = signal(true);

  constructor() {

  }
  ngOnInit(): void {
    if(typeof window !== 'undefined') {
        localStorage.getItem('blackjackBank') === null ? this.userBank.set(100) : this.userBank.set(Number(localStorage.getItem('blackjackBank')));
    }
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
    this.disableResetButton.set(true);

    localStorage.setItem('blackjackBank', this.userBank().toString());
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
    if(this.playersTotal() > 21) {
      const dialogRef = this.dialog.open(EndOfGameDialogComponent, {
        height: '200px',
        width: '500px',
        data: { title: 'Player Bust!', message: `You busted with ${this.playersTotal()}... dealer wins!` }
      });

      dialogRef.afterClosed().subscribe(() => {
        this.userBank.set(this.userBank() - this.userBet());
        this.disableResetButton.set(false);
        if(typeof window !== 'undefined') {
          localStorage.setItem('blackjackBank', this.userBank().toString());
        }
      });
    }
  }

  protected async stand(): Promise<void> {
    this.disableResetButton.set(false);
    this.userStanding.set(true);
    this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));
    this.playersTotal.set(this.calcHandTotal(this.playersHand()));
    while(this.calcHandTotal(this.dealersHand()) < 17) {
      await this.sleep(500);
      this.hit('Dealer');
    }
    let dialogTitle: string = "";
    let dialogMessage: string = "";
    if(this.playersTotal() === 21 && this.dealersTotal() !== 21) { 
      dialogTitle = "Blackjack!";
      dialogMessage = "You got a blackjack! You win!";
      this.userBank.set(this.userBank() + this.userBet()*2);
    }
    else if(this.dealersTotal() > 21) {
      dialogTitle = "Dealer Bust!";
      dialogMessage = `The dealer busted with ${this.dealersTotal()}... you win!`;
      this.userBank.set(this.userBank() + this.userBet());
    }
    else if(this.dealersTotal() > this.playersTotal()) {
      dialogTitle = "Dealer Wins!";
      dialogMessage = `The dealer beat your ${this.playersTotal()} with ${this.dealersTotal()}!`;
      this.userBank.set(this.userBank() - this.userBet());
    }
    else if(this.dealersTotal() === this.playersTotal()) {
      dialogTitle = "Push!";
      dialogMessage = `It's a push! Both you and the dealer have ${this.playersTotal()}.`;
    }
    else if(this.dealersTotal() < this.playersTotal()) {
      dialogTitle = "You Win!";
      dialogMessage = `You beat the dealer with ${this.playersTotal()} to their ${this.dealersTotal()}!`;
      this.userBank.set(this.userBank() + this.userBet());
    }

    this.dialog.open(EndOfGameDialogComponent, {
      height: '200px',
      width: '500px',
      data: { title: dialogTitle, message: dialogMessage }
    }).afterClosed().subscribe(() => {
      this.disableResetButton.set(false);
    });

    if(typeof window !== 'undefined') {
      localStorage.setItem('blackjackBank', this.userBank().toString());
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

  protected changeBet(amount: 10 | -10) : void {
    if(this.userBet() + amount >= 10) {
      this.userBet.set(this.userBet() + amount);
    }
  }

  placeBet(): void {
    this.betPlaced.set(true);
    this.userStanding.set(false);

    this.initNewGame();
  }

  resetGame(): void {
    this.playersHand.set([]);
    this.dealersHand.set([]);
    this.betPlaced.set(false);
    this.disableResetButton.set(true);
  }
}
