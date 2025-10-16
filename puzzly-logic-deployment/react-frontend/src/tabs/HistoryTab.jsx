import React from 'react';
import Visualizer from "../../components/Visualizer";

const HistoryTab = ({ filteredData }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Solution History
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredData.length} records
        </p>
      </div>
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {['Date', 'Algorithm', 'Size', 'Time', 'Memory', 'Accuracy'].map((header) => (
                <th
                  key={header}
                  className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((item, index) => (
              <TableRow key={index} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableRow = ({ item }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
      {new Date(item.timestamp).toLocaleDateString()}
    </td>
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
      {item.algorithm}
    </td>
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
      {item.size}x{item.size}
    </td>
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
      {item.executionTime.toFixed(3)}s
    </td>
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
      {Visualizer.formatMemory(item.memoryUsage)}
    </td>
    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
      {(item.cellAccuracy * 100).toFixed(2)}%
    </td>
  </tr>
);

export default HistoryTab;