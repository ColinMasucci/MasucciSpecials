import { useEffect, useState } from "react";
import { redirectToAuthCodeFlow, getAccessToken } from "./auth";

function App() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      // Not logged in → show login button
      return;
    }

    async function fetchToken() {
      const { access_token } = await getAccessToken(code);
      setToken(access_token);
      localStorage.setItem("access_token", access_token);
    }

    fetchToken();
  }, []);

  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      const result = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await result.json();
      setProfile(data);
    }

    fetchProfile();
  }, [token]);


  return (
    <div className="bg-blue-900 flex h-screen overflow-hidden">
      {/*Side Profile*/}
      <div className="bg-blue-950 w-64 p-7">
        {token ? (
          <div>
            <h1 className="text-2xl font-bold text-white flex-col pb-5">Welcome, {profile?.display_name}</h1>
            <p>Email: {profile?.email}</p>
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
          <div></div>
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
