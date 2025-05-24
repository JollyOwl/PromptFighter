
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar, Mail, User } from 'lucide-react';

interface UserStats {
  totalGames: number;
  averageAccuracy: number;
  accuracyByDifficulty: Record<string, number>;
  accuracyByMode: Record<string, number>;
  globalRank: number;
  totalUsers: number;
}

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile = ({ onClose }: UserProfileProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // This is a placeholder for the actual stats fetching
      // You'll need to implement the actual database queries based on your game_submissions table
      const mockStats: UserStats = {
        totalGames: 0,
        averageAccuracy: 0,
        accuracyByDifficulty: {},
        accuracyByMode: {},
        globalRank: 1,
        totalUsers: 1
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-black/80 backdrop-blur-lg border-promptfighter-neon/20 text-white">
        <CardHeader className="border-b border-promptfighter-neon/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-promptfighter-neon">Profil Utilisateur</CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* User Info Section */}
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback className="bg-promptfighter-neon/20 text-promptfighter-neon text-lg">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-promptfighter-neon">{user.username}</h3>
              <div className="flex items-center space-x-2 text-white/70">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.created_at && (
                <div className="flex items-center space-x-2 text-white/70">
                  <Calendar className="h-4 w-4" />
                  <span>Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Dashboard */}
          {loading ? (
            <div className="text-center text-white/70">Chargement des statistiques...</div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-6 w-6 text-promptfighter-neon mr-2" />
                      <span className="text-promptfighter-neon font-semibold">Parties Jouées</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                  </CardContent>
                </Card>

                <Card className="bg-promptfighter-neon/10 border-promptfighter-neon/30">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-6 w-6 text-promptfighter-neon mr-2" />
                      <span className="text-promptfighter-neon font-semibold">Précision Moyenne</span>
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
                    <div className="text-sm text-white/70">sur {stats.totalUsers} joueurs</div>
                  </CardContent>
                </Card>
              </div>

              {/* Accuracy by Difficulty */}
              {Object.keys(stats.accuracyByDifficulty).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-promptfighter-neon mb-3">Précision par Difficulté</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(stats.accuracyByDifficulty).map(([difficulty, accuracy]) => (
                      <div key={difficulty} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="capitalize text-white/90">{difficulty}</span>
                        <Badge variant="secondary" className="bg-promptfighter-neon/20 text-promptfighter-neon">
                          {accuracy.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accuracy by Game Mode */}
              {Object.keys(stats.accuracyByMode).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-promptfighter-neon mb-3">Précision par Mode de Jeu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(stats.accuracyByMode).map(([mode, accuracy]) => (
                      <div key={mode} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span className="capitalize text-white/90">{mode}</span>
                        <Badge variant="secondary" className="bg-promptfighter-neon/20 text-promptfighter-neon">
                          {accuracy.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/70">Aucune statistique disponible</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
