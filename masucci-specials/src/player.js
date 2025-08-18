
export function loadSpotifySDK() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve(window.Spotify);
    };
  });
}


export async function createSpotifyPlayer(token, onReady) {
  const Spotify = await loadSpotifySDK();

  const player = new Spotify.Player({
    name: "Masucci Heardle Player",
    getOAuthToken: cb => { cb(token); },
    volume: 0.8
  });

  player.addListener("ready", ({ device_id }) => {
    console.log("Ready with Device ID", device_id);
    onReady(device_id);
  });

  player.addListener("not_ready", ({ device_id }) => {
    console.log("Device ID has gone offline", device_id);
  });

  player.connect();
  return player;
}

// Start playback on a device
export async function playTrack(token, device_id, trackUri) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [trackUri] }),
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
}
