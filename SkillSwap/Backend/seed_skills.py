import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SkillSwap.settings')
django.setup()

from skills.models import Skill

skills = [
    # Development
    {"name": "React", "category": "Development", "icon_class": "fab fa-react", "color_class": "text-blue-500"},
    {"name": "Node.js", "category": "Development", "icon_class": "fab fa-node-js", "color_class": "text-green-500"},
    {"name": "TypeScript", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-blue-600"},
    {"name": "Python", "category": "Development", "icon_class": "fab fa-python", "color_class": "text-yellow-500"},
    {"name": "JavaScript", "category": "Development", "icon_class": "fab fa-js", "color_class": "text-yellow-400"},
    {"name": "Java", "category": "Development", "icon_class": "fab fa-java", "color_class": "text-red-600"},
    {"name": "C++", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-blue-700"},
    {"name": "Go", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-cyan-500"},
    {"name": "Rust", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-orange-600"},
    {"name": "PHP", "category": "Development", "icon_class": "fab fa-php", "color_class": "text-indigo-600"},
    {"name": "Ruby", "category": "Development", "icon_class": "fas fa-gem", "color_class": "text-red-500"},
    {"name": "Swift", "category": "Development", "icon_class": "fab fa-swift", "color_class": "text-orange-500"},
    {"name": "Kotlin", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-purple-600"},
    {"name": "Django", "category": "Development", "icon_class": "fab fa-python", "color_class": "text-green-700"},
    {"name": "Flask", "category": "Development", "icon_class": "fas fa-flask", "color_class": "text-gray-700"},
    {"name": "Vue.js", "category": "Development", "icon_class": "fab fa-vuejs", "color_class": "text-green-600"},
    {"name": "Angular", "category": "Development", "icon_class": "fab fa-angular", "color_class": "text-red-600"},
    {"name": "Next.js", "category": "Development", "icon_class": "fas fa-code", "color_class": "text-black"},
    {"name": "Express.js", "category": "Development", "icon_class": "fas fa-server", "color_class": "text-gray-600"},
    {"name": "Spring Boot", "category": "Development", "icon_class": "fas fa-leaf", "color_class": "text-green-600"},
    
    # Design
    {"name": "UI/UX Design", "category": "Design", "icon_class": "fas fa-paint-brush", "color_class": "text-purple-500"},
    {"name": "Figma", "category": "Design", "icon_class": "fab fa-figma", "color_class": "text-pink-500"},
    {"name": "Adobe XD", "category": "Design", "icon_class": "fas fa-pen-nib", "color_class": "text-purple-600"},
    {"name": "Sketch", "category": "Design", "icon_class": "fas fa-pencil-ruler", "color_class": "text-orange-400"},
    {"name": "Photoshop", "category": "Design", "icon_class": "fas fa-image", "color_class": "text-blue-600"},
    {"name": "Illustrator", "category": "Design", "icon_class": "fas fa-vector-square", "color_class": "text-orange-600"},
    {"name": "Graphic Design", "category": "Design", "icon_class": "fas fa-palette", "color_class": "text-pink-600"},
    {"name": "Logo Design", "category": "Design", "icon_class": "fas fa-copyright", "color_class": "text-indigo-600"},
    {"name": "Web Design", "category": "Design", "icon_class": "fas fa-desktop", "color_class": "text-teal-600"},
    {"name": "Motion Graphics", "category": "Design", "icon_class": "fas fa-film", "color_class": "text-red-500"},
    {"name": "3D Modeling", "category": "Design", "icon_class": "fas fa-cube", "color_class": "text-purple-700"},
    {"name": "Blender", "category": "Design", "icon_class": "fas fa-cube", "color_class": "text-orange-500"},
    
    # Data & AI
    {"name": "Machine Learning", "category": "Data & AI", "icon_class": "fas fa-brain", "color_class": "text-pink-600"},
    {"name": "Data Science", "category": "Data & AI", "icon_class": "fas fa-chart-line", "color_class": "text-blue-600"},
    {"name": "Deep Learning", "category": "Data & AI", "icon_class": "fas fa-network-wired", "color_class": "text-purple-600"},
    {"name": "TensorFlow", "category": "Data & AI", "icon_class": "fas fa-robot", "color_class": "text-orange-600"},
    {"name": "PyTorch", "category": "Data & AI", "icon_class": "fas fa-fire", "color_class": "text-red-600"},
    {"name": "Data Analysis", "category": "Data & AI", "icon_class": "fas fa-chart-bar", "color_class": "text-green-600"},
    {"name": "SQL", "category": "Data & AI", "icon_class": "fas fa-database", "color_class": "text-blue-700"},
    {"name": "Tableau", "category": "Data & AI", "icon_class": "fas fa-chart-pie", "color_class": "text-orange-500"},
    {"name": "Power BI", "category": "Data & AI", "icon_class": "fas fa-chart-area", "color_class": "text-yellow-600"},
    {"name": "Excel", "category": "Data & AI", "icon_class": "fas fa-file-excel", "color_class": "text-green-700"},
    
    # DevOps & Cloud
    {"name": "Docker", "category": "DevOps", "icon_class": "fab fa-docker", "color_class": "text-blue-500"},
    {"name": "Kubernetes", "category": "DevOps", "icon_class": "fas fa-dharmachakra", "color_class": "text-blue-600"},
    {"name": "AWS", "category": "DevOps", "icon_class": "fab fa-aws", "color_class": "text-orange-500"},
    {"name": "Azure", "category": "DevOps", "icon_class": "fab fa-microsoft", "color_class": "text-blue-600"},
    {"name": "Google Cloud", "category": "DevOps", "icon_class": "fab fa-google", "color_class": "text-red-500"},
    {"name": "CI/CD", "category": "DevOps", "icon_class": "fas fa-cogs", "color_class": "text-gray-600"},
    {"name": "Jenkins", "category": "DevOps", "icon_class": "fas fa-tools", "color_class": "text-red-600"},
    {"name": "Git", "category": "DevOps", "icon_class": "fab fa-git-alt", "color_class": "text-orange-600"},
    {"name": "Linux", "category": "DevOps", "icon_class": "fab fa-linux", "color_class": "text-yellow-600"},
    {"name": "Nginx", "category": "DevOps", "icon_class": "fas fa-server", "color_class": "text-green-600"},
    
    # Languages
    {"name": "English", "category": "Languages", "icon_class": "fas fa-language", "color_class": "text-blue-600"},
    {"name": "Spanish", "category": "Languages", "icon_class": "fas fa-globe", "color_class": "text-red-600"},
    {"name": "French", "category": "Languages", "icon_class": "fas fa-flag", "color_class": "text-blue-700"},
    {"name": "German", "category": "Languages", "icon_class": "fas fa-language", "color_class": "text-gray-700"},
    {"name": "Mandarin", "category": "Languages", "icon_class": "fas fa-yin-yang", "color_class": "text-red-700"},
    {"name": "Japanese", "category": "Languages", "icon_class": "fas fa-torii-gate", "color_class": "text-pink-600"},
    {"name": "Korean", "category": "Languages", "icon_class": "fas fa-language", "color_class": "text-blue-500"},
    {"name": "Arabic", "category": "Languages", "icon_class": "fas fa-mosque", "color_class": "text-green-700"},
    {"name": "Italian", "category": "Languages", "icon_class": "fas fa-pizza-slice", "color_class": "text-green-600"},
    {"name": "Portuguese", "category": "Languages", "icon_class": "fas fa-globe-americas", "color_class": "text-yellow-600"},
    {"name": "Hindi", "category": "Languages", "icon_class": "fas fa-language", "color_class": "text-orange-600"},
    
    # Music
    {"name": "Guitar", "category": "Music", "icon_class": "fas fa-music", "color_class": "text-yellow-600"},
    {"name": "Piano", "category": "Music", "icon_class": "fas fa-music", "color_class": "text-gray-800"},
    {"name": "Drums", "category": "Music", "icon_class": "fas fa-drum", "color_class": "text-red-600"},
    {"name": "Violin", "category": "Music", "icon_class": "fas fa-music", "color_class": "text-brown-600"},
    {"name": "Singing", "category": "Music", "icon_class": "fas fa-microphone-alt", "color_class": "text-pink-600"},
    {"name": "Music Production", "category": "Music", "icon_class": "fas fa-sliders-h", "color_class": "text-purple-600"},
    {"name": "DJ Mixing", "category": "Music", "icon_class": "fas fa-headphones", "color_class": "text-cyan-600"},
    {"name": "Music Theory", "category": "Music", "icon_class": "fas fa-book-open", "color_class": "text-indigo-600"},
    
    # Soft Skills
    {"name": "Public Speaking", "category": "Soft Skills", "icon_class": "fas fa-microphone", "color_class": "text-red-500"},
    {"name": "Leadership", "category": "Soft Skills", "icon_class": "fas fa-users", "color_class": "text-blue-600"},
    {"name": "Communication", "category": "Soft Skills", "icon_class": "fas fa-comments", "color_class": "text-green-600"},
    {"name": "Time Management", "category": "Soft Skills", "icon_class": "fas fa-clock", "color_class": "text-purple-600"},
    {"name": "Project Management", "category": "Soft Skills", "icon_class": "fas fa-tasks", "color_class": "text-orange-600"},
    {"name": "Critical Thinking", "category": "Soft Skills", "icon_class": "fas fa-lightbulb", "color_class": "text-yellow-500"},
    {"name": "Problem Solving", "category": "Soft Skills", "icon_class": "fas fa-puzzle-piece", "color_class": "text-teal-600"},
    {"name": "Team Collaboration", "category": "Soft Skills", "icon_class": "fas fa-handshake", "color_class": "text-blue-500"},
    {"name": "Negotiation", "category": "Soft Skills", "icon_class": "fas fa-balance-scale", "color_class": "text-indigo-600"},
    {"name": "Emotional Intelligence", "category": "Soft Skills", "icon_class": "fas fa-heart", "color_class": "text-pink-600"},
    
    # Business & Marketing
    {"name": "Digital Marketing", "category": "Business", "icon_class": "fas fa-bullhorn", "color_class": "text-orange-600"},
    {"name": "SEO", "category": "Business", "icon_class": "fas fa-search", "color_class": "text-green-600"},
    {"name": "Content Marketing", "category": "Business", "icon_class": "fas fa-pen-fancy", "color_class": "text-blue-600"},
    {"name": "Social Media Marketing", "category": "Business", "icon_class": "fas fa-hashtag", "color_class": "text-pink-600"},
    {"name": "Email Marketing", "category": "Business", "icon_class": "fas fa-envelope", "color_class": "text-red-600"},
    {"name": "Copywriting", "category": "Business", "icon_class": "fas fa-pencil-alt", "color_class": "text-purple-600"},
    {"name": "Sales", "category": "Business", "icon_class": "fas fa-chart-line", "color_class": "text-green-700"},
    {"name": "Entrepreneurship", "category": "Business", "icon_class": "fas fa-rocket", "color_class": "text-blue-700"},
    {"name": "Business Strategy", "category": "Business", "icon_class": "fas fa-chess", "color_class": "text-gray-700"},
    {"name": "Financial Analysis", "category": "Business", "icon_class": "fas fa-dollar-sign", "color_class": "text-green-600"},
    
    # Photography & Video
    {"name": "Photography", "category": "Photography", "icon_class": "fas fa-camera", "color_class": "text-gray-700"},
    {"name": "Video Editing", "category": "Photography", "icon_class": "fas fa-video", "color_class": "text-red-600"},
    {"name": "Videography", "category": "Photography", "icon_class": "fas fa-film", "color_class": "text-purple-600"},
    {"name": "Adobe Premiere", "category": "Photography", "icon_class": "fas fa-cut", "color_class": "text-indigo-600"},
    {"name": "Final Cut Pro", "category": "Photography", "icon_class": "fas fa-scissors", "color_class": "text-blue-600"},
    {"name": "Lightroom", "category": "Photography", "icon_class": "fas fa-image", "color_class": "text-cyan-600"},
    {"name": "DaVinci Resolve", "category": "Photography", "icon_class": "fas fa-film", "color_class": "text-red-700"},
    
    # Fitness & Wellness
    {"name": "Yoga", "category": "Fitness", "icon_class": "fas fa-spa", "color_class": "text-purple-500"},
    {"name": "Meditation", "category": "Fitness", "icon_class": "fas fa-om", "color_class": "text-indigo-600"},
    {"name": "Personal Training", "category": "Fitness", "icon_class": "fas fa-dumbbell", "color_class": "text-red-600"},
    {"name": "Nutrition", "category": "Fitness", "icon_class": "fas fa-apple-alt", "color_class": "text-green-600"},
    {"name": "Pilates", "category": "Fitness", "icon_class": "fas fa-running", "color_class": "text-pink-600"},
    {"name": "Martial Arts", "category": "Fitness", "icon_class": "fas fa-fist-raised", "color_class": "text-orange-700"},
    {"name": "Swimming", "category": "Fitness", "icon_class": "fas fa-swimmer", "color_class": "text-blue-500"},
    {"name": "Running", "category": "Fitness", "icon_class": "fas fa-running", "color_class": "text-green-600"},
    
    # Arts & Crafts
    {"name": "Drawing", "category": "Arts", "icon_class": "fas fa-pencil-alt", "color_class": "text-gray-700"},
    {"name": "Painting", "category": "Arts", "icon_class": "fas fa-palette", "color_class": "text-purple-600"},
    {"name": "Sculpture", "category": "Arts", "icon_class": "fas fa-monument", "color_class": "text-brown-600"},
    {"name": "Pottery", "category": "Arts", "icon_class": "fas fa-mug-hot", "color_class": "text-orange-600"},
    {"name": "Knitting", "category": "Arts", "icon_class": "fas fa-mitten", "color_class": "text-pink-600"},
    {"name": "Sewing", "category": "Arts", "icon_class": "fas fa-cut", "color_class": "text-teal-600"},
    {"name": "Origami", "category": "Arts", "icon_class": "fas fa-paper-plane", "color_class": "text-red-500"},
    {"name": "Calligraphy", "category": "Arts", "icon_class": "fas fa-feather-alt", "color_class": "text-indigo-700"},
    
    # Cooking & Culinary
    {"name": "Cooking", "category": "Culinary", "icon_class": "fas fa-utensils", "color_class": "text-orange-600"},
    {"name": "Baking", "category": "Culinary", "icon_class": "fas fa-birthday-cake", "color_class": "text-pink-500"},
    {"name": "Pastry", "category": "Culinary", "icon_class": "fas fa-cookie", "color_class": "text-yellow-600"},
    {"name": "Italian Cuisine", "category": "Culinary", "icon_class": "fas fa-pizza-slice", "color_class": "text-red-600"},
    {"name": "Asian Cuisine", "category": "Culinary", "icon_class": "fas fa-bowl-rice", "color_class": "text-orange-700"},
    {"name": "Vegan Cooking", "category": "Culinary", "icon_class": "fas fa-leaf", "color_class": "text-green-600"},
    {"name": "BBQ & Grilling", "category": "Culinary", "icon_class": "fas fa-fire", "color_class": "text-red-700"},
]

for skill_data in skills:
    skill, created = Skill.objects.get_or_create(name=skill_data["name"], defaults=skill_data)
    if created:
        print(f"✓ Created: {skill.name}")
    else:
        print(f"⊙ Already exists: {skill.name}")

print(f"\n{'='*50}")
print(f"Successfully processed {len(skills)} skills.")
print(f"{'='*50}")