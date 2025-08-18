import { useEffect, useState } from "react";
import { redirectToAuthCodeFlow, getAccessToken } from "./auth";
import { getUserPlaylists, getPlaylistTracks, searchRandomTrack } from "./api";
import { createSpotifyPlayer, playTrack } from "./audioplayer.js";
import { FaPlay, FaPause } from "react-icons/fa";
import { supabase } from './supabaseClient';

export async function createGame(hostId, token) {
  // 1. Insert new game
  const { data, error } = await supabase
    .from('games')
    .insert([{ host_id: hostId, current_song: null }])
    .select()
    .single();

  if (error) throw error;

  const gameId = data.id;

  // 2. Insert Spotify token for this game
  await supabase
    .from('games')
    .update({ spotify_token: token })
    .eq('id', gameId);

  return data; // contains gameId
}


export async function updateCurrentSong(gameId, trackUri) {
  const { data, error } = await supabase
    .from('games')
    .update({ current_song: trackUri })
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

function Host() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState("random");
  const [currentTrack, setCurrentTrack] = useState(null); // holds track info
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0); // current position in ms

  const [gameId, setGameId] = useState(null);


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
      //alert(`Now playing: ${track.name} by ${track.artists.map(a => a.name).join(", ")}`);
      if (gameId) {
        try {
          await updateCurrentSong(gameId, track.uri);
        } catch (error) {
          console.error("Failed to update current song:", error);
        }
      }
    }
  };


  return (
    <div className="bg-blue-900 flex h-screen overflow-hidden">
      {/*Side Profile*/}
      <div className="bg-blue-950 w-64 p-7 overflow-hidden">
        {token ? (
          <div>
            <h1 className="text-2xl font-bold text-white flex-col pb-5">Welcome, {profile?.display_name}</h1>
            <img className="rounded-full" src={profile?.images?.[0]?.url} alt="profile" width={100} />
            <p className="text-white">Email: {profile?.email}</p>

            <h2 className="font-bold pt-10 text-white pb-1">Playlist:</h2>
            <select
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                className="p-2 rounded max-w-25"
              >
                <option value="random">Random Spotify Track</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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

      <div className="flex flex-col justify-between flex-1">
        <div className="flex flex-col justify-start flex-1 p-7">
          <h1 className="font-bold text-white text-center pb-5">🎵The Masucci Heardle Special🎵</h1>
          {token ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePlay}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Next Song
              </button>

              {gameId ? (
                <div className="flex flex-col justify-center items-center">
                  <p className="text-center text-white">To join game go to 'https://masucci-special.vercel.com/player' and enter code:</p>
                  <h1 className="text-[0.95rem] font-bold text-center text-white">{gameId}</h1>
                  <button
                    onClick={async () => {
                      if (!gameId) return;
                      await supabase.from("games").delete().eq("id", gameId);
                      setGameId(null);
                      alert("Lobby closed!");
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    End Lobby
                  </button>
                </div>
              ):
              (
                <div>
                  <button
                    onClick={async () => {
                      if (!profile) return alert("Profile not loaded yet!");
                      
                      try {
                        const game = await createGame(profile.id, token); // use Spotify profile ID as hostId
                        setGameId(game.id);
                        alert(`Lobby created! Share this code with players: ${game.id.slice(0, 6)}`);
                      } catch (error) {
                        console.error(error);
                        alert("Failed to create lobby.");
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Create Lobby
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

      {/* Track Section */}
        {currentTrack ? (
          <div className="w-full bg-gray-900 p-4 flex items-center justify-items-end gap-4 shadow-lg">
            
            {/* Song / Artist info */}
            <div className="flex flex-col text-white flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{currentTrack.name}</span>
                <img src={currentTrack.album.images[2]?.url} alt="song" className="w-6 h-6 rounded" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{currentTrack.artists.map(a => a.name).join(", ")}</span>
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
              className="text-white text-2xl rounded-full bg-green-500"
            >
              {isPlaying ? <FaPause/> : <FaPlay/>}
            </button>

          </div>
        ):
        (
          <div className="w-full bg-gray-900 p-4 flex items-center justify-end gap-4 shadow-lg">
            {/* Progress bar */}
            <div className="flex flex-col items-center w-1/2">
              <div className="w-full h-1 bg-gray-700 rounded"></div>
              <span className="text-xs text-gray-300 mt-1">
                0:00
              </span>
            </div>

            {/* Play / Pause button */}
            <button className="text-white text-2xl rounded-full bg-green-500">
              <FaPlay />
            </button>
          </div>
        )}


      </div>
      
    </div>
  );
}

export default Host;
