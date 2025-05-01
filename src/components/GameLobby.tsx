
import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { createGameRoom, joinGameRoom, leaveGameRoom } from "@/services/gameService";
import { supabase } from "@/lib/supabase";

interface GameLobbyProps {
  onShowRules: () => void;
}

const GameLobby = ({ onShowRules }: GameLobbyProps) => {
  const { user } = useAuth();
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
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);

  useEffect(() => {
    // Fetch available rooms when component mounts
    if (user) {
      fetchAvailableRooms();
      
      // Subscribe to room changes
      const roomsSubscription = supabase
        .channel('public:game_rooms')
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public',
            table: 'game_rooms'
          }, 
          () => {
            fetchAvailableRooms();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(roomsSubscription);
      };
    }
  }, [user]);

  const fetchAvailableRooms = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select(`
          id, 
          name, 
          game_mode, 
          difficulty, 
          max_players,
          created_at,
          join_code,
          owner_id,
          status,
          target_image_url,
          game_players:game_players(user_id)
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Transform to get player count
      const roomsWithPlayerCount = data.map(room => ({
        ...room,
        playerCount: room.game_players ? room.game_players.length : 0
      }));
      
      setAvailableRooms(roomsWithPlayerCount);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
    }
  };

  const handleCreateRoom = async (roomName: string, maxPlayers: number) => {
    if (!user) {
      toast.error("Please log in to create a game room");
      return;
    }
    
    const room = await createGameRoom(
      roomName,
      selectedGameMode,
      selectedDifficulty,
      user,
      maxPlayers
    );
    
    if (room) {
      setCurrentRoom(room);
      toast.success(`Room "${roomName}" created successfully!`);
    }
  };
  
  const handleJoinRoom = async (joinCode: string) => {
    if (!user) {
      toast.error("Please log in to join a game room");
      return;
    }
    
    const room = await joinGameRoom(joinCode, user);
    if (room) {
      setCurrentRoom(room);
      toast.success(`You joined ${room.name}!`);
    }
  };

  const handleQuickJoin = async (room: any) => {
    if (!user) {
      toast.error("Please log in to join a game room");
      return;
    }
    
    const joinedRoom = await joinGameRoom(room.join_code, user);
    if (joinedRoom) {
      setCurrentRoom(joinedRoom);
      toast.success(`You joined ${joinedRoom.name}!`);
    }
  };

  const handleStartGame = async () => {
    setShowGame(true);
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom || !user) return;
    
    const success = await leaveGameRoom(currentRoom.id, user.id);
    if (success) {
      setCurrentRoom(null);
      toast.info("You left the room");
    }
  };

  // Render the game simulator if a game is in progress
  if (showGame) {
    return <GameSimulator onExit={() => setShowGame(false)} gameMode={selectedGameMode} difficulty={selectedDifficulty} targetImage={currentRoom?.target_image_url} />;
  }

  // Render waiting room if the user is in a room
  if (currentRoom) {
    return (
      <WaitingRoom
        room={currentRoom}
        isOwner={currentRoom.owner_id === user?.id}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Render room creation form
  if (isCreatingRoom) {
    return (
      <GameRoomCreation
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onCancel={() => setIsCreatingRoom(false)}
      />
    );
  }

  // Render main lobby
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableRooms.length > 0 ? (
                      availableRooms.map(room => (
                        <div key={room.id} className="bg-white/30 border border-white/20 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-white" />
                              <span className="text-sm text-white">{room.name}</span>
                            </div>
                            <Badge className="bg-promptfighter-pink text-white">
                              {room.playerCount}/{room.max_players}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/70">
                              {room.game_mode === "duel" ? "Duel" : "Équipe"} • {
                                room.difficulty === "easy" ? "Facile" :
                                room.difficulty === "medium" ? "Intermédiaire" : "Difficile"
                              }
                            </span>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleQuickJoin(room)}
                              className="h-7 text-xs"
                            >
                              Rejoindre
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-white/70 p-2 text-center">
                        Aucune salle disponible pour le moment
                      </p>
                    )}
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

      {user && (
        <div className="mt-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold text-white flex items-center mb-2">
                <Trophy className="mr-2 h-5 w-5 text-promptfighter-pink" />
                Classement
              </h3>
              <p className="text-sm text-white/70">
                Jouez pour apparaître dans le classement!
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameLobby;
