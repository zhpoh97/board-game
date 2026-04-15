import { Card, CritterType, ChainStep, ChainPublicInfo } from '@cockroach-poker/shared';

export class CardChain {
  readonly card: Card;
  readonly originalPasser: string;
  private _claimedType: CritterType;
  private _currentTarget: string;
  private _currentFrom: string;
  private _seenBy: Set<string> = new Set();
  private _history: ChainStep[] = [];

  constructor(card: Card, originalPasser: string, claimedType: CritterType, target: string) {
    this.card = card;
    this.originalPasser = originalPasser;
    this._claimedType = claimedType;
    this._currentTarget = target;
    this._currentFrom = originalPasser;
    this._seenBy.add(originalPasser);
    this._history.push({ from: originalPasser, to: target, claimedType });
  }

  get claimedType(): CritterType { return this._claimedType; }
  get currentTarget(): string { return this._currentTarget; }
  get currentFrom(): string { return this._currentFrom; }
  get seenByIds(): string[] { return [...this._seenBy]; }

  hasSeenCard(playerId: string): boolean {
    return this._seenBy.has(playerId);
  }

  markAsSeen(playerId: string): void {
    this._seenBy.add(playerId);
  }

  passTo(newTarget: string, claimedType: CritterType, fromPlayerId: string): void {
    this._currentFrom = fromPlayerId;
    this._currentTarget = newTarget;
    this._claimedType = claimedType;
    this._history.push({ from: fromPlayerId, to: newTarget, claimedType });
  }

  canPassTo(playerId: string): boolean {
    return !this._seenBy.has(playerId);
  }

  getValidTargets(allPlayerIds: string[]): string[] {
    return allPlayerIds.filter(id => this.canPassTo(id));
  }

  toPublicInfo(): ChainPublicInfo {
    return {
      claimedType: this._claimedType,
      currentTarget: this._currentTarget,
      from: this._currentFrom,
      seenByIds: [...this._seenBy],
      originalPasser: this.originalPasser,
    };
  }
}
