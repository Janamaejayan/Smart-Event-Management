import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { loginUser } from '../services/api';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { user, token } = await loginUser(data.email, data.password);
      login(user);
      localStorage.setItem('sem_token', token);
      addToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(user.role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-container">
        <div className="auth-card card card-elevated fade-in">
          <div className="auth-header">
            <div className="auth-logo">⚡</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to EventSphere</p>
          </div>

          <div className="demo-hint">
            <strong>Demo accounts:</strong><br />
            <span>🎓 Student: <code>student@demo.com</code></span><br />
            <span>🗂 Organizer: <code>organizer@demo.com</code></span><br />
            <span>🔑 Password: <code>demo123</code></span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <LogIn size={18} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
