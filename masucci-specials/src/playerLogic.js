import { supabase } from './supabaseClient';

export async function joinGame(gameId, playerName) {
  const { data, error } = await supabase
    .from('players')
    .insert([{ game_id: gameId, name: playerName }])
    .select()
    .single();

  if (error) throw error;
  return data; // contains player id
}

export function subscribeToSong(gameId, callback) {
  return supabase
    .channel('game-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        const songName = payload.new.current_song_name;
        const songArtist = payload.new.current_song_artist;
        callback(songName, songArtist);
      }
    )
    .subscribe();
}

export async function submitGuess(playerId, gameId, guess) {
  const { data, error } = await supabase
    .from('guesses')
    .insert([{ player_id: playerId, game_id: gameId, guess }]);

  if (error) throw error;
  return data;
}