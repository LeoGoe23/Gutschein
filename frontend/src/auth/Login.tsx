import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";
import useAuth from "./useAuth";

export default function Login() {
  const user = useAuth();

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(res => console.log("Erfolgreich eingeloggt:", res.user.email))
      .catch(console.error);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      {user ? (
        <>
          <p>Willkommen {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login mit Google</button>
      )}
    </div>
  );
}
