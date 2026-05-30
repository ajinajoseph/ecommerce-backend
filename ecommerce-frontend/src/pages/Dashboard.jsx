import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";

function Dashboard() {
  const { role } = useAuth();

  return (
    <div className="container">
      <Navbar />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Account</span>
          <h1>Dashboard</h1>
          <p className="hero-text">
            You are signed in as <strong>{role || "user"}</strong>.
          </p>
          <p className="hero-text">
            <Link to="/">Browse products</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
