import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { GamificationProvider } from './context/GamificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import TickerTape from './components/TickerTape';
import LoginPage from './pages/LoginPage';
import Landing from './pages/Landing';
import OpportunityRadar from './pages/OpportunityRadar';
import ChartIntelligence from './pages/ChartIntelligence';
import AskET from './pages/AskET';
import Learn from './pages/Learn';
import MyPortfolio from './pages/MyPortfolio';
import StockDetail from './pages/StockDetail';
import AgentLogPanel from './components/AgentLogPanel';
import FloatingAssistant from './components/FloatingAssistant';
import './styles/animations.css';
import './App.css';

function AppLayout({ children }) {
    return (
        <div className="app">
            {/* Floating Glow Blobs */}
            <div className="glow-blob blob-1" aria-hidden="true" />
            <div className="glow-blob blob-2" aria-hidden="true" />
            <div className="glow-blob blob-3" aria-hidden="true" />
            <TickerTape />
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <FloatingAssistant />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <PortfolioProvider>
                    <GamificationProvider>
                        <Router>
                            <Routes>
                                <Route path="/" element={<LoginPage />} />
                                <Route path="/home" element={
                                    <ProtectedRoute>
                                        <AppLayout><Landing /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/radar" element={
                                    <ProtectedRoute>
                                        <AppLayout><OpportunityRadar /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/charts" element={
                                    <ProtectedRoute>
                                        <AppLayout><ChartIntelligence /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/ask" element={
                                    <ProtectedRoute>
                                        <AppLayout><AskET /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/portfolio" element={
                                    <ProtectedRoute>
                                        <AppLayout><MyPortfolio /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/learn" element={
                                    <ProtectedRoute>
                                        <AppLayout><Learn /></AppLayout>
                                    </ProtectedRoute>
                                } />
                                <Route path="/stock/:ticker" element={
                                    <ProtectedRoute>
                                        <AppLayout><StockDetail /></AppLayout>
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </Router>
                    </GamificationProvider>
                </PortfolioProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
