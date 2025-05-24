import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/store/gameStore";
import { useState, useEffect } from "react";
import UserProfile from "./UserProfile";

const Navbar = () => {
  const { user } = useAuth();
  const { setCurrentPlayer } = useGameStore();
  const [showProfile, setShowProfile] = useState(false);

  // Close profile modal when user changes (login/logout)
  useEffect(() => {
    setShowProfile(false);
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentPlayer(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-promptfighter-neon/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NavigationMenu className="h-16">
            <NavigationMenuList className="justify-between w-full">
              <NavigationMenuItem>
                <NavigationMenuLink 
                  className="text-2xl font-bold text-promptfighter-neon hover:text-promptfighter-neon/90 retro-text animate-neon-pulse"
                  href="/"
                >
                  Prompt Fighter
                </NavigationMenuLink>
              </NavigationMenuItem>

              {user && (
                <NavigationMenuItem className="flex items-center space-x-4">
                  {/* User Profile Section */}
                  <div className="flex items-center space-x-3 bg-white/5 rounded-lg px-3 py-2 border border-promptfighter-neon/30">
                    <Avatar 
                      className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-promptfighter-neon/50 transition-all"
                      onClick={() => setShowProfile(true)}
                    >
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback className="bg-promptfighter-neon/20 text-promptfighter-neon text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setShowProfile(true)}
                      className="text-white/90 hover:text-promptfighter-neon hover:bg-transparent p-0 h-auto font-medium"
                    >
                      {user.username}
                    </Button>
                  </div>

                  {/* Logout Button */}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-promptfighter-neon border-promptfighter-neon/50 hover:bg-promptfighter-neon/20 hover:border-promptfighter-neon"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
};

export default Navbar;
