import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      <h1>Welcome to your dashboard</h1>
      {user && (
        <div>
          <p>Hello, {user.username}!</p>
          <p>Email: {user.email}</p>
        </div>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
