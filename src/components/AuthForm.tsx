
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp } from "@/lib/auth";
import { useGameStore } from "@/store/gameStore";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { getAvatarFromUsername } from "@/utils/avatarUtils";

interface AuthFormProps {
  onLogin: () => void;
}

const AuthForm = ({ onLogin }: AuthFormProps) => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setCurrentPlayer } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const user = await signIn({
          email: emailOrUsername, // For now, only email login works
          password
        });
        if (user) {
          const displayUsername = emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername;
          setCurrentPlayer({
            id: user.id,
            username: displayUsername,
            avatar_url: getAvatarFromUsername(displayUsername)
          });
          onLogin();
        }
      } else {
        const avatarUrl = getAvatarFromUsername(username);
        
        const result = await signUp({
          email: emailOrUsername,
          password,
          username,
          avatar_id: 1 // No longer used but keeping for compatibility
        });
        if (result.user) {
          setCurrentPlayer({
            id: result.user.id,
            username: username,
            avatar_url: avatarUrl
          });
          onLogin();
        }
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Tabs defaultValue="login" className="w-full" onValueChange={value => setIsLogin(value === "login")}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login" className="text-lg">
          Connexion
        </TabsTrigger>
        <TabsTrigger value="register" className="text-lg">
          Inscription
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-white">Email</Label>
            <Input 
              id="emailOrUsername" 
              type="email" 
              placeholder="vous@exemple.com" 
              value={emailOrUsername} 
              onChange={e => setEmailOrUsername(e.target.value)} 
              required 
              disabled={loading} 
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60" 
            />
            <p className="text-xs text-white/60">
              Veuillez utiliser votre adresse email pour vous connecter
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Mot de passe</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading} 
                className="bg-white/30 border-white/20 text-white placeholder:text-white/60 pr-10" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-white/60" /> : <Eye className="h-4 w-4 text-white/60" />}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-lime-400 hover:bg-lime-300 text-center text-neutral-950"
          >
            {loading ? "Connexion en cours..." : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </>
            )}
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
              value={emailOrUsername} 
              onChange={e => setEmailOrUsername(e.target.value)} 
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
              onChange={e => setUsername(e.target.value)} 
              required 
              disabled={loading} 
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-white">Mot de passe</Label>
            <div className="relative">
              <Input 
                id="register-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading} 
                className="bg-white/30 border-white/20 text-white placeholder:text-white/60 pr-10" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-white/60" /> : <Eye className="h-4 w-4 text-white/60" />}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full text-promptfighter-navy font-bold bg-lime-400 hover:bg-lime-300"
          >
            {loading ? "Inscription en cours..." : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                S'inscrire
              </>
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
