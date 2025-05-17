
import { Button } from "@/components/ui/button";
import AuthForm from "@/components/AuthForm";
import GameLobby from "@/components/GameLobby";
import GameRules from "@/components/GameRules";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const { user, loading } = useAuth();
  const [showRules, setShowRules] = useState(false);
  const { setCurrentPlayer } = useGameStore();

  // Set current player in game store when user logs in
  useEffect(() => {
    if (user) {
      setCurrentPlayer({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      });
    } else {
      setCurrentPlayer(null);
    }
  }, [user, setCurrentPlayer]);

  // Initialize user profile in Supabase if needed
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (!user) return;
      
      try {
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        // If profile doesn't exist, create it
        if (!data) {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.username || user.email?.split('@')[0] || 'User',
              avatar_url: user.avatar_url || '/placeholder.svg',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error("Error checking/creating profile:", error);
      }
    };
    
    createProfileIfNeeded();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-promptfighter-black grid-bg">
        <div className="text-promptfighter-neon text-2xl retro-text animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Scanlines effect for retro look */}
      <div className="scanline"></div>
      
      <Navbar />
      
      <div className="flex flex-col items-center justify-center z-10 p-4 w-full max-w-5xl mt-16">
        {/* Main content - auth or lobby */}
        <Card className="w-full max-w-4xl bg-black/30 backdrop-blur-lg border-promptfighter-neon/20 shadow-xl neon-border">
          <CardContent className="p-6">
            {!user ? (
              <AuthForm onLogin={() => {}} />
            ) : showRules ? (
              <GameRules onBack={() => setShowRules(false)} />
            ) : (
              <GameLobby onShowRules={() => setShowRules(true)} />
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-promptfighter-neon/60 text-sm text-center">
          © {new Date().getFullYear()} Prompt Fighter - Un projet interne
        </div>
      </div>
    </div>
  );
};

export default Index;
