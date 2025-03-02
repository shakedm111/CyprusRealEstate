
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });

      if (response.data.success) {
        toast({
          title: "התחברות הצליחה",
          description: "ברוך הבא למערכת",
          variant: "success",
        });
        navigate("/dashboard");
      } else {
        setError(response.data.message || "התחברות נכשלה");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "שם משתמש או סיסמה שגויים");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" dir="rtl">
      <div className="auth-card">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="TELEM Nadlan" className="auth-logo" />
          <h1 className="text-2xl font-bold mb-2">כניסה למערכת</h1>
          <p className="text-gray-600 text-sm">ברוכים הבאים לשירות לניהול השקעות נדל"ן</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              שם משתמש
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-700 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                מתחבר...
              </span>
            ) : (
              "כניסה"
            )}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600 text-center">
          <a href="#" className="text-primary hover:underline">
            שכחתי סיסמה
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>login.contact@admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
