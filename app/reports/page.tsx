'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ReportTable from '@/components/ReportTable';

const ReportsPage = () => {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const user = await res.json();
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    const fetchAllReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const gmailReportsRes = await fetch('/api/gmail/reports');
        if (!gmailReportsRes.ok) {
          const data = await gmailReportsRes.json();
          setError(data.message || 'Failed to fetch reports');
          setAllReports([]);
        } else {
          const gmailReports = await gmailReportsRes.json();
          setAllReports(gmailReports);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to fetch reports');
        setAllReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
    fetchAllReports();

    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      fetchAllReports();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 p-10">
      <Header title="Reports" />
      {userEmail && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Logged in as: <span className="font-semibold">{userEmail}</span>
          </p>
        </div>
      )}
      <div className="mt-6">
        {loading && allReports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-sm text-gray-500">Please connect your Google account in the Integrations page</p>
          </div>
        ) : (
          <ReportTable reports={allReports} />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
