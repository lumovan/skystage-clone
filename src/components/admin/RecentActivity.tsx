/**
 * Recent Activity Component
 * Displays recent platform activities and events in the admin dashboard
 */

"use client";

import { formatDistanceToNow } from 'date-fns';
import {
  User,
  Bookmark,
  Plane,
  LogIn,
  UserPlus,
  Eye,
  Activity
} from 'lucide-react';

interface ActivityEvent {
  event_type: string;
  entity_type: string;
  created_at: string;
  count: number;
}

interface RecentActivityProps {
  activities: ActivityEvent[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (eventType: string, entityType: string) => {
    const iconClass = "h-5 w-5";

    switch (eventType) {
      case 'user_registered':
        return <UserPlus className={`${iconClass} text-green-600`} />;
      case 'user_login':
        return <LogIn className={`${iconClass} text-blue-600`} />;
      case 'booking_created':
        return <Bookmark className={`${iconClass} text-purple-600`} />;
      case 'formation_created':
        return <Plane className={`${iconClass} text-indigo-600`} />;
      case 'formations_viewed':
        return <Eye className={`${iconClass} text-gray-600`} />;
      case 'admin_dashboard_viewed':
        return <Activity className={`${iconClass} text-orange-600`} />;
      default:
        return <Activity className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityDescription = (eventType: string, entityType: string, count: number) => {
    const countText = count > 1 ? ` (${count}x)` : '';

    switch (eventType) {
      case 'user_registered':
        return `New user registration${countText}`;
      case 'user_login':
        return `User login${countText}`;
      case 'booking_created':
        return `New booking request${countText}`;
      case 'formation_created':
        return `New formation uploaded${countText}`;
      case 'formations_viewed':
        return `Formations browsed${countText}`;
      case 'admin_dashboard_viewed':
        return `Admin dashboard accessed${countText}`;
      case 'admin_users_viewed':
        return `Users management accessed${countText}`;
      case 'admin_user_updated':
        return `User profile updated${countText}`;
      default:
        return `${eventType.replace(/_/g, ' ')}${countText}`;
    }
  };

  const getActivityColor = (eventType: string) => {
    switch (eventType) {
      case 'user_registered':
        return 'bg-green-50 border-green-200';
      case 'user_login':
        return 'bg-blue-50 border-blue-200';
      case 'booking_created':
        return 'bg-purple-50 border-purple-200';
      case 'formation_created':
        return 'bg-indigo-50 border-indigo-200';
      case 'formations_viewed':
        return 'bg-gray-50 border-gray-200';
      case 'admin_dashboard_viewed':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No recent activity to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="mt-1 text-sm text-gray-600">
          Platform events from the last 7 days
        </p>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={`${activity.event_type}-${activity.created_at}-${index}`}>
                <div className="relative pb-8">
                  {index !== activities.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex space-x-3">
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.event_type)}`}>
                      {getActivityIcon(activity.event_type, activity.entity_type)}
                    </div>

                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {getActivityDescription(activity.event_type, activity.entity_type, activity.count)}
                        </p>
                        {activity.count > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Multiple events aggregated
                          </p>
                        )}
                      </div>

                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.created_at}>
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
