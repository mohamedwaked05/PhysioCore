import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem('physiocore-theme') ?? 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('physiocore-theme', theme);
    }, [theme]);

    const toggle = () => {
        // Apply smooth transition class only while switching
        document.documentElement.setAttribute('data-theme-transitioning', '');
        setTheme(t => (t === 'light' ? 'dark' : 'light'));
        setTimeout(() => {
            document.documentElement.removeAttribute('data-theme-transitioning');
        }, 400);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
