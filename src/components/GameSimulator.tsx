import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Timer, Check, Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateAIImage, getRandomTargetImage } from "@/services/gameService";
import { useAuth } from "@/hooks/useAuth";
import { Difficulty, GamePhase, GameRoom, Player, Point, TargetImage } from "@/types/game";
import { useGameStore } from '@/store/gameStore';

interface GameSimulatorProps {
  room: GameRoom;
  currentPlayer: Player;
  onGamePhaseChange: (phase: GamePhase) => void;
  onGameEnd: (results: { winner: Player; score: number }) => void;
}

// Temps de jeu selon la difficulté (en secondes)
const difficultyTimes = {
  easy: 180,
  medium: 120,
  hard: 60
};

export function GameSimulator({ room, currentPlayer, onGamePhaseChange, onGameEnd }: GameSimulatorProps) {
  const { user } = useAuth();
  const { currentTargetImage, setCurrentTargetImage, targetImage, setTargetImage } = useGameStore();
  const [gamePhase, setGamePhase] = useState<"playing" | "voting" | "results">("playing");
  const [timeLeft, setTimeLeft] = useState(room?.difficulty === "easy" ? 120 : room?.difficulty === "medium" ? 180 : 240);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [accuracyScore, setAccuracyScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  
  // Reset target image when component unmounts
  useEffect(() => {
    return () => {
      setCurrentTargetImage(null);
      setTargetImage(null);
    };
  }, [setCurrentTargetImage, setTargetImage]);

  // Fetch target image when component mounts or room difficulty changes
  useEffect(() => {
    const fetchTargetImage = async () => {
      if (!currentTargetImage && room?.difficulty) {
        setIsLoading(true);
        setError(null);
        try {
          const image = await getRandomTargetImage(room.difficulty);
          setCurrentTargetImage(image);
          setTargetImage(image);
        } catch (err) {
          console.error('Error fetching target image:', err);
          setError('Failed to load target image. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTargetImage();
  }, [room?.difficulty, currentTargetImage, setCurrentTargetImage, setTargetImage]);

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
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPoint({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setLastPoint({ x, y });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => onGamePhaseChange("waiting")}
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
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading game...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-2xl aspect-square bg-white rounded-lg shadow-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                {currentTargetImage && (
                  <img
                    src={currentTargetImage.url}
                    alt="Target image"
                    className="absolute inset-0 w-full h-full object-contain opacity-50 pointer-events-none"
                  />
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleUndo}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Undo
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="w-full max-w-2xl space-y-4">
                <Textarea
                  placeholder="Décrivez l'image que vous souhaitez générer..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                
                <div className="flex justify-between items-center">
                  <Progress value={(timeLeft / (difficultyTimes[room?.difficulty as keyof typeof difficultyTimes] || 180)) * 100} className="flex-1 mr-4" />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={loading || !prompt.trim()}
                    className="bg-promptfighter-pink hover:bg-promptfighter-pink/80 text-white"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Générer
                      </>
                    )}
                  </Button>
                </div>

                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                          selectedImage === imageUrl
                            ? "border-promptfighter-pink"
                            : "border-transparent"
                        }`}
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === imageUrl && (
                          <div className="absolute inset-0 bg-promptfighter-pink/20 flex items-center justify-center">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
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
                  {currentTargetImage ? (
                    <img 
                      src={currentTargetImage.url} 
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
          
          {room.players.length > 1 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white text-center">
                Images des autres joueurs
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.players.map((player) => (
                  <Card key={player.id} className="bg-white/10 border-white/10 overflow-hidden">
                    <div className="aspect-square">
                      <img src="/placeholder.svg" alt={`Player ${player.id}`} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">Joueur {player.id}</span>
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
                    {room.players.length > 1 ? "Gagnant: Vous" : "Votre score"}
                  </h3>
                  <p className="text-white/70">
                    Score d'accuracy: {accuracyScore}%
                  </p>
                  {room.players.length > 1 && (
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
                    {currentTargetImage ? (
                      <img 
                        src={currentTargetImage.url} 
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
              onClick={() => onGamePhaseChange("waiting")}
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
}

export default GameSimulator;
