
import { useEffect, useState } from 'react';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import { GameRoom, GamePhase, Player } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Users, Vote, Trophy } from 'lucide-react';
import { getVotingProgress, hasUserVoted } from '@/services/realtimeGameService';

interface RealtimeGameManagerProps {
  room: GameRoom;
  onPhaseChange?: (phase: GamePhase) => void;
  children?: React.ReactNode;
}

export const RealtimeGameManager = ({ room, onPhaseChange, children }: RealtimeGameManagerProps) => {
  const { user } = useAuth();
  const [votingProgress, setVotingProgress] = useState({ totalPlayers: 0, votedPlayers: 0 });
  const [userHasVoted, setUserHasVoted] = useState(false);

  const {
    currentSession,
    timeLeft,
    isOwner,
    updatePhase,
    submitVote,
    logPlayerAction
  } = useRealtimeGame({
    roomId: room.id,
    onPhaseChange: (phase) => {
      console.log('Phase changed to:', phase);
      if (onPhaseChange) {
        onPhaseChange(phase);
      }
    },
    onPlayerAction: (action) => {
      console.log('Player action received:', action);
      
      // Refresh voting progress when votes are cast
      if (action.action_type === 'vote') {
        refreshVotingProgress();
      }
    }
  });

  // Refresh voting progress
  const refreshVotingProgress = async () => {
    if (!room.id) return;

    const progress = await getVotingProgress(room.id);
    setVotingProgress(progress);

    if (user) {
      const voted = await hasUserVoted(room.id, user.id);
      setUserHasVoted(voted);
    }
  };

  // Refresh voting progress when phase changes to voting
  useEffect(() => {
    if (currentSession?.current_phase === 'voting') {
      refreshVotingProgress();
    }
  }, [currentSession?.current_phase, room.id, user]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get phase display info
  const getPhaseInfo = () => {
    if (!currentSession) return { title: 'Waiting to start...', description: '' };

    switch (currentSession.current_phase) {
      case 'waiting':
        return {
          title: 'Waiting for players',
          description: 'Room owner can start the game when ready'
        };
      case 'playing':
        return {
          title: 'Game in Progress',
          description: 'Create your prompt and generate your image!'
        };
      case 'voting':
        return {
          title: 'Voting Phase',
          description: 'Vote for the best submission! Game advances when everyone votes.'
        };
      case 'results':
        return {
          title: 'Results',
          description: 'See who won this round!'
        };
      default:
        return { title: 'Unknown phase', description: '' };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="space-y-4">
      {/* Game Status Header */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-bold">{phaseInfo.title}</h3>
                <p className="text-white/70 text-sm">{phaseInfo.description}</p>
              </div>
              
              {currentSession?.current_phase === 'voting' && (
                <div className="flex items-center space-x-2">
                  <Vote className="h-5 w-5 text-promptfighter-pink" />
                  <span className="text-sm">
                    {votingProgress.votedPlayers}/{votingProgress.totalPlayers} voted
                    {userHasVoted && " (including you)"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer (only for non-voting phases) */}
              {currentSession && currentSession.current_phase !== 'voting' && timeLeft > 0 && (
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-promptfighter-cyan" />
                  <span className={`font-mono text-lg font-bold ${
                    timeLeft < 30 ? "text-red-400 animate-pulse" : "text-white"
                  }`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Player count */}
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-promptfighter-cyan" />
                <span className="text-sm">{room.players.length}/{room.max_players}</span>
              </div>
            </div>
          </div>

          {/* Progress bar for voting */}
          {currentSession?.current_phase === 'voting' && votingProgress.totalPlayers > 0 && (
            <div className="mt-4">
              <Progress 
                value={(votingProgress.votedPlayers / votingProgress.totalPlayers) * 100} 
                className="w-full h-2"
              />
              <p className="text-xs text-white/60 mt-1">
                Waiting for all players to vote...
              </p>
            </div>
          )}

          {/* Phase controls for room owner */}
          {isOwner && (
            <div className="mt-4 flex space-x-2">
              {currentSession?.current_phase === 'waiting' && (
                <Button
                  onClick={() => updatePhase('playing', 180)}
                  className="bg-promptfighter-pink hover:bg-promptfighter-pink/80"
                >
                  Start Game
                </Button>
              )}
              
              {currentSession?.current_phase === 'playing' && (
                <Button
                  onClick={() => updatePhase('voting')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Force Voting Phase
                </Button>
              )}
              
              {currentSession?.current_phase === 'results' && (
                <Button
                  onClick={() => updatePhase('waiting')}
                  className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/80 text-promptfighter-navy"
                >
                  New Round
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Content */}
      {children}
    </div>
  );
};
