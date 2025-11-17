import React, { useEffect, useState, useCallback, createContext, useContext } from "react";
import ky from "ky";
import { jwtDecode } from "jwt-decode";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// AuthProvider component manages authentication state and provides it to children components via AuthContext.
export const AuthProvider = ({ children }) => {
    // States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Processes a JWT token to update the authentication state
    // AuthProvider.processToken: include provider in user state
    const processToken = useCallback((token) => {
        // If no token is provided reset auth state to logged out
        if (!token) {
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            return;
        }
        try {
            const decoded = jwtDecode(token);
            
            // Extract the payload into userInfo
            const userInfo = decoded.UserInfo;
            // Validation
            if (!userInfo || !userInfo._id) {
                console.error("Token payload missing UserInfo or _id:", userInfo);
            }
            // Set the user info
            setUser({
                _id: userInfo._id,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email,
                phoneNumber: userInfo.phoneNumber,
                role: userInfo.role,
                nationality: userInfo.nationality,
                avatarUrl: userInfo.avatarUrl,
                authProvider: userInfo.authProvider,
                notifications: userInfo.notifications
            });
            // Store the valid access token
            setAccessToken(token);
            // Set the user as logged in
            setIsLoggedIn(true);
            
            // 🆕 Store token in localStorage for persistence
            localStorage.setItem('accessToken', token);
        } catch (error) {
            console.error("Failed to decode token or set user:", error);
            // Reset auth state as logged out
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
        }
    }, []);

    // 🆕 NEW: Refresh access token function
    const refreshAccessToken = useCallback(async () => {
        try {
            console.log('🔄 Attempting to refresh token...');
            
            const response = await ky.post('/api/auth/refresh', {
                credentials: 'include',
                timeout: 10000
            }).json();

            if (response.success && response.accessToken) {
                console.log('✅ Token refreshed successfully');
                processToken(response.accessToken);
                return response.accessToken;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            
            // If refresh fails, logout user
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            return null;
        }
    }, [processToken]);

    // 🆕 NEW: Check token expiration and refresh if needed
    const checkAndRefreshToken = useCallback(async () => {
        const token = accessToken || localStorage.getItem('accessToken');
        if (!token) return null;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            const timeUntilExpiry = decoded.exp - currentTime;

            // Refresh if token expires in less than 2 minutes
            if (timeUntilExpiry < 120) {
                console.log('⏰ Token expiring soon, refreshing...');
                return await refreshAccessToken();
            }

            return token;
        } catch (error) {
            console.error('Error checking token:', error);
            return await refreshAccessToken();
        }
    }, [accessToken, refreshAccessToken]);

    // Check the users authentication status on initial load
    const checkAuthStatus = useCallback(async () => {
        console.log("Checking auth status");
        setIsLoading(true);
        try {
            // Request a new access token from the refresh endpoint
            const response = await ky.get(
                "/api/auth/refresh",
                { credentials: 'include' }
            ).json();
            // Logging
            console.log("AuthProvider: Refresh response", response);
            processToken(response.accessToken); // Call the helper function to set user info
            console.log("AuthProvider: Refresh successful.");
        } catch (error) {
            // Log error
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                console.log("If you are not logged in. This error can be safely ignored.");
            } else {
                console.error("AuthProvider: Refresh API error:", error.response?.data || error.message);
            }

            // Reset auth state to logged out
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
        } finally {
            setIsLoading(false);
        }
    }, [processToken]);

    // Run auth status check when the auth provider mounts
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // 🆕 NEW: Set up automatic token refresh (every 5 minutes)
    useEffect(() => {
        if (!accessToken || !isLoggedIn) return;

        const interval = setInterval(() => {
            checkAndRefreshToken();
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [accessToken, isLoggedIn, checkAndRefreshToken]);

    /**
     * Logs the user in by sending credentials to the login endpoint.
     * Processes the received access token on success.
     * @param {string} identifier - User's email or phone number.
     * @param {string} password - User's password.
     * @returns {Promise<object>} - A promise resolving to { success: true } or { success: false, message: string }.
     */
    const login = async (identifier, password, recaptchaToken) => {
        try {
            const response = await ky.post(
                "/api/auth/login",
                {
                    credentials: 'include',
                    json: { identifier, password, recaptchaToken }
                }
            ).json();
            if (response.success) {
                processToken(response.accessToken);
                const decoded = jwtDecode(response.accessToken);
                const userInfo = decoded.UserInfo;
                let redirectTo = '/';
                if (userInfo.role === "cbt_admin") redirectTo = '/dashboard';
                else if (userInfo.role === "system_admin") redirectTo = '/admin-dashboard';
                return { success: true, user: userInfo, redirectTo };
            } else {
                return { success: false, message: response.message || "Login failed" };
            }
        } catch (error) {
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            if (error.response) {
                try {
                    const errorJson = await error.response.json();
                    return { success: false, message: errorJson.message || 'Login failed' };
                } catch (_) {
                    return { success: false, message: 'Login failed' };
                }
            }
            return { success: false, message: 'Login failed' };
        }
    };

    // Logs out the user
    const logout = async () => {
        try {
            const response = await ky.post(
                "/api/auth/logout",
                { credentials: 'include' }
            )
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            setAccessToken(null);
            setUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('accessToken');
            console.log("Logged out");
        }
    };

    // Allows for updating the user information stored in the context without needing to relogin or refresh
    const updateUserContext = useCallback((newUserData) => {
        console.log("AuthProvider: Updating user context", newUserData);
        // Use the functional update form of useState to ensure updates are based on the latest state.
        setUser(prevUser => {
            // Merge previous user data with the new data
            // The fields have to match
            const updatedUser = {
                ...prevUser,
                ...newUserData
            };
            console.log("AuthProvider: User state after update:", updatedUser);
            return updatedUser;
        });
    }, []);

    function setUpRecaptcha(identifier) {
        if (!auth) {
            console.error("Firebase auth is undefined!");
            return;
        }
        console.log(auth);
        
        const recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {},
            
        );
        recaptchaVerifier.render();
        return signInWithPhoneNumber(auth, identifier, recaptchaVerifier);
    }

    // The value object provided to the AuthContext.Consumer components.
    // It includes the authentication state and functions to modify it.
    const value = {
        isLoggedIn,
        user,
        accessToken,
        isLoading,
        login,
        logout,
        updateUserContext,
        setUpRecaptcha,
        refreshAccessToken,      // 🆕 NEW: Expose refresh function
        checkAndRefreshToken     // 🆕 NEW: Expose check function
    };

    // Render the AuthContext.Provider, passing the 'value' object.
    // Render children components only when the initial loading is complete.
    // Shows a simple "Loading..." text during the initial auth check.
    return (
        <AuthContext.Provider value={value}>
            {!isLoading ? children : <div>Loading...</div> }
        </AuthContext.Provider>
    );
}