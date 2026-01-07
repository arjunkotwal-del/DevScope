import requests
import sys
import json
from datetime import datetime

class DevScopeAPITester:
    def __init__(self, base_url="https://gitmetrics.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.repositories = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {json.dumps(response_data, indent=2)}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with demo credentials"""
        success, response = self.run_test(
            "Login with demo credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "[email protected]", "password": "demo123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response.get('user', {})
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test GET /api/auth/me with valid token"""
        success, response = self.run_test(
            "Get current user info",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_repositories(self):
        """Test GET /api/repositories"""
        success, response = self.run_test(
            "Get user repositories",
            "GET",
            "repositories",
            200
        )
        if success and isinstance(response, list):
            self.repositories = response
            print(f"   Found {len(self.repositories)} repositories")
        return success

    def test_analytics_overview(self):
        """Test GET /api/analytics/overview"""
        success, response = self.run_test(
            "Get analytics overview",
            "GET",
            "analytics/overview",
            200
        )
        return success

    def test_commit_analytics(self, repo_id):
        """Test GET /api/analytics/commits/{repo_id}"""
        success, response = self.run_test(
            f"Get commit analytics for repo {repo_id}",
            "GET",
            f"analytics/commits/{repo_id}",
            200
        )
        return success

    def test_pr_analytics(self, repo_id):
        """Test GET /api/analytics/pull-requests/{repo_id}"""
        success, response = self.run_test(
            f"Get PR analytics for repo {repo_id}",
            "GET",
            f"analytics/pull-requests/{repo_id}",
            200
        )
        return success

    def test_health_analytics(self, repo_id):
        """Test GET /api/analytics/health/{repo_id}"""
        success, response = self.run_test(
            f"Get health analytics for repo {repo_id}",
            "GET",
            f"analytics/health/{repo_id}",
            200
        )
        return success

    def test_generate_insights(self, repo_id):
        """Test POST /api/insights/generate/{repo_id}"""
        success, response = self.run_test(
            f"Generate AI insights for repo {repo_id}",
            "POST",
            f"insights/generate/{repo_id}",
            200
        )
        return success

    def test_github_oauth_url(self):
        """Test GET /api/auth/github/login (get OAuth URL)"""
        success, response = self.run_test(
            "Get GitHub OAuth URL",
            "GET",
            "auth/github/login",
            200
        )
        if success and 'auth_url' in response:
            print(f"   OAuth URL: {response['auth_url'][:100]}...")
            # Verify URL structure
            auth_url = response['auth_url']
            if 'github.com/login/oauth/authorize' in auth_url and 'client_id=' in auth_url:
                print("   ✅ OAuth URL structure is correct")
            else:
                print("   ❌ OAuth URL structure is incorrect")
        return success

    def test_import_repositories_without_github(self):
        """Test POST /api/repositories/import (expect error without GitHub token)"""
        success, response = self.run_test(
            "Import repositories without GitHub token",
            "POST",
            "repositories/import",
            400  # Expecting 400 error
        )
        return success

    def test_unauthorized_requests(self):
        """Test API endpoints without authentication"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized request to /repositories",
            "GET",
            "repositories",
            401  # Expecting 401 Unauthorized
        )
        
        # Restore token
        self.token = original_token
        return success

def main():
    print("🚀 Starting DevScope API Testing...")
    print("=" * 60)
    
    # Setup
    tester = DevScopeAPITester()

    # Test authentication flow
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    if not tester.test_auth_me():
        print("❌ Auth/me failed")
        return 1

    # Test repository endpoints
    print("\n📋 REPOSITORY TESTS")
    print("-" * 30)
    
    if not tester.test_get_repositories():
        print("❌ Get repositories failed")
        return 1

    # Test analytics endpoints
    print("\n📋 ANALYTICS TESTS")
    print("-" * 30)
    
    if not tester.test_analytics_overview():
        print("❌ Analytics overview failed")
        return 1

    # Test repository-specific analytics if we have repositories
    if tester.repositories and len(tester.repositories) > 0:
        first_repo = tester.repositories[0]
        repo_id = first_repo.get('id')
        
        if repo_id:
            print(f"\n📋 REPOSITORY-SPECIFIC TESTS (Repo: {first_repo.get('name', 'Unknown')})")
            print("-" * 50)
            
            tester.test_commit_analytics(repo_id)
            tester.test_pr_analytics(repo_id)
            tester.test_health_analytics(repo_id)
            
            # Test AI insights (this might take longer)
            print("\n📋 AI INSIGHTS TEST")
            print("-" * 30)
            tester.test_generate_insights(repo_id)
    else:
        print("⚠️  No repositories found, skipping repository-specific tests")

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())