import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClass = 'btn';
    let variantClass = 'btn-primary';

    if (variant === 'secondary') variantClass = 'btn-secondary';
    if (variant === 'danger') variantClass = 'btn-danger';

    return (
        <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};
