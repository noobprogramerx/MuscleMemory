// src/data/mockData.ts
import initialData from './initialData.json';
import type { StoreState } from '../types/index';

/**
 * Wrapper to provide initial store state with proper TypeScript typing.
 */
const mockData: StoreState = initialData as StoreState;

export default mockData;
