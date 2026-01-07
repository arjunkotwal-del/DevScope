import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Code2, TrendingUp, BarChart3, Github } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthPage() {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginData, setLoginData] = useState({ email: 'demo@devscope.com', password: 'demo123' });
  const [registerData, setRegisterData] = useState({ email: '', name: '', password: '' });

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/github/login`);
      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      toast.error('Failed to initiate GitHub login');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back to DevScope!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData.email, registerData.name, registerData.password);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Code2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">DevScope</h1>
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Engineering Intelligence
              <br />
              <span className="text-indigo-400">Built for Scale</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Transform GitHub data into actionable insights. Understand velocity, identify bottlenecks, and optimize team performance.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-6">
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-indigo-400 mb-3" />
              <p className="text-sm text-zinc-400">Real-time Analytics</p>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-emerald-400 mb-3" />
              <p className="text-sm text-zinc-400">AI Insights</p>
            </Card>
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
              <Code2 className="h-8 w-8 text-purple-400 mb-3" />
              <p className="text-sm text-zinc-400">Health Scoring</p>
            </Card>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 p-8 shadow-2xl">
          <Button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white mb-6 h-12 text-base font-semibold"
            data-testid="github-login-button"
          >
            <Github className="h-5 w-5 mr-2" />
            {loading ? 'Connecting...' : 'Continue with GitHub'}
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">Or</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6" data-testid="auth-tabs">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-zinc-300">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="demo@devscope.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-zinc-300">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit-button"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-xs text-zinc-500 text-center">
                  Demo: demo@devscope.com / demo123
                </p>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6" data-testid="register-form">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-zinc-300">Name</Label>
                  <Input
                    id="register-name"
                    data-testid="register-name-input"
                    placeholder="John Doe"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-zinc-300">Email</Label>
                  <Input
                    id="register-email"
                    data-testid="register-email-input"
                    type="email"
                    placeholder="[email protected]"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-zinc-300">Password</Label>
                  <Input
                    id="register-password"
                    data-testid="register-password-input"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="register-submit-button"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
