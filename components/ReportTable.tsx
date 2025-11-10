'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/app/context/SearchContext';

interface Report {
  id: number;
  source: string;
  title: string;
  readScore: number;
  tags: string[];
  owner: string;
  date: string;
}

interface ReportTableProps {
  reports: Report[];
}

const ReportTable = ({ reports }: ReportTableProps) => {
  const { searchQuery } = useSearch();
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  useEffect(() => {
    setFilteredReports(reports);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [reports]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = reports.filter((report) =>
      report.title.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  const handleRefresh = () => {
    // In a real app, you would re-fetch data here from the parent component
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const copyLink = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/reports/${id}`);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Meeting Reports</h2>
        <div className="flex items-center space-x-3">
          <span className="text-gray-500 text-sm">
            Last refreshed at {lastRefreshed}
          </span>
          <button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-md"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Report Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Read Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {report.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {report.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.readScore > 80 ? 'bg-green-100 text-green-800' :
                      report.readScore > 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.readScore}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {report.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mr-2"
                    >
                      {tag}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {report.owner}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(report.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => copyLink(report.id)}
                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                  >
                    Copy link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
