'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import NotificationsList from '@/components/notifications/NotificationsList';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <BellIcon className="h-8 w-8 mr-2 text-blue-600" />
          Notifications
        </h1>
        <p className="text-gray-600 mt-2">
          Stay updated with the latest activity on your articles and profile
        </p>
      </div>

      <div className="mb-8">
        <NotificationsList />
      </div>
    </div>
  );
}
