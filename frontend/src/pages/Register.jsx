import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../slices/authSlice.js";
import { useNavigate, Link } from "react-router-dom";
import { LayoutGrid, User, Mail, Lock, ArrowRight } from "lucide-react";
import { initiateSocketConnection } from "../socket/socketService.js";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (token) {
      navigate("/");
    }
  }, [token, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const result = await dispatch(registerUser({ name, email, password }));
    if (result.meta.requestStatus === "fulfilled") {
      const user = result.payload;
      // Connect socket
      initiateSocketConnection(user._id, dispatch);
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-3 text-white shadow-lg shadow-purple-500/20">
            <LayoutGrid size={28} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Start collaborating with your team today
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 p-3.5 border border-rose-500/20 text-center text-sm text-rose-450 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none transition"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/50 focus:border-purple-500 focus:outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-purple-500 hover:shadow-purple-500/20 transition disabled:opacity-50"
            >
              <span>{isLoading ? "Creating account..." : "Sign Up"}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-250 transition group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-800/60">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
