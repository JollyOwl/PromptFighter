import { Button } from "@/components/ui/button";
import AuthForm from "@/components/AuthForm";
import GameLobby from "@/components/GameLobby";
import GameRules from "@/components/GameRules";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import Navbar from "@/components/Navbar";

const Index = () => {
  const { user, loading } = useAuth();
  const [showRules, setShowRules] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-game">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-game">
      <Navbar />
      <div className="flex flex-col items-center justify-center z-10 p-4 w-full max-w-5xl">

        {/* Contenu principal - soit auth, soit lobby */}
        <Card className="w-full max-w-4xl bg-white/20 backdrop-blur-lg border-white/20 shadow-xl">
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
        <div className="mt-8 text-white/60 text-sm text-center">
          © {new Date().getFullYear()} Prompt Fighter - Un projet interne
        </div>
      </div>
    </div>
  );
};

export default Index;
