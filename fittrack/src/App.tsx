import { Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import MacrosPage from './pages/MacrosPage';
import BarbellPage from './pages/BarbellPage';
import ConditioningPage from './pages/ConditioningPage';
import ProfilePage from './pages/ProfilePage';

const tabs = [
  { to: '/profile', label: 'Profile' },
  { to: '/workout', label: 'Workout' },
  { to: '/macros', label: 'Macros' },
  { to: '/barbell', label: 'Barbell' },
  { to: '/conditioning', label: 'Conditioning' },
];

function NavBar() {
  return (
    <nav className="flex items-center gap-2 border-b border-[#2A2A2A] bg-[#141414] px-6 py-3">
      <NavLink to="/" end className="mr-6 text-lg font-bold text-[#6C63FF]">
        FORGE.
      </NavLink>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#6C63FF] text-white'
                : 'text-gray-400 hover:bg-[#1C1C1C] hover:text-gray-200'
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
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-gray-100">
      <NavBar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/macros" element={<MacrosPage />} />
          <Route path="/barbell" element={<BarbellPage />} />
          <Route path="/conditioning" element={<ConditioningPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}
