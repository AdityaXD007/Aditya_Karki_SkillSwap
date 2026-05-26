# SkillSwap: A Peer-to-Peer Skill Exchange Platform

SkillSwap is a comprehensive full-stack web application developed to facilitate the exchange of skills and knowledge between users. The platform enables individuals to connect, schedule learning sessions, and manage skill-sharing transactions in a secure and intuitive environment.

## Project Overview

The primary objective of SkillSwap is to create a decentralized learning ecosystem where users can both teach and learn various disciplines. By integrating real-time communication, session coordination, and skill-based matching, the platform streamlines the process of peer-to-peer knowledge transfer.

## Key Features

- Skill Management: Comprehensive system for creating, browsing, and searching skill categories.
- User Matching: Custom algorithms to connect users based on complementary skill interests.
- Real-time Communication: Integrated WebRTC video calls with screen-sharing and direct messaging.
- Session Coordination: Facilitated system for users to arrange and manage one-on-one learning sessions.
- Payment Processing: Secure transaction management for premium skill exchanges.
- Notification System: Email and system alerts for account activities and session updates.
- User Dashboard: Centralized interface for managing profiles, skills, and active learning sessions.

## Technical Specifications

### Frontend Architecture
- Core Framework: React 19 with Vite build tool.
- Programming Language: TypeScript for static type safety.
- Styling: Tailwind CSS for responsive design and Radix UI for accessible components.
- State Management: TanStack Query for efficient server-state synchronization.
- Motion and Interaction: Framer Motion for interface transitions.
- Form Validation: React Hook Form integrated with Zod schema validation.

### Backend Architecture
- Core Framework: Django Web Framework.
- Programming Language: Python 3.x.
- Database Management: PostgreSQL.
- Security: JWT (JSON Web Tokens) and Django Rest Framework authentication.

### Infrastructure
- Deployment: Containerized using Docker.
- Orchestration: Docker Compose for multi-service management.

## System Directory Structure

SkillSwap/
├── Backend/                # Django Application Source
│   ├── ai_assistant/       # AI Integration Modules
│   ├── chat/               # Messaging Services
│   ├── learning/           # Session Booking Logic
│   ├── notifications/      # Alert and Email Services
│   ├── payment/            # Transaction Logic
│   ├── skills/             # Skill Repository Management
│   ├── users/              # Authentication and Profile Management
│   └── manage.py           # Project Management CLI
├── Frontend/               # React Application Source
│   ├── src/
│   │   ├── components/     # UI Component Library
│   │   ├── pages/          # View Implementations
│   │   ├── services/       # API Integration Layer
│   │   └── types/          # Type Definitions
│   └── package.json        # Node.js Project Configuration
└── docker-compose.yml      # Container Configuration

## Installation and Configuration

### Prerequisites
- Python 3.10+ (for local development)
- Node.js 18+ (for local development)

### Containerized Deployment
To deploy the full system using Docker:
1. Clone the repository to the local environment.
2. Execute the following command in the root directory:
   docker-compose up --build
3. Access the application at http://localhost:5173.

### Local Development Setup

#### Backend Configuration
1. Navigate to the Backend directory.
2. Initialize a Python virtual environment.
3. Install required dependencies:
   pip install -r requirements.txt
4. Execute database migrations:
   python manage.py migrate
5. Initialize the development server:
   python manage.py runserver

#### Frontend Configuration
1. Navigate to the Frontend directory.
2. Install Node.js dependencies:
   npm install
3. Execute the development server:
   npm run dev

## Testing and Verification

### Backend Unit Testing
To execute the automated test suite:
python manage.py test

### Code Coverage Analysis
To generate technical coverage reports:
coverage run manage.py test
coverage html

## Project Attribution

- Author: Aditya Karki
- Repository: AdityaXD007/Aditya_Karki_SkillSwap
- License: MIT License
