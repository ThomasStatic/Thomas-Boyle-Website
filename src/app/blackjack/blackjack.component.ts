import { Component, OnInit } from '@angular/core';
import { CardName, Deck, PlayingCard, Suit } from 'typedeck';

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [],
  templateUrl: './blackjack.component.html',
  styleUrl: './blackjack.component.scss'
})
export class BlackjackComponent implements OnInit {
  
  validCardNumbers: CardName[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  validCardSuits: Suit[] = [0, 1, 2, 3]; // Suit is an enum with values 0-3
  deck: Deck | null = null;
  cards: PlayingCard[] = [];

  ngOnInit(): void {
    this.refreshDeck();
    this.deck?.shuffle();
  } 
  
  refreshDeck(): void {
   for(const cardName of this.validCardNumbers) {
      for(const suit of this.validCardSuits) {
        this.cards.push(new PlayingCard(cardName, suit));
      }
    }
    this.deck = new Deck(this.cards);
  }

}
