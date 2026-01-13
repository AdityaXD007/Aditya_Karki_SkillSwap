import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Calendar, 
  Star, 
  TrendingUp,
  Check,
  Sparkles,
  Zap,
  Globe,
  Award
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

export const Landing: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hero slider images
  const heroImages = [
    'https://images.unsplash.com/photo-1758270704025-0e1a1793e1ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBsZWFybmluZ3xlbnwxfHx8fDE3Njc0MTc3ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1625111380820-9a371d413cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzY3NDU4MjE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1630406144797-821be1f35d75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50b3IlMjB0ZWFjaGluZyUyMHN0dWRlbnR8ZW58MXx8fHwxNzY3NDUyMTU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    'https://images.unsplash.com/photo-1758270704763-22072a90d3b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBsZWFybmluZyUyMGdyb3VwfGVufDF8fHx8MTc2NzQ5MzAxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  ];

  // Auto-rotate images every 4 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const features = [
    {
      icon: Users,
      title: 'Find Your Match',
      description: 'Connect with learners who have skills you want and want skills you have.',
      image: 'https://images.unsplash.com/photo-1617153817979-283ffdcd52f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsYWJvcmF0aW9uJTIwdGVhbXdvcmt8ZW58MXx8fHwxNzY3NDc0NTU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Schedule Sessions',
      description: 'Book flexible learning sessions that fit your schedule.',
      image: 'https://images.unsplash.com/photo-1758873272808-5580ed7deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjB0ZWFjaGluZyUyMHZpZGVvJTIwY2FsbHxlbnwxfHx8fDE3Njc0OTMwMTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'Learn & Teach',
      description: 'Exchange knowledge in a collaborative learning environment.',
      image: 'https://images.unsplash.com/photo-1766867257943-0665537fb2dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2lsbCUyMGRldmVsb3BtZW50JTIwd29ya3Nob3B8ZW58MXx8fHwxNzY3NDkzMDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Your Profile',
      description: 'List skills you want to teach and skills you want to learn.',
      icon: BookOpen,
    },
    {
      step: '02',
      title: 'Get Matched',
      description: 'Our smart algorithm finds the perfect learning partners for you.',
      icon: Zap,
    },
    {
      step: '03',
      title: 'Start Learning',
      description: 'Schedule sessions, exchange knowledge, and grow together.',
      icon: TrendingUp,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '50K+', label: 'Skills Exchanged', icon: Award },
    { value: '95%', label: 'Success Rate', icon: Star },
    { value: '100+', label: 'Countries', icon: Globe },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Graphic Designer',
      content: 'I learned web development while teaching design. Best learning experience ever!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1758270704025-0e1a1793e1ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBsZWFybmluZ3xlbnwxfHx8fDE3Njc0MTc3ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      name: 'Michael Chen',
      role: 'Marketing Manager',
      content: 'The skill matching is incredible. Found the perfect mentor within days!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2NzM4NTE0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      name: 'Emma Williams',
      role: 'Software Engineer',
      content: 'Teaching others while learning new skills has transformed my career!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1758270704763-22072a90d3b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBsZWFybmluZyUyMGdyb3VwfGVufDF8fHx8MTc2NzQ5MzAxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center">
        {/* Background Image Slider */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: currentImageIndex === index ? 1 : 0,
                scale: currentImageIndex === index ? 1.05 : 1
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <ImageWithFallback
                src={image}
                alt={`Hero background ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Subtle dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/60 to-gray-900/70" />
            </motion.div>
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Join 10,000+ learners worldwide</span>
            </motion.div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              Learn New Skills.
              <br />
              <span className="text-blue-400 drop-shadow-lg">
                Teach Your Expertise.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/95 mb-10 max-w-3xl mx-auto drop-shadow-lg">
              The revolutionary platform where knowledge flows both ways. Connect with peers, exchange skills, and grow together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/95 backdrop-blur-md text-gray-700 rounded-xl border-2 border-white/50 hover:border-blue-400 hover:text-blue-600 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Sign In
              </Link>
            </div>

            {/* Image slider indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-2 mt-12"
            >
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 shadow-lg ${
                    currentImageIndex === index 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 hover:bg-white/70 w-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Everything You Need to Exchange Skills
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make skill exchange seamless and effective.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="group relative"
              >
                <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <motion.div
                      animate={{ scale: hoveredFeature === index ? 1.1 : 1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <ImageWithFallback
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 transform -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border-2 border-gray-100">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 mx-auto">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-blue-600 mb-2 text-center">{step.step}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-600 text-center">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Loved by Learners Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our community has to say about their experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of learners exchanging skills and growing together. It's free to get started!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="group px-8 py-4 bg-white text-purple-600 rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-transparent text-white rounded-xl border-2 border-white hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-300"
              >
                Sign In Now
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">SE</span>
                </div>
                <span className="font-bold text-white">SkillExchange</span>
              </div>
              <p className="text-sm">
                The future of peer-to-peer learning. Exchange skills, grow together.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/matches" className="hover:text-white transition-colors">Find Skills</Link></li>
                <li><Link to="/bookings" className="hover:text-white transition-colors">Sessions</Link></li>
                <li><Link to="/messages" className="hover:text-white transition-colors">Messages</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 SkillExchange. All rights reserved. Built for learning, powered by community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};