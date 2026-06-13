import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import WorkoutPage from './pages/WorkoutPage';
import MacrosPage from './pages/MacrosPage';
import BarbellPage from './pages/BarbellPage';

const tabs = [
  { to: '/workout', label: 'Workout' },
  { to: '/macros', label: 'Macros' },
  { to: '/barbell', label: 'Barbell' },
];

function NavBar() {
  return (
    <nav className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-6 py-3">
      <span className="mr-6 text-lg font-bold text-indigo-400">FORGE.</span>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-500 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <NavBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/workout" replace />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/macros" element={<MacrosPage />} />
          <Route path="/barbell" element={<BarbellPage />} />
        </Routes>
      </main>
    </div>
  );
}
