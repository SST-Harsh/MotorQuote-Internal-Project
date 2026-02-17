// Utility functions
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
};
