import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <span className="loading-text">Loading...</span>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
