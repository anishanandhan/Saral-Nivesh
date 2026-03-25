import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import TickerTape from './components/TickerTape';
import LoginPage from './pages/LoginPage';
import Landing from './pages/Landing';
import OpportunityRadar from './pages/OpportunityRadar';
import ChartIntelligence from './pages/ChartIntelligence';
import AskET from './pages/AskET';
import DemoScenarios from './pages/DemoScenarios';
import Learn from './pages/Learn';
import StockDetail from './pages/StockDetail';
import AgentLogPanel from './components/AgentLogPanel';
import './App.css';

function AppLayout({ children }) {
    return (
        <div className="app">
            <TickerTape />
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <AgentLogPanel />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={
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
                        <Route path="/demo" element={
                            <ProtectedRoute>
                                <AppLayout><DemoScenarios /></AppLayout>
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
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
