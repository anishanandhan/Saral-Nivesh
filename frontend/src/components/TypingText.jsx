import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * AI-tutor typing animation component.
 * Renders text character-by-character with a blinking cursor.
 *
 * @param {string}  text      - The text to type out
 * @param {number}  speed     - Milliseconds per character (default 25)
 * @param {string}  className - Optional CSS class
 * @param {boolean} trigger   - Start typing when true (default true)
 */
export default function TypingText({ text = '', speed = 25, className = '', trigger = true }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!trigger) { setDisplayed(''); setDone(false); return; }
        setDisplayed('');
        setDone(false);
        let i = 0;
        const id = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) { clearInterval(id); setDone(true); }
        }, speed);
        return () => clearInterval(id);
    }, [text, speed, trigger]);

    return (
        <span className={`typing-text ${className}`}>
            {displayed}
            {!done && (
                <motion.span
                    className="typing-cursor"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                >
                    |
                </motion.span>
            )}
        </span>
    );
}
