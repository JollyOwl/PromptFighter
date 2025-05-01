
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Users, Copy, ArrowRight } from "lucide-react";
import { useGameStore } from "@/store/gameStore";

interface GameRoomCreationProps {
  onCreateRoom: (roomName: string, maxPlayers: number) => void;
  onJoinRoom: (joinCode: string) => void;
  onCancel: () => void;
}

const GameRoomCreation = ({ onCreateRoom, onJoinRoom, onCancel }: GameRoomCreationProps) => {
  const [roomName, setRoomName] = useState("");
  const [formMode, setFormMode] = useState<"create" | "join">("create");
  const [maxPlayers, setMaxPlayers] = useState<string>("8");
  const { 
    selectedGameMode,
    setSelectedGameMode,
    selectedDifficulty,
    setSelectedDifficulty,
    joinCode,
    setJoinCode
  } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === "create") {
      if (!roomName.trim()) {
        toast.error("Veuillez saisir un nom de salle");
        return;
      }
      onCreateRoom(roomName, parseInt(maxPlayers));
    } else {
      if (!joinCode.trim()) {
        toast.error("Veuillez saisir un code de salle");
        return;
      }
      onJoinRoom(joinCode);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        {formMode === "create" ? "Créer une nouvelle salle" : "Rejoindre une salle"}
      </h2>
      
      <div className="flex space-x-4 mb-6">
        <Button
          variant={formMode === "create" ? "default" : "outline"}
          onClick={() => setFormMode("create")}
          className={formMode === "create" ? "bg-promptfighter-pink text-white" : "bg-white/20 text-white"}
        >
          Créer une salle
        </Button>
        <Button
          variant={formMode === "join" ? "default" : "outline"}
          onClick={() => setFormMode("join")}
          className={formMode === "join" ? "bg-promptfighter-pink text-white" : "bg-white/20 text-white"}
        >
          Rejoindre avec un code
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formMode === "create" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="room-name" className="text-white">Nom de la salle</Label>
              <Input
                id="room-name"
                placeholder="Entrez un nom pour votre salle..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            
            <Card className="bg-white/20 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Paramètres de la partie</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-mode" className="text-white">Mode de jeu</Label>
                    <RadioGroup 
                      value={selectedGameMode} 
                      onValueChange={(value) => setSelectedGameMode(value as any)}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-2 p-3 rounded-md bg-white/10">
                        <RadioGroupItem value="duel" id="duel" className="mt-1" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="duel" className="font-medium text-white">Duel</Label>
                          <p className="text-sm text-white/70">
                            Affrontez un autre joueur en face à face
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2 p-3 rounded-md bg-white/10">
                        <RadioGroupItem value="team" id="team" className="mt-1" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="team" className="font-medium text-white">Équipe</Label>
                          <p className="text-sm text-white/70">
                            Rejoignez une équipe et affrontez d'autres groupes
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-white">Difficulté</Label>
                    <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as any)}>
                      <SelectTrigger id="difficulty" className="bg-white/30 border-white/20 text-white">
                        <SelectValue placeholder="Sélectionnez la difficulté" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Facile</SelectItem>
                        <SelectItem value="medium">Intermédiaire</SelectItem>
                        <SelectItem value="hard">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Nombre de joueurs max</Label>
                    <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                      <SelectTrigger className="bg-white/30 border-white/20 text-white">
                        <SelectValue placeholder="Nombre de joueurs max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 joueurs</SelectItem>
                        <SelectItem value="4">4 joueurs</SelectItem>
                        <SelectItem value="6">6 joueurs</SelectItem>
                        <SelectItem value="8">8 joueurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="join-code" className="text-white">Code de la salle</Label>
            <Input
              id="join-code"
              placeholder="Entrez le code de la salle..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="bg-white/30 border-white/20 text-white placeholder:text-white/60"
            />
            <p className="text-sm text-white/70">
              Demandez le code à la personne qui a créé la salle.
            </p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            type="button"
            className="bg-white/20 border-white/20 text-white hover:bg-white/30"
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold"
          >
            {formMode === "create" ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Créer la salle
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Rejoindre
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GameRoomCreation;
