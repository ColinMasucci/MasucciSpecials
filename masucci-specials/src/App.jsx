import { useEffect, useState } from "react";
import { redirectToAuthCodeFlow, getAccessToken } from "./auth";
import { getUserPlaylists, getPlaylistTracks, searchRandomTrack } from "./api";
import { createSpotifyPlayer, playTrack } from "./player";

function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState("random");
  const [currentTrack, setCurrentTrack] = useState(null); // holds track info
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0); // current position in ms

  // --- Auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    async function fetchToken() {
      const { access_token } = await getAccessToken(code);
      setToken(access_token);
      localStorage.setItem("access_token", access_token);
    }

    fetchToken();
  }, []);

  // --- Fetch profile & playlists
  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      const profileData = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json());
      setProfile(profileData);

      const userPlaylists = await getUserPlaylists(token);
      setPlaylists(userPlaylists);
    }

    fetchData();
  }, [token]);

  // --- Setup Spotify Player
  // useEffect(() => {
  //   if (!token) return;
  //   createSpotifyPlayer(token, setDeviceId);
  // }, [token]);
  useEffect(() => {
    if (!token) return;

    let interval;

    createSpotifyPlayer(token, (id) => {
      setDeviceId(id);

      // subscribe to state changes
      interval = setInterval(async () => {
        const state = await fetch(`https://api.spotify.com/v1/me/player`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json());

        if (state?.item) {
          setCurrentTrack(state.item);
          setIsPlaying(state.is_playing);
          setProgressMs(state.progress_ms);
        }
      }, 1000); // update every second
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);


  // --- Play random track handler
  const handlePlay = async () => {
    if (!deviceId) {
      alert("Player not ready yet!");
      return;
    }

    let track;
    if (selectedPlaylist === "random") {
      track = await searchRandomTrack(token);
    } else {
      const tracks = await getPlaylistTracks(token, selectedPlaylist);
      track = tracks[Math.floor(Math.random() * tracks.length)];
    }

    if (track?.uri) {
      await playTrack(token, deviceId, track.uri);
      alert(`Now playing: ${track.name} by ${track.artists.map(a => a.name).join(", ")}`);
    }
  };


  return (
    <div className="bg-blue-900 flex h-screen overflow-hidden">
      {/*Side Profile*/}
      <div className="bg-blue-950 w-64 p-7">
        {token ? (
          <div>
            <h1 className="text-2xl font-bold text-white flex-col pb-5">Welcome, {profile?.display_name}</h1>
            <img className="rounded-full" src={profile?.images?.[0]?.url} alt="profile" width={100} />
            <p className="text-white">Email: {profile?.email}</p>
          </div>
        ):(
          <div className="flex h-screen flex-col">
            <h1 className="text-2xl font-bold text-white pb-5">No Profile Found</h1>
            <button
              onClick={redirectToAuthCodeFlow}
              className="bg-green-500 text-white px-6 py-3 rounded-lg"
            >
              Login with Spotify
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-start flex-1 p-7">
        <h1 className="font-bold text-white text-center pb-5">🎵The Masucci Heardle Special🎵</h1>
        {token ? (
          <div className="flex flex-col gap-3">
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="p-2 rounded"
            >
              <option value="random">Random Spotify Track</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={handlePlay}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Play Random Song
            </button>


            {currentTrack && (
              <div className="absolute bottom-0 left-0 right-0 bg-gray-900 p-4 flex items-center gap-4 shadow-lg">
                
                {/* Song / Artist info */}
                <div className="flex flex-col text-white flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{currentTrack.name}</span>
                    <img src={currentTrack.album.images[2]?.url} alt="song" className="w-6 h-6 rounded" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{currentTrack.artists.map(a => a.name).join(", ")}</span>
                    <img src={currentTrack.album.images[2]?.url} alt="artist" className="w-4 h-4 rounded-full" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col items-center w-1/2">
                  <div className="w-full h-1 bg-gray-700 rounded">
                    <div
                      className="h-1 bg-green-500 rounded"
                      style={{ width: `${(progressMs / currentTrack.duration_ms) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 mt-1">
                    {Math.floor(progressMs / 60000)}:{String(Math.floor((progressMs / 1000) % 60)).padStart(2, "0")}
                  </span>
                </div>

                {/* Play / Pause button */}
                <button
                  onClick={async () => {
                    const method = isPlaying ? "pause" : "play";
                    await fetch(`https://api.spotify.com/v1/me/player/${method}?device_id=${deviceId}`, {
                      method: "PUT",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    setIsPlaying(!isPlaying);
                  }}
                  className="text-white text-2xl"
                >
                  {isPlaying ? "⏸" : "▶️"}
                </button>

              </div>
            )}

          </div>
        ):(
          <div>
            <p className="text-white text-center">Login to your Spotify Account in order to use Application</p>
          </div>
        )}


      </div>
      
    </div>
  );
}

export default App;
