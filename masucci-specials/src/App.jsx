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
  useEffect(() => {
    if (!token) return;
    createSpotifyPlayer(token, setDeviceId);
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
            <p className="text-white">Email: {profile?.email}</p>
            <img className="rounded-full" src={profile?.images?.[0]?.url} alt="profile" width={100} />
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
