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

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={redirectToAuthCodeFlow}
          className="bg-green-500 text-white px-6 py-3 rounded-lg"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {profile?.display_name}</h1>
      <p>Email: {profile?.email}</p>
      <img src={profile?.images?.[0]?.url} alt="profile" width={100} />
    </div>
  );
}

export default App;
