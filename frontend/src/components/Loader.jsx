import React from 'react';
import './Loader.css';

const Loader = ({ text = "Loading..." }) => {
    return (
        <div className="loader-container">
            <div className="sports-ball"></div>
            <div className="loader-shadow"></div>
            <div className="loader-text-wrapper">
                <p className="loader-text">{text}</p>
                <div className="loading-line-container">
                    <div className="loading-line-bar"></div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
