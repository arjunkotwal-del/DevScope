import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Code2, GitBranch, TrendingUp, Sparkles, Github, BarChart3, Users, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent"></div>
        
        <nav className="relative border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">DevScope</span>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started
            </Button>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Engineering Analytics
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Engineering Intelligence
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Built for Scale
              </span>
            </h1>
            
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Transform GitHub data into actionable insights. Understand velocity, identify bottlenecks, 
              and optimize team performance with AI-powered analytics.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-lg h-14 px-8"
              >
                <Github className="h-5 w-5 mr-2" />
                Start Free
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                variant="outline"
                className="border-zinc-700 text-lg h-14 px-8"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything you need to understand your engineering velocity
          </h2>
          <p className="text-xl text-zinc-400">
            Production-grade analytics trusted by engineering teams
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Real-Time Analytics</h3>
            <p className="text-zinc-400">
              Track commits, PRs, and code churn in real-time. Understand your team's velocity at a glance.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-purple-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Insights</h3>
            <p className="text-zinc-400">
              Get intelligent recommendations powered by Gemini. Identify bottlenecks before they become problems.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Health Scoring</h3>
            <p className="text-zinc-400">
              Repository health scores based on commit frequency, PR velocity, and collaboration metrics.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-amber-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Team Analytics</h3>
            <p className="text-zinc-400">
              Understand contributor patterns, workload distribution, and collaboration dynamics across your team.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Instant Sync</h3>
            <p className="text-zinc-400">
              Connect your repositories in seconds. Background syncing keeps your data always up-to-date.
            </p>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 p-8 backdrop-blur-sm hover:border-red-500/30 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Secure by Default</h3>
            <p className="text-zinc-400">
              Enterprise-grade security with encrypted tokens, JWT authentication, and secure OAuth flows.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 p-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your engineering metrics?
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Join engineering teams using DevScope to ship faster and more reliably.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-lg h-14 px-8"
          >
            <Github className="h-5 w-5 mr-2" />
            Get Started Free
          </Button>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © 2025 DevScope. Built for engineering teams.
        </div>
      </div>
    </div>
  );
}
