
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGameStore } from '@/store/gameStore';
import { Loader2 } from 'lucide-react';

const avatars = [
  { id: 1, url: "/placeholder.svg", name: "Avatar 1" },
  { id: 2, url: "/placeholder.svg", name: "Avatar 2" },
  { id: 3, url: "/placeholder.svg", name: "Avatar 3" },
  { id: 4, url: "/placeholder.svg", name: "Avatar 4" }
];

interface ProfileEditModalProps {
  onClose: () => void;
}

const ProfileEditModal = ({ onClose }: ProfileEditModalProps) => {
  const { user } = useAuth();
  const { setCurrentPlayer } = useGameStore();
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || "/placeholder.svg");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const updatedUser = await updateProfile({
        username: username.trim(),
        avatar_url: selectedAvatar
      });

      // Update the current player in the game store
      setCurrentPlayer({
        id: updatedUser.id,
        username: updatedUser.username,
        avatar_url: updatedUser.avatar_url
      });

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
            </div>

            <div className="space-y-3">
              <Label className="text-white">Avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {avatars.map((avatar) => (
                  <Avatar
                    key={avatar.id}
                    className={`w-16 h-16 cursor-pointer transition-all ${
                      selectedAvatar === avatar.url
                        ? "ring-2 ring-promptfighter-neon"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedAvatar(avatar.url)}
                  >
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback className="bg-promptfighter-neon/20 text-promptfighter-neon">
                      {avatar.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
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
