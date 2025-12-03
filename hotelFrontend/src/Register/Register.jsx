import React, { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import India from "./India";
import { authService } from '../services/authService';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    countryCode: '+94',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else {
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
      if (!re.test(form.email)) e.email = 'Enter a valid email';
    }
    if (!form.phone) e.phone = 'Phone is required';
    else {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length !== 10) e.phone = 'Phone must be 10 digits';
    }
    if (!form.country) e.country = 'Country is required';
    if (!form.username) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    
    if (Object.keys(e).length === 0) {
      setLoading(true);
      try {
        await authService.register(form);
        // Redirect to register success page
        navigate('/registersucess');
      } catch (error) {
        setErrors({
          submit: error.response?.data?.message || 'Registration failed. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };
  return (
  <div className="min-h-screen flex flex-col lg:flex-row bg-[#fafafa]">
      {/* Left: Image + Glass + Logo (hidden on small/medium) */}
    <India /> 
      {/* Right: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-8 lg:py-12 lg:h-screen">
        <form onSubmit={handleSubmit} className="w-[90%] sm:w-[85%] lg:w-[80%] max-w-sm flex flex-col gap-3 mt-2">
          <h2 className="text-[32px] font-bold mb-2 text-center bg-linear-to-r from-[#152C5B] to-[#3252DF] bg-clip-text text-transparent">Create Account</h2>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="name">Name</label>
            <input value={form.name} onChange={handleChange} className="w-full h-10 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300" id="name" type="text" placeholder="Enter your name" />
            {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="email">E mail</label>
            <input value={form.email} onChange={handleChange} className="w-full h-10 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300" id="email" type="text" placeholder="name@gmail.com" />
            {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="phone">Phone No</label>
            <div className="flex">
              <select id="countryCode" value={form.countryCode} onChange={handleChange} className="h-10 rounded-l-xl border-2 border-r-0 border-gray-200 bg-white text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-300 hover:border-blue-300">
                <option value="+94">+94 (LK)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (IN)</option>
                <option value="+61">+61 (AU)</option>
              </select>
              <input value={form.phone} onChange={handleChange} className="flex-1 h-10 rounded-r-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300" id="phone" type="text" placeholder="10-digit number" />
            </div>
            {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="country">Country</label>
            <input value={form.country} onChange={handleChange} className="w-full h-10 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300" id="country" type="text" placeholder="Country Name" />
            {errors.country && <div className="text-red-500 text-xs mt-1">{errors.country}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="username">Username</label>
            <input value={form.username} onChange={handleChange} className="w-full h-10 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300" id="username" type="text" placeholder="Username" />
            {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
          </div>
          <div>
            <label className="text-[16px] font-medium mb-1 block text-gray-700" htmlFor="password">Password</label>
            <div className="relative">
              <input value={form.password} onChange={handleChange} className="w-full h-10 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-all duration-300 hover:border-blue-300" id="password" type={showPassword ? "text" : "password"} placeholder="6+ characters" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer flex items-center hover:text-blue-500 transition-colors duration-200" style={{height: '100%'}} onClick={() => setShowPassword(!showPassword)}>
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
          <button type="submit" disabled={loading} className="bg-linear-to-r from-[#0057FF] to-[#5b7cff] text-white text-base font-medium rounded-xl py-3 mt-2 mb-2 w-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {loading ? 'Registering...' : 'Register'}
          </button>
          <div className="flex items-center justify-between w-full mt-2">
            <Link to="/" className="text-sm text-gray-700 hover:underline">Home</Link>
            <Link to="/login" className="text-black text-sm underline">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;