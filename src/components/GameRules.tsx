
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, Clock, Award, Target } from "lucide-react";

interface GameRulesProps {
  onBack: () => void;
}

const GameRules = ({ onBack }: GameRulesProps) => {
  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4 text-white hover:bg-white/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <h2 className="text-3xl font-bold text-white">Règles du jeu</h2>
      
      <div className="space-y-8 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-promptfighter-pink/20 p-3 rounded-full">
            <Lightbulb className="h-6 w-6 text-promptfighter-pink" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Concept</h3>
            <p className="text-white/80">
              Une image modèle est présentée à tous les joueurs. Chaque joueur doit créer un prompt qui générera une image 
              aussi proche que possible de cette image modèle. Le joueur dont l'image générée ressemble le plus à l'image 
              modèle gagne la partie.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-promptfighter-cyan/20 p-3 rounded-full">
            <Clock className="h-6 w-6 text-promptfighter-cyan" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Déroulement</h3>
            <p className="text-white/80">
              1. Une image modèle est affichée à tous les joueurs.<br />
              2. Un chronomètre de 2 minutes est lancé.<br />
              3. Les joueurs écrivent un prompt pour générer une image similaire.<br />
              4. Les joueurs peuvent générer plusieurs images et sélectionner la meilleure.<br />
              5. À la fin du chronomètre, toutes les images sont affichées.<br />
              6. Les joueurs votent pour l'image qu'ils trouvent la plus proche (sauf la leur).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-promptfighter-lavender/30 p-3 rounded-full">
            <Target className="h-6 w-6 text-promptfighter-lavender" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Modes de jeu</h3>
            <p className="text-white/80">
              <strong>Solo:</strong> Entraînez-vous avec un score d'accuracy objectif.<br />
              <strong>Duel:</strong> Affrontez un autre joueur en face à face.<br />
              <strong>Équipe:</strong> Rejoignez une équipe et affrontez d'autres groupes.
            </p>
            <p className="mt-2 text-white/80">
              <strong>Difficulté:</strong><br />
              <strong>Facile:</strong> Images simples, 3 minutes de temps.<br />
              <strong>Intermédiaire:</strong> Images modérément complexes, 2 minutes.<br />
              <strong>Difficile:</strong> Images complexes, 1 minute seulement.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-promptfighter-navy/40 p-3 rounded-full">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Scores</h3>
            <p className="text-white/80">
              <strong>Score objectif:</strong> Pourcentage de similarité calculé entre l'image générée et l'image modèle.<br />
              <strong>Score des votes:</strong> Nombre de votes reçus par les autres joueurs.<br />
              <strong>Classement:</strong> Combinaison du score objectif et des votes reçus au fil des parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRules;
