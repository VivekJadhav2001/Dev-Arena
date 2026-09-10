import { BACKEND_URL } from "../utils/constants"

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`
  }

  return (
    <button type="button" onClick={handleGoogleLogin}>
      Continue with Google
  </button>
  )
}

export default GoogleLoginButton