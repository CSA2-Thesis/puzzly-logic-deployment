import React from 'react';
import Visualizer from "../../components/Visualizer";

const SizesTab = ({ sizeComparisonData, algorithmBySizeData }) => {
  return (
    <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Performance by Puzzle Size
        </h3>
        <div className="h-72 sm:h-96">
          <Visualizer.PerformanceBySizeChart data={sizeComparisonData} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Algorithm Performance by Size
        </h3>
        <div className="h-72 sm:h-96">
          <Visualizer.AlgorithmBySizeChart data={algorithmBySizeData} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {sizeComparisonData.map((sizeData) => (
          <SizeCard key={sizeData.size} sizeData={sizeData} />
        ))}
      </div>
    </div>
  );
};

const SizeCard = ({ sizeData }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
      {sizeData.size}x{sizeData.size} Puzzles
    </h4>
    <div className="space-y-3">
      <StatItem label="Runs" value={sizeData.count} color="blue" />
      <StatItem label="Avg. Execution Time" value={`${sizeData.avgExecutionTime.toFixed(3)}s`} color="purple" />
      <StatItem label="Avg. Memory Usage" value={Visualizer.formatMemory(sizeData.avgMemoryUsage)} color="green" />
      <StatItem label="Avg. Accuracy" value={`${(sizeData.avgAccuracy * 100).toFixed(2)}%`} color="orange" />
    </div>
  </div>
);

const StatItem = ({ label, value, color }) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400",
    orange: "text-orange-600 dark:text-orange-400"
  };

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
};

export default SizesTab;