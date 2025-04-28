import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ChartBarIcon, 
  EyeIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ChatBubbleLeftIcon, 
  HandThumbUpIcon, 
  BookmarkIcon 
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ArticleAnalyticsProps = {
  articleId: string;
};

type AnalyticsData = {
  article: {
    id: string;
    title: string;
    slug: string;
    createdAt: string;
    publishedAt: string | null;
  };
  views: {
    total: number;
    unique: number;
  };
  readMetrics: {
    totalReads: number;
    averageReadTime: number;
    completionRate: number;
    readTimeDistribution: {
      '0-30s': number;
      '30s-1m': number;
      '1m-3m': number;
      '3m-5m': number;
      '5m-10m': number;
      '10m+': number;
    };
  };
  engagement: {
    comments: number;
    claps: {
      total: number;
      uniqueClappers: number;
    };
    bookmarks: number;
    engagementScore: number;
  };
  referrals: Record<string, number>;
  devices: Record<string, number>;
  geography: Record<string, number>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    reads: number;
    claps: number;
  }>;
};

export default function ArticleAnalyticsDashboard({ articleId }: ArticleAnalyticsProps) {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session && articleId) {
      fetchAnalytics();
    }
  }, [session, articleId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${articleId}/analytics`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Error loading analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div className="text-center py-4">Please sign in to view analytics</div>;
  }

  if (loading) {
    return <div className="text-center py-4">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (!analytics) {
    return <div className="text-center py-4">No analytics data available</div>;
  }

  // Prepare chart data
  const timeSeriesData = {
    labels: analytics.timeSeriesData.map(item => item.date),
    datasets: [
      {
        label: 'Views',
        data: analytics.timeSeriesData.map(item => item.views),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Reads',
        data: analytics.timeSeriesData.map(item => item.reads),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Claps',
        data: analytics.timeSeriesData.map(item => item.claps),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const readTimeDistributionData = {
    labels: Object.keys(analytics.readMetrics.readTimeDistribution),
    datasets: [
      {
        label: 'Readers',
        data: Object.values(analytics.readMetrics.readTimeDistribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const deviceData = {
    labels: Object.keys(analytics.devices),
    datasets: [
      {
        label: 'Devices',
        data: Object.values(analytics.devices),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const referralData = {
    labels: Object.keys(analytics.referrals).slice(0, 5), // Top 5 referrals
    datasets: [
      {
        label: 'Referrals',
        data: Object.values(analytics.referrals).slice(0, 5),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Analytics for "{analytics.article.title}"</h2>
        <p className="text-sm text-gray-500">
          {analytics.article.publishedAt
            ? `Published ${new Date(analytics.article.publishedAt).toLocaleDateString()}`
            : 'Draft'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <EyeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-xl font-semibold">{analytics.views.total}</p>
              <p className="text-xs text-gray-500">{analytics.views.unique} unique viewers</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg. Read Time</p>
              <p className="text-xl font-semibold">
                {Math.floor(analytics.readMetrics.averageReadTime / 60)}m {Math.round(analytics.readMetrics.averageReadTime % 60)}s
              </p>
              <p className="text-xs text-gray-500">
                {Math.round(analytics.readMetrics.completionRate * 100)}% completion rate
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full">
              <HandThumbUpIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Claps</p>
              <p className="text-xl font-semibold">{analytics.engagement.claps.total}</p>
              <p className="text-xs text-gray-500">
                From {analytics.engagement.claps.uniqueClappers} readers
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Engagement Score</p>
              <p className="text-xl font-semibold">{analytics.engagement.engagementScore}/100</p>
              <p className="text-xs text-gray-500">
                {analytics.engagement.comments} comments, {analytics.engagement.bookmarks} bookmarks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="p-4 border-t">
        <h3 className="text-md font-semibold mb-4">Performance Over Time</h3>
        <div className="h-64">
          <Line
            data={timeSeriesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Read Time Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-t">
        <div>
          <h3 className="text-md font-semibold mb-4">Read Time Distribution</h3>
          <div className="h-64">
            <Bar
              data={readTimeDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-4">Device Breakdown</h3>
          <div className="h-64">
            <Doughnut
              data={deviceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>

      {/* Referrals */}
      <div className="p-4 border-t">
        <h3 className="text-md font-semibold mb-4">Top Referral Sources</h3>
        <div className="h-64">
          <Bar
            data={referralData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              scales: {
                x: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Geographic Data */}
      <div className="p-4 border-t">
        <h3 className="text-md font-semibold mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(analytics.geography)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([country, value]) => (
              <div key={country} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-sm font-medium">{country}</p>
                <p className="text-lg font-semibold">{value}%</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
