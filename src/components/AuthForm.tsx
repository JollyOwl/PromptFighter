
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dans une implémentation réelle, nous appellerions Supabase Auth ici
    console.log("Connexion avec:", { email, password, username, selectedAvatar });
    
    // Simulons une connexion réussie
    onLogin();
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
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-promptfighter-pink hover:bg-promptfighter-pink/80 text-white"
          >
            Se connecter
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
          >
            S'inscrire
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
