"""Seed demo data for DevScope"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import random
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    print("Seeding demo data...")
    
    # Create demo user
    demo_user = {
        "id": str(uuid.uuid4()),
        "email": "[email protected]",
        "name": "Demo User",
        "password": pwd_context.hash("demo123"),
        "avatar_url": None,
        "github_token": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_user = await db.users.find_one({"email": "[email protected]"})
    if existing_user:
        user_id = existing_user["id"]
        print(f"Demo user already exists with ID: {user_id}")
    else:
        await db.users.insert_one(demo_user)
        user_id = demo_user["id"]
        print(f"Created demo user with ID: {user_id}")
    
    # Create demo repositories
    repos = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "github_id": 12345,
            "name": "microservices-platform",
            "full_name": "demo-org/microservices-platform",
            "owner": "demo-org",
            "description": "Enterprise microservices platform with service mesh",
            "url": "https://github.com/demo-org/microservices-platform",
            "is_private": False,
            "language": "Python",
            "stars": 1234,
            "forks": 156,
            "last_synced": datetime.now(timezone.utc).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "github_id": 12346,
            "name": "frontend-dashboard",
            "full_name": "demo-org/frontend-dashboard",
            "owner": "demo-org",
            "description": "Real-time analytics dashboard built with React",
            "url": "https://github.com/demo-org/frontend-dashboard",
            "is_private": False,
            "language": "TypeScript",
            "stars": 892,
            "forks": 78,
            "last_synced": datetime.now(timezone.utc).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "github_id": 12347,
            "name": "ml-pipeline",
            "full_name": "demo-org/ml-pipeline",
            "owner": "demo-org",
            "description": "Machine learning data pipeline infrastructure",
            "url": "https://github.com/demo-org/ml-pipeline",
            "is_private": True,
            "language": "Python",
            "stars": 445,
            "forks": 34,
            "last_synced": datetime.now(timezone.utc).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        }
    ]
    
    await db.repositories.delete_many({"user_id": user_id})
    await db.repositories.insert_many(repos)
    print(f"Created {len(repos)} demo repositories")
    
    # Generate commits for each repo
    authors = ["alice.smith", "bob.jones", "carol.williams", "david.brown", "emma.davis"]
    
    for repo in repos:
        commits = []
        # Generate 90 days of commits with varying frequency
        for day in range(90):
            commit_date = datetime.now(timezone.utc) - timedelta(days=day)
            # Random number of commits per day (0-5)
            daily_commits = random.randint(0, 5)
            for _ in range(daily_commits):
                commits.append({
                    "id": str(uuid.uuid4()),
                    "repository_id": repo["id"],
                    "sha": f"{random.randint(1000000, 9999999):x}",
                    "author": random.choice(authors),
                    "author_email": f"{random.choice(authors)}@example.com",
                    "message": random.choice([
                        "feat: add new feature",
                        "fix: resolve bug in module",
                        "refactor: improve code structure",
                        "docs: update documentation",
                        "test: add unit tests",
                        "perf: optimize query performance"
                    ]),
                    "timestamp": commit_date.isoformat(),
                    "files_changed": random.randint(1, 10),
                    "additions": random.randint(10, 500),
                    "deletions": random.randint(5, 200),
                    "url": f"https://github.com/{repo['full_name']}/commit/{random.randint(1000000, 9999999):x}"
                })
        
        if commits:
            await db.commits.insert_many(commits)
        print(f"Generated {len(commits)} commits for {repo['name']}")
        
        # Generate pull requests
        prs = []
        for i in range(random.randint(10, 30)):
            created = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))
            state = random.choice(["open", "merged", "closed"])
            merged_at = (created + timedelta(hours=random.randint(2, 72))).isoformat() if state == "merged" else None
            closed_at = (created + timedelta(hours=random.randint(1, 120))).isoformat() if state == "closed" else None
            
            prs.append({
                "id": str(uuid.uuid4()),
                "repository_id": repo["id"],
                "github_id": random.randint(1000, 9999),
                "number": i + 1,
                "title": random.choice([
                    "Feature: Implement new authentication flow",
                    "Fix: Resolve memory leak in worker",
                    "Refactor: Modernize API structure",
                    "Enhancement: Improve error handling",
                    "Update: Dependencies and security patches"
                ]),
                "author": random.choice(authors),
                "state": state,
                "created_at": created.isoformat(),
                "merged_at": merged_at,
                "closed_at": closed_at,
                "additions": random.randint(50, 1000),
                "deletions": random.randint(20, 400),
                "changed_files": random.randint(2, 15),
                "comments": random.randint(0, 20),
                "url": f"https://github.com/{repo['full_name']}/pull/{i + 1}"
            })
        
        if prs:
            await db.pull_requests.insert_many(prs)
        print(f"Generated {len(prs)} pull requests for {repo['name']}")
    
    print("\n✓ Seed data created successfully!")
    print(f"\nDemo credentials:")
    print(f"Email: [email protected]")
    print(f"Password: demo123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
