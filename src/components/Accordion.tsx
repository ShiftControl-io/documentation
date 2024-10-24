import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Accordion = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div role="button" className="accordion-container">
            <button
                className="accordion-button"
                aria-expanded={isOpen}
                onClick={toggleAccordion}
            >
                <div className={`accordion-icon ${isOpen ? 'rotate' : ''}`}></div>
                <div className="accordion-title">
                    {title}
                </div>
            </button>
            {isOpen && (
                <div className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );
};

Accordion.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

export default Accordion;
