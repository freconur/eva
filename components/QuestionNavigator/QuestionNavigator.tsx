import React, { useEffect, useState } from 'react';
import styles from './QuestionNavigator.module.css';

interface QuestionNavigatorProps {
    totalQuestions: number;
    onQuestionClick?: (index: number) => void;
    activeQuestion?: number;
}

const QuestionNavigator = ({
    totalQuestions,
    onQuestionClick,
    activeQuestion = 0
}: QuestionNavigatorProps) => {
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll to add background blur/shadow when passed the top
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClick = (index: number) => {
        // Scroll to the element if id is standard "question-index"
        const element = document.getElementById(`question-${index}`);
        if (element) {
            // Offset for fixed header + this navigation bar
            const yOffset = -140;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }

        if (onQuestionClick) {
            onQuestionClick(index);
        }
    };

    if (totalQuestions === 0) return null;

    return (
        <div className={`${styles.navigatorContainer} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.scrollWrapper}>
                <div className={styles.buttonsContainer}>
                    {Array.from({ length: totalQuestions }).map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.navButton} ${activeQuestion === index ? styles.active : ''}`}
                            onClick={() => handleClick(index)}
                            title={`Ir a la pregunta ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuestionNavigator;
