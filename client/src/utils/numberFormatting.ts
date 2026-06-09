export const formatAbbreviateNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    
    let suffix = '';
    let val = num;
    
    if (num >= 1e9) {
        val = num / 1e9;
        suffix = 'B';
    } else if (num >= 1e6) {
        val = num / 1e6;
        suffix = 'M';
    } else if (num >= 1e3) {
        val = num / 1e3;
        suffix = 'k';
    }
    
    if (val >= 100) {
        return val.toFixed(1) + suffix;
    } else {
        return val.toFixed(2) + suffix;
    }
};

export const formatNumberWithCommas = (num: number): string => {
    return num.toLocaleString('en-US');
};
