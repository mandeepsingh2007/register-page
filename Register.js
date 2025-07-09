
import React, { useEffect, useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    email: '', 
    role: 'creator', 
    githubUsername: '',
   
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await API.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const user = res.data.user;
        if (user) {
          if (user.role === 'creator') navigate('/creator-profile');
          else if (user.role === 'hunter') navigate('/hunter-profile');
          else navigate('/');
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ Fix: remove wrong origin check & always accept message
  useEffect(() => {
    if (form.role === 'hunter' && !form.githubUsername) {
      const width = 600, height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      const popup = window.open(
        `${process.env.REACT_APP_BACKEND_URL || ''}/api/auth/github/hunter/login`,
        'GitHub Login',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      const handleMessage = (event) => {
        if (event.data.githubUsername) {
          setForm(prev => ({ ...prev, githubUsername: event.data.githubUsername }));
          popup && popup.close();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [form.role, form.githubUsername]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await API.post('/api/auth/register', form);
      const user = res.data.user;
      localStorage.setItem('token', res.data.token);
      if (user.role === 'creator') navigate('/creator-profile');
      else if (user.role === 'hunter') navigate('/bounties-display');
      else navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering');
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Welcome to Fixera</h1>
 
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
    
     
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="projectmayhem@fc.com"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

   

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select 
              id="role"
              name="role" 
              value={form.role} 
              onChange={handleChange}
              className="form-select"
            >
              <option value="creator">Creator</option>
              <option value="hunter">Hunter</option>
            </select>
          </div>

          {form.role === 'hunter' && form.githubUsername && (
            <div className="github-connected">
              <span className="github-icon">✅</span>
              <span>Connected GitHub: {form.githubUsername} Click on Signup</span>
            </div>
          )}

          <button type="submit" className="submit-button">
            Sign up →
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
