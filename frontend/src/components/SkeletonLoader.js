import React from 'react';
import '../css/SkeletonLoader.css';

const SkeletonLoader = ({ type = 'text', count = 1, className = '', height, width, style = {} }) => {
    const renderEx = () => {
        const classNames = `skeleton-wrapper ${type === 'circle' ? 'skeleton-circle' : ''} ${className}`;
        const styles = { ...style, height, width };

        if (type === 'dashboard') {
            return (
                <div className="row g-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="col-12 col-md-6 col-lg-3">
                            <div className="skeleton-card skeleton-dashboard-card">
                                <div className="skeleton-wrapper skeleton-circle mb-3" style={{ width: 50, height: 50 }}></div>
                                <div className="skeleton-wrapper skeleton-text mb-2" style={{ width: '60%' }}></div>
                                <div className="skeleton-wrapper skeleton-title" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (type === 'list') {
            return (
                <div className="d-flex flex-column gap-3">
                    {[...Array(count)].map((_, i) => (
                        <div key={i} className="skeleton-wrapper" style={{ height: '60px', borderRadius: '12px' }}></div>
                    ))}
                </div>
            );
        }

        // Default single line/block
        return <div className={classNames} style={styles}></div>;
    };

    return (
        <>
            {type === 'dashboard' || type === 'list' ? renderEx() : [...Array(count)].map((_, i) => (
                <div key={i} className={`skeleton-wrapper ${type === 'circle' ? 'skeleton-circle' : ''} ${className}`} style={{ ...style, height, width, marginBottom: count > 1 ? '0.5rem' : 0 }}></div>
            ))}
        </>
    );
};

export default SkeletonLoader;
