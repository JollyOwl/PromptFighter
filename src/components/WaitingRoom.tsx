import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Copy, PlayCircle, ArrowLeft } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { GameRoom, Player } from "@/types/game";
import { Badge } from "./ui/badge";
import { startGameSession } from "@/services/gameService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface WaitingRoomProps {
  room: GameRoom;
  isOwner: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const WaitingRoom = ({ 
  room, 
  isOwner,
  onStartGame, 
  onLeaveRoom 
}: WaitingRoomProps) => {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [players, setPlayers] = useState<Player[]>(room.players || []);
  const { setCurrentRoom } = useGameStore();
  
  useEffect(() => {
    if (!room || !user) return;
    
    // Subscribe to player changes in this room
    const playersSubscription = supabase
      .channel(`room-${room.id}-players`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `room_id=eq.${room.id}`
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();
    
    // Subscribe to room changes
    const roomSubscription = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${room.id}`
        },
        async (payload) => {
          // If room status changed to playing, start the game
          if (payload.new.status === 'playing' && room.status === 'waiting') {
            onStartGame();
          }
          
          // Update current room with new data
          const updatedRoom = { ...room, ...payload.new };
          setCurrentRoom(updatedRoom);
        }
      )
      .subscribe();
    
    // Initial fetch of players
    fetchPlayers();
    
    return () => {
      supabase.removeChannel(playersSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [onStartGame, room, setCurrentRoom, user]);
  
  const fetchPlayers = useCallback(async () => {
    if (!room) return;
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('room_id', room.id);
      
      if (error) throw error;
      
      // Map the nested profile data to Player objects
      const mappedPlayers: Player[] = data.map(p => ({
        id: p.profiles.id,
        username: p.profiles.username,
        avatar_url: p.profiles.avatar_url
      }));
      
      setPlayers(mappedPlayers);
      
      // Update current room with new players
      setCurrentRoom({
        ...room,
        players: mappedPlayers
      });
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  }, [room, setCurrentRoom]);
  
  const copyJoinCode = () => {
    navigator.clipboard.writeText(room.join_code);
    setCopiedCode(true);
    toast.success("Code copié dans le presse-papier!");
    
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  const handleStartGame = async () => {
    if (!isOwner || !user) return;
    
    const success = await startGameSession(room.id, user.id);
    if (success) {
      toast.success("La partie commence !");
      onStartGame();
    }
  };
  
  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={onLeaveRoom}
        className="mb-4 text-white hover:bg-white/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quitter la salle
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{room.name}</h2>
          <p className="text-white/70">
            Mode: {room.game_mode === "duel" ? "Duel" : "Équipe"} | 
            Difficulté: {
              room.difficulty === "easy" ? "Facile" :
              room.difficulty === "medium" ? "Intermédiaire" : "Difficile"
            }
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Code de la salle:</span>
            <Badge variant="secondary" className="bg-white/20 text-white text-lg font-mono">
              {room.join_code}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={copyJoinCode}
              className="h-8 px-2 text-white hover:bg-white/20"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {copiedCode && (
            <p className="text-xs text-promptfighter-cyan animate-pulse">
              Code copié !
            </p>
          )}
        </div>
      </div>
      
      <Card className="bg-white/20 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Joueurs
            </h3>
            <Badge className="bg-promptfighter-pink text-white">
              {players.length}/{room.max_players}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {players.map((player) => (
              <div 
                key={player.id}
                className="bg-white/10 p-3 rounded-lg flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden">
                  <img 
                    src={player.avatar_url || "/placeholder.svg"}
                    alt={player.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white font-medium">{player.username}</p>
              </div>
            ))}
            
            {Array(room.max_players - players.length).fill(0).map((_, index) => (
              <div 
                key={`empty-${index}`}
                className="bg-white/5 p-3 rounded-lg flex flex-col items-center gap-2 border border-dashed border-white/20"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-white/50 text-sm">En attente...</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {isOwner && (
        <div className="flex justify-center pt-4">
          <Button 
            size="lg"
            onClick={handleStartGame}
            className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold px-8 py-6 text-lg"
            disabled={players.length < 2}
          >
            <PlayCircle className="mr-2 h-6 w-6" />
            Lancer la partie
          </Button>
        </div>
      )}
      
      {!isOwner && (
        <div className="text-center p-4 bg-white/10 rounded-lg">
          <p className="text-white">En attente du lancement de la partie par l'hôte...</p>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
