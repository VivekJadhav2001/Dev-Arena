import { BACKEND_URL } from "../utils/constants"

const GithubLoginButton = () => {
  const handleGitHubLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/github`
  }

  return (
    <button type="button" onClick={handleGitHubLogin}>
      Continue with GitHub
    </button>
  )
}

export default GithubLoginButton