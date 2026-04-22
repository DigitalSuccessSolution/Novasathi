import React, { useEffect } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import CallManager from "./components/CallManager";
import Home from "./components/Home";
import StarsAndFuture from "./pages/StarsAndFuture";
import DilKiBaat from "./pages/DilKiBaat";
import ChatScreen from "./pages/ChatScreen";
import ExpertDetail from "./pages/ExpertDetail";
import MoodDetail from "./pages/MoodDetail";
import BottomNav from "./components/BottomNav";
import WhatsAppButton from "./components/WhatsAppButton";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Transactions from "./pages/Transactions";
import Notifications from "./pages/Notifications";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminVerifications from "./pages/admin/Verifications";
import AdminFinances from "./pages/admin/Finances";
import AdminContent from "./pages/admin/Content";
import AdminSettings from "./pages/admin/Settings";
import AdminRitualMonitor from "./pages/admin/RitualMonitor";
import AdminPayouts from "./pages/admin/Payouts";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminCategories from "./pages/admin/CategoryManagement";

import ExpertOverview from "./pages/expert/Overview";
import ExpertEarnings from "./pages/expert/Earnings";
import ExpertHistory from "./pages/expert/History";
import ExpertProfile from "./pages/expert/Profile";
import ExpertSessions from "./pages/expert/Sessions";
import ExpertSettings from "./pages/expert/Settings";
import ExpertLounge from "./pages/expert/ExpertLounge";
import ExpertHandbook from "./pages/expert/Handbook";
import ExpertTerms from "./pages/expert/ExpertTerms";
import ExpertLogin from "./components/ExpertLogin";
import ExpertSignup from "./components/ExpertSignup";

import UserBottomNav from "./components/UserBottomNav";
import LoginSidebar from "./components/LoginSidebar";
import Experts from "./pages/Experts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ─── SCROLL TO TOP ON NAVIGATE ───
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

// ─── ROUTE PROTECTION ───
const ProtectedRoute = ({ children, allowedRoles, requireApproval = false }) => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06070f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // If not logged in, we go to home and trigger the login sidebar
    return <Navigate to="/" state={{ from: pathname, openLogin: true }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  // Exclusive check for verified experts for B2B Lounge
  if (requireApproval && user.role === 'EXPERT' && user.serverStatus !== 'APPROVED') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ─── AUTH REDIRECT ───
const RedirectIfAuth = ({ children, preventUserRedirect = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'EXPERT' || user.role === 'COUNSELOR') return <Navigate to="/expert-panel/overview" replace />;
    
    // For regular users, we only redirect if not explicitly prevented (e.g. on / route)
    if (user.role === 'USER' && !preventUserRedirect) return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── MAIN CONTENT ───
const AppContent = () => {
  const { pathname, state } = useLocation();
  const { isLoginModalOpen, setIsLoginModalOpen } = useAuth();

  const navigate = useNavigate();
  useEffect(() => {
    if (state?.openLogin && !isLoginModalOpen) {
      setIsLoginModalOpen(true);
      // Clear the state so it doesn't re-trigger on next render or after closing
      navigate(pathname, { replace: true, state: { ...state, openLogin: undefined } });
    }
  }, [state, isLoginModalOpen, setIsLoginModalOpen, navigate, pathname]);
  
  const isSpecialToggle = pathname === "/" || 
                          pathname === "/stars-and-future" || 
                          pathname === "/dil-ki-baat" || 
                          pathname.startsWith("/feeling/");

  const isUserDashboard = pathname === "/dashboard" || 
                           pathname === "/profile" || 
                           pathname === "/wallet" || 
                           pathname === "/transactions" ||
                           pathname === "/experts";

  const isChatPath = pathname.startsWith("/chat/") || pathname.startsWith("/admin/messages");

  const isHideNav = pathname === "/expert-login" || 
                     pathname === "/expert-signup" ||
                     pathname === "/admin-login" ||
                     isChatPath;

  const isAdminPath = pathname.startsWith("/admin");
  const isExpertPath = pathname.startsWith("/expert-panel");
  const hideFooter = isHideNav || isUserDashboard || isAdminPath || isExpertPath;

  return (
    <div className={`font-sans antialiased text-white bg-[#06070f] min-h-screen ${isHideNav ? "" : "pb-20 md:pb-0"} relative overflow-x-hidden`}>
      {!isHideNav && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RedirectIfAuth preventUserRedirect={true}><Home /></RedirectIfAuth>} />
        <Route path="/stars-and-future" element={<StarsAndFuture />} />
        <Route path="/dil-ki-baat" element={<DilKiBaat />} />
        <Route path="/expert/:id" element={<ExpertDetail />} />
        <Route path="/feeling/:mood" element={<MoodDetail />} />
        <Route path="/expert-login" element={<RedirectIfAuth><ExpertLogin /></RedirectIfAuth>} />
        <Route path="/expert-signup" element={<RedirectIfAuth><ExpertSignup /></RedirectIfAuth>} />
        <Route path="/admin-login" element={<RedirectIfAuth><AdminLogin /></RedirectIfAuth>} />
        <Route path="/experts" element={<Experts />} />

        {/* Protected User Routes */}
        <Route path="/chat/:id" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVerifications /></ProtectedRoute>} />
        <Route path="/admin/finances" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminFinances /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['ADMIN']}><ChatScreen /></ProtectedRoute>} />
        <Route path="/admin/messages/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><ChatScreen /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminContent /></ProtectedRoute>} />
        <Route path="/admin/ritual-monitor" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminRitualMonitor /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPayouts /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCategories /></ProtectedRoute>} />

        {/* Expert Routes */}
        <Route path="/expert-panel" element={<Navigate to="/expert-panel/overview" replace />} />
        <Route path="/expert-panel/overview" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertOverview /></ProtectedRoute>} />
        <Route path="/expert-panel/earnings" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertEarnings /></ProtectedRoute>} />
        <Route path="/expert-panel/history" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertHistory /></ProtectedRoute>} />
        <Route path="/expert-panel/profile" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertProfile /></ProtectedRoute>} />
        <Route path="/expert-panel/sessions" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertSessions /></ProtectedRoute>} />
        <Route path="/expert-panel/settings" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertSettings /></ProtectedRoute>} />
        <Route path="/expert-panel/lounge" element={<ProtectedRoute allowedRoles={['EXPERT', 'ADMIN']}><ExpertLounge /></ProtectedRoute>} />
        <Route path="/expert-panel/handbook" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertHandbook /></ProtectedRoute>} />
        <Route path="/expert-panel/terms" element={<ProtectedRoute allowedRoles={['EXPERT']}><ExpertTerms /></ProtectedRoute>} />

        <Route path="*" element={<Home />} />
      </Routes>
      
      {isSpecialToggle && <BottomNav />}
      {isUserDashboard && <UserBottomNav />}
      {/* {!isHideNav && <WhatsAppButton />} */}
      
      {!hideFooter && <Footer />}
      <LoginSidebar />
    </div>
  );
};

const App = () => {
  return (
    <>
      <ScrollToTop />
      <AppContent />
      <CallManager />
    </>
  );
};

export default App;
