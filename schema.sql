
-- Schéma de base de données pour l'application Prompt Fighter

-- Table des profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table profiles
CREATE POLICY "Les profils sont visibles par tous les utilisateurs authentifiés"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Table pour les salles de jeu
CREATE TABLE game_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('solo', 'duel', 'team')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'voting', 'results', 'closed')),
  target_image_url TEXT,
  join_code TEXT NOT NULL UNIQUE,
  max_players INT NOT NULL DEFAULT 8
);

-- Activer RLS pour game_rooms
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Politiques pour game_rooms
CREATE POLICY "Les salles de jeu sont visibles par tous les utilisateurs authentifiés"
  ON game_rooms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Seuls les propriétaires peuvent modifier leurs salles"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Tous les utilisateurs authentifiés peuvent créer des salles"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Table pour les joueurs dans les salles
CREATE TABLE game_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

-- Activer RLS pour game_players
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Politiques pour game_players
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir qui est dans les salles"
  ON game_players FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent rejoindre n'importe quelle salle"
  ON game_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent quitter une salle"
  ON game_players FOR DELETE
  USING (auth.uid() = user_id);

-- Table pour les soumissions des joueurs
CREATE TABLE game_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  accuracy_score NUMERIC(5,2) DEFAULT 0,
  votes_received INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour game_submissions
ALTER TABLE game_submissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour game_submissions
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les soumissions"
  ON game_submissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres soumissions"
  ON game_submissions FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Table pour les votes
CREATE TABLE game_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES profiles(id) NOT NULL,
  submission_id UUID REFERENCES game_submissions(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (room_id, voter_id)
);

-- Activer RLS pour game_votes
ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

-- Politiques pour game_votes
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les votes"
  ON game_votes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres votes"
  ON game_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- Table pour les scores globaux des joueurs
CREATE TABLE player_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id UUID REFERENCES profiles(id) NOT NULL,
  total_games INT DEFAULT 0,
  games_won INT DEFAULT 0,
  total_accuracy_score NUMERIC(10,2) DEFAULT 0,
  avg_accuracy_score NUMERIC(5,2) DEFAULT 0,
  total_votes_received INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour player_scores
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;

-- Politiques pour player_scores
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les scores"
  ON player_scores FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fonction pour mettre à jour les scores lors d'une nouvelle soumission
CREATE OR REPLACE FUNCTION update_player_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour ou insérer dans player_scores
  INSERT INTO player_scores (player_id, total_games, total_accuracy_score)
  VALUES (NEW.player_id, 1, NEW.accuracy_score)
  ON CONFLICT (player_id)
  DO UPDATE SET
    total_games = player_scores.total_games + 1,
    total_accuracy_score = player_scores.total_accuracy_score + NEW.accuracy_score,
    avg_accuracy_score = (player_scores.total_accuracy_score + NEW.accuracy_score) / (player_scores.total_games + 1),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour les scores
CREATE TRIGGER update_score_on_submission
AFTER INSERT ON game_submissions
FOR EACH ROW
EXECUTE FUNCTION update_player_score();

-- Fonction pour mettre à jour les votes reçus
CREATE OR REPLACE FUNCTION update_submission_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le nombre de votes pour la soumission
  UPDATE game_submissions
  SET votes_received = votes_received + 1
  WHERE id = NEW.submission_id;
  
  -- Mettre à jour les votes totaux reçus par le joueur
  UPDATE player_scores
  SET 
    total_votes_received = total_votes_received + 1,
    updated_at = NOW()
  FROM game_submissions
  WHERE player_scores.player_id = game_submissions.player_id
    AND game_submissions.id = NEW.submission_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour les votes
CREATE TRIGGER update_votes_on_vote
AFTER INSERT ON game_votes
FOR EACH ROW
EXECUTE FUNCTION update_submission_votes();
