import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';

const MainMenu = lazy(() => import('./pages/MainMenu'));
const PuzzleGenerator = lazy(() => import('./pages/PuzzleGenerator'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Solution = lazy(() => import('./pages/Solution'));
const About = lazy(() => import('./pages/About'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MainMenu />} />
            <Route path="generate" element={<PuzzleGenerator />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="solution" element={<Solution />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;