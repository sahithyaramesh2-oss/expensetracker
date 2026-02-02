import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await login(email, password);
            } else {
                result = await register(name, email, password);
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-card"
            >
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="logo-icon">💰</span>
                        <h1>SpendWise</h1>
                    </div>
                    <p>{isLogin ? 'Welcome back! Please enter your details.' : 'Start your journey to financial freedom.'}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="auth-error"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                key="name-field"
                                className="form-group"
                            >
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isLogin}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`auth-submit ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </motion.div>

            <style jsx>{`
                .auth-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0a0a0c;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                    padding: 20px;
                }

                .auth-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 0;
                }

                .blob {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    filter: blur(80px);
                    opacity: 0.15;
                    border-radius: 50%;
                }

                .blob-1 {
                    background: #2962ff;
                    top: -100px;
                    right: -100px;
                    animation: float 20s infinite alternate;
                }

                .blob-2 {
                    background: #e91e63;
                    bottom: -150px;
                    left: -100px;
                    animation: float 25s infinite alternate-reverse;
                }

                .blob-3 {
                    background: #00e676;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation: float 30s infinite linear;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(100px, 50px) scale(1.1); }
                }

                .auth-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 48px;
                    border-radius: 32px;
                    width: 100%;
                    max-width: 450px;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .auth-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .logo-icon {
                    font-size: 32px;
                    background: linear-gradient(135deg, #2962ff, #00e676);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                h1 {
                    color: white;
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .auth-header p {
                    color: #888;
                    font-size: 15px;
                    line-height: 1.5;
                }

                .auth-error {
                    background: rgba(233, 30, 99, 0.1);
                    color: #ff4081;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(233, 30, 99, 0.2);
                    text-align: center;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #aaa;
                    font-size: 13px;
                    font-weight: 500;
                    margin-left: 4px;
                }

                input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 14px 18px;
                    border-radius: 14px;
                    color: white;
                    font-size: 15px;
                    transition: all 0.3s ease;
                }

                input:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #2962ff;
                    box-shadow: 0 0 0 4px rgba(41, 98, 255, 0.15);
                }

                .auth-submit {
                    background: #2962ff;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 12px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(41, 98, 255, 0.3);
                }

                .auth-submit:hover:not(:disabled) {
                    background: #1e4bd8;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(41, 98, 255, 0.4);
                }

                .auth-submit:active {
                    transform: translateY(0);
                }

                .auth-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .auth-footer {
                    margin-top: 32px;
                    text-align: center;
                }

                .auth-footer p {
                    color: #666;
                    font-size: 14px;
                }

                .toggle-auth {
                    background: none;
                    border: none;
                    color: #2962ff;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 8px;
                    padding: 0;
                    transition: color 0.3s ease;
                }

                .toggle-auth:hover {
                    color: #7293ff;
                    text-decoration: underline;
                }

                @media (max-width: 480px) {
                    .auth-card {
                        padding: 32px 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
