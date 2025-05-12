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
                avatarUrl: userInfo.avatarUrl
            });
            // Store the valid access token
            setAccessToken(token);
            // Set the user as logged in
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Failed to decode token or set user:", error);
            // Reset auth state as logged out
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
        }
    }, []);

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
        } finally {
            setIsLoading(false);
        }
    }, [processToken]);
    // const checkAuthStatus = useCallback(async () => {
    //     console.log("Checking auth status");
    //     setIsLoading(true);
    
    //     const maxRetries = 3;
    //     const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    
    //     for (let attempt = 1; attempt <= maxRetries; attempt++) {
    //         try {
    //             const response = await ky.get("/api/auth/refresh", {
    //                 credentials: 'include',
    //             }).json();
    
    //             console.log("AuthProvider: Refresh response", response);
    //             processToken(response.accessToken);
    //             console.log("AuthProvider: Refresh successful.");
    //             return; // Success: exit function
    //         } catch (error) {
    //             const status = error.response?.status;
    //             const message = await error.response?.text();
    
    //             if (status === 401 || status === 403) {
    //                 console.log("User not authenticated. This can be safely ignored.");
    //                 break; // Don't retry unauthorized
    //             }
    
    //             if (attempt < maxRetries) {
    //                 console.warn(`Retry attempt ${attempt} failed. Retrying...`, message);
    //                 await delay(1000 * Math.pow(2, attempt)); // exponential backoff: 2s, 4s, 8s...
    //             } else {
    //                 console.error("AuthProvider: Refresh API failed after retries:", message || error.message);
    //             }
    //         }
    //     }
    
    //     // If we reach here, all attempts failed — reset auth state
    //     setIsLoggedIn(false);
    //     setUser(null);
    //     setAccessToken(null);
    //     setIsLoading(false);
    // }, [processToken]);
    

    // Run auth status check when the auth provider mounts
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    /**
     * Logs the user in by sending credentials to the login endpoint.
     * Processes the received access token on success.
     * @param {string} identifier - User's email or phone number.
     * @param {string} password - User's password.
     * @returns {Promise<object>} - A promise resolving to { success: true } or { success: false, message: string }.
     */
    const login = async (identifier, password) => {
        setIsLoading(true);
        try {
            const response = await ky.post(
                "/api/auth/login",
                {
                    credentials: 'include',
                    json: {identifier, password}
                }
            ).json();
            if (response.success) {
                processToken(response.accessToken);
                const decoded = jwtDecode(response.accessToken);
                const userInfo = decoded.UserInfo;

                let redirectTo = '/';
                if (userInfo.role === "cbt_admin") {
                    redirectTo = '/dashboard';
                } else if (userInfo.role === "system_admin") {
                    redirectTo = '/system-admin';
                }
                
                console.log("AuthProvider: Login successful.");
                setIsLoading(false);
                return { success: true, user: userInfo, redirectTo: redirectTo };
            } else {
                console.log("AuthProvider: Login failed - API success false or no token.");
                setIsLoading(false);
                return { success: false, message: response.message || "Login failed" };
            }
        } catch (error) {
            setIsLoading(false);
            setIsLoggedIn(false);
            setUser(null);
            setAccessToken(null);
            console.error(error);
            if (error.response) {
                const errorJson = await error.response.json();
                console.error(error);
                return errorJson.message;
            }
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
        setUpRecaptcha
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