import { create } from 'zustand';
import { Difficulty, GameMode, GamePhase, GameRoom, Player, TargetImage } from '@/types/game';

interface GameState {
  // Utilisateur courant
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
  
  // Salle de jeu
  currentRoom: GameRoom | null;
  setCurrentRoom: (room: GameRoom | null) => void;
  
  // Gestion des paramètres
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (difficulty: Difficulty) => void;
  selectedGameMode: GameMode;
  setSelectedGameMode: (mode: GameMode) => void;
  
  // Gestion de l'interface
  isCreatingRoom: boolean;
  setIsCreatingRoom: (isCreating: boolean) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;

  // Target image management
  currentTargetImage: TargetImage | null;
  setCurrentTargetImage: (image: TargetImage | null) => void;
  targetImage: TargetImage | null;
  setTargetImage: (image: TargetImage | null) => void;
  
  // Réinitialiser le store
  resetStore: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Utilisateur courant
  currentPlayer: null,
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  // Salle de jeu
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  // Gestion des paramètres
  selectedDifficulty: "medium",
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
  selectedGameMode: "solo",
  setSelectedGameMode: (mode) => set({ selectedGameMode: mode }),
  
  // Gestion de l'interface
  isCreatingRoom: false,
  setIsCreatingRoom: (isCreating) => set({ isCreatingRoom: isCreating }),
  joinCode: "",
  setJoinCode: (code) => set({ joinCode: code }),

  // Target image management
  currentTargetImage: null,
  setCurrentTargetImage: (image) => set({ currentTargetImage: image }),
  targetImage: null,
  setTargetImage: (image) => set({ targetImage: image }),
  
  // Réinitialiser le store
  resetStore: () => set({
    currentRoom: null,
    selectedDifficulty: "medium",
    selectedGameMode: "solo",
    isCreatingRoom: false,
    joinCode: "",
    currentTargetImage: null,
    targetImage: null,
  }),
}));
