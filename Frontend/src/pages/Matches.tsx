import React, { useState, useEffect } from "react";
import { matchesApi, type Match } from "@/services";
import { SkillCard } from "@/components/SkillCard";
import { Search, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { SessionRequestModal } from "@/components/SessionRequestModal";

export const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
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

    // Match: Day HH(AM/PM) to/- HH(AM/PM)
    // Handles: "Sunday 12pm-6PM", "Sunday 12PM - 6PM", "Sunday 12PM to 6PM", etc.
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

    // Convert to 24-hour format
    if (startPeriod === "PM" && startHour !== 12) startHour24 = startHour + 12;
    if (startPeriod === "AM" && startHour === 12) startHour24 = 0;
    if (endPeriod === "PM" && endHour !== 12) endHour24 = endHour + 12;
    if (endPeriod === "AM" && endHour === 12) endHour24 = 0;

    return { day, startHour24, endHour24 };
  };

  // Check if availability slot falls within selected time of day
  const timeOfDayMatches = (
    startHour: number,
    timeOfDayFilter: string
  ): boolean => {
    if (timeOfDayFilter.includes("Morning")) {
      return startHour < 12; // Starts before noon
    }
    if (timeOfDayFilter.includes("Afternoon")) {
      return startHour >= 12 && startHour < 18; // Starts between noon and 6PM
    }
    if (timeOfDayFilter.includes("Evening")) {
      return startHour >= 18; // Starts at 6PM or later
    }
    return false;
  };

  const filteredMatches = matches.filter((match: any) => {
    // Handle both old and new data formats
    const skills = match.skills || (match.skill ? [match.skill] : []);
    const proficiencyLevels = skills.map((s: any) => s.proficiency_level);

    const proficiencyMatch =
      selectedProficiency.length === 0 ||
      proficiencyLevels.some((level: string) =>
        selectedProficiency.includes(level)
      );

    const availabilityMatch =
      selectedAvailability.length === 0 ||
      (match.teacher.availability || "")
        .split(",")
        .map((slot: string) => slot.trim())
        .some((slot: string) => {
          const parsed = parseAvailability(slot);
          if (!parsed) return false;

          return selectedAvailability.some((filter) => {
            if (daysOfWeek.includes(filter)) {
              return parsed.day === filter;
            } else if (timeOfDay.includes(filter)) {
              return timeOfDayMatches(
                parsed.startHour24,
                filter
              );
            }
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
        let response;
        if (debouncedSearch) {
          response = await matchesApi.search(debouncedSearch);
        } else {
          response = await matchesApi.getRecommended();
        }
        setMatches(response.data);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [debouncedSearch]);





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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Find Learning Partners
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect with people who can teach you new skills and learn from you
          </p>
        </div>

        {/* Search and Filter */}
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-6 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Proficiency Level Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Proficiency Level
                </h3>
                <div className="space-y-2">
                  {proficiencyLevels.map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProficiency.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProficiency([
                              ...selectedProficiency,
                              level,
                            ]);
                          } else {
                            setSelectedProficiency(
                              selectedProficiency.filter((p) => p !== level)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">
                        {level.charAt(0).toUpperCase() +
                          level.slice(1).toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Day of Week Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Day of Week
                </h3>
                <div className="space-y-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAvailability([
                              ...selectedAvailability,
                              day,
                            ]);
                          } else {
                            setSelectedAvailability(
                              selectedAvailability.filter((a) => a !== day)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">
                        {day}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time of Day Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Time of Day
                </h3>
                <div className="space-y-2">
                  {timeOfDay.map((time) => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAvailability.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAvailability([
                              ...selectedAvailability,
                              time,
                            ]);
                          } else {
                            setSelectedAvailability(
                              selectedAvailability.filter((a) => a !== time)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-400 cursor-pointer">
                        {time}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredMatches.length}{" "}
            {filteredMatches.length === 1 ? "match" : "matches"} found
          </p>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((match) => (
              <SkillCard
                key={match.id}
                match={match}
                onBookSession={handleBookSession}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
            <Search className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">No matches found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
      <SessionRequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        match={selectedMatch}
      />
    </div>
  );
};
