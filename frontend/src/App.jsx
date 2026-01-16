
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TurfDiscovery from './pages/TurfDiscovery';
import TurfDetails from './pages/TurfDetails';
import TeamFinder from './pages/TeamFinder';
import LandingPage from './pages/LandingPage';
import Trainers from './pages/Trainers';
import CoachProfile from './pages/CoachProfile';
import AcademyProfile from './pages/AcademyProfile';
import AcademyScheduler from './pages/AcademyScheduler';
import CoachScheduler from './pages/CoachScheduler';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import TournamentManage from './pages/TournamentManage';
import HostTournament from './pages/HostTournament';
import MyTournaments from './pages/MyTournaments';
import OrganizerHub from './pages/OrganizerHub';
import BookingConfirmation from './pages/BookingConfirmation';
import Community from './pages/Community';
import CommunityDetails from './pages/CommunityDetails';
import TurfManagement from './pages/TurfManagement';
import TurfGameManagement from './pages/TurfGameManagement';
import OwnerBookings from './pages/OwnerBookings';
import WalkInBooking from './pages/WalkInBooking';
import OwnerAnalytics from './pages/OwnerAnalytics';
import PlayerBookings from './pages/PlayerBookings';
import CoachDashboard from './pages/CoachDashboard';
import AcademyDashboard from './pages/AcademyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PartnerWithUs from './pages/PartnerWithUs';
import SamplePage from './pages/SamplePage';
import AboutUs from './pages/AboutUs';
import Support from './pages/Support';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

// Guard Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id" element={<TournamentDetails />} />
          <Route path="/tournaments/:id/manage" element={<PrivateRoute><TournamentManage /></PrivateRoute>} />
          <Route path="/host-tournament" element={<PrivateRoute><HostTournament /></PrivateRoute>} />
          <Route path="/my-tournaments" element={<PrivateRoute><MyTournaments /></PrivateRoute>} />
          <Route path="/organizer/tournaments" element={<PrivateRoute><OrganizerHub /></PrivateRoute>} />
          <Route path="/coaches/:id" element={<CoachProfile />} />
          <Route path="/coaches/:id/schedule" element={<CoachScheduler />} />
          <Route path="/academies/:id" element={<AcademyProfile />} />
          <Route path="/academies/:id/schedule" element={<AcademyScheduler />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/discovery"
            element={
              <PrivateRoute>
                <TurfDiscovery />
              </PrivateRoute>
            }
          />
          <Route
            path="/turf/:id"
            element={
              <PrivateRoute>
                <TurfDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <PrivateRoute>
                <TeamFinder />
              </PrivateRoute>
            }
          />
          <Route path="/booking-confirmation" element={<PrivateRoute><BookingConfirmation /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/manage-turfs" element={<PrivateRoute><TurfManagement /></PrivateRoute>} />
          <Route path="/manage-turfs/:turfId/games" element={<PrivateRoute><TurfGameManagement /></PrivateRoute>} />
          <Route path="/owner/bookings" element={<PrivateRoute><OwnerBookings /></PrivateRoute>} />
          <Route path="/owner/walk-in" element={<PrivateRoute><WalkInBooking /></PrivateRoute>} />
          <Route path="/owner/analytics" element={<PrivateRoute><OwnerAnalytics /></PrivateRoute>} />
          <Route path="/coach/dashboard" element={<PrivateRoute><CoachDashboard /></PrivateRoute>} />
          <Route path="/academy/dashboard" element={<PrivateRoute><AcademyDashboard /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/community/:id" element={<PrivateRoute><CommunityDetails /></PrivateRoute>} />
          <Route path="/my-bookings" element={<PrivateRoute><PlayerBookings /></PrivateRoute>} />
          <Route path="/partner" element={<PartnerWithUs />} />
          <Route path="/sample" element={<SamplePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/support" element={<Support />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
      <Analytics />
    </Router>
  );
}

export default App;
