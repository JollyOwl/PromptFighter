
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/store/gameStore";

const Navbar = () => {
  const { user } = useAuth();
  const { setCurrentPlayer } = useGameStore();

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentPlayer(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
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
                <span className="text-white/80 font-medium">
                  {user.username}
                </span>
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
  );
};

export default Navbar;
