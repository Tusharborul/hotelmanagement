import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginImg from '../assets/Login/login.png';
import Lanka from "../Register/Lanka";
import { authService } from '../services/authService';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username || username.trim() === "") e.username = "Username is required";
    if (!password || password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    
    if (Object.keys(e).length === 0) {
      setLoading(true);
      try {
        await authService.login({ username, password });
        
        // Check if there's a redirect URL stored (explicit flow)
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          // Default role-aware redirect: users -> /dashboard/hotels, admins -> /dashboard/admin,
          // hotel owners -> /dashboard/owner, others -> /dashboard
          const user = authService.getCurrentUser();
          if (user && user.role === 'user') {
            navigate('/dashboard/hotels');
          } else if (user && (user.role === 'admin' || user.role === 'administrator')) {
            navigate('/dashboard/admin');
          } else if (user && (user.role === 'hotelOwner' || user.role === 'owner')) {
            navigate('/dashboard/owner');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        setErrors({
          submit: error.response?.data?.message || 'Login failed. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <div className="min-h-screen flex flex-col lg:flex-row  bg-[#fafafa]">
  {/* Left: Image + Glass + Logo (hidden on mobile) */}
  <Lanka />
      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 lg:h-screen">
        <form onSubmit={handleSubmit} className="w-[90%] lg:w-[80%] max-w-sm flex flex-col gap-3 mt-2">
          <h2 className="text-[32px] font-bold mb-2 text-center">Login Account</h2>
          <div>
            <label className="text-[16px] font-medium mb-1 block" htmlFor="username">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full h-9 rounded-md border border-gray-300 px-3 py-1 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" id="username" type="text" placeholder="Username" />
            {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block" htmlFor="password">Password</label>
            <div className="relative">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-9 rounded-md border border-gray-300 px-3 py-1 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" id="password" type={showPassword ? "text" : "password"} placeholder="6+ characters" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer flex items-center" style={{height: '100%'}} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  // Eye icon (visible)
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  // Eye-off icon (hidden)
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15a3 3 0 01-4.24-4.24" />
                  </svg>
                )}
              </span>
            </div>
            {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
          </div>
          {errors.submit && <div className="text-red-500 text-sm mt-2 text-center">{errors.submit}</div>}
          <p className="text-xs text-gray-500 mt-2 mb-2 text-center">By signing up you agree to <a href="#" className="text-blue-600 underline">terms and conditions</a> at zoho.</p>
          <button type="submit" disabled={loading} className="bg-[#0057FF] text-white text-base font-medium rounded-lg py-2 mt-2 mb-2 w-full shadow hover:bg-[#003bb3] transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <a href="register" className="text-black text-sm underline text-center">Create Account</a>
        </form>
      </div>
    </div>
  );
};

export default Login;
