import React, { useState, useEffect } from "react";
import { matchesApi, type Match } from "@/services";
import { SkillCard } from "@/components/SkillCard";
import { Search, Filter, Star, Award, Users, Clock } from "lucide-react";
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
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minSessionsTaught, setMinSessionsTaught] = useState<number>(0);
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
  const timeOfDayOptions = [
    { label: "Morning (6AM–12PM)", minHour: 6, maxHour: 12 },
    { label: "Afternoon (12PM–6PM)", minHour: 12, maxHour: 18 },
    { label: "Evening (6PM–11PM)", minHour: 18, maxHour: 23 },
  ];
  const experienceTitles = [
    "Newcomer",
    "Novice Mentor",
    "Rising Star",
    "Experienced Tutor",
    "SkillSwap Veteran",
    "Senior Teacher",
    "Expert Mentor",
    "Master Teacher",
  ];
  const ratingOptions = [
    { label: "Any Rating", value: 0 },
    { label: "3.0+", value: 3 },
    { label: "3.5+", value: 3.5 },
    { label: "4.0+", value: 4 },
    { label: "4.5+", value: 4.5 },
  ];
  const sessionsOptions = [
    { label: "Any", value: 0 },
    { label: "1+", value: 1 },
    { label: "5+", value: 5 },
    { label: "10+", value: 10 },
    { label: "20+", value: 20 },
  ];

  // Map abbreviated day names to full names for filter matching
  const dayAbbrevMap: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
    fri: "Friday", sat: "Saturday", sun: "Sunday",
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  };

  // Helper: parse availability string like "Mon 9:00 AM - 11:00 PM" or "Monday 9 AM to 5 PM"
  const parseAvailability = (availStr: string) => {
    const normalized = availStr.trim().replace(/\s+/g, " ");

    // Match: "Mon 9:00 AM - 11:00 PM", "Monday 9 AM to 5 PM", "Tue 10am-3pm"
    const match = normalized.match(
      /^(\w+)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i
    );
    if (!match) return null;

    const dayRaw = match[1].toLowerCase();
    const day = dayAbbrevMap[dayRaw] || (dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1));
    const startHour = parseInt(match[2]);
    const startPeriod = match[4].toUpperCase();
    const endHour = parseInt(match[5]);
    const endPeriod = match[7].toUpperCase();

    const to24 = (hour: number, period: string) => {
      if (period === "AM" && hour === 12) return 0;
      if (period === "PM" && hour !== 12) return hour + 12;
      return hour;
    };

    return { day, startHour24: to24(startHour, startPeriod), endHour24: to24(endHour, endPeriod) };
  };

  // Count how many filters are active
  const activeFilterCount =
    selectedProficiency.length +
    selectedDays.length +
    selectedTimeOfDay.length +
    selectedExperience.length +
    (minRating > 0 ? 1 : 0) +
    (minSessionsTaught > 0 ? 1 : 0);

  const filteredMatches = matches.filter((match: any) => {
    const skills = match.skills || (match.skill ? [match.skill] : []);

    // --- Proficiency filter ---
    const shouldCheckProficiency = matchingLevel === "EXACT" || searchTerm.length > 0;
    const proficiencyMatch =
      !shouldCheckProficiency ||
      selectedProficiency.length === 0 ||
      skills.some((s: any) => selectedProficiency.includes(s.proficiency_level));

    // --- Day of Week filter ---
    const dayMatch = (() => {
      if (selectedDays.length === 0) return true;
      const availability = (match.teacher.availability || "").split(",").map((s: string) => s.trim());
      return availability.some((slot: string) => {
        const parsed = parseAvailability(slot);
        return parsed && selectedDays.includes(parsed.day);
      });
    })();

    // --- Time of Day filter ---
    const timeMatch = (() => {
      if (selectedTimeOfDay.length === 0) return true;
      const availability = (match.teacher.availability || "").split(",").map((s: string) => s.trim());
      return availability.some((slot: string) => {
        const parsed = parseAvailability(slot);
        if (!parsed) return false;
        return selectedTimeOfDay.some((timeLabel) => {
          const opt = timeOfDayOptions.find((o) => o.label === timeLabel);
          if (!opt) return false;
          // Check if the slot's start time falls within the time-of-day window
          return parsed.startHour24 >= opt.minHour && parsed.startHour24 < opt.maxHour;
        });
      });
    })();

    // --- Experience Title filter ---
    const experienceMatch =
      selectedExperience.length === 0 ||
      selectedExperience.includes(match.teacher.experience_title);

    // --- Minimum Rating filter ---
    const ratingMatch =
      minRating === 0 || (match.teacher.rating || 0) >= minRating;

    // --- Minimum Sessions Taught filter ---
    const sessionsMatch =
      minSessionsTaught === 0 ||
      (match.teacher.sessions_taught_count || 0) >= minSessionsTaught;

    return proficiencyMatch && dayMatch && timeMatch && experienceMatch && ratingMatch && sessionsMatch;
  });

  const handleClearFilters = () => {
    setSelectedProficiency([]);
    setSelectedDays([]);
    setSelectedTimeOfDay([]);
    setSelectedExperience([]);
    setMinRating(0);
    setMinSessionsTaught(0);
  };


  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        // Refresh user skills before fetching
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

        // Minimum threshold logic
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

  // Helper to toggle a value in an array state
  const toggleArrayFilter = <T,>(
    value: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
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

        {/* Search + Filter toggle */}
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
            className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-lg transition-colors relative ${
              activeFilterCount > 0
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700"
                : "border-gray-300 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            <Filter className={`w-5 h-5 ${activeFilterCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`} />
            <span className={`font-medium ${activeFilterCount > 0 ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Compact filter panel */}
        {showFilters && (
          <div className="mb-6 px-5 py-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg shadow-sm space-y-4">
            {/* Row 1: Proficiency pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">Proficiency:</span>
              {proficiencyLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedProficiency(selectedProficiency.includes(level) ? [] : [level])}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedProficiency.includes(level)
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Row 2: Dropdowns */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Experience dropdown */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" /> Experience
                </label>
                <select
                  value={selectedExperience[0] || ""}
                  onChange={(e) => setSelectedExperience(e.target.value ? [e.target.value] : [])}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Any</option>
                  {experienceTitles.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Rating dropdown */}
              <div className="flex flex-col gap-1 min-w-[130px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3" /> Min Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {ratingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value === 0 ? "Any" : `★ ${opt.label}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sessions dropdown */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" /> Sessions Taught
                </label>
                <select
                  value={minSessionsTaught}
                  onChange={(e) => setMinSessionsTaught(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {sessionsOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value === 0 ? "Any" : `${opt.label} sessions`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability (Day) dropdown */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Available Day
                </label>
                <select
                  value={selectedDays[0] || ""}
                  onChange={(e) => setSelectedDays(e.target.value ? [e.target.value] : [])}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Any Day</option>
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Time of Day dropdown */}
              <div className="flex flex-col gap-1 min-w-[150px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time of Day
                </label>
                <select
                  value={selectedTimeOfDay[0] || ""}
                  onChange={(e) => setSelectedTimeOfDay(e.target.value ? [e.target.value] : [])}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Any Time</option>
                  {timeOfDayOptions.map((t) => (
                    <option key={t.label} value={t.label}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-end"
                >
                  Clear All
                </button>
              )}
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
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {activeFilterCount > 0
                ? "Try adjusting your filters or clearing them to see more results."
                : "Try adding more skills to your profile to expand your search."}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 border-2 border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg transition-colors inline-block"
                >
                  Clear Filters
                </button>
              )}
              <Link to="/profile" className="px-6 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-lg transition-colors inline-block">Add More Skills</Link>
            </div>
          </div>
        )}
      </div>
      <SessionRequestModal isOpen={isModalOpen} onClose={handleCloseModal} match={selectedMatch} />
    </div>
  );
};
