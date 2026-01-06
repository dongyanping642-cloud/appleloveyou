
export enum GameMode {
  SOLO = 'SOLO',
  DUO = 'DUO',
  AI_VS_AI = 'AI_VS_AI'
}

export enum TopicMethod {
  CLASSIC = 'CLASSIC', 
  SCENARIO = 'SCENARIO' 
}

export enum Side {
  PRO = 'PRO',
  CON = 'CON'
}

export interface Debater {
  id: string;
  name: string;
  description: string;
  style: string;
  avatar: string;
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  role: 'system' | 'user' | 'ai';
  content: string;
  senderName: string;
  timestamp: number;
  side?: Side;
  sources?: Source[];
}

export interface CoachAnalysis {
  userLogic: string;
  opponentLogic: string;
  rebuttalStrategies: string[];
  goldenSentences: string[];
  slangOrMeme: string;
  supportRate: number; 
  timestamp: number;
}

export interface SavedBattle {
  id: string;
  mode: GameMode;
  topic: string;
  userSide: Side;
  opponent: Debater;
  opponent2?: Debater;
  messages: Message[];
  analysisHistory?: CoachAnalysis[];
  timestamp: number;
}

export interface GameState {
  id: string | null;
  mode: GameMode;
  topicMethod: TopicMethod;
  topic: string;
  scenarioContext?: string;
  userSide: Side;
  opponent: Debater;
  opponent2: Debater | null;
  player1Name: string;
  player2Name: string;
  messages: Message[];
  isThinking: boolean;
  coachAnalysis: CoachAnalysis | null;
  analysisHistory: CoachAnalysis[];
  turnCount: number;
}
