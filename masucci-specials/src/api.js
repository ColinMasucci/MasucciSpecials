
export async function spotifyFetch(token, endpoint) {
  const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

// Get all user playlists
export async function getUserPlaylists(token) {
  const data = await spotifyFetch(token, "me/playlists?limit=50");
  return data.items; // array of playlists
}

// Get tracks from a playlist
export async function getPlaylistTracks(token, playlistId) {
  const data = await spotifyFetch(token, `playlists/${playlistId}/tracks?limit=100`);
  return data.items.map((item) => item.track);
}

// Search tracks randomly across Spotify
export async function searchRandomTrack(token) {
  // Spotify requires a search term, so pick a random letter
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const data = await spotifyFetch(token, `search?q=${randomLetter}&type=track&limit=50`);
  const tracks = data.tracks.items;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export async function fetchSpotifySuggestions(query, token) {
  if (!query) return [];

  const result = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=US`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await result.json();
  const tracks = data.tracks?.items || [];

  // Format: "Song - Artist"
  const suggestions = tracks.map(t => ({
    display: `${t.name} – ${t.artists.map(a => a.name).join(", ")}`,
    type: "track",
    uri: t.uri,
    id: t.id, // keep ID if you want to check guesses later
  }));

  return suggestions;
}

