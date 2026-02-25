from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from groq import Groq
from decouple import config

class AIChatView(APIView):
    def post(self, request):
        user_message = request.data.get('message')
        history = request.data.get('history', [])
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        api_key = config('GROQ_API_KEY', default='')
        
        if not api_key:
            return Response({"error": "Groq API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        client = Groq(api_key=api_key)
        
        system_prompt = (
            "You are the SkillSwap Assistant, a helpful and friendly AI guide for the SkillSwap platform. "
            "SkillSwap is a web application where users can exchange skills - you teach what you know, and learn what you don't. "
            "Your goal is to help users navigate the site, understand how skill swapping works, and provide guidance on how to find matches. "
            "Features of SkillSwap include: "
            "1. Dashboard: See your recent activity and recommendations. "
            "2. Profile: Manage the skills you want to learn and the skills you can teach. "
            "3. Matches: Use our smart matching system to find users whose skills complement yours. "
            "4. Bookings: Schedule and manage your learning sessions. "
            "5. Messages: Chat directly with your matches to coordinate. "
            "Always be encouraging, professional, and concise. If you don't know something about the user specifically, "
            "ask them to check their profile or dashboard."
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (limit to last 5 exchanges to save tokens/context)
        for msg in history[-10:]:
            messages.append(msg)
            
        messages.append({"role": "user", "content": user_message})
        
        try:
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
            )
            
            bot_response = chat_completion.choices[0].message.content
            return Response({"response": bot_response})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
