import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CardName, PlayingCard, Suit } from 'typedeck';
import { MatDialog } from '@angular/material/dialog';
import { EndOfGameDialogComponent } from './end-of-game-dialog/end-of-game-dialog.component';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';

type PlayerHandStatus = 'playing' | 'stood' | 'busted';

interface RoundResult {
  title: string;
  message: string;
  bankDelta: number;
}

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './blackjack.component.html',
  styleUrl: './blackjack.component.scss'
})
export class BlackjackComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  private readonly minimumBet = 10;
  private readonly betStep = 10;
  private readonly maxSplitHands = 4;
  
  validCardNumbers: CardName[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  validCardSuits: Suit[] = [0, 1, 2, 3]; // Suit is an enum with values 0-3
  private deck: PlayingCard[] = [];

  dealersHand: WritableSignal<PlayingCard[]> = signal([]);
  playerHands: WritableSignal<PlayingCard[][]> = signal([[]]);
  playerHandBets: WritableSignal<number[]> = signal([10]);
  playerHandStatuses: WritableSignal<PlayerHandStatus[]> = signal(['playing']);
  activePlayerHandIndex: WritableSignal<number> = signal(0);

  dealersTotal: WritableSignal<number> = signal(0);

  userStanding: WritableSignal<boolean> = signal(false);
  splitActive: WritableSignal<boolean> = signal(false);

  userBank: WritableSignal<number> = signal(100);
  userBet: WritableSignal<number> = signal(10);
  betPlaced: WritableSignal<boolean> = signal(false);

  // setting to true on init so button is disabled until after first round
  disableResetButton: WritableSignal<boolean> = signal(true);

  constructor() {

  }
  ngOnInit(): void {
    if(typeof window !== 'undefined') {
      const savedBank = localStorage.getItem('blackjackBank');
      this.setUserBank(savedBank === null ? 100 : Number(savedBank));
    }
    this.syncBetToBank();
  }

  refreshDeck(): void {
    const cards: PlayingCard[] = [];
    for(const cardName of this.validCardNumbers) {
      for(const suit of this.validCardSuits) {
        cards.push(new PlayingCard(cardName, suit));
      }
    }
    this.deck = this.shuffleDeck(cards);
  }

  private shuffleDeck(cards: PlayingCard[]): PlayingCard[] {
    const shuffledCards = [...cards];

    for(let index = shuffledCards.length - 1; index > 0; index--) {
      const randomIndex = this.getRandomIndex(index + 1);
      [shuffledCards[index], shuffledCards[randomIndex]] = [shuffledCards[randomIndex], shuffledCards[index]];
    }

    return shuffledCards;
  }

  private getRandomIndex(maxExclusive: number): number {
    if(maxExclusive <= 0) {
      throw new Error('Cannot draw a random index from an empty range');
    }

    const crypto = globalThis.crypto;
    if(crypto?.getRandomValues) {
      const randomValues = new Uint32Array(1);
      const randomLimit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
      let randomValue = 0;

      do {
        crypto.getRandomValues(randomValues);
        randomValue = randomValues[0];
      } while(randomValue >= randomLimit);

      return randomValue % maxExclusive;
    }

    return Math.floor(Math.random() * maxExclusive);
  }

  private drawCard(): PlayingCard {
    const card = this.deck.shift();

    if(!card) {
      throw new Error('No cards remaining in deck');
    }

    return card;
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

    this.saveBank();
    this.refreshDeck();

    const playerFirstCard = this.drawCard();
    const dealerHoleCard = this.drawCard();
    const playerSecondCard = this.drawCard();
    const dealerUpCard = this.drawCard();

    this.dealersHand.set([dealerHoleCard, dealerUpCard]);
    this.playerHands.set([[playerFirstCard, playerSecondCard]]);
    this.playerHandBets.set([this.userBet()]);
    this.playerHandStatuses.set(['playing']);
    this.activePlayerHandIndex.set(0);
    this.splitActive.set(false);
    this.dealersTotal.set(this.calcHandTotal([this.dealersHand()[1]])); // Only show the player the dealer's face-up card

    // If the player has blackjack, they shouldn't be able to hit
    if(this.calcHandTotal(this.activePlayerHand()) === 21) {
      this.stand();
    }
  }

  protected async hit(whoHit: 'Player' | 'Dealer' = 'Dealer'): Promise<void> {
    if(whoHit === 'Dealer') {
      this.hitDealer();
      return;
    }

    if(!this.canHitActiveHand()) {
      return;
    }

    const handIndex = this.activePlayerHandIndex();
    this.addCardToPlayerHand(handIndex);

    const handTotal = this.getPlayerHandTotal(handIndex);

    if(handTotal > 21) {
      this.setPlayerHandStatus(handIndex, 'busted');

      if(this.splitActive()) {
        await this.advanceSplitHandOrResolve();
        return;
      }

      this.openRoundDialog({
        title: 'Player Bust!',
        message: `You busted with ${this.getPlayerHandTotal(0)}... dealer wins!`,
        bankDelta: -this.getPlayerHandBet(0)
      });
      return;
    }

    if(handTotal === 21) {
      this.setPlayerHandStatus(handIndex, 'stood');

      if(this.splitActive()) {
        await this.advanceSplitHandOrResolve();
        return;
      }

      await this.resolveRound();
    }
  }

  protected async stand(): Promise<void> {
    if(!this.canActOnActiveHand()) {
      return;
    }

    const handIndex = this.activePlayerHandIndex();
    this.setPlayerHandStatus(handIndex, 'stood');

    if(this.splitActive()) {
      await this.advanceSplitHandOrResolve();
      return;
    }

    await this.resolveRound();
  }

  protected handTotal(hand: PlayingCard[]): number {
    return this.calcHandTotal(hand);
  }

  protected getPlayerHandTotal(handIndex: number): number {
    return this.calcHandTotal(this.playerHands()[handIndex] ?? []);
  }

  protected getPlayerHandBet(handIndex: number): number {
    return this.playerHandBets()[handIndex] ?? this.userBet();
  }

  protected getPlayerHandTotalText(handIndex: number): string {
    const status = this.playerHandStatuses()[handIndex];
    const total = this.getPlayerHandTotal(handIndex);

    if(this.splitActive()) {
      if(status === 'busted') {
        return `Hand ${handIndex + 1} busted: ${total}`;
      }

      if(status === 'stood') {
        return `Hand ${handIndex + 1} standing: ${total}`;
      }

      return `Hand ${handIndex + 1}: ${total}`;
    }

    return !this.userStanding() ? `You have: ${total}` : `Standing with: ${total}`;
  }

  protected roundStatusText(): string {
    if(!this.betPlaced()) {
      return 'AWAITING BET';
    }

    if(this.userStanding()) {
      return 'ROUND CLOSED';
    }

    if(this.splitActive()) {
      return `HAND ${this.activePlayerHandIndex() + 1}/${this.playerHands().length}`;
    }

    return 'PLAYER TURN';
  }

  protected activeSeatText(): string {
    if(!this.betPlaced()) {
      return 'STANDBY';
    }

    if(this.userStanding()) {
      return 'STANDING';
    }

    if(this.splitActive()) {
      return `HAND ${this.activePlayerHandIndex() + 1}/${this.playerHands().length}`;
    }

    return 'ACTIVE_HAND';
  }

  protected remainingCardsText(): string {
    return this.betPlaced() ? `${this.deck.length} CARDS` : 'READY';
  }

  protected isActivePlayerHand(handIndex: number): boolean {
    return this.activePlayerHandIndex() === handIndex && this.playerHandStatuses()[handIndex] === 'playing';
  }

  protected canActOnActiveHand(): boolean {
    return this.betPlaced() && this.disableResetButton() && this.isActivePlayerHand(this.activePlayerHandIndex());
  }

  protected canHitActiveHand(): boolean {
    return this.canActOnActiveHand() && this.getPlayerHandTotal(this.activePlayerHandIndex()) < 21;
  }

  protected shouldShowDoubleButton(handIndex: number): boolean {
    const hand = this.playerHands()[handIndex] ?? [];
    return this.betPlaced()
      && !this.userStanding()
      && this.disableResetButton()
      && this.isActivePlayerHand(handIndex)
      && hand.length === 2;
  }

  protected canDouble(handIndex: number): boolean {
    return this.shouldShowDoubleButton(handIndex)
      && this.totalWagerAfterAdding(this.getPlayerHandBet(handIndex)) <= this.userBank();
  }

  protected async double(handIndex: number): Promise<void> {
    if(!this.canDouble(handIndex)) {
      return;
    }

    this.playerHandBets.update(bets => bets.map((bet, index) => {
      return index === handIndex ? bet * 2 : bet;
    }));

    this.addCardToPlayerHand(handIndex);
    this.setPlayerHandStatus(handIndex, this.getPlayerHandTotal(handIndex) > 21 ? 'busted' : 'stood');

    if(this.splitActive()) {
      await this.advanceSplitHandOrResolve();
      return;
    }

    await this.resolveRound();
  }

  protected shouldShowSplitButton(handIndex: number): boolean {
    const hand = this.playerHands()[handIndex] ?? [];
    return this.betPlaced()
      && !this.userStanding()
      && this.disableResetButton()
      && this.isActivePlayerHand(handIndex)
      && hand.length === 2
      && this.cardSplitValue(hand[0]) === this.cardSplitValue(hand[1]);
  }

  protected canSplit(handIndex: number): boolean {
    return this.shouldShowSplitButton(handIndex)
      && this.playerHands().length < this.maxSplitHands
      && this.totalWagerAfterAdding(this.getPlayerHandBet(handIndex)) <= this.userBank();
  }

  protected split(handIndex: number): void {
    if(!this.canSplit(handIndex)) {
      return;
    }

    const currentHands = this.playerHands();
    const currentBets = this.playerHandBets();
    const currentStatuses = this.playerHandStatuses();
    const [firstCard, secondCard] = currentHands[handIndex];
    const splitBet = currentBets[handIndex];
    const splitHands = [
      [firstCard, this.drawCard()],
      [secondCard, this.drawCard()]
    ];

    this.playerHands.set([
      ...currentHands.slice(0, handIndex),
      ...splitHands,
      ...currentHands.slice(handIndex + 1)
    ]);
    this.playerHandBets.set([
      ...currentBets.slice(0, handIndex),
      splitBet,
      splitBet,
      ...currentBets.slice(handIndex + 1)
    ]);
    this.playerHandStatuses.set([
      ...currentStatuses.slice(0, handIndex),
      'playing',
      'playing',
      ...currentStatuses.slice(handIndex + 1)
    ]);
    this.activePlayerHandIndex.set(handIndex);
    this.splitActive.set(true);
  }

  private totalCurrentWager(): number {
    return this.playerHandBets().reduce((total, bet) => total + bet, 0);
  }

  private totalWagerAfterAdding(amount: number): number {
    return this.totalCurrentWager() + amount;
  }

  private isNaturalBlackjack(handIndex: number): boolean {
    const hand = this.playerHands()[handIndex] ?? [];
    return !this.splitActive() && hand.length === 2 && this.calcHandTotal(hand) === 21;
  }

  private activePlayerHand(): PlayingCard[] {
    return this.playerHands()[this.activePlayerHandIndex()] ?? [];
  }

  private addCardToPlayerHand(handIndex: number): void {
    this.playerHands.update(hands => hands.map((hand, index) => {
      if(index !== handIndex) {
        return hand;
      }

      return [...hand, this.drawCard()];
    }));
  }

  private hitDealer(): void {
    this.dealersHand.update(hand => [...hand, this.drawCard()]);
    this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));
  }

  private setPlayerHandStatus(handIndex: number, status: PlayerHandStatus): void {
    this.playerHandStatuses.update(statuses => statuses.map((currentStatus, index) => {
      return index === handIndex ? status : currentStatus;
    }));
  }

  private async advanceSplitHandOrResolve(): Promise<void> {
    const nextHandIndex = this.playerHandStatuses().findIndex((status, index) => {
      return index > this.activePlayerHandIndex() && status === 'playing';
    });

    if(nextHandIndex !== -1) {
      this.activePlayerHandIndex.set(nextHandIndex);
      return;
    }

    await this.resolveRound();
  }

  private async resolveRound(): Promise<void> {
    this.userStanding.set(true);
    this.activePlayerHandIndex.set(-1);
    this.dealersTotal.set(this.calcHandTotal(this.dealersHand()));

    if(this.playerHandStatuses().some(status => status !== 'busted')) {
      while(this.calcHandTotal(this.dealersHand()) < 17) {
        await this.sleep(500);
        this.hitDealer();
      }
    }

    this.openRoundDialog(this.splitActive() ? this.getSplitRoundResult() : this.getSingleRoundResult());
  }

  private getSingleRoundResult(): RoundResult {
    const playerTotal = this.getPlayerHandTotal(0);
    const dealerTotal = this.dealersTotal();
    const handBet = this.getPlayerHandBet(0);

    if(playerTotal > 21) {
      return {
        title: 'Player Bust!',
        message: `You busted with ${playerTotal}... dealer wins!`,
        bankDelta: -handBet
      };
    }

    if(this.isNaturalBlackjack(0) && dealerTotal !== 21) {
      return {
        title: 'Blackjack!',
        message: 'You got a blackjack! You win!',
        bankDelta: handBet * 2
      };
    }

    if(dealerTotal > 21) {
      return {
        title: 'Dealer Bust!',
        message: `The dealer busted with ${dealerTotal}... you win!`,
        bankDelta: handBet
      };
    }

    if(dealerTotal > playerTotal) {
      return {
        title: 'Dealer Wins!',
        message: `The dealer beat your ${playerTotal} with ${dealerTotal}!`,
        bankDelta: -handBet
      };
    }

    if(dealerTotal === playerTotal) {
      return {
        title: 'Push!',
        message: `It's a push! Both you and the dealer have ${playerTotal}.`,
        bankDelta: 0
      };
    }

    return {
      title: 'You Win!',
      message: `You beat the dealer with ${playerTotal} to their ${dealerTotal}!`,
      bankDelta: handBet
    };
  }

  private getSplitRoundResult(): RoundResult {
    const dealerTotal = this.dealersTotal();
    let bankDelta = 0;
    const messages = this.playerHands().map((hand, index) => {
      const handTotal = this.calcHandTotal(hand);
      const handName = `Hand ${index + 1}`;
      const handBet = this.getPlayerHandBet(index);
      const status = this.playerHandStatuses()[index];

      if(status === 'busted' || handTotal > 21) {
        bankDelta -= handBet;
        return `${handName} busted with ${handTotal}`;
      }

      if(dealerTotal > 21) {
        bankDelta += handBet;
        return `${handName} wins with ${handTotal}`;
      }

      if(dealerTotal > handTotal) {
        bankDelta -= handBet;
        return `${handName} loses ${handTotal} to ${dealerTotal}`;
      }

      if(dealerTotal === handTotal) {
        return `${handName} pushes at ${handTotal}`;
      }

      bankDelta += handBet;
      return `${handName} wins ${handTotal} to ${dealerTotal}`;
    });

    return {
      title: bankDelta > 0 ? 'Split Win!' : bankDelta < 0 ? 'Split Loss!' : 'Split Push!',
      message: messages.join('. '),
      bankDelta
    };
  }

  private openRoundDialog(result: RoundResult): void {
    this.setUserBank(this.userBank() + result.bankDelta);
    this.dialog.open(EndOfGameDialogComponent, {
      width: 'min(92vw, 520px)',
      maxWidth: '92vw',
      panelClass: 'blackjack-round-dialog',
      data: { title: result.title, message: result.message }
    }).afterClosed().subscribe(() => {
      this.disableResetButton.set(false);
    });
  }

  private cardSplitValue(card: PlayingCard): CardName {
    return card.cardName;
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
    if(this.betPlaced()) {
      return;
    }

    const nextBet = this.userBet() + amount;
    if(nextBet >= this.minimumBet && nextBet <= this.userBank()) {
      this.userBet.set(nextBet);
    }
  }

  protected canDecreaseBet(): boolean {
    return !this.betPlaced() && this.userBet() > this.minimumBet;
  }

  protected canIncreaseBet(): boolean {
    return !this.betPlaced() && this.userBet() + this.betStep <= this.userBank();
  }

  protected canPlaceBet(): boolean {
    return !this.betPlaced() && this.userBet() >= this.minimumBet && this.userBet() <= this.userBank();
  }

  protected canResetBank(): boolean {
    return !this.betPlaced();
  }

  protected resetBank(): void {
    if(!this.canResetBank()) {
      return;
    }

    this.setUserBank(100);
  }

  placeBet(): void {
    if(!this.canPlaceBet()) {
      return;
    }

    this.betPlaced.set(true);
    this.userStanding.set(false);

    this.initNewGame();
  }

  resetGame(): void {
    this.dealersHand.set([]);
    this.playerHands.set([[]]);
    this.playerHandBets.set([this.userBet()]);
    this.playerHandStatuses.set(['playing']);
    this.activePlayerHandIndex.set(0);
    this.splitActive.set(false);
    this.userStanding.set(false);
    this.dealersTotal.set(0);
    this.betPlaced.set(false);
    this.disableResetButton.set(true);
    this.syncBetToBank();
  }

  private setUserBank(amount: number): void {
    const nextBank = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    this.userBank.set(nextBank);

    if(!this.betPlaced()) {
      this.syncBetToBank();
    }

    this.saveBank();
  }

  private syncBetToBank(): void {
    const bank = this.userBank();

    if(bank < this.minimumBet) {
      this.userBet.set(0);
      return;
    }

    if(this.userBet() < this.minimumBet) {
      this.userBet.set(this.minimumBet);
      return;
    }

    if(this.userBet() > bank) {
      this.userBet.set(bank - (bank % this.betStep));
    }
  }

  private saveBank(): void {
    if(typeof window !== 'undefined') {
      localStorage.setItem('blackjackBank', this.userBank().toString());
    }
  }
}
