// Cache for database instances
const dbCache = new WeakMap();

export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (dbCache.has(initDB)) {
      const cachedDb = dbCache.get(initDB);
      if (cachedDb) {
        resolve(cachedDb);
        return;
      }
    }

    const request = indexedDB.open('CrosswordAnalyticsDB', 3);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbCache.set(initDB, request.result);
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('analytics')) {
        const store = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('algorithm', 'algorithm', { unique: false });
        store.createIndex('size', 'size', { unique: false });
        store.createIndex('difficulty', 'difficulty', { unique: false });
      }
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

    // Quick duplicate check without fetching all data
    const isDuplicate = await checkForDuplicate(db, analyticsData);
    if (isDuplicate) return true;

    const transaction = db.transaction(['analytics'], 'readwrite');
    const store = transaction.objectStore('analytics');
    
    return new Promise((resolve) => {
      const request = store.add(analyticsData);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Error storing analytics data:', error);
    return false;
  }
};

const checkForDuplicate = async (db, newData) => {
  return new Promise((resolve) => {
    const transaction = db.transaction(['analytics'], 'readonly');
    const store = transaction.objectStore('analytics');
    const index = store.index('algorithm');
    const request = index.getAll(newData.algorithm);

    request.onsuccess = () => {
      const existing = request.result;
      const isDuplicate = existing.some(item => 
        item.algorithm === newData.algorithm &&
        item.size === newData.size &&
        item.difficulty === newData.difficulty &&
        Math.abs(item.executionTime - newData.executionTime) < 0.001 &&
        item.memoryUsage === newData.memoryUsage &&
        Math.abs(item.cellAccuracy - newData.cellAccuracy) < 0.001
      );
      resolve(isDuplicate);
    };

    request.onerror = () => resolve(false);
  });
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
    
    return new Promise((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
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