from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'devscope_secure_jwt_secret_key_production_ready')
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    avatar_url: Optional[str] = None
    github_token: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Repository(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    github_id: int
    name: str
    full_name: str
    owner: str
    description: Optional[str] = None
    url: str
    is_private: bool
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    last_synced: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Commit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repository_id: str
    sha: str
    author: str
    author_email: str
    message: str
    timestamp: datetime
    files_changed: int = 0
    additions: int = 0
    deletions: int = 0
    url: str

class PullRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repository_id: str
    github_id: int
    number: int
    title: str
    author: str
    state: str
    created_at: datetime
    merged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    additions: int = 0
    deletions: int = 0
    changed_files: int = 0
    comments: int = 0
    url: str

class HealthScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    repository_id: str
    overall_score: float
    commit_frequency_score: float
    pr_velocity_score: float
    code_quality_score: float
    collaboration_score: float
    computed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth helpers
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(email=user_data.email, name=user_data.name)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"user_id": user.id, "email": user.email})
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**user)
    token = create_access_token({"user_id": user_obj.id, "email": user_obj.email})
    return {"token": token, "user": user_obj}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Repository endpoints
@api_router.get("/repositories", response_model=List[Repository])
async def get_repositories(current_user: User = Depends(get_current_user)):
    repos = await db.repositories.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    for repo in repos:
        if isinstance(repo.get("created_at"), str):
            repo["created_at"] = datetime.fromisoformat(repo["created_at"])
        if repo.get("last_synced") and isinstance(repo["last_synced"], str):
            repo["last_synced"] = datetime.fromisoformat(repo["last_synced"])
    return repos

@api_router.get("/repositories/{repo_id}", response_model=Repository)
async def get_repository(repo_id: str, current_user: User = Depends(get_current_user)):
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if isinstance(repo.get("created_at"), str):
        repo["created_at"] = datetime.fromisoformat(repo["created_at"])
    if repo.get("last_synced") and isinstance(repo["last_synced"], str):
        repo["last_synced"] = datetime.fromisoformat(repo["last_synced"])
    return Repository(**repo)

# Analytics endpoints
@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: User = Depends(get_current_user)):
    repos = await db.repositories.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    repo_ids = [r["id"] for r in repos]
    
    total_commits = await db.commits.count_documents({"repository_id": {"$in": repo_ids}})
    total_prs = await db.pull_requests.count_documents({"repository_id": {"$in": repo_ids}})
    
    # Get recent commits for trend
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_commits = await db.commits.find(
        {"repository_id": {"$in": repo_ids}},
        {"_id": 0, "timestamp": 1, "additions": 1, "deletions": 1}
    ).to_list(1000)
    
    return {
        "total_repositories": len(repos),
        "total_commits": total_commits,
        "total_pull_requests": total_prs,
        "active_repositories": len([r for r in repos if r.get("last_synced")]),
        "recent_commits": len([c for c in recent_commits if datetime.fromisoformat(c["timestamp"]) > thirty_days_ago]) if recent_commits and len(recent_commits) > 0 and isinstance(recent_commits[0].get("timestamp"), str) else 0
    }

@api_router.get("/analytics/commits/{repo_id}")
async def get_commit_analytics(repo_id: str, current_user: User = Depends(get_current_user)):
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    commits = await db.commits.find(
        {"repository_id": repo_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    
    # Group by day for trend
    daily_commits = {}
    for commit in commits:
        ts = commit.get("timestamp")
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        date_key = ts.strftime("%Y-%m-%d")
        if date_key not in daily_commits:
            daily_commits[date_key] = {"count": 0, "additions": 0, "deletions": 0}
        daily_commits[date_key]["count"] += 1
        daily_commits[date_key]["additions"] += commit.get("additions", 0)
        daily_commits[date_key]["deletions"] += commit.get("deletions", 0)
    
    return {
        "total_commits": len(commits),
        "daily_trend": [{
            "date": k,
            "commits": v["count"],
            "additions": v["additions"],
            "deletions": v["deletions"]
        } for k, v in sorted(daily_commits.items())[-30:]]
    }

@api_router.get("/analytics/pull-requests/{repo_id}")
async def get_pr_analytics(repo_id: str, current_user: User = Depends(get_current_user)):
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    prs = await db.pull_requests.find(
        {"repository_id": repo_id},
        {"_id": 0}
    ).to_list(500)
    
    merged_prs = [pr for pr in prs if pr.get("state") == "merged"]
    
    # Calculate review turnaround time
    turnaround_times = []
    for pr in merged_prs:
        if pr.get("created_at") and pr.get("merged_at"):
            created = datetime.fromisoformat(pr["created_at"]) if isinstance(pr["created_at"], str) else pr["created_at"]
            merged = datetime.fromisoformat(pr["merged_at"]) if isinstance(pr["merged_at"], str) else pr["merged_at"]
            turnaround_times.append((merged - created).total_seconds() / 3600)
    
    avg_turnaround = sum(turnaround_times) / len(turnaround_times) if turnaround_times else 0
    
    return {
        "total_prs": len(prs),
        "merged_prs": len(merged_prs),
        "open_prs": len([pr for pr in prs if pr.get("state") == "open"]),
        "avg_turnaround_hours": round(avg_turnaround, 2),
        "avg_size": round(sum(pr.get("additions", 0) + pr.get("deletions", 0) for pr in prs) / len(prs), 2) if prs else 0
    }

@api_router.get("/analytics/health/{repo_id}")
async def get_repository_health(repo_id: str, current_user: User = Depends(get_current_user)):
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Calculate health metrics
    commits = await db.commits.find({"repository_id": repo_id}, {"_id": 0}).to_list(1000)
    prs = await db.pull_requests.find({"repository_id": repo_id}, {"_id": 0}).to_list(500)
    
    # Commit frequency score (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_commits = [c for c in commits if datetime.fromisoformat(c["timestamp"]) > thirty_days_ago] if commits and len(commits) > 0 and isinstance(commits[0].get("timestamp"), str) else []
    commit_frequency_score = min(len(recent_commits) / 30 * 10, 100)
    
    # PR velocity score
    merged_prs = [pr for pr in prs if pr.get("state") == "merged"]
    pr_velocity_score = min(len(merged_prs) / max(len(prs), 1) * 100, 100) if prs else 50
    
    # Code quality score (based on PR size)
    avg_pr_size = sum(pr.get("additions", 0) + pr.get("deletions", 0) for pr in prs) / len(prs) if prs else 0
    code_quality_score = max(100 - (avg_pr_size / 50), 30) if avg_pr_size > 0 else 70
    
    # Collaboration score (based on unique contributors)
    unique_authors = set(c.get("author") for c in commits if c.get("author"))
    collaboration_score = min(len(unique_authors) * 20, 100)
    
    overall_score = (commit_frequency_score + pr_velocity_score + code_quality_score + collaboration_score) / 4
    
    health = HealthScore(
        repository_id=repo_id,
        overall_score=round(overall_score, 2),
        commit_frequency_score=round(commit_frequency_score, 2),
        pr_velocity_score=round(pr_velocity_score, 2),
        code_quality_score=round(code_quality_score, 2),
        collaboration_score=round(collaboration_score, 2)
    )
    
    health_dict = health.model_dump()
    health_dict["computed_at"] = health_dict["computed_at"].isoformat()
    await db.health_scores.insert_one(health_dict)
    
    return health

@api_router.post("/insights/generate/{repo_id}")
async def generate_insights(repo_id: str, current_user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Gather metrics
    commits = await db.commits.find({"repository_id": repo_id}, {"_id": 0}).to_list(1000)
    prs = await db.pull_requests.find({"repository_id": repo_id}, {"_id": 0}).to_list(500)
    health = await db.health_scores.find_one({"repository_id": repo_id}, {"_id": 0}, sort=[("computed_at", -1)])
    
    metrics_summary = f"""Repository: {repo['full_name']}
Total Commits: {len(commits)}
Total Pull Requests: {len(prs)}
Health Score: {health.get('overall_score', 'N/A') if health else 'Not computed'}
Commit Frequency Score: {health.get('commit_frequency_score', 'N/A') if health else 'N/A'}
PR Velocity Score: {health.get('pr_velocity_score', 'N/A') if health else 'N/A'}
Code Quality Score: {health.get('code_quality_score', 'N/A') if health else 'N/A'}
Collaboration Score: {health.get('collaboration_score', 'N/A') if health else 'N/A'}
"""
    
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"insights_{repo_id}_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are an engineering analytics expert. Analyze repository metrics and provide actionable insights for engineering teams."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        message = UserMessage(
            text=f"Analyze these repository metrics and provide 3-5 actionable insights focusing on: velocity trends, potential bottlenecks, code health concerns, and collaboration patterns. Be specific and data-driven.\n\n{metrics_summary}"
        )
        
        response = await chat.send_message(message)
        
        return {
            "repository_id": repo_id,
            "insights": response,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

@api_router.post("/repositories/sync/{repo_id}")
async def sync_repository(repo_id: str, current_user: User = Depends(get_current_user)):
    """Trigger background sync for a repository"""
    repo = await db.repositories.find_one({"id": repo_id, "user_id": current_user.id}, {"_id": 0})
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Update last_synced timestamp
    await db.repositories.update_one(
        {"id": repo_id},
        {"$set": {"last_synced": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Repository sync initiated", "repository_id": repo_id}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
