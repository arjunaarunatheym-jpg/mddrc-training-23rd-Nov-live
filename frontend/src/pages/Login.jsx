import React, { useState } from "react";
import { login } from "../lib/api";

function Login() {
  const [identifier, setIdentifier] = useState(""); // email or IC
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await login(identifier, password);

      console.log("Login response:", result);

      if (!result.ok) {
        setError(
          result?.data?.detail ||
            result?.data?.message ||
            "Login failed. Please check your credentials."
        );
      } else {
        setMessage("Login successful! (We will wire dashboards next.)");
        // TODO: later we will redirect based on user role
        // e.g. navigate("/admin") or navigate("/participant")
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "8px", textAlign: "center" }}>
          Malaysian Defensive Driving
          <br />
          and Riding Centre Sdn Bhd
        </h1>
        <p style={{ marginBottom: "24px", textAlign: "center" }}>
          Training Management System
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Email or IC Number
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin@example.com or IC number"
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
            required
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: "16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
            required
          />

          {error && (
            <div
              style={{
                marginBottom: "12px",
                color: "#b00020",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginBottom: "12px",
                color: "green",
                fontSize: "0.9rem",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          style={{
            marginTop: "16px",
            fontSize: "0.8rem",
            color: "#666",
            textAlign: "center",
          }}
        >
          Contact your administrator for account access
        </p>
      </div>
    </div>
  );
}

export default Login;

