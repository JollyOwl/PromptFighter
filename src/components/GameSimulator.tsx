
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Timer, Check, Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateAIImage } from "@/services/gameService";
import { useAuth } from "@/hooks/useAuth";

interface GameSimulatorProps {
  onExit: () => void;
  gameMode: string;
  difficulty: string;
  targetImage?: string;
}

// Temps de jeu selon la difficulté (en secondes)
const difficultyTimes = {
  easy: 180,
  medium: 120,
  hard: 60
};

const GameSimulator = ({ onExit, gameMode, difficulty, targetImage }: GameSimulatorProps) => {
  const { user } = useAuth();
  const [gamePhase, setGamePhase] = useState<"playing" | "voting" | "results">("playing");
  const [timeLeft, setTimeLeft] = useState(difficultyTimes[difficulty as keyof typeof difficultyTimes] || 180);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [accuracyScore, setAccuracyScore] = useState(0);
  
  // Use the provided target image or fallback to placeholder
  const targetImageUrl = targetImage || "/placeholder.svg";
  
  // Debug the target image
  useEffect(() => {
    console.log("Target image URL:", targetImage);
  }, [targetImage]);

  // Compter à rebours
  useEffect(() => {
    if (gamePhase !== "playing") return;
    
    if (timeLeft <= 0) {
      setGamePhase("voting");
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, gamePhase]);
  
  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Generate image using our edge function
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez saisir un prompt");
      return;
    }
    
    setLoading(true);
    
    try {
      const imageUrl = await generateAIImage(prompt);
      
      if (imageUrl) {
        const updatedImages = [...generatedImages, imageUrl];
        setGeneratedImages(updatedImages);
        
        // Simuler un score d'accuracy
        const randomScore = Math.floor(Math.random() * 70) + 30; // Entre 30 et 100
        setAccuracyScore(randomScore);
        
        // Sélectionner automatiquement la première image générée si aucune n'est déjà sélectionnée
        if (!selectedImage) {
          setSelectedImage(imageUrl);
        }
        
        toast.success("Image générée avec succès!");
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Erreur lors de la génération de l'image");
    } finally {
      setLoading(false);
    }
  };
  
  // Simuler le passage à la phase de résultats
  const showResults = () => {
    setGamePhase("results");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onExit}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quitter la partie
        </Button>
        
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-promptfighter-pink" />
          <span className={`font-mono text-xl font-bold ${
            timeLeft < 10 ? "text-red-400 animate-pulse" : "text-white"
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {gamePhase === "playing" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Image modèle</h2>
            <Card className="overflow-hidden bg-white/10 border-white/10">
              <div className="aspect-square bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                {targetImageUrl ? (
                  <img 
                    src={targetImageUrl} 
                    alt="Target" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Image failed to load:", targetImageUrl);
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    No target image available
                  </div>
                )}
              </div>
            </Card>
            
            <div className="mt-4">
              <h3 className="text-lg font-bold text-white mb-2">
                {gameMode === "solo" ? "Votre score" : "Classement actuel"}
              </h3>
              
              {gameMode === "solo" ? (
                <div className="bg-white/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Accuracy</span>
                    <span className="text-white font-bold">{accuracyScore}%</span>
                  </div>
                  <Progress value={accuracyScore} className="h-2 bg-white/20" />
                </div>
              ) : (
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-white text-sm">
                    Les scores seront disponibles à la fin de la partie
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Générer une image</h2>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Décrivez l'image que vous souhaitez générer..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-24 bg-white/30 border-white/20 text-white placeholder:text-white/60"
              />
              
              <Button 
                onClick={handleGenerateImage}
                disabled={loading || !prompt.trim()}
                className="w-full bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  "Générer une image"
                )}
              </Button>
            </div>
            
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Images générées</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                        selectedImage === image 
                          ? "border-promptfighter-pink" 
                          : "border-transparent hover:border-white/50"
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img src={image} alt={`Generated ${index}`} className="w-full h-full object-cover" />
                      
                      {selectedImage === image && (
                        <div className="absolute top-2 right-2 bg-promptfighter-pink rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">
                    {selectedImage ? `Image ${generatedImages.indexOf(selectedImage) + 1} sélectionnée` : "Aucune image sélectionnée"}
                  </span>
                  <span className="text-white font-bold">
                    Accuracy: {accuracyScore}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {gamePhase === "voting" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Temps écoulé ! Votez pour la meilleure image
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/10 border-white/10">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-3">Image modèle</h3>
                <div className="aspect-square bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                  {targetImageUrl ? (
                    <img 
                      src={targetImageUrl} 
                      alt="Target" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/50">
                      No target image available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/10">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-3">Votre image</h3>
                <div className="aspect-square flex items-center justify-center bg-white/5">
                  <img src={selectedImage || "/placeholder.svg"} alt="Your submission" className="object-contain max-h-full" />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-white/70">Prompt: {prompt.slice(0, 30)}...</span>
                  <span className="text-white font-bold">Score: {accuracyScore}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {gameMode !== "solo" ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white text-center">
                Images des autres joueurs
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Simuler d'autres joueurs */}
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-white/10 border-white/10 overflow-hidden">
                    <div className="aspect-square">
                      <img src="/placeholder.svg" alt={`Player ${i}`} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Joueur {i}</span>
                        <Button 
                          size="sm" 
                          className="bg-promptfighter-pink hover:bg-promptfighter-pink/80 text-white"
                        >
                          Voter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
          
          <div className="flex justify-center pt-4">
            <Button 
              size="lg"
              onClick={showResults}
              className="bg-promptfighter-cyan hover:bg-promptfighter-cyan/90 text-promptfighter-navy font-bold px-8 py-6 text-lg"
            >
              Voir les résultats
            </Button>
          </div>
        </div>
      )}
      
      {gamePhase === "results" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Résultats de la partie
          </h2>
          
          <Card className="bg-white/10 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <Trophy className="h-12 w-12 text-yellow-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {gameMode === "solo" ? "Votre score" : "Gagnant: Vous"}
                  </h3>
                  <p className="text-white/70">
                    Score d'accuracy: {accuracyScore}%
                  </p>
                  {gameMode !== "solo" && (
                    <p className="text-white/70">
                      Votes reçus: 2/3
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Image modèle</h4>
                  <div className="aspect-square bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                    {targetImageUrl ? (
                      <img 
                        src={targetImageUrl} 
                        alt="Target" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/50">
                        No target image available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Votre image</h4>
                  <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                    <img src={selectedImage || "/placeholder.svg"} alt="Your submission" className="object-contain max-h-full" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <h4 className="text-md font-bold text-white">Votre prompt:</h4>
                <p className="text-white/70 mt-1">{prompt || "Aucun prompt saisi"}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center space-x-4 pt-4">
            <Button 
              variant="outline"
              onClick={onExit}
              className="bg-white/20 border-white/20 text-white hover:bg-white/30"
            >
              Retour au lobby
            </Button>
            
            <Button 
              className="bg-promptfighter-pink hover:bg-promptfighter-pink/80 text-white"
            >
              Rejoindre une nouvelle partie
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSimulator;
