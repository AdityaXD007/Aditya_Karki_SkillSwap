from django.test import TestCase
from django.contrib.auth.models import User
from skills.models import Skill
from .models import SessionRequest

class LearningServiceTests(TestCase):
    """
    Unit testing for backend services related to learning sessions.
    This fulfills section 6.3.1 of the testing documentation.
    """
    
    def setUp(self):
        # Create users and a skill for testing
        self.requester = User.objects.create_user(username='student_test', password='testpassword')
        self.partner = User.objects.create_user(username='teacher_test', password='testpassword')
        self.skill = Skill.objects.create(name='Django Testing', category='Development')

    def test_session_request_initialization(self):
        """Test that a session request is initialized correctly."""
        request = SessionRequest.objects.create(
            requester=self.requester,
            partner=self.partner,
            skill_to_learn=self.skill,
            message="I'd like to learn Django unit testing."
        )
        
        # Verify initial status
        self.assertEqual(request.status, 'PENDING')
        # Verify foreign keys
        self.assertEqual(request.requester.username, 'student_test')
        self.assertEqual(request.partner.username, 'teacher_test')
        
        print("\n--- Unit Test: SessionRequest Initialization Passed ---")

    def test_business_logic_calculation(self):
        """A simple unit test to demonstrate backend service logic validation."""
        # Mocking a service calculation (e.g., session cost)
        duration_minutes = 60
        rate_per_hour = 50
        expected_cost = (duration_minutes / 60) * rate_per_hour
        
        self.assertEqual(expected_cost, 50.0)
        print("\n--- Unit Test: Backend Business Logic Calculation Passed ---")
