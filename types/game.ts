export type PlayerColor = 'white' | 'black';

export interface Point {
  checkers: PlayerColor[];
}

export interface DiceState {
  values: [number, number];
  remaining: number[]; // remaining moves to use
  rolled: boolean;
}

export interface BarState {
  white: number;
  black: number;
}

export interface BearOffState {
  white: number;
  black: number;
}

export interface GameState {
  points: Point[]; // index 0..23, point 1 = index 0 from white's perspective
  bar: BarState;
  bearOff: BearOffState;
  dice: DiceState;
  currentPlayer: PlayerColor;
  gamePhase: 'waiting' | 'rolling' | 'moving' | 'game_over';
  winner: PlayerColor | null;
  moveHistory: Move[];
  turnNumber: number;
}

export interface Move {
  from: number | 'bar'; // point index 0-23, or 'bar'
  to: number | 'bearoff'; // point index 0-23, or 'bearoff'
  player: PlayerColor;
  hitBlot: boolean;
  dieUsed: number;
  turnNumber: number;
}

export interface ValidMove {
  from: number | 'bar';
  to: number | 'bearoff';
  dieUsed: number;
  hitsBlot: boolean;
}

export type GameMode = 'vs_ai' | 'vs_friend_local' | 'vs_friend_online' | 'dark_mode' | 'long';

export type GameVariant = 'short' | 'long' | 'dark';

export interface GameSettings {
  mode: GameMode;
  playerColor: PlayerColor;
  variant?: GameVariant;        // rules variant for local/online modes
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  // Online multiplayer
  roomId?: string;
  roomCode?: string;
  playerRole?: 'player1' | 'player2';
  playerId?: string;
  playerName?: string;
  opponentName?: string;
  isFlipped?: boolean;          // board flip for online guest (player2)
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  city?: string;
  gamesPlayed: number;
  gamesWon: number;
  averageAIScore?: number;
  createdAt: string;
}

export interface GameRecord {
  id: string;
  playerId: string;
  opponentName: string;
  result: 'win' | 'loss';
  aiCoachScore?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  mode: GameMode;
  createdAt: string;
}

export type AICoachScore = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface AICoachAnalysis {
  score: AICoachScore;
  insights: string[];
}
