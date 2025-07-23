import savgolFilter from 'ml-savitzky-golay';

export function savgol(data: number[], windowSize: number, poly: number) {
  return savgolFilter(data, windowSize, { derivative: 0, polynomial: poly, pad: 'post' });
}
