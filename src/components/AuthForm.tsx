
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signIn, signUp } from "@/lib/auth";
import { useGameStore } from "@/store/gameStore";
import { toast } from "sonner";

// Avatars pré-générés (dans une implémentation complète, ils seraient stockés en BDD)
const avatars = [
  { id: 1, url: "/placeholder.svg", name: "Avatar 1" },
  { id: 2, url: "/placeholder.svg", name: "Avatar 2" },
  { id: 3, url: "/placeholder.svg", name: "Avatar 3" },
  { id: 4, url: "/placeholder.svg", name: "Avatar 4" },
];

interface AuthFormProps {
  onLogin: () => void;
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { setCurrentPlayer } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Dans une implémentation réelle, nous utiliserions Supabase Auth
        // await signIn({ email, password });
        
        // Pour la démo, nous simulons une connexion réussie
        console.log("Connexion avec:", { email, password });
        
        // Simuler un utilisateur connecté
        setCurrentPlayer({
          id: "user-1",
          username: email.split('@')[0],
          avatar_url: "/placeholder.svg"
        });
      } else {
        // Dans une implémentation réelle, nous utiliserions Supabase Auth
        // await signUp({ email, password, username, avatar_id: selectedAvatar });
        
        // Pour la démo, nous simulons une inscription réussie
        console.log("Inscription avec:", { email, password, username, selectedAvatar });
        
        // Simuler un utilisateur connecté
        setCurrentPlayer({
          id: "user-1",
          username: username,
          avatar_url: "/placeholder.svg"
        });
      }
      
      // Simuler un délai pour l'authentification
      setTimeout(() => {
        toast.success(isLogin ? "Connexion réussie !" : "Inscription réussie !");
        onLogin();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger 
          value="login" 
          onClick={() => setIsLogin(true)}
          className="text-lg"
        >
          Connexion
        </TabsTrigger>
        <TabsTrigger 
          value="register" 
          onClick={() => setIsLogin(false)}
          className="text-lg"
        >
          Inscription
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-promptfighter-pink hover:bg-promptfighter-pink/80 text-white"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-white">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Pseudo</Label>
            <Input
              id="username"
              type="text"
              placeholder="Votre pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-white">Mot de passe</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Choisissez un avatar</Label>
            <div className="grid grid-cols-4 gap-4 mt-2">
              {avatars.map((avatar) => (
                <Avatar 
                  key={avatar.id}
                  className={`w-16 h-16 cursor-pointer transition-all ${
                    selectedAvatar === avatar.id 
                      ? "ring-4 ring-promptfighter-cyan" 
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                >
                  <AvatarImage src={avatar.url} alt={avatar.name} />
                  <AvatarFallback className="bg-promptfighter-lavender">
                    {avatar.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-promptfighter-cyan hover:bg-promptfighter-cyan/80 text-promptfighter-navy font-bold"
            disabled={loading}
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
