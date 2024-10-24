import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';

// Step component: takes 'title' and 'stepNumber' as props and renders children inside it
const Step = ({ title, stepNumber, children }: { title: string, stepNumber: number, children: React.ReactNode }) => {
    return (
        <div role="listitem" className="step-container">
            <div className="step-line"></div>
            <div className="step-number-container">
                <div className="step-number">
                    {stepNumber}
                </div>
            </div>
            <div className="step-content">
                <p className="step-title">{title}</p>
                <div>{children}</div>
            </div>
        </div>
    );
};

// Define prop types for Step component
Step.propTypes = {
    title: PropTypes.string.isRequired,
    stepNumber: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired,
};

// Steps component: renders multiple Step components and adds the numbering automatically
const Steps = ({ children }: { children: React.ReactNode }) => {
    const steps = React.Children.toArray(children).filter(React.isValidElement) as ReactElement[];

    return (
        <div role="list" className="steps-list">
            {steps.map((step, index) => (
                <>
                    {React.cloneElement(step, {
                        stepNumber: index + 1,
                    })}
                </>
            ))}
        </div>
    );
};

// Define prop types for Steps component
Steps.propTypes = {
    children: PropTypes.node.isRequired,
};

export { Step, Steps };
