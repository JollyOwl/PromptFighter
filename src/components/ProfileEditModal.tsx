
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile, getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameStore } from '@/store/gameStore';
import { Loader2 } from 'lucide-react';
import { getAvatarFromUsername } from '@/utils/avatarUtils';

interface ProfileEditModalProps {
  onClose: () => void;
  onUserUpdate?: (user: any) => void;
}

const ProfileEditModal = ({ onClose, onUserUpdate }: ProfileEditModalProps) => {
  const { user } = useAuth();
  const { setCurrentPlayer } = useGameStore();
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const avatarUrl = getAvatarFromUsername(username.trim());

      const updatedUser = await updateProfile({
        username: username.trim(),
        avatar_url: avatarUrl
      });

      // Update the current player in the game store
      setCurrentPlayer({
        id: updatedUser.id,
        username: updatedUser.username,
        avatar_url: updatedUser.avatar_url
      });

      // Force refresh of auth context by calling getCurrentUser again
      const refreshedUser = await getCurrentUser();
      
      // Call the callback to update parent component
      if (onUserUpdate && refreshedUser) {
        onUserUpdate(refreshedUser);
      }

      // Trigger a manual auth state change to refresh all components using useAuth
      window.dispatchEvent(new CustomEvent('authUserUpdated', { detail: refreshedUser }));

      onClose();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black/80 backdrop-blur-lg border-promptfighter-neon/20 text-white">
        <CardHeader className="border-b border-promptfighter-neon/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-promptfighter-neon">Modifier le profil</CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                disabled={loading}
                className="bg-white/10 border-promptfighter-neon/30 text-white placeholder:text-white/60"
                required
              />
              <p className="text-sm text-white/60">
                Votre avatar sera automatiquement généré à partir de vos initiales
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-promptfighter-neon/50 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !username.trim()}
                className="flex-1 bg-promptfighter-neon text-promptfighter-navy hover:bg-promptfighter-neon/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileEditModal;
