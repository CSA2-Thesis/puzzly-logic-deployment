import React from 'react';
import Visualizer from "../../components/Visualizer";

const AlgorithmsTab = ({ algorithmComparisonData, algorithmDetails, filteredData }) => {
  return (
    <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Algorithm Performance Scatter Plots
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-white mb-2 text-center">
              Accuracy vs Memory
            </h4>
            <div className="h-80 sm:h-100">
              <Visualizer.MemoryAccuracyScatter data={filteredData} />
            </div>
          </div>
          <div>
            <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-white mb-2 text-center">
              Memory vs Time
            </h4>
            <div className="h-80 sm:h-100">
              <Visualizer.MemoryTimeScatter data={filteredData} />
            </div>
          </div>
          <div>
            <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-white mb-2 text-center">
              Time vs Accuracy
            </h4>
            <div className="h-80 sm:h-100">
              <Visualizer.TimeAccuracyScatter data={filteredData} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {algorithmComparisonData.map((algo) => (
          <AlgorithmCard key={algo.algorithm} algorithm={algo} />
        ))}
      </div>
    </div>
  );
};

const AlgorithmCard = ({ algorithm: algo }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
      {algo.algorithm} Algorithm
    </h4>
    <div className="space-y-3">
      <StatItem label="Runs" value={algo.count} color="blue" />
      <StatItem label="Avg. Execution Time" value={`${algo.avgExecutionTime.toFixed(3)}s`} color="purple" />
      <StatItem label="Avg. Memory Usage" value={Visualizer.formatMemory(algo.avgMemoryUsage)} color="green" />
      <StatItem label="Avg. Accuracy" value={`${(algo.avgAccuracy * 100).toFixed(2)}%`} color="orange" />
      <StatItem label="Avg. Word Accuracy" value={`${(algo.avgWordAccuracy * 100).toFixed(2)}%`} color="cyan" />
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Puzzle Sizes</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {[...algo.sizes].sort((a, b) => a - b).join(", ")}
        </p>
      </div>
    </div>
  </div>
);

const StatItem = ({ label, value, color }) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400",
    orange: "text-orange-600 dark:text-orange-400",
    cyan: "text-cyan-600 dark:text-cyan-400"
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

export default AlgorithmsTab;