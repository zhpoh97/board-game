import {
  Direction, SaboteurPathCard, BoardCell, GoalCard,
  START_POSITION, GOAL_POSITIONS, START_CARD_TEMPLATE,
  PATH_TEMPLATES, OPPOSITE_DIRECTION, DIRECTION_OFFSET, ALL_DIRECTIONS,
  SaboteurCardKind,
} from '@cockroach-poker/shared';

/**
 * Manages the Saboteur tunnel grid, path validation, and goal card logic.
 */
export class SaboteurBoard {
  cells: Map<string, BoardCell> = new Map();
  goals: GoalCard[] = [];

  private static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  init(): void {
    this.cells.clear();

    // Place start card
    const startTemplate = PATH_TEMPLATES[START_CARD_TEMPLATE];
    const startCard: SaboteurPathCard = {
      id: '__start__',
      kind: SaboteurCardKind.PATH,
      templateId: START_CARD_TEMPLATE,
      openings: { ...startTemplate.openings },
      connectedGroups: startTemplate.connectedGroups.map(g => [...g]),
    };
    this.cells.set(SaboteurBoard.key(START_POSITION.x, START_POSITION.y), {
      x: START_POSITION.x, y: START_POSITION.y, card: startCard,
    });

    // Shuffle gold position among the 3 goal spots
    const goldIndex = Math.floor(Math.random() * GOAL_POSITIONS.length);
    this.goals = GOAL_POSITIONS.map((pos, i) => ({
      x: pos.x, y: pos.y,
      hasGold: i === goldIndex,
      revealed: false,
    }));
  }

  getCell(x: number, y: number): BoardCell | undefined {
    return this.cells.get(SaboteurBoard.key(x, y));
  }

  isGoalPosition(x: number, y: number): boolean {
    return this.goals.some(g => g.x === x && g.y === y);
  }

  getGoalAt(x: number, y: number): GoalCard | undefined {
    return this.goals.find(g => g.x === x && g.y === y);
  }

  /**
   * Check if a path card can be placed at (x, y).
   * Rules:
   * 1. Position must be empty (and not a goal position unless tunnel reaches it)
   * 2. At least one adjacent cell must have an existing card
   * 3. All touching sides must be compatible (both open or both closed)
   * 4. The new card must be connected to the start via continuous tunnel
   */
  canPlace(card: SaboteurPathCard, x: number, y: number): boolean {
    // Can't place on existing card
    if (this.cells.has(SaboteurBoard.key(x, y))) return false;

    // Can't place on goal position (goals are revealed when tunnel reaches adjacent)
    if (this.isGoalPosition(x, y)) return false;

    let hasAdjacentCard = false;

    for (const dir of ALL_DIRECTIONS) {
      const { dx, dy } = DIRECTION_OFFSET[dir];
      const nx = x + dx;
      const ny = y + dy;
      const neighbor = this.getCell(nx, ny);
      const neighborGoal = this.getGoalAt(nx, ny);

      if (neighbor) {
        hasAdjacentCard = true;
        const oppositeDir = OPPOSITE_DIRECTION[dir];
        const cardHasOpening = card.openings[dir];
        const neighborHasOpening = neighbor.card.openings[oppositeDir];

        // Openings must match where cards touch
        if (cardHasOpening !== neighborHasOpening) return false;
      }

      // Goal cards act as if they have openings on all sides for compatibility
      // But we don't count them as adjacent cards for the "must be adjacent" rule
      // unless a connected tunnel actually reaches next to the goal
      if (neighborGoal && !neighbor) {
        // If placing next to a goal, the card's opening toward the goal is fine
        // (goals are like walls until reached)
      }
    }

    if (!hasAdjacentCard) return false;

    // Check that the new card is reachable from start via connected tunnels
    // Temporarily place the card and check connectivity
    const tempCell: BoardCell = { x, y, card };
    this.cells.set(SaboteurBoard.key(x, y), tempCell);
    const reachable = this.isConnectedToStart(x, y);
    this.cells.delete(SaboteurBoard.key(x, y));

    return reachable;
  }

