/**
 * Shared Framer Motion animation variants & hooks
 * Import into any page: import { fadeUp, stagger, ... } from '../utils/motionVariants'
 */
import { useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

/* ─── Stagger Containers ───────────────────────────────────── */
export const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

export const staggerFast = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

export const staggerSlow = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18 } },
};

/* ─── Fade Variants ────────────────────────────────────────── */
export const fadeUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const fadeInScale = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── Slide Variants ───────────────────────────────────────── */
export const slideLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── Hover Presets ────────────────────────────────────────── */
export const hoverLift = {
    scale: 1.03,
    y: -5,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
};

export const hoverGlow = {
    scale: 1.04,
    boxShadow: '0 12px 40px rgba(108, 92, 231, 0.15)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
};

export const hoverTilt = {
    scale: 1.04,
    rotateX: 2,
    rotateY: -2,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
};

export const tapScale = { scale: 0.95 };

/* ─── Viewport Defaults ─────────────────────────────────────── */
export const viewportOnce = { once: true, amount: 0.2 };
export const viewportHalf = { once: true, amount: 0.3 };

/* ─── Count-Up Hook ─────────────────────────────────────────── */
export function useCountUp(target, duration = 1200, startOnView = true) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(!startOnView);
    const ref = useRef(null);

    useEffect(() => {
        if (!startOnView) return;
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [startOnView]);

    useEffect(() => {
        if (!started) return;
        const num = typeof target === 'string' ? parseFloat(target.replace(/[₹,%+\s]/g, '')) : target;
        if (isNaN(num)) return;

        let start = 0;
        const step = num / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= num) {
                setCount(num);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start * 100) / 100);
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration, started]);

    return { count, ref };
}

/* ─── Parallax Hook ─────────────────────────────────────────── */
export function useParallax(offset = 80) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [0, -offset]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.04]);
    return { ref, y, scale };
}
