import React, { useState, useEffect } from 'react';
import { bookingsApi, type Booking } from '@/services/api';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

export const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingsApi.getUserBookings();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="mt-2 text-gray-600">Manage your learning and teaching sessions</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Past ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : displayedBookings.length > 0 ? (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={booking.partnerAvatar}
                      alt={booking.partnerName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{booking.skill}</h3>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>with {booking.partnerName}</span>
                        <span className="text-gray-400">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.type === 'teaching' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {booking.type === 'teaching' ? 'Teaching' : 'Learning'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.time} ({booking.duration} min)</span>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    {booking.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No {activeTab} sessions</p>
          </div>
        )}
      </div>
    </div>
  );
};