  /**
   * Place a card on the board. Returns true if a goal was reached.
   */
  place(card: SaboteurPathCard, x: number, y: number): GoalCard | null {
    this.cells.set(SaboteurBoard.key(x, y), { x, y, card });

    // Check if any goal is now reachable
    for (const goal of this.goals) {
      if (goal.revealed) continue;
      if (this.isGoalReachable(goal)) {
        return goal;
      }
    }
    return null;
  }

  /**
   * Remove a card from the board (rockfall).
   */
  removeCard(x: number, y: number): boolean {
    // Can't remove start card
    if (x === START_POSITION.x && y === START_POSITION.y) return false;
    return this.cells.delete(SaboteurBoard.key(x, y));
  }

  /**
   * Check if position (x,y) is connected to start via internal tunnel paths.
   */
  private isConnectedToStart(x: number, y: number): boolean {
    const startKey = SaboteurBoard.key(START_POSITION.x, START_POSITION.y);
    const targetKey = SaboteurBoard.key(x, y);

    // BFS through connected tunnels
    const visited = new Set<string>();
    const queue: string[] = [startKey];
    visited.add(startKey);

    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      if (currentKey === targetKey) return true;

      const cell = this.cells.get(currentKey);
      if (!cell) continue;

      // For each direction this card has a connected opening
      for (const dir of ALL_DIRECTIONS) {
        if (!cell.card.openings[dir]) continue;
        if (!this.isInConnectedGroup(cell.card, dir)) continue;

        const { dx, dy } = DIRECTION_OFFSET[dir];
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        const neighborKey = SaboteurBoard.key(nx, ny);

        if (visited.has(neighborKey)) continue;

        const neighbor = this.cells.get(neighborKey);
        if (!neighbor) continue;

        const oppositeDir = OPPOSITE_DIRECTION[dir];
        if (!neighbor.card.openings[oppositeDir]) continue;
        if (!this.isInConnectedGroup(neighbor.card, oppositeDir)) continue;

        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }

    return false;
  }

  /**
   * Check if a goal card is reachable via connected tunnel from start.
   * A goal is reached if a card adjacent to it has a connected opening facing the goal.
   */
  private isGoalReachable(goal: GoalCard): boolean {
    // Check each direction around the goal
    for (const dir of ALL_DIRECTIONS) {
      const { dx, dy } = DIRECTION_OFFSET[dir];
      const adjX = goal.x + dx;
      const adjY = goal.y + dy;
      const adjCell = this.getCell(adjX, adjY);

      if (!adjCell) continue;

      const facingDir = OPPOSITE_DIRECTION[dir];
      if (!adjCell.card.openings[facingDir]) continue;
      if (!this.isInConnectedGroup(adjCell.card, facingDir)) continue;

      // This adjacent card has a connected opening facing the goal.
      // Is this card connected to start?
      if (this.isConnectedToStart(adjX, adjY)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a direction is part of any connected group on the card.
   */
  private isInConnectedGroup(card: SaboteurPathCard, dir: Direction): boolean {
    return card.connectedGroups.some(group => group.includes(dir));
  }

  /**
   * Get all valid placement positions for a given card.
   */
  getValidPlacements(card: SaboteurPathCard): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const checked = new Set<string>();

    // Check all positions adjacent to existing cards
    for (const cell of this.cells.values()) {
      for (const dir of ALL_DIRECTIONS) {
        const { dx, dy } = DIRECTION_OFFSET[dir];
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        const key = SaboteurBoard.key(nx, ny);
        if (checked.has(key)) continue;
        checked.add(key);

        if (this.canPlace(card, nx, ny)) {
          positions.push({ x: nx, y: ny });
        }
      }
    }

    return positions;
  }

  /**
   * Get board cells as array for serialization.
   */
  toArray(): BoardCell[] {
    return [...this.cells.values()];
  }

  /**
   * Get public goal info (hide gold location unless revealed).
   */
  getGoalsPublic(): { x: number; y: number; revealed: boolean; hasGold?: boolean }[] {
    return this.goals.map(g => ({
      x: g.x,
      y: g.y,
      revealed: g.revealed,
      ...(g.revealed ? { hasGold: g.hasGold } : {}),
    }));
  }
}
