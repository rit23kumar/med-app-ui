export const formatIndianCurrency = (amount: number): string => {
    const parts = amount.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    if (integerPart.length > 3) {
        let lastThree = integerPart.substring(integerPart.length - 3);
        let otherNumbers = integerPart.substring(0, integerPart.length - 3);
        if (otherNumbers.length > 0) {
            lastThree = ',' + lastThree;
        }
        integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    }

    return `${integerPart}.${decimalPart}`;
}; 