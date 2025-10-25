import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";

const SeniorModeContext = createContext({
    isSeniorMode: false,
    setIsSeniorMode: () => { },
});

export const SeniorModeProvider = ({ children }) => {
    const [isSeniorMode, setIsSeniorMode] = useState(() => {
        try {
            const savedMode = localStorage.getItem('seniorMode');
            return savedMode ? JSON.parse(savedMode) : false;
        } catch (error) {
            console.error('Could not parse seniorMode from localStorage', error);
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem('seniorMode', JSON.stringify(isSeniorMode));

        if (isSeniorMode) {
            document.body.classList.add('senior-mode-active');
        } else {
            document.body.classList.remove('senior-mode-active');
        }
    }, [isSeniorMode]);

    const value = { isSeniorMode, setIsSeniorMode };

    return (
        <SeniorModeContext.Provider value={value}>
            {children}
        </SeniorModeContext.Provider>
    );
};

export const useSeniorMode = () => {
    return useContext(SeniorModeContext);
}