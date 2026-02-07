import React, { useState } from "react";
import { MessageSquare, Send, ThumbsUp, Heart, Bug, Lightbulb } from "lucide-react";

export const Feedback: React.FC = () => {
  const [selectedType, setSelectedType] = useState("general");
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { id: "general", label: "General", icon: MessageSquare, color: "blue" },
    { id: "bug", label: "Bug Report", icon: Bug, color: "red" },
    { id: "feature", label: "Feature Request", icon: Lightbulb, color: "purple" },
    { id: "love", label: "Praise", icon: Heart, color: "pink" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 text-center max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ThumbsUp className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your feedback helps us make SkillSwap better for everyone. We'll review it shortly.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            Send More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Send Us Feedback
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Have a suggestion, found a bug, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
                  What's on your mind?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        selectedType === type.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-md"
                          : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 bg-transparent"
                      }`}
                    >
                      <type.icon className={`w-6 h-6 mb-2 ${
                        selectedType === type.id ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                      }`} />
                      <span className={`text-xs font-bold ${
                        selectedType === type.id ? "text-blue-700 dark:text-blue-300" : "text-gray-500"
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium"
                    placeholder="Brief summary of your feedback"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium resize-none"
                    placeholder="Tell us more about it..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20"
              >
                <Send className="w-5 h-5" />
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
