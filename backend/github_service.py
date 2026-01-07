"""GitHub API service for fetching repository data"""
import httpx
from typing import Optional, List, Dict
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class GitHubService:
    BASE_URL = "https://api.github.com"
    OAUTH_URL = "https://github.com/login/oauth"
    
    def __init__(self):
        self.client_id = os.environ.get('GITHUB_CLIENT_ID')
        self.client_secret = os.environ.get('GITHUB_CLIENT_SECRET')
        self.frontend_url = os.environ.get('FRONTEND_URL')
    
    def get_oauth_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL"""
        # Use FRONTEND_URL as the base since backend is accessible at the same domain
        backend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').replace(':3000', ':8001')
        if 'localhost' not in backend_url:
            # For production, backend is accessible at the same domain as frontend
            backend_url = os.environ.get('FRONTEND_URL', 'https://gitmetrics.preview.emergentagent.com')
        redirect_uri = f"{backend_url}/api/auth/github/callback"
        scope = "user repo read:org"
        return f"{self.OAUTH_URL}/authorize?client_id={self.client_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}"
    
    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange OAuth code for access token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.OAUTH_URL}/access_token",
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code
                    },
                    headers={"Accept": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("access_token")
                return None
            except Exception as e:
                print(f"Error exchanging code: {e}")
                return None
    
    async def get_user_info(self, token: str) -> Optional[Dict]:
        """Get authenticated user information"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error fetching user info: {e}")
                return None
    
    async def get_user_repos(self, token: str) -> List[Dict]:
        """Get user's repositories"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/user/repos",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params={"per_page": 100, "sort": "updated"}
                )
                
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                print(f"Error fetching repos: {e}")
                return []
    
    async def get_repo_commits(self, token: str, owner: str, repo: str, since: Optional[datetime] = None) -> List[Dict]:
        """Get commits from a repository"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                params = {"per_page": 100}
                if since:
                    params["since"] = since.isoformat()
                
                response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/commits",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                print(f"Error fetching commits: {e}")
                return []
    
    async def get_repo_pulls(self, token: str, owner: str, repo: str, state: str = "all") -> List[Dict]:
        """Get pull requests from a repository"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/pulls",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params={"state": state, "per_page": 100}
                )
                
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                print(f"Error fetching PRs: {e}")
                return []
    
    async def get_commit_details(self, token: str, owner: str, repo: str, sha: str) -> Optional[Dict]:
        """Get detailed commit information"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/repos/{owner}/{repo}/commits/{sha}",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                return None
            except Exception as e:
                print(f"Error fetching commit details: {e}")
                return None

github_service = GitHubService()
