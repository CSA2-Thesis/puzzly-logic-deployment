import React from 'react';
import Visualizer from "../../components/Visualizer";

const OverviewTab = ({ algorithmComparisonData, sizeComparisonData }) => {
  return (
    <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Algorithm Distribution
          </h3>
          <div className="h-64 sm:h-80">
            <Visualizer.AlgorithmDistributionChart
              data={algorithmComparisonData}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Performance by Puzzle Size
          </h3>
          <div className="h-64 sm:h-80">
            <Visualizer.PerformanceBySizeChart
              data={sizeComparisonData}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-5 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Algorithm Performance Comparison
        </h3>
        <div className="h-72 sm:h-96">
          <Visualizer.AlgorithmComparisonChart
            data={algorithmComparisonData}
          />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;