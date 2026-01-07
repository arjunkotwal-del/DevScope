import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GitBranch, GitPullRequest, Code2, TrendingUp, Activity, Sparkles, BarChart3, Users, Download, RefreshCw, Github, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [addingRepo, setAddingRepo] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commitData, setCommitData] = useState(null);
  const [prData, setPrData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchRepoAnalytics(selectedRepo.id);
    }
  }, [selectedRepo]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('devscope_token');
      const [reposRes, overviewRes] = await Promise.all([
        axios.get(`${API}/repositories`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRepositories(reposRes.data);
      setOverview(overviewRes.data);
      if (reposRes.data.length > 0) {
        setSelectedRepo(reposRes.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const importRepositories = async () => {
    setImporting(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await axios.post(
        `${API}/repositories/import`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Repositories imported successfully');
      await fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to import repositories';
      if (errorMsg.includes('GitHub token not found')) {
        toast.error('Please connect GitHub in Settings to import repositories');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setImporting(false);
    }
  };

  const addRepository = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }

    setAddingRepo(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await axios.post(
        `${API}/repositories/add`,
        { repo_url: repoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Repository added successfully');
      setShowAddDialog(false);
      setRepoUrl('');
      await fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to add repository';
      toast.error(errorMsg);
    } finally {
      setAddingRepo(false);
    }
  };

  const fetchRepoAnalytics = async (repoId) => {
    try {
      const token = localStorage.getItem('devscope_token');
      const [commits, prs, health] = await Promise.all([
        axios.get(`${API}/analytics/commits/${repoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/pull-requests/${repoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/health/${repoId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCommitData(commits.data);
      setPrData(prs.data);
      setHealthData(health.data);
    } catch (error) {
      console.error('Failed to fetch repo analytics:', error);
    }
  };

  const generateInsights = async () => {
    if (!selectedRepo) return;
    setLoadingInsights(true);
    try {
      const token = localStorage.getItem('devscope_token');
      const response = await axios.post(
        `${API}/insights/generate/${selectedRepo.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsights(response.data);
      toast.success('AI insights generated!');
    } catch (error) {
      toast.error('Failed to generate insights');
      console.error(error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const syncRepo = async (repoId) => {
    try {
      const token = localStorage.getItem('devscope_token');
      await axios.post(
        `${API}/repositories/sync/${repoId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Repository sync initiated');
      await fetchData();
    } catch (error) {
      toast.error('Failed to sync repository');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Engineering Analytics</h1>
          <p className="text-zinc-400">Real-time insights across your repositories</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-zinc-700"
                data-testid="add-repo-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Repository
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add GitHub Repository</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-url" className="text-zinc-300">Repository URL</Label>
                  <Input
                    id="repo-url"
                    data-testid="repo-url-input"
                    placeholder="https://github.com/owner/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                  <p className="text-xs text-zinc-500">
                    Enter the full GitHub URL of the repository you want to analyze
                  </p>
                </div>
                <Button
                  onClick={addRepository}
                  disabled={addingRepo}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  data-testid="add-repo-submit"
                >
                  {addingRepo ? 'Adding...' : 'Add Repository'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={importRepositories}
            disabled={importing}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="import-repos-button"
          >
            <Download className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import All'}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="overview-stats">
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <GitBranch className="h-5 w-5 text-indigo-400" />
            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400">
              Active
            </Badge>
          </div>
          <p className="text-3xl font-bold text-white mono">{overview?.total_repositories || 0}</p>
          <p className="text-sm text-zinc-500 mt-1">Repositories</p>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <Code2 className="h-5 w-5 text-emerald-400" />
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mono">{overview?.total_commits.toLocaleString() || 0}</p>
          <p className="text-sm text-zinc-500 mt-1">Total Commits</p>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <GitPullRequest className="h-5 w-5 text-purple-400" />
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white mono">{overview?.total_pull_requests || 0}</p>
          <p className="text-sm text-zinc-500 mt-1">Pull Requests</p>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-5 w-5 text-amber-400" />
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white mono">{overview?.recent_commits || 0}</p>
          <p className="text-sm text-zinc-500 mt-1">Recent Activity (30d)</p>
        </Card>
      </div>

      {repositories.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
          <Github className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Repositories Yet</h3>
          <p className="text-zinc-400 mb-6">
            Login with GitHub or import your repositories to start analyzing your engineering metrics
          </p>
          <Button
            onClick={importRepositories}
            disabled={importing}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="import-repos-empty-state"
          >
            {importing ? 'Importing...' : 'Import Repositories'}
          </Button>
        </Card>
      ) : (
        <>
          {/* Repository Selection */}
          <div className="flex gap-3 flex-wrap items-center">
            {repositories.map(repo => (
              <Button
                key={repo.id}
                onClick={() => setSelectedRepo(repo)}
                variant={selectedRepo?.id === repo.id ? 'default' : 'outline'}
                className={selectedRepo?.id === repo.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-zinc-700'}
                data-testid={`repo-button-${repo.id}`}
              >
                {repo.name}
              </Button>
            ))}
            {selectedRepo && (
              <Button
                onClick={() => syncRepo(selectedRepo.id)}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
                data-testid="sync-repo-button"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </Button>
            )}
          </div>

          {selectedRepo && (
        <>
          {/* Repository Health Score */}
          {healthData && (
            <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="health-score-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Repository Health</h2>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white mono">{healthData.overall_score}</p>
                    <p className="text-xs text-zinc-500">Overall Score</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Commit Frequency</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${healthData.commit_frequency_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white mono">{healthData.commit_frequency_score}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">PR Velocity</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${healthData.pr_velocity_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white mono">{healthData.pr_velocity_score}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Code Quality</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${healthData.code_quality_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white mono">{healthData.code_quality_score}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Collaboration</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${healthData.collaboration_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white mono">{healthData.collaboration_score}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commit Trend */}
            {commitData && (
              <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="commit-chart">
                <h3 className="text-lg font-semibold text-white mb-4">Commit Activity (30 days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={commitData.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717A"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => new Date(val).getDate()}
                    />
                    <YAxis stroke="#71717A" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: '1px solid #27272A',
                        borderRadius: '6px',
                        color: '#FAFAFA'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="commits" 
                      stroke="#6366F1" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* PR Stats */}
            {prData && (
              <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="pr-stats">
                <h3 className="text-lg font-semibold text-white mb-4">Pull Request Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Total PRs</span>
                    <span className="text-2xl font-bold text-white mono">{prData.total_prs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Merged</span>
                    <span className="text-2xl font-bold text-emerald-400 mono">{prData.merged_prs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Open</span>
                    <span className="text-2xl font-bold text-indigo-400 mono">{prData.open_prs}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Avg Turnaround</span>
                    <span className="text-2xl font-bold text-white mono">{prData.avg_turnaround_hours}h</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* AI Insights */}
          <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="insights-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
              </div>
              <Button
                onClick={generateInsights}
                disabled={loadingInsights}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="generate-insights-button"
              >
                {loadingInsights ? 'Analyzing...' : 'Generate Insights'}
              </Button>
            </div>
            {insights ? (
              <div className="space-y-6">
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-6">
                  <div className="prose prose-invert max-w-none">
                    {insights.insights.split('\n').map((line, i) => {
                      // Remove ** markdown
                      const cleanLine = line.replace(/\*\*/g, '');
                      const isBullet = cleanLine.trim().match(/^[\*\-\•]\s/);
                      const isNumbered = cleanLine.trim().match(/^\d+\.\s/);
                      const isHeader = cleanLine.trim().match(/^#+\s/) || (cleanLine.trim() && cleanLine.trim() === cleanLine.trim().toUpperCase() && cleanLine.trim().length < 50);
                      
                      if (!cleanLine.trim()) return <div key={i} className="h-3" />;
                      
                      if (isHeader) {
                        return (
                          <h4 key={i} className="text-lg font-semibold text-indigo-400 mb-3">
                            {cleanLine.trim().replace(/^#+\s/, '')}
                          </h4>
                        );
                      }
                      
                      if (isBullet || isNumbered) {
                        return (
                          <div key={i} className="flex gap-3 mb-3">
                            <span className="text-indigo-400 mt-1">•</span>
                            <p className="text-zinc-300 leading-relaxed flex-1">
                              {cleanLine.trim().replace(/^[\*\-\•\d+\.]\s/, '')}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <p key={i} className="text-zinc-300 leading-relaxed mb-3">
                          {cleanLine}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Powered by Gemini 3 Flash</span>
                  <span>Generated {new Date(insights.generated_at).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-950/30 rounded-lg border border-dashed border-zinc-800">
                <Sparkles className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 mb-2">No insights generated yet</p>
                <p className="text-zinc-600 text-sm">
                  Click &quot;Generate Insights&quot; to get AI-powered analysis of this repository
                </p>
              </div>
            )}
          </Card>
        </>
      )}
        </>
      )}
    </div>
  );
}
