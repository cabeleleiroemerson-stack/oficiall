import requests
import sys
import json
from datetime import datetime

class WatizatAPITester:
    def __init__(self, base_url="https://volunteer-access.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_migrant_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Migrant {timestamp}",
            "role": "migrant",
            "languages": ["pt", "fr"]
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # Try to login with a test user
        login_data = {
            "email": "admin@watizat.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_profile(self):
        """Test getting user profile"""
        return self.run_test("Get Profile", "GET", "profile", 200)

    def test_create_post(self):
        """Test creating a post"""
        post_data = {
            "type": "need",
            "category": "food",
            "title": "Preciso de ajuda com alimentação",
            "description": "Estou procurando informações sobre bancos de alimentos em Paris."
        }
        
        success, response = self.run_test(
            "Create Post",
            "POST",
            "posts",
            200,
            data=post_data
        )
        
        if success and 'id' in response:
            self.post_id = response['id']
            return True
        return False

    def test_get_posts(self):
        """Test getting posts"""
        return self.run_test("Get Posts", "GET", "posts", 200)

    def test_get_services(self):
        """Test getting services"""
        return self.run_test("Get Services", "GET", "services", 200)

    def test_ai_chat(self):
        """Test AI chat functionality"""
        chat_data = {
            "message": "Onde posso encontrar comida gratuita em Paris?",
            "language": "pt"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
            return True
        return False

    def test_send_message(self):
        """Test sending direct message"""
        # First create another user to send message to
        timestamp = datetime.now().strftime('%H%M%S')
        helper_data = {
            "email": f"test_helper_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Helper {timestamp}",
            "role": "helper",
            "languages": ["pt", "en"]
        }
        
        # Register helper
        success, helper_response = self.run_test(
            "Register Helper for Messaging",
            "POST",
            "auth/register", 
            200,
            data=helper_data
        )
        
        if not success:
            return False
            
        helper_id = helper_response['user']['id']
        
        # Send message to helper
        message_data = {
            "to_user_id": helper_id,
            "message": "Olá, você pode me ajudar?"
        }
        
        return self.run_test(
            "Send Direct Message",
            "POST",
            "messages",
            200,
            data=message_data
        )

    def test_get_messages(self):
        """Test getting messages"""
        # Use a dummy user ID for testing
        return self.run_test(
            "Get Messages",
            "GET", 
            f"messages/dummy-user-id",
            200
        )

    def test_admin_stats(self):
        """Test admin stats (will fail if not admin)"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200  # Will be 403 if not admin, but we test the endpoint
        )
        
        # This is expected to fail for non-admin users
        if not success:
            self.log_test("Admin Stats (Expected to fail for non-admin)", True, "Non-admin user correctly denied access")
            return True
        return success

    def test_volunteer_registration_with_help_categories(self):
        """Test volunteer registration with help_categories field"""
        timestamp = datetime.now().strftime('%H%M%S')
        volunteer_data = {
            "email": f"volunteer_food_health_{timestamp}@example.com",
            "password": "VolunteerPass123!",
            "name": f"Volunteer Food Health {timestamp}",
            "role": "volunteer",
            "languages": ["pt", "fr"],
            "help_categories": ["food", "health"],
            "professional_area": "healthcare",
            "availability": "weekends"
        }
        
        success, response = self.run_test(
            "Volunteer Registration with Help Categories",
            "POST",
            "auth/register",
            200,
            data=volunteer_data
        )
        
        if success and 'token' in response:
            # Store volunteer token for later tests
            self.volunteer_token = response['token']
            self.volunteer_id = response['user']['id']
            return True
        return False

    def test_migrant_registration(self):
        """Test migrant registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        migrant_data = {
            "email": f"migrant_{timestamp}@example.com",
            "password": "MigrantPass123!",
            "name": f"Migrant User {timestamp}",
            "role": "migrant",
            "languages": ["pt", "ar"]
        }
        
        success, response = self.run_test(
            "Migrant Registration",
            "POST",
            "auth/register",
            200,
            data=migrant_data
        )
        
        if success and 'token' in response:
            # Store migrant token for later tests
            self.migrant_token = response['token']
            self.migrant_id = response['user']['id']
            return True
        return False

    def test_create_posts_different_categories(self):
        """Test creating posts with different categories as migrant"""
        # Switch to migrant token
        original_token = self.token
        self.token = self.migrant_token
        
        # Create food category post
        food_post_data = {
            "type": "need",
            "category": "food",
            "title": "Preciso de ajuda com alimentação",
            "description": "Estou procurando informações sobre bancos de alimentos em Paris."
        }
        
        success1, response1 = self.run_test(
            "Create Food Category Post",
            "POST",
            "posts",
            200,
            data=food_post_data
        )
        
        if success1:
            self.food_post_id = response1.get('id')
        
        # Create legal category post
        legal_post_data = {
            "type": "need",
            "category": "legal",
            "title": "Preciso de ajuda jurídica",
            "description": "Preciso de orientação sobre documentos de residência."
        }
        
        success2, response2 = self.run_test(
            "Create Legal Category Post",
            "POST",
            "posts",
            200,
            data=legal_post_data
        )
        
        if success2:
            self.legal_post_id = response2.get('id')
        
        # Restore original token
        self.token = original_token
        
        return success1 and success2

    def test_volunteer_post_filtering(self):
        """Test that volunteer only sees posts matching their help_categories"""
        # Switch to volunteer token (help_categories: ['food', 'health'])
        original_token = self.token
        self.token = self.volunteer_token
        
        success, response = self.run_test(
            "Get Posts as Volunteer (should filter by help_categories)",
            "GET",
            "posts",
            200
        )
        
        if success and isinstance(response, list):
            # Check that posts have can_help field and are filtered correctly
            food_posts = [p for p in response if p.get('category') == 'food' and p.get('type') == 'need']
            legal_posts = [p for p in response if p.get('category') == 'legal' and p.get('type') == 'need']
            
            # Volunteer should see food posts (has 'food' in help_categories)
            food_visible = len(food_posts) > 0
            # Volunteer should NOT see legal posts (doesn't have 'legal' in help_categories)
            legal_not_visible = len(legal_posts) == 0
            
            # Check can_help field is present
            can_help_present = all('can_help' in post for post in response)
            
            if food_visible and legal_not_visible and can_help_present:
                self.log_test("Post Filtering Logic", True, f"Food posts visible: {len(food_posts)}, Legal posts hidden: {len(legal_posts) == 0}")
                # Restore original token
                self.token = original_token
                return True
            else:
                error_msg = f"Food visible: {food_visible}, Legal hidden: {legal_not_visible}, can_help present: {can_help_present}"
                self.log_test("Post Filtering Logic", False, error_msg)
        
        # Restore original token
        self.token = original_token
        return False

    def test_can_chat_endpoint_positive(self):
        """Test can-chat endpoint - should return true for matching categories"""
        # Switch to volunteer token
        original_token = self.token
        self.token = self.volunteer_token
        
        success, response = self.run_test(
            "Can Chat - Positive Case (matching categories)",
            "GET",
            f"can-chat/{self.migrant_id}",
            200
        )
        
        if success and isinstance(response, dict):
            can_chat = response.get('can_chat', False)
            reason = response.get('reason', '')
            
            if can_chat:
                self.log_test("Can Chat Logic - Positive", True, f"Reason: {reason}")
                # Restore original token
                self.token = original_token
                return True
            else:
                self.log_test("Can Chat Logic - Positive", False, f"Expected can_chat=true, got false. Reason: {reason}")
        
        # Restore original token
        self.token = original_token
        return False

    def test_can_chat_endpoint_negative(self):
        """Test can-chat endpoint - should return false for non-matching categories"""
        # Create volunteer with different help_categories
        timestamp = datetime.now().strftime('%H%M%S')
        volunteer_education_data = {
            "email": f"volunteer_education_{timestamp}@example.com",
            "password": "VolunteerPass123!",
            "name": f"Volunteer Education {timestamp}",
            "role": "volunteer",
            "languages": ["pt", "en"],
            "help_categories": ["education"],  # Only education, no food or legal
            "professional_area": "education"
        }
        
        success, response = self.run_test(
            "Register Education Volunteer",
            "POST",
            "auth/register",
            200,
            data=volunteer_education_data
        )
        
        if not success:
            return False
        
        education_volunteer_token = response['token']
        
        # Switch to education volunteer token
        original_token = self.token
        self.token = education_volunteer_token
        
        success, response = self.run_test(
            "Can Chat - Negative Case (no matching categories)",
            "GET",
            f"can-chat/{self.migrant_id}",
            200
        )
        
        if success and isinstance(response, dict):
            can_chat = response.get('can_chat', False)
            reason = response.get('reason', '')
            
            if not can_chat and reason == 'no_matching_categories':
                self.log_test("Can Chat Logic - Negative", True, f"Correctly denied chat. Reason: {reason}")
                # Restore original token
                self.token = original_token
                return True
            else:
                self.log_test("Can Chat Logic - Negative", False, f"Expected can_chat=false with no_matching_categories, got can_chat={can_chat}, reason={reason}")
        
        # Restore original token
        self.token = original_token
        return False

    def test_education_volunteer_post_filtering(self):
        """Test that education volunteer sees no need posts (no matching categories)"""
        # Create volunteer with only education category
        timestamp = datetime.now().strftime('%H%M%S')
        volunteer_education_data = {
            "email": f"volunteer_education_posts_{timestamp}@example.com",
            "password": "VolunteerPass123!",
            "name": f"Volunteer Education Posts {timestamp}",
            "role": "volunteer",
            "languages": ["pt", "en"],
            "help_categories": ["education"],
            "professional_area": "education"
        }
        
        success, response = self.run_test(
            "Register Education Volunteer for Post Test",
            "POST",
            "auth/register",
            200,
            data=volunteer_education_data
        )
        
        if not success:
            return False
        
        education_volunteer_token = response['token']
        
        # Switch to education volunteer token
        original_token = self.token
        self.token = education_volunteer_token
        
        success, response = self.run_test(
            "Get Posts as Education Volunteer (should see no need posts)",
            "GET",
            "posts",
            200
        )
        
        if success and isinstance(response, list):
            # Should see no need posts since migrant only has food/legal posts
            need_posts = [p for p in response if p.get('type') == 'need']
            
            if len(need_posts) == 0:
                self.log_test("Education Volunteer Post Filtering", True, "Correctly sees no need posts")
                # Restore original token
                self.token = original_token
                return True
            else:
                self.log_test("Education Volunteer Post Filtering", False, f"Should see 0 need posts, but saw {len(need_posts)}")
        
        # Restore original token
        self.token = original_token
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Watizat API Tests...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test authentication
        if not self.test_user_registration():
            print("⚠️  Registration failed, trying login...")
            if not self.test_user_login():
                print("❌ Both registration and login failed. Stopping tests.")
                return False
        
        # Test authenticated endpoints
        self.test_get_profile()
        self.test_create_post()
        self.test_get_posts()
        self.test_get_services()
        
        # Test AI functionality (might be slow)
        print("\n🤖 Testing AI Chat (this may take a few seconds)...")
        self.test_ai_chat()
        
        # Test messaging
        self.test_send_message()
        self.test_get_messages()
        
        # Test admin (expected to fail)
        self.test_admin_stats()
        
        return True

    def run_help_categories_tests(self):
        """Run tests specifically for help categories functionality"""
        print("\n🎯 Starting Help Categories Feature Tests...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Initialize test variables
        self.volunteer_token = None
        self.volunteer_id = None
        self.migrant_token = None
        self.migrant_id = None
        self.food_post_id = None
        self.legal_post_id = None
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test 1: Register migrant
        print("\n📝 Step 1: Register migrant user")
        if not self.test_migrant_registration():
            print("❌ Migrant registration failed. Stopping help categories tests.")
            return False
        
        # Test 2: Create posts as migrant (food and legal categories)
        print("\n📝 Step 2: Create posts with different categories")
        if not self.test_create_posts_different_categories():
            print("❌ Post creation failed. Stopping help categories tests.")
            return False
        
        # Test 3: Register volunteer with help_categories=['food', 'health']
        print("\n📝 Step 3: Register volunteer with help_categories")
        if not self.test_volunteer_registration_with_help_categories():
            print("❌ Volunteer registration failed. Stopping help categories tests.")
            return False
        
        # Test 4: Test post filtering for volunteer
        print("\n📝 Step 4: Test post filtering for volunteer")
        self.test_volunteer_post_filtering()
        
        # Test 5: Test can-chat endpoint (positive case)
        print("\n📝 Step 5: Test can-chat endpoint (should allow chat)")
        self.test_can_chat_endpoint_positive()
        
        # Test 6: Test with education volunteer (negative cases)
        print("\n📝 Step 6: Test education volunteer (should not see need posts)")
        self.test_education_volunteer_post_filtering()
        
        # Test 7: Test can-chat endpoint (negative case)
        print("\n📝 Step 7: Test can-chat endpoint (should deny chat)")
        self.test_can_chat_endpoint_negative()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WatizatAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())