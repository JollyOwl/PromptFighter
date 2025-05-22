import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GameRoom } from '@/types/game';
import { useUser } from '@/lib/auth';
import { leaveGameRoom, startGameSession } from '@/services/gameService';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface WaitingRoomProps {
  room: GameRoom;
  isOwner: boolean;
  onLeave: () => void;
  onStart: () => void;
}

const WaitingRoom = ({ room, isOwner, onLeave, onStart }: WaitingRoomProps) => {
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLeave = async () => {
    if (!user || !room) return;
    const success = await leaveGameRoom(room.id, user.id);
    if (success) {
      toast.success('Left the room');
      onLeave();
    } else {
      toast.error('Failed to leave the room');
    }
  };

  const handleStart = async () => {
    if (!room) return;
    const success = await startGameSession(room.id, room.owner_id);
    if (success) {
      toast.success('Game started!');
      onStart();
    } else {
      toast.error('Failed to start the game');
    }
  };

  const renderPlayers = () => {
    return room.players.map((player, index) => (
      <div key={player.id || index} className="flex items-center space-x-2 p-2 rounded-md transition-colors border border-gray-800 bg-stone-900 hover:bg-stone-800">
        <Avatar className="h-8 w-8 bg-stone-800">
          {player.avatar_url ? (
            <AvatarImage src={player.avatar_url} alt={player.username} />
          ) : (
            <AvatarFallback className="text-xs">{player.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
          )}
        </Avatar>
        <span className="text-sm font-medium">{player.username || 'Player'}</span>
        {room.owner_id === player.id && (
          <span className="ml-1 text-xs px-1 py-0.5 bg-primary/20 text-primary rounded">Host</span>
        )}
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Waiting Room: {room?.name}</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Players:</h3>
        <div className="flex flex-wrap gap-2">
          {renderPlayers()}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="destructive" onClick={handleLeave}>
          Leave Room
        </Button>
        {isOwner && (
          <Button onClick={handleStart}>
            Start Game
          </Button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
