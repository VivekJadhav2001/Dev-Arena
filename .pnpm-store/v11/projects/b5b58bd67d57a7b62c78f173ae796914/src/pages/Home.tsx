import React, { useEffect, useState } from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import GithubLoginButton from "../components/GithubLoginButton";
import { BACKEND_URL } from "../utils/constants";

type Props = {};

type User = {
  name: string;
  email: string;
  avatarUrl: string;
};

function Home({}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function getCurrentUser() {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        // The Express session cookie is on localhost:2001, so it must be
        // explicitly included when this page is served from localhost:5173.
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      const data = await res.json();
      console.log(data, "USER DATA");
      setUser(data.data);
    } catch (error) {
      setUser(null);
      console.log(error, "Fetching Current user failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    let logout = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    console.log(logout,"LOGOUT")
    setUser(null);
  }

  useEffect(() => {
    getCurrentUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {!user ? (
        <div>
          <h1>Welcome</h1>

          <GoogleLoginButton />
          <GithubLoginButton />
        </div>
      ) : (
        <div>
          <h1>Welcome {user.name}</h1>

          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.name}
              width="100"
              height="100"
            />
          )}

          <p>{user.email}</p>

          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Home;
