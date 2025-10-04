export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CrosswordAnalyticsDB', 3);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('analytics')) {
        const store = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('algorithm', 'algorithm', { unique: false });
        store.createIndex('size', 'size', { unique: false });
        store.createIndex('difficulty', 'difficulty', { unique: false });
        store.createIndex('uniqueRun', ['algorithm', 'size', 'difficulty', 'executionTime', 'memoryUsage', 'cellAccuracy'], { unique: true });
      }
      
      ['DFS_analytics', 'ASTAR_analytics', 'HYBRID_analytics'].forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
};

export const storeAnalyticsData = async (data, fixedTimestamp) => {
  try {
    const db = await initDB();
    const analyticsData = {
      timestamp: fixedTimestamp || new Date().toISOString(),
      algorithm: data.solvedResult.method,
      size: data.originalPuzzle.stats.size,
      difficulty: data.originalPuzzle.stats.difficulty,
      cellAccuracy: data.analysisData.accuracy,
      wordAccuracy: data.analysisData.wordAccuracy,
      executionTime: parseFloat(data.solvedResult.metrics.execution_time.replace('s', '')),
      memoryUsage: data.solvedResult.metrics.memory_usage_kb,
      wordsPlaced: data.solvedResult.metrics.words_placed,
      puzzleData: {
        grid: data.originalPuzzle.grid,
        emptyGrid: data.originalPuzzle.empty_grid,
        clues: data.originalPuzzle.clues
      }
    };

    const existingData = await getAllAnalyticsData();
    const isDuplicate = existingData.some(item => 
      item.algorithm === analyticsData.algorithm &&
      item.size === analyticsData.size &&
      item.difficulty === analyticsData.difficulty &&
      Math.abs(item.executionTime - analyticsData.executionTime) < 0.001 &&
      item.memoryUsage === analyticsData.memoryUsage &&
      Math.abs(item.cellAccuracy - analyticsData.cellAccuracy) < 0.001
    );
    
    if (isDuplicate) return true;

    const transaction = db.transaction(['analytics'], 'readwrite');
    const store = transaction.objectStore('analytics');
    await store.add(analyticsData);

    return true;
  } catch (error) {
    console.error('Error storing analytics data:', error);
    return false;
  }
};

export const getAllAnalyticsData = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['analytics'], 'readonly');
    const store = transaction.objectStore('analytics');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error retrieving analytics data:', error);
    return [];
  }
};

export const clearAnalyticsData = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['analytics'], 'readwrite');
    const store = transaction.objectStore('analytics');
    await store.clear();
    return true;
  } catch (error) {
    console.error('Error clearing analytics data:', error);
    return false;
  }
};

export const removeDuplicates = (data) => {
  const seen = new Set();
  return data.filter(item => {
    const key = `${item.algorithm}-${item.size}-${item.difficulty}-${item.executionTime.toFixed(4)}-${item.memoryUsage}-${item.cellAccuracy.toFixed(4)}-${item.wordAccuracy.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};