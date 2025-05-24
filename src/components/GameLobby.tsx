
import { useCallback, useState, useEffect } from "react";
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
import { GameRoom, Player, TargetImage } from "@/types/game";
import { useAuth } from "@/hooks/useAuth";
import { createGameRoom, joinGameRoom, leaveGameRoom, getRandomTargetImage } from "@/services/gameService";
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
    setCurrentRoom,
    setCurrentTargetImage,
    targetImage,
    setTargetImage
  } = useGameStore();
  
  const [showGame, setShowGame] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);

  const fetchAvailableRooms = useCallback(async () => {
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
      
      // Transform to match GameRoom interface
      const roomsWithPlayers: GameRoom[] = data.map(room => ({
        id: room.id,
        name: room.name,
        created_at: room.created_at,
        owner_id: room.owner_id,
        game_mode: room.game_mode,
        difficulty: room.difficulty,
        status: room.status,
        target_image_url: room.target_image_url || '',
        join_code: room.join_code,
        max_players: room.max_players,
        players: [], // Initialize empty array, we'll get player details if needed
        playerCount: room.game_players ? room.game_players.length : 0 // Custom property for UI only
      }));
      
      setAvailableRooms(roomsWithPlayers);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAvailableRooms();
      
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
  }, [user, fetchAvailableRooms]);

  const handleCreateRoom = async (roomName: string, maxPlayers: number) => {
    if (!user) {
      toast.error("Please log in to create a game room");
      return;
    }
    
    try {
      console.log('Creating room:', { roomName, selectedGameMode, selectedDifficulty, maxPlayers });
      
      const room = await createGameRoom(
        roomName,
        selectedGameMode,
        selectedDifficulty,
        user,
        maxPlayers
      );
      
      if (room) {
        console.log('Room created successfully:', room);
        setCurrentRoom(room);
        setIsCreatingRoom(false); // Close the creation modal
        toast.success(`Room "${roomName}" created successfully!`);
        
        // Check if we should start the game immediately (e.g., if room is full)
        if (room.players && room.players.length >= room.max_players) {
          // Auto-start if room is full
          setTimeout(() => {
            handleStartGame();
          }, 1000);
        }
      } else {
        console.error('Room creation returned null');
        toast.error('Failed to create room - no room returned');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
  };
  
  const handleJoinRoom = async (joinCode: string) => {
    if (!user) {
      toast.error("Please log in to join a game room");
      return;
    }
    
    try {
      console.log('Joining room with code:', joinCode);
      
      const room = await joinGameRoom(joinCode, user);
      if (room) {
        console.log('Joined room successfully:', room);
        setCurrentRoom(room);
        setIsCreatingRoom(false); // Close the creation modal
        toast.success(`You joined ${room.name}!`);
        
        // Check if we should start the game immediately (e.g., if room is full)
        if (room.players && room.players.length >= room.max_players) {
          // Auto-start if room is full
          setTimeout(() => {
            handleStartGame();
          }, 1000);
        }
      } else {
        console.error('Room join returned null');
        toast.error('Failed to join room - no room returned');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  };

  const handleQuickJoin = async (room: GameRoom) => {
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
    console.log("handleStartGame called");
    try {
      if (selectedGameMode === 'solo') {
        // Reset current target image before fetching a new one
        setCurrentTargetImage(null);
        
        // For solo mode, get a random target image
        const randomTargetImage = await getRandomTargetImage(selectedDifficulty);
        console.log("Fetched target image for solo mode:", randomTargetImage); // Debug log
        
        if (!randomTargetImage) {
          toast.error("Failed to load target image");
          return;
        }
        
        setTargetImage(randomTargetImage);
      } else if (currentRoom) {
        // Reset current target image before fetching a new one
        setCurrentTargetImage(null);
        
        // For multiplayer, fetch the target image based on the room's target_image_url
        if (currentRoom.target_image_url) {
          console.log("Fetching target image based on URL:", currentRoom.target_image_url);
          
          // Try to find the image in the database first
          const { data: imageData, error } = await supabase
            .from('target_images')
            .select('*')
            .eq('url', currentRoom.target_image_url)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching target image:", error);
            toast.error("Failed to fetch target image");
            return;
          }
          
          if (imageData) {
            console.log("Found image in database:", imageData);
            setTargetImage(imageData as TargetImage);
          } else {
            // If not found, create a placeholder
            console.log("Creating placeholder for image with URL:", currentRoom.target_image_url);
            setTargetImage({
              id: 'placeholder',
              url: currentRoom.target_image_url,
              difficulty: currentRoom.difficulty,
              name: 'Target Image'
            });
          }
        } else {
          // If no target_image_url, get a random one based on the room's difficulty
          console.log("No target image URL in room, fetching random image");
          const randomTargetImage = await getRandomTargetImage(currentRoom.difficulty);
          
          if (!randomTargetImage) {
            toast.error("Failed to load target image");
            return;
          }
          
          console.log("Fetched random image for room:", randomTargetImage);
          setTargetImage(randomTargetImage);
          
          // Update the room with the new target image
          const { error } = await supabase
            .from('game_rooms')
            .update({ target_image_url: randomTargetImage.url })
            .eq('id', currentRoom.id);
            
          if (error) {
            console.error("Error updating room with target image:", error);
          }
        }
      } else {
        toast.error("No room available");
        return;
      }
      
      console.log("Final target image set:", targetImage);
      setShowGame(true);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
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
    return <GameSimulator 
      room={{
        id: 'solo-game',
        name: 'Solo Game',
        created_at: new Date().toISOString(),
        owner_id: user?.id || '',
        game_mode: selectedGameMode,
        difficulty: selectedDifficulty,
        status: 'playing',
        target_image_url: targetImage?.url || '',
        join_code: '',
        max_players: 1,
        players: [{
          id: user?.id || '',
          username: user?.username || 'Player',
          avatar_url: user?.avatar_url
        }]
      }}
      currentPlayer={{
        id: user?.id || '',
        username: user?.username || 'Player',
        avatar_url: user?.avatar_url
      }}
      onGamePhaseChange={(phase) => {
        if (phase === 'waiting') {
          setShowGame(false);
        }
      }}
      onGameEnd={(results) => {
        console.log('Game ended:', results);
        setShowGame(false);
      }}
    />;
  }

  // Render waiting room if the user is in a room
  if (currentRoom) {
    return (
      <WaitingRoom
        room={currentRoom}
        isOwner={currentRoom.owner_id === user?.id}
        onLeave={() => {}}
        onStart={() => {}}
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
              onValueChange={(value) => setSelectedGameMode(value as "solo" | "duel" | "team")}
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
                <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as "easy" | "medium" | "hard")}>
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
                              {room.players?.length || 0}/{room.max_players}
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
