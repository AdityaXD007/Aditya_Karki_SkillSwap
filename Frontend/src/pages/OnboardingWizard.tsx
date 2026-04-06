import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Sparkles, User, GraduationCap, Microscope, Rocket, Search } from 'lucide-react';
import { useAuth } from '@/components/Context/AuthContext';
import { authAPI, skillsAPI, matchesApi } from '@/services';
import type { Skill, Match } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { SkillCard } from '@/components/SkillCard';

const STEPS = [
  { id: 1, title: 'Profile', icon: User, description: 'Basic info' },
  { id: 2, title: 'Teaching', icon: GraduationCap, description: 'Your expertise' },
  { id: 3, title: 'Learning', icon: Microscope, description: 'Your goals' },
  { id: 4, title: 'Discover', icon: Sparkles, description: 'Meet partners' },
];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    bio: user?.bio || '',
    teaching: [] as number[],
    learning: [] as number[],
  });

  // Discovery State
  const [recommendedMatches, setRecommendedMatches] = useState<Match[]>([]);
  const [fetchingMatches, setFetchingMatches] = useState(false);

  // Skills Data
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await skillsAPI.getAllSkills();
        setAvailableSkills(response.data);
      } catch (error) {
        console.error('Failed to fetch skills', error);
        toast.error('Failed to load available skills');
      }
    };
    fetchSkills();
  }, []);

  const handleNext = () => {
    if (currentStep === 1 && !formData.full_name) {
      toast.error('Please enter your display name');
      return;
    }
    if (currentStep < 4) {
      if (currentStep === 3) {
        // Prepare to enter Discovery step - must save first!
        handleSubmit();
      } else {
        setCurrentStep(prev => prev + 1);
        setSearchTerm('');
      }
    } else {
      // Step 4 "Finish" -> Go to Dashboard after context update
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setSearchTerm('');
    }
  };

  const toggleSkill = (skillId: number, type: 'teaching' | 'learning') => {
    setFormData(prev => {
      const current = prev[type];
      const exists = current.includes(skillId);
      if (exists) {
        return { ...prev, [type]: current.filter(id => id !== skillId) };
      } else {
        return { ...prev, [type]: [...current, skillId] };
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Update Profile & Skills together
      await Promise.all([
        authAPI.onboardingUpdate({
          full_name: formData.full_name,
          bio: formData.bio
        }),
        authAPI.onboardingSkills({
          teaching: formData.teaching,
          learning: formData.learning
        })
      ]);

      // 2. Fetch matches now that the data is saved
      setFetchingMatches(true);
      setCurrentStep(4);
      
      try {
        const matchResponse = await matchesApi.getRecommended();
        setRecommendedMatches(matchResponse.data);
      } catch (err) {
        console.error("Failed to fetch matches", err);
      } finally {
        setFetchingMatches(false);
      }

    } catch (error) {
      console.error('Onboarding failed', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = () => {
    // 3. Update local auth context (triggers redirection via ProtectedRoute)
    updateUser({
      name: formData.full_name,
      bio: formData.bio,
      isOnboarded: true
    });

    setIsSuccess(true);
    
    // Redirect after a short delay to show success screen
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const filteredSkills = availableSkills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const progress = (currentStep / STEPS.length) * 100;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
            <Check className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">You're all set!</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome to SkillSwap, {formData.full_name.split(' ')[0]}. We're preparing your personalized dashboard...
            </p>
          </div>
          <div className="flex justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Rocket className="w-8 h-8 text-indigo-600" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Background blobs for premium feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500 blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Welcome to SkillSwap</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Let's build your profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Tell us a bit about yourself to find the best matches.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-500">Step {currentStep} of 4</span>
            <span className="text-indigo-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="hidden md:grid grid-cols-4 gap-4 pt-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                    isActive ? 'opacity-100' : isCompleted ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 
                    'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs">{step.id}</span>}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Display Name <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        placeholder="John Doe" 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="h-12 text-lg"
                      />
                      <p className="text-xs text-slate-400">This is how other users will see you.</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea 
                        placeholder="Tell us about yourself, your background, and why you're here..." 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="min-h-[150px] resize-none text-base"
                      />
                      <p className="text-xs text-slate-400">Briefly describe your interests and goals.</p>
                    </div>
                  </div>
                )}

                {/* Step 2 & 3: Skills Selection */}
                {(currentStep === 2 || currentStep === 3) && (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search skills (e.g. React, Photography, Piano)..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        {currentStep === 2 ? 'Popular Skills to Teach' : 'Popular Skills to Learn'}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredSkills.length > 0 ? (
                          filteredSkills.map((skill) => {
                            const type = currentStep === 2 ? 'teaching' : 'learning';
                            const isSelected = formData[type].includes(skill.id);
                            
                            return (
                              <Badge
                                key={skill.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer h-9 px-4 text-sm transition-all hover:scale-105 active:scale-95 ${
                                  isSelected 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                                onClick={() => toggleSkill(skill.id, type)}
                              >
                                {skill.name}
                                {isSelected && <Check className="w-3 h-3 ml-2" />}
                              </Badge>
                            );
                          })
                        ) : (
                          <div className="w-full py-8 text-center text-slate-400">
                            No skills found matching "{searchTerm}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Summary */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Selected ({currentStep === 2 ? formData.teaching.length : formData.learning.length})
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 p-0"
                          onClick={() => setFormData({...formData, [currentStep === 2 ? 'teaching' : 'learning']: []})}
                        >
                          Clear all
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[36px]">
                        {(currentStep === 2 ? formData.teaching : formData.learning).map(id => {
                          const skill = availableSkills.find(s => s.id === id);
                          return skill ? (
                            <Badge key={id} variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-transparent">
                              {skill.name}
                            </Badge>
                          ) : null;
                        })}
                        {(currentStep === 2 ? formData.teaching : formData.learning).length === 0 && (
                          <span className="text-xs text-slate-400 italic">None selected yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Discovery */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {recommendedMatches.length > 0 
                          ? `Found ${recommendedMatches.length} matching partners for you!` 
                          : "Finding partners who share your interests..."}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Here are some people you might want to connect with based on your skills.
                      </p>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-4 pt-2">
                      {fetchingMatches ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                          <p className="text-sm text-slate-400 animate-pulse">Running our matching engine...</p>
                        </div>
                      ) : recommendedMatches.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {recommendedMatches.map((match) => (
                            <SkillCard key={match.id} match={match} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <Rocket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">No immediate matches found</p>
                          <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">Don't worry, once you joint the community, others will be able to find you!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {/* Card Footer Actions */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : currentStep === 4 ? (
                <div className="flex items-center gap-2">
                  Go to Dashboard
                  <Rocket className="w-4 h-4" />
                </div>
              ) : currentStep === 3 ? (
                <div className="flex items-center gap-2">
                  Find Partners
                  <ChevronRight className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}} />
    </div>
  );
};
