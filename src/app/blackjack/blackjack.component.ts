import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Card, CardName, Deck, ICard, PlayingCard, Suit } from 'typedeck';
import { PlayerBustDialogComponent } from './player-bust-dialog/player-bust-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
    this.refreshDeck();
    this.deck?.shuffle();
    this.dealersHand.set([this.deck?.takeCard() as PlayingCard, this.deck?.takeCard() as PlayingCard]);
    this.playersHand.set([this.deck?.takeCard() as PlayingCard, this.deck?.takeCard() as PlayingCard]);
  }

  protected hit(whoHit: 'Player' | 'Dealer' = 'Dealer'): void {
    this.playersHand.update(hand => [...hand, this.deck?.takeCard() as PlayingCard]);
    whoHit === 'Player' ? this.playersTotal.set(this.calcHandTotal(this.playersHand())) : this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));
    if(this.playersTotal() > 21) {
      const dialogRef = this.dialog.open(PlayerBustDialogComponent, {
        height: '200px',
        width: '500px',
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
}
