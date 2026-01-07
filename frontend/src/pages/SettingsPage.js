import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Github, CheckCircle, XCircle, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const hasGitHubConnected = !!user?.github_token;

  const connectGitHub = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/github/login`);
      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      toast.error('Failed to initiate GitHub connection');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8" data-testid="settings-page">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your account and integrations</p>
      </div>

      {/* GitHub Connection */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Github className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">GitHub Integration</h2>
              <p className="text-zinc-400 text-sm">
                Connect your GitHub account to import and sync repositories
              </p>
            </div>
          </div>
          {hasGitHubConnected ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Not Connected</span>
            </div>
          )}
        </div>

        {hasGitHubConnected ? (
          <div className="space-y-4">
            <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">GitHub Username</p>
                  <p className="text-white font-medium">@{user.github_username || 'Connected'}</p>
                </div>
                <Button
                  onClick={connectGitHub}
                  variant="outline"
                  className="border-zinc-700"
                  disabled={loading}
                >
                  Reconnect
                </Button>
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              Your GitHub account is connected. You can import repositories and sync data automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-amber-400 text-sm">
                <strong>Note:</strong> Connecting GitHub allows you to import repositories and access real commit and PR data.
              </p>
            </div>
            <Button
              onClick={connectGitHub}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="connect-github-button"
            >
              <Github className="h-4 w-4 mr-2" />
              {loading ? 'Connecting...' : 'Connect GitHub Account'}
            </Button>
          </div>
        )}
      </Card>

      {/* Account Info */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Account Information</h2>
            <p className="text-zinc-400 text-sm">Your DevScope account details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
            <p className="text-sm text-zinc-400 mb-1">Name</p>
            <p className="text-white font-medium">{user?.name}</p>
          </div>
          <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
            <p className="text-sm text-zinc-400 mb-1">Email</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
