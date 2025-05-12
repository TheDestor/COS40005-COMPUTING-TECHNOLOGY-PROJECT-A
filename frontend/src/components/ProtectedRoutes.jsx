import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider"

const ProtectedRoute = ({ allowedRoles }) => {
    const { isLoggedIn, user } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        console.warn(`Access denied for role: ${user.role}. Required: ${allowedRoles.join(', ')}`);
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;