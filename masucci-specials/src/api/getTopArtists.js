// src/services/spotify.js
export async function getTopArtists(accessToken) {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/top/artists?limit=5", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Spotify API error: ${res.status}`);
    }

    const data = await res.json();
    console.log("Top Artists:", data.items);
    return data.items; // Array of artist objects
  } catch (error) {
    console.error("Failed to fetch top artists:", error);
    return [];
  }
}
