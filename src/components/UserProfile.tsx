
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar, Mail, User, Target, Vote, Settings } from 'lucide-react';
import ProfileEditModal from './ProfileEditModal';

interface UserStats {
  totalGames: number;
  averageAccuracy: number;
  accuracyByDifficulty: Record<string, { accuracy: number; games: number }>;
  accuracyByMode: Record<string, { accuracy: number; games: number }>;
  globalRank: number;
  totalUsers: number;
  totalVotesReceived: number;
  gamesWon: number;
}

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile = ({ onClose }: UserProfileProps) => {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const handleUserUpdate = async (updatedUser: any) => {
    setCurrentUser(updatedUser);
    // Refresh stats with updated user data
    await fetchUserStats();
  };

  const fetchUserStats = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Get player scores
      const { data: playerScores } = await supabase
        .from('player_scores')
        .select('*')
        .eq('player_id', currentUser.id)
        .maybeSingle();

      // Get detailed submission stats grouped by difficulty and mode
      const { data: submissions } = await supabase
        .from('game_submissions')
        .select(`
          accuracy_score,
          game_rooms!inner(difficulty, game_mode)
        `)
        .eq('player_id', currentUser.id);

      const { data: allScores } = await supabase
        .from('player_scores')
        .select('player_id, avg_accuracy_score')
        .order('avg_accuracy_score', { ascending: false });

      const accuracyByDifficulty: Record<string, { accuracy: number; games: number }> = {};
      const accuracyByMode: Record<string, { accuracy: number; games: number }> = {};

      if (submissions) {
        submissions.forEach(submission => {
          const roomData = submission.game_rooms as any;
          const difficulty = roomData.difficulty;
          const mode = roomData.game_mode;
          const score = submission.accuracy_score;

          if (!accuracyByDifficulty[difficulty]) {
            accuracyByDifficulty[difficulty] = { accuracy: 0, games: 0 };
          }
          accuracyByDifficulty[difficulty].accuracy += score;
          accuracyByDifficulty[difficulty].games += 1;

          if (!accuracyByMode[mode]) {
            accuracyByMode[mode] = { accuracy: 0, games: 0 };
          }
          accuracyByMode[mode].accuracy += score;
          accuracyByMode[mode].games += 1;
        });

        Object.keys(accuracyByDifficulty).forEach(key => {
          const data = accuracyByDifficulty[key];
          data.accuracy = data.accuracy / data.games;
        });

        Object.keys(accuracyByMode).forEach(key => {
          const data = accuracyByMode[key];
          data.accuracy = data.accuracy / data.games;
        });
      }

      let globalRank = 1;
      const userScore = playerScores?.avg_accuracy_score || 0;
      if (allScores) {
        globalRank = allScores.findIndex(score => score.player_id === currentUser.id) + 1;
        if (globalRank === 0) globalRank = allScores.length + 1;
      }

      const calculatedStats: UserStats = {
        totalGames: playerScores?.total_games || 0,
        averageAccuracy: playerScores?.avg_accuracy_score || 0,
        accuracyByDifficulty,
        accuracyByMode,
        globalRank,
        totalUsers: allScores?.length || 1,
        totalVotesReceived: playerScores?.total_votes_received || 0,
        gamesWon: playerScores?.games_won || 0
      };
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl bg-black/80 backdrop-blur-lg border-promptfighter-neon/20 text-white max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b border-promptfighter-neon/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-promptfighter-neon">Profil Utilisateur</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="border-promptfighter-neon/50 text-promptfighter-neon hover:bg-promptfighter-neon/20"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* User Info Section */}
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
                <AvatarFallback className="bg-promptfighter-neon/20 text-promptfighter-neon text-lg">
                  {currentUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-promptfighter-neon">{currentUser.username}</h3>
                <div className="flex items-center space-x-2 text-white/70">
                  <Mail className="h-4 w-4" />
                  <span>{currentUser.email}</span>
                </div>
                {currentUser.created_at && (
                  <div className="flex items-center space-x-2 text-white/70">
                    <Calendar className="h-4 w-4" />
                    <span>Inscrit le {new Date(currentUser.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Dashboard */}
            {loading ? (
              <div className="text-center text-white/70">Chargement des statistiques...</div>
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Trophy className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Parties</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Précision Moy.</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.averageAccuracy.toFixed(1)}%</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <User className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Classement</span>
                      </div>
                      <div className="text-2xl font-bold text-white">#{stats.globalRank}</div>
                      <div className="text-sm text-white/70">sur {stats.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Vote className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Votes Reçus</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.totalVotesReceived}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Victoires</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{stats.gamesWon}</div>
                      <div className="text-sm text-white/70">
                        {stats.totalGames > 0 ? `${((stats.gamesWon / stats.totalGames) * 100).toFixed(1)}%` : '0%'} de victoires
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-6 w-6 text-promptfighter-neon mr-2" />
                        <span className="text-promptfighter-neon font-semibold">Score Total</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {stats.totalGames > 0 ? (stats.averageAccuracy * stats.totalGames).toFixed(0) : '0'}
                      </div>
                      <div className="text-sm text-white/70">Points de précision</div>
                    </CardContent>
                  </Card>
                </div>

                {Object.keys(stats.accuracyByDifficulty).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-promptfighter-neon mb-3">Précision par Difficulté</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(stats.accuracyByDifficulty).map(([difficulty, data]) => (
                        <div key={difficulty} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <span className="capitalize text-white/90 font-medium">
                              {difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                            </span>
                            <div className="text-xs text-white/60">{data.games} parties</div>
                          </div>
                          <Badge variant="secondary" className="bg-promptfighter-neon/20 text-promptfighter-neon">
                            {data.accuracy.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(stats.accuracyByMode).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-promptfighter-neon mb-3">Précision par Mode de Jeu</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(stats.accuracyByMode).map(([mode, data]) => (
                        <div key={mode} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <div>
                            <span className="capitalize text-white/90 font-medium">
                              {mode === 'solo' ? 'Solo' : mode === 'duel' ? 'Duel' : 'Équipe'}
                            </span>
                            <div className="text-xs text-white/60">{data.games} parties</div>
                          </div>
                          <Badge variant="secondary" className="bg-promptfighter-neon/20 text-promptfighter-neon">
                            {data.accuracy.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-white/70">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-promptfighter-neon/50" />
                <p>Aucune statistique disponible</p>
                <p className="text-sm mt-2">Jouez votre première partie pour voir vos stats !</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <ProfileEditModal 
          onClose={() => setShowEditModal(false)} 
          onUserUpdate={handleUserUpdate}
        />
      )}
    </>
  );
};

export default UserProfile;
