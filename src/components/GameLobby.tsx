
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Info, Users, Brain, Trophy, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import GameSimulator from "./GameSimulator";
import GameRoomCreation from "./GameRoomCreation";
import WaitingRoom from "./WaitingRoom";
import { toast } from "sonner";
import { useGameStore } from "@/store/gameStore";
import { GameRoom } from "@/types/game";

interface GameLobbyProps {
  onShowRules: () => void;
}

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const GameLobby = ({ onShowRules }: GameLobbyProps) => {
  const { 
    selectedGameMode, 
    setSelectedGameMode, 
    selectedDifficulty, 
    setSelectedDifficulty,
    isCreatingRoom,
    setIsCreatingRoom,
    currentRoom,
    setCurrentRoom
  } = useGameStore();
  
  const [showGame, setShowGame] = useState(false);

  // Simuler un utilisateur temporaire pour la démo
  const currentUserId = "user-1";

  if (showGame) {
    return <GameSimulator onExit={() => setShowGame(false)} gameMode={selectedGameMode} difficulty={selectedDifficulty} />;
  }

  const handleCreateRoom = (roomName: string) => {
    // Simulation de création de salle (à remplacer par l'appel à Supabase)
    const newRoom: GameRoom = {
      id: `room-${Date.now()}`,
      name: roomName,
      created_at: new Date().toISOString(),
      owner_id: currentUserId,
      game_mode: selectedGameMode,
      difficulty: selectedDifficulty,
      status: "waiting",
      target_image_url: "/placeholder.svg",
      players: [
        {
          id: currentUserId,
          username: "Vous",
          avatar_url: "/placeholder.svg"
        }
      ],
      join_code: generateRandomCode(),
      max_players: 8
    };
    
    setCurrentRoom(newRoom);
    toast.success(`Salle "${roomName}" créée avec succès !`);
  };
  
  const handleJoinRoom = (joinCode: string) => {
    // Simulation de rejoindre une salle (à remplacer par l'appel à Supabase)
    // Dans une implémentation réelle, nous vérifierions si le code existe
    
    const mockRoom: GameRoom = {
      id: `room-${Date.now()}`,
      name: "Salle de jeu",
      created_at: new Date().toISOString(),
      owner_id: "other-user",
      game_mode: selectedGameMode,
      difficulty: selectedDifficulty,
      status: "waiting",
      target_image_url: "/placeholder.svg",
      players: [
        {
          id: "other-user",
          username: "Hôte",
          avatar_url: "/placeholder.svg"
        },
        {
          id: currentUserId,
          username: "Vous",
          avatar_url: "/placeholder.svg"
        }
      ],
      join_code: joinCode,
      max_players: 8
    };
    
    setCurrentRoom(mockRoom);
    toast.success("Vous avez rejoint la salle !");
  };

  const handleStartGame = () => {
    setShowGame(true);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    toast.info("Vous avez quitté la salle");
  };

  // Afficher la salle d'attente si l'utilisateur est dans une salle
  if (currentRoom) {
    return (
      <WaitingRoom
        room={currentRoom}
        isOwner={currentRoom.owner_id === currentUserId}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Afficher le formulaire de création de salle si l'utilisateur est en train de créer/rejoindre
  if (isCreatingRoom) {
    return (
      <GameRoomCreation
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onCancel={() => setIsCreatingRoom(false)}
      />
    );
  }

  // Afficher le lobby principal
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Salle d'attente</h2>
        <Button variant="outline" onClick={onShowRules} className="bg-white/20 border-white/20 text-white hover:bg-white/30">
          <BookOpen className="mr-2 h-4 w-4" />
          Règles du jeu
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/20 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Brain className="mr-2 h-5 w-5" />
              Mode de jeu
            </h3>
            
            <RadioGroup 
              value={selectedGameMode} 
              onValueChange={(value) => setSelectedGameMode(value as any)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2 p-3 rounded-md bg-white/10">
                <RadioGroupItem value="solo" id="solo" className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="solo" className="font-medium text-white">Solo</Label>
                  <p className="text-sm text-white/70">
                    Entraînez-vous seul et améliorez vos compétences de prompting
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-3 rounded-md bg-white/10">
                <RadioGroupItem value="duel" id="duel" className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="duel" className="font-medium text-white">Duel</Label>
                  <p className="text-sm text-white/70">
                    Affrontez un autre joueur en face à face
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-3 rounded-md bg-white/10">
                <RadioGroupItem value="team" id="team" className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="team" className="font-medium text-white">Équipe</Label>
                  <p className="text-sm text-white/70">
                    Rejoignez une équipe et affrontez d'autres groupes
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="bg-white/20 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Paramètres
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-white">Difficulté</Label>
                <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as any)}>
                  <SelectTrigger id="difficulty" className="bg-white/30 border-white/20 text-white">
                    <SelectValue placeholder="Sélectionnez la difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Intermédiaire</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedGameMode !== "solo" && (
                <div className="space-y-2">
                  <Label className="text-white">Salles disponibles</Label>
                  <div className="bg-white/30 border border-white/20 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-white" />
                        <span className="text-sm text-white">Salle principale</span>
                      </div>
                      <Badge className="bg-promptfighter-pink text-white">2/8</Badge>
                    </div>
                    <p className="text-xs text-white/70">
                      En attente de joueurs supplémentaires...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        {selectedGameMode === "solo" ? (
          <Button 
            size="lg"
            onClick={() => setShowGame(true)}
            className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold px-8 py-6 text-lg"
          >
            Commencer la partie
          </Button>
        ) : (
          <>
            <Button 
              size="lg"
              onClick={() => setIsCreatingRoom(true)}
              className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold px-8 py-6 text-lg"
            >
              Créer une salle
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setIsCreatingRoom(true)}
              className="bg-white/20 border-white/20 hover:bg-white/30 text-white font-bold px-8 py-6 text-lg"
            >
              Rejoindre une salle
            </Button>
          </>
        )}
      </div>

      <div className="mt-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <h3 className="text-lg font-bold text-white flex items-center mb-2">
              <Trophy className="mr-2 h-5 w-5 text-promptfighter-pink" />
              Classement
            </h3>
            <p className="text-sm text-white/70">
              Connectez-vous et jouez pour apparaître dans le classement!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameLobby;
