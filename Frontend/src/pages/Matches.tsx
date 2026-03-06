import React, { useState, useEffect } from "react";
import { matchesApi, type Match } from "@/services";
import { SkillCard } from "@/components/SkillCard";
import { Search, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { SessionRequestModal } from "@/components/SessionRequestModal";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/Context/AuthContext";

export const Matches: React.FC = () => {
  const { user, refreshUserSkills } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLevel, setMatchingLevel] = useState<
    "NONE" | "TOP_TEACHERS" | "EXACT" | "CATEGORY_FALLBACK" | "EMPTY"
  >("EXACT");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProficiency, setSelectedProficiency] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(
    []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const proficiencyLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeOfDay = [
    "Morning (6AM-12PM)",
    "Afternoon (12PM-6PM)",
    "Evening (6PM-11PM)",
  ];

  // Helper function to parse availability string and extract day and time range
  const parseAvailability = (availStr: string) => {
    // Remove extra whitespace and normalize
    const normalized = availStr.trim().replace(/\s+/g, " ");

    const match = normalized.match(
      /^(\w+)\s+(\d{1,2})\s*(am|pm)\s*(?:to|-|:)\s*(\d{1,2})\s*(am|pm)$/i
    );
    if (!match) return null;

    const day =
      match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const startHour = parseInt(match[2]);
    const startPeriod = match[3].toUpperCase();
    const endHour = parseInt(match[4]);
    const endPeriod = match[5].toUpperCase();

    let startHour24 = startHour;
    let endHour24 = endHour;

    if (startPeriod === "PM" && startHour !== 12) startHour24 = startHour + 12;
    if (startPeriod === "AM" && startHour === 12) startHour24 = 0;
    if (endPeriod === "PM" && endHour !== 12) endHour24 = endHour + 12;
    if (endPeriod === "AM" && endHour === 12) endHour24 = 0;

    return { day, startHour24, endHour24 };
  };

  const timeOfDayMatches = (
    startHour: number,
    timeOfDayFilter: string
  ): boolean => {
    if (timeOfDayFilter.includes("Morning")) return startHour < 12;
    if (timeOfDayFilter.includes("Afternoon")) return startHour >= 12 && startHour < 18;
    if (timeOfDayFilter.includes("Evening")) return startHour >= 18;
    return false;
  };

  const filteredMatches = matches.filter((match: any) => {
    const skills = match.skills || (match.skill ? [match.skill] : []);
    
    // Skip proficiency match for fallback or top teachers unless searching
    const shouldCheckProficiency = matchingLevel === "EXACT" || searchTerm.length > 0;
    const proficiencyMatch =
      !shouldCheckProficiency ||
      selectedProficiency.length === 0 ||
      skills.some((s: any) => selectedProficiency.includes(s.proficiency_level));

    const availabilityMatch =
      selectedAvailability.length === 0 ||
      (match.teacher.availability || "")
        .split(",")
        .map((slot: string) => slot.trim())
        .some((slot: string) => {
          const parsed = parseAvailability(slot);
          if (!parsed) return false;
          return selectedAvailability.some((filter) => {
            if (daysOfWeek.includes(filter)) return parsed.day === filter;
            if (timeOfDay.includes(filter)) return timeOfDayMatches(parsed.startHour24, filter);
            return false;
          });
        });

    return proficiencyMatch && availabilityMatch;
  });

  const handleClearFilters = () => {
    setSelectedProficiency([]);
    setSelectedAvailability([]);
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        // Fix 2: Refresh user skills before fetching
        if (refreshUserSkills) {
          await refreshUserSkills();
        }

        const hasTeaching = (user?.skillsTeaching?.length || 0) > 0;
        const hasLearning = (user?.skillsLearning?.length || 0) > 0;

        if (!hasTeaching && !hasLearning) {
          setMatches([]);
          setMatchingLevel("NONE");
          setLoading(false);
          return;
        }

        if (debouncedSearch) {
          const response = await matchesApi.search(debouncedSearch);
          setMatches(response.data);
          setMatchingLevel("EXACT");
          setLoading(false);
          return;
        }

        if (!hasLearning) {
          const response = await matchesApi.getTopTeachers();
          setMatches(response.data);
          setMatchingLevel("TOP_TEACHERS");
          setLoading(false);
          return;
        }

        // Level 1: Fetch Exact Match
        const exactResponse = await matchesApi.getRecommended();
        const exactMatches = exactResponse.data;

        // Fix 1: Minimum threshold logic
        if (exactMatches.length >= 3) {
          setMatches(exactMatches);
          setMatchingLevel("EXACT");
        } else {
          // Fall through: Exact matches are 0, 1, or 2
          const categories = Array.from(
            new Set(user?.userSkills?.filter(s => s.type === "LEARN").map((s: any) => s.category))
          )
            .filter(Boolean)
            .join(",");

          let finalMatches = [...exactMatches];
          let usedFallback = false;

          if (categories) {
            const fallbackResponse = await matchesApi.getCategoryFallback(categories);
            const fallbackMatches = fallbackResponse.data;

            if (fallbackMatches.length > 0) {
              usedFallback = true;
              // Merge and deduplicate by user id (match.id is user.id)
              const merged = [...exactMatches, ...fallbackMatches];
              finalMatches = Array.from(
                new Map(merged.map((m) => [m.id, m])).values()
              );
            }
          }

          setMatches(finalMatches);

          if (finalMatches.length > 0) {
            // Show "Similar matches" label if we blended or only have fallback
            setMatchingLevel(usedFallback ? "CATEGORY_FALLBACK" : "EXACT");
          } else {
            setMatchingLevel("EMPTY");
          }
        }
      } catch (error) {
        console.error("Error fetching matches waterfall:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMatches();
    }
  }, [debouncedSearch, user?.skillsTeaching?.length, user?.skillsLearning?.length]);

  const handleBookSession = (matchId: number) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {matchingLevel === "NONE" ? "Find Your Perfect Match" : "Find Learning Partners"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {matchingLevel === "TOP_TEACHERS" 
              ? "Add skills you want to learn to find better matches" 
              : "Connect with people who can teach you new skills and learn from you"}
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by skill or name..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-6 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Proficiency Level</h3>
                <div className="space-y-2">
                  {proficiencyLevels.map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProficiency.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProficiency([...selectedProficiency, level]);
                          else setSelectedProficiency(selectedProficiency.filter((p) => p !== level));
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">
                        {level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Day of Week</h3>
                <div className="space-y-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAvailability([...selectedAvailability, day]);
                          else setSelectedAvailability(selectedAvailability.filter((a) => a !== day));
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Time of Day</h3>
                <div className="space-y-2">
                  {timeOfDay.map((time) => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAvailability([...selectedAvailability, time]);
                          else setSelectedAvailability(selectedAvailability.filter((a) => a !== time));
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleClearFilters} className="px-4 py-2 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors">Clear Filters</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Apply</button>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-1">
          {matchingLevel === "CATEGORY_FALLBACK" && filteredMatches.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Similar matches you might like</span>
                <span className="text-xs font-normal px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">Fallback</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">Showing users who teach related skills</p>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"} found
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((match) => (
              <SkillCard key={match.id} match={match} onBookSession={handleBookSession} />
            ))}
          </div>
        ) : matchingLevel === "NONE" ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add skills to find your perfect match</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              Setting up your teaching and learning skills helps our matching engine find the right partners for you.
            </p>
            <div className="mt-8">
              <Link to="/profile" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20 inline-block">Go to Profile</Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <Search className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">No matches found yet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adding more skills to your profile to expand your search.</p>
            <div className="mt-8">
              <Link to="/profile" className="px-6 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-lg transition-colors inline-block">Add More Skills</Link>
            </div>
          </div>
        )}
      </div>
      <SessionRequestModal isOpen={isModalOpen} onClose={handleCloseModal} match={selectedMatch} />
    </div>
  );
};
