import React from "react";
import { BACKEND_URL } from "../utils/constants.ts";
type Props = {};

const GithubLoginButton = (props: Props) => {
  console.log(BACKEND_URL, "url");

  const handleGitHubLogin = () =>{
    window.location.href = `${BACKEND_URL}/auth/github`
  };

  return (
    <button type="button" onClick={handleGitHubLogin}>
      Continue with GitHub
    </button>
  );
};

export default GithubLoginButton;
