export function calculateLinearRegression(y) {
    const n = y.length;
    if (n === 0)
        return { slope: 0, intercept: 0, r2: 0 };
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0)
        return { slope: 0, intercept: sumY / n, r2: 0 };
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    // R2 Calculation
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - (sumY / n), 2), 0);
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    return { slope, intercept, r2 };
}
export function analyzeTrendShape(points) {
    if (!points || points.length < 5)
        return 'Flat'; // Not enough data
    const { slope, r2 } = calculateLinearRegression(points);
    // Heuristics for shape (assuming normalized 0-100 data usually)
    // Slope represents change per unit (day/week). 
    // If points are [10, 20, 30, 40, 50], slope is 10.
    if (slope > 0.5)
        return 'Rising';
    if (slope < -0.5)
        return 'Falling';
    // Check for Peaking (Rising then Falling)
    // Split in half
    const mid = Math.floor(points.length / 2);
    const firstHalf = points.slice(0, mid);
    const secondHalf = points.slice(mid);
    const slope1 = calculateLinearRegression(firstHalf).slope;
    const slope2 = calculateLinearRegression(secondHalf).slope;
    if (slope1 > 0.5 && slope2 < -0.5)
        return 'Peaking';
    return 'Flat';
}
