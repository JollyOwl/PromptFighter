
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Copy, PlayCircle, ArrowLeft } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { GameRoom, Player } from "@/types/game";
import { Badge } from "./ui/badge";

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
  const [copiedCode, setCopiedCode] = useState(false);
  
  const copyJoinCode = () => {
    navigator.clipboard.writeText(room.join_code);
    setCopiedCode(true);
    toast.success("Code copié dans le presse-papier!");
    
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  // Simuler l'arrivée de nouveaux joueurs pour la démo
  const [players, setPlayers] = useState<Player[]>(room.players);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (players.length < room.max_players && Math.random() > 0.7) {
        const newPlayer: Player = {
          id: `player-${players.length + 1}`,
          username: `Joueur ${players.length + 1}`,
          avatar_url: "/placeholder.svg"
        };
        
        setPlayers(prev => [...prev, newPlayer]);
        toast.info(`${newPlayer.username} a rejoint la partie!`);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [players, room.max_players]);
  
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
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-promptfighter-navy to-promptfighter-pink/30">
                  <img 
                    src={player.avatar_url || "/placeholder.svg"}
                    alt={player.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">{player.username}</p>
                  {player.id === room.owner_id && (
                    <Badge variant="outline" className="border-promptfighter-cyan text-promptfighter-cyan text-xs">
                      Hôte
                    </Badge>
                  )}
                </div>
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
            onClick={onStartGame}
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
