import React, { useState, useEffect } from 'react';
import { matchesApi, type Match } from '@/services/api';
import { SkillCard } from '@/components/SkillCard';
import { Search, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

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
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [debouncedSearch]);

  const handleConnect = (matchId: number) => {
    // TODO: Use requestsAPI to send a request
    alert(`Connect functionality would open messaging with match ID: ${matchId}`);
  };

  const handleBookSession = (matchId: number) => {
    // TODO: Navigate to boolean page
    alert(`Booking functionality would open session booking for match ID: ${matchId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Learning Partners</h1>
          <p className="mt-2 text-gray-600">
            Connect with people who can teach you new skills and learn from you
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by skill or name..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Filters</span>
          </button>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
          </p>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match) => (
              <SkillCard
                key={match.id}
                match={match}
                onConnect={handleConnect}
                onBookSession={handleBookSession}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No matches found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};
