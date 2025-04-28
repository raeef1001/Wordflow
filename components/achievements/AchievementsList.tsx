import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StarIcon, TrophyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type AchievementsListProps = {
  userId?: string; // If not provided, shows current user's achievements
  showLocked?: boolean; // Whether to show locked achievements
};

type Achievement = {
  id: string;
  name: string;
  description: string;
  badge: string;
  criteria: string;
  points: number;
};

type UserAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  awardedAt: string;
  achievement: Achievement;
};

export default function AchievementsList({ userId, showLocked = true }: AchievementsListProps) {
  const { data: session } = useSession();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchAchievements();
    }
  }, [session, userId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      // Fetch user achievements
      const userParam = userId ? `?userId=${userId}` : '';
      const userResponse = await fetch(`/api/achievements${userParam}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user achievements');
      }
      
      const userData = await userResponse.json();
      setUserAchievements(userData.userAchievements || []);
      
      // If we need to show locked achievements, fetch all achievements
      if (showLocked) {
        const allResponse = await fetch('/api/achievements');
        
        if (!allResponse.ok) {
          throw new Error('Failed to fetch all achievements');
        }
        
        const allData = await allResponse.json();
        setAllAchievements(allData.achievements || []);
      }
    } catch (err) {
      setError('Error loading achievements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to parse criteria for display
  const formatCriteria = (criteriaJson: string) => {
    try {
      const criteria = JSON.parse(criteriaJson);
      switch (criteria.type) {
        case 'ARTICLE_COUNT':
          return `Publish ${criteria.count} article${criteria.count > 1 ? 's' : ''}`;
        case 'FOLLOWER_COUNT':
          return `Gain ${criteria.count} follower${criteria.count > 1 ? 's' : ''}`;
        case 'CLAP_COUNT':
          return `Receive ${criteria.count} clap${criteria.count > 1 ? 's' : ''}`;
        default:
          return 'Complete special actions';
      }
    } catch (e) {
      return 'Complete special actions';
    }
  };

  if (!session) {
    return <div className="text-center py-4">Please sign in to view achievements</div>;
  }

  if (loading) {
    return <div className="text-center py-4">Loading achievements...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  // Combine earned and locked achievements
  const earnedAchievementIds = userAchievements.map(ua => ua.achievement.id);
  const lockedAchievements = showLocked
    ? allAchievements.filter(a => !earnedAchievementIds.includes(a.id))
    : [];

  if (userAchievements.length === 0 && lockedAchievements.length === 0) {
    return <div className="text-center py-4">No achievements available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Achievements</h2>
        <p className="text-sm text-gray-500">
          {userAchievements.length} of {userAchievements.length + lockedAchievements.length} achievements earned
        </p>
      </div>

      {/* Earned Achievements */}
      {userAchievements.length > 0 && (
        <div className="p-4">
          <h3 className="text-md font-medium mb-3 flex items-center">
            <TrophyIcon className="h-5 w-5 text-yellow-500 mr-1" />
            Earned Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userAchievements.map(({ achievement, awardedAt }) => (
              <div key={achievement.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <StarIconSolid className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold">{achievement.name}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                        {achievement.points} points
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        Earned {new Date(awardedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {showLocked && lockedAchievements.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-md font-medium mb-3 flex items-center">
            <LockClosedIcon className="h-5 w-5 text-gray-500 mr-1" />
            Locked Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map((achievement) => (
              <div key={achievement.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <div className="bg-gray-200 p-2 rounded-full">
                    <StarIcon className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold">{achievement.name}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {achievement.points} points
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatCriteria(achievement.criteria)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Progress */}
      <div className="p-4 border-t">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-yellow-500 h-2.5 rounded-full"
            style={{
              width: `${(userAchievements.length / (userAchievements.length + lockedAchievements.length)) * 100}%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-center mt-2 text-gray-600">
          {Math.round((userAchievements.length / (userAchievements.length + lockedAchievements.length)) * 100)}% complete
        </p>
      </div>

      {/* Total Points */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Achievement Points</span>
          <span className="text-lg font-bold text-yellow-600">
            {userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
