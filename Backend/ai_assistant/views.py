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
            "SkillSwap is a peer-to-peer learning platform where users exchange skills. "
            "\n\nSTRICT GUIDELINES FOR RESPONSES:\n"
            "- Use Markdown formatting (bold, italics).\n"
            "- ALWAYS use bullet points or numbered lists for steps and instructions.\n"
            "- Keep responses extremely concise and structure them with clear points.\n"
            "- Avoid long paragraphs.\n"
            "- If explaining a feature, use a short title and then bullet points.\n"
            "\nFeatures of SkillSwap:\n"
            "- Dashboard: Recent activity and recommendations.\n"
            "- Profile: Manage learning and teaching skills.\n"
            "- Matches: Smart matching for complementary skills.\n"
            "- Bookings: Schedule and manage learning sessions.\n"
            "- Messages: Direct chat to coordinate with matches.\n"
            "\nEncourage users and be professional. If specifics are unknown, point them to their profile/dashboard."
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
