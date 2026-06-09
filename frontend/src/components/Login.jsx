import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'register') {
        await api.post('/auth/register', { name, email, password });
        setMessage('Account created. Please login.');
        setMode('login');
        setName('');
        setPassword('');
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const userData = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      onLogin(userData);
      navigate('/dashboard');
    } catch {
      setError(mode === 'register' ? 'Registration failed. Email may already be in use.' : 'Invalid credentials');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p style={{marginBottom: '2rem', color: 'var(--text-secondary)'}}>
          {mode === 'login' ? 'Login to manage your tasks' : 'Register to start managing tasks'}
        </p>
        {error && <div style={{color: 'var(--danger)', marginBottom: '1rem'}}>{error}</div>}
        {message && <div style={{color: 'var(--success)', marginBottom: '1rem'}}>{message}</div>}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <div style={{marginTop: '1.5rem'}}>
          <button type="button" onClick={toggleMode} className="link" style={{background: 'none', border: 0, cursor: 'pointer'}}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
