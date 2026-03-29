import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { registerUser } from '../services/api';
import { Eye, EyeOff, UserPlus, GraduationCap, Briefcase } from 'lucide-react';
import './AuthPage.css';

export default function RegisterPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { user, token } = await registerUser(data.name, data.email, data.password, role);
      login(user);
      localStorage.setItem('sem_token', token);
      addToast(`Account created! Welcome, ${user.name.split(' ')[0]}!`, 'success');
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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join EventSphere today</p>
          </div>

          {/* Role toggle */}
          <div className="toggle-group mb-2">
            <button
              type="button"
              className={`toggle-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              <GraduationCap size={16} /> Student
            </button>
            <button
              type="button"
              className={`toggle-btn ${role === 'organizer' ? 'active' : ''}`}
              onClick={() => setRole('organizer')}
            >
              <Briefcase size={16} /> Organizer
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

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
                  placeholder="Min. 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <UserPlus size={18} />}
              {loading ? 'Creating account…' : `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
