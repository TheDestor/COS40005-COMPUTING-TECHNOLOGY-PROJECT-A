import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider"

function ProtectedRoute({ allowedRoles }) {
    const { isLoggedIn, user } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        if (location.pathname === "/profile-settings") {
            return <Navigate to="/" replace state={{ showLoginOnce: true, from: location }} />;
        }
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        // console.warn(`Access denied for role: ${user.role}. Required: ${allowedRoles.join(', ')}`);
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;