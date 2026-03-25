import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
        >
            <div className={`theme-toggle-thumb ${theme === 'light' ? 'light' : ''}`}>
                {theme === 'dark' ? <Moon /> : <Sun />}
            </div>
        </button>
    );
}
