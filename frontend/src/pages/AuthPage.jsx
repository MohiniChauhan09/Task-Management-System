import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const AuthPage = () => {
  const { saveAuth } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetCompleted, setResetCompleted] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);

  const isRegister = mode === "register";

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim() || (isRegister && !form.name.trim())) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        ...(isRegister ? { name: form.name } : {})
      };

      const response = isRegister ? await api.register(payload) : await api.login(payload);
      saveAuth(response.token, response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRequestReset = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetCompleted(false);
    setCanResetPassword(false);

    const emailToUse = resetEmail.trim() || form.email.trim();
    if (!emailToUse) {
      setResetError("Enter your email to request a reset token.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.forgotPassword({ email: emailToUse });
      setResetMessage(response.message);
      setCanResetPassword(true);
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (err) {
      setResetError(err.message);
      setCanResetPassword(false);
    } finally {
      setResetLoading(false);
    }
  };

  const onResetPassword = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetToken.trim() || !newPassword.trim()) {
      setResetError("Reset token and new password are required.");
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.resetPassword({
        token: resetToken.trim(),
        newPassword: newPassword.trim()
      });
      setResetMessage(response.message);
      setResetCompleted(true);
      setResetError("");
      setNewPassword("");
      setResetToken("");
      setCanResetPassword(false);
      setMode("login");
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="aurora"></div>
      <div className="auth-card">
        <h1>TaskFlow</h1>
        <p>Track work with clarity and finish stronger.</p>

        <div className="auth-toggle">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {isRegister && (
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="jane@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Enter password"
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        {!isRegister && (
          <div className="reset-box">
            <button
              className="link-btn"
              type="button"
              onClick={() => {
                setShowReset((prev) => !prev);
                setResetError("");
                setResetMessage("");
                setResetCompleted(false);
                setCanResetPassword(false);
              }}
            >
              {showReset ? "Hide password reset" : "Forgot password?"}
            </button>

            {showReset && (
              <div className="reset-panel">
                {!resetCompleted && (
                  <>
                    <form onSubmit={onRequestReset}>
                      <label>
                        Email for reset
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(event) => setResetEmail(event.target.value)}
                          placeholder="jane@example.com"
                        />
                      </label>
                      <button className="ghost-btn" type="submit" disabled={resetLoading}>
                        {resetLoading ? "Please wait..." : "Get reset token"}
                      </button>
                    </form>

                    {canResetPassword && (
                      <form onSubmit={onResetPassword}>
                        <label>
                          Reset token
                          <input
                            value={resetToken}
                            onChange={(event) => setResetToken(event.target.value)}
                            placeholder="Paste token"
                          />
                        </label>
                        <label>
                          New password
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            placeholder="At least 6 characters"
                          />
                        </label>
                        <button className="primary-btn" type="submit" disabled={resetLoading}>
                          {resetLoading ? "Please wait..." : "Reset password"}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {resetError && <div className="error-text">{resetError}</div>}
                {resetMessage && <p className="info-text">{resetMessage}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
