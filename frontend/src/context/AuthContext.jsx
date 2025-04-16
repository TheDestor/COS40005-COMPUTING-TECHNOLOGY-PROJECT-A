import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
 
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = async () => {
        console.log("Checking auth status");
        try {
            const response = await axios.get("http://localhost:5050/auth/refresh", { withCredentials: true });
            const newAccessToken = response.data.accessToken;
            const decoded = jwtDecode(newAccessToken);

            setAccessToken(newAccessToken);
            setUser({ identifier: decoded.UserInfo.identifier, firstName: decoded.UserInfo.firstName, role: decoded.UserInfo.role });
            setIsLoggedIn(true);
            console.log("Refresh successful");
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                console.log("Refresh check: No valid session found (401/403). User is logged out.");
            } else {
                console.error("Refresh failed or no valid token:", error.response?.data || error.message);
            }

            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await axios.post("http://localhost:5050/auth/login", { identifier, password }, { withCredentials:true });
            if (response.data.success) {
                const receivedAccessToken = response.data.accessToken;
                setAccessToken(receivedAccessToken);
                setIsLoggedIn(true);

                const decoded = jwtDecode(receivedAccessToken);
                setUser({ identifier: decoded.UserInfo.identifier, firstName: decoded.UserInfo.firstName, role: decoded.UserInfo.role });
                console.log("Login successful");
                return { success: true };
            } else {
                return { success: false, message: response.data.message || "Login failed" };
            }
        } catch (error) {
            console.error("Login API error:", error.response?.data || error.message);
            return { success: false, message: error.response?.data?.message || "An error occurred during login." };
        }
    };

    const logout = async () => {
        try {
            await axios.post("http://localhost:5050/auth/logout", null, { withCredentials: true })
        } catch (error) {
            console.error("Logout API error:", error.response?.data || error.message);
        } finally {
            setAccessToken(null);
            setUser(null);
            setIsLoggedIn(false);
            console.log("Logged out");
        }
    };

    const value = {
        isLoggedIn,
        user,
        accessToken,
        isLoading,
        login,
        logout,
        setAccessToken,
        setUser,
        setIsLoggedIn
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading ? children : <div>Loading...</div> }
        </AuthContext.Provider>
    );
}