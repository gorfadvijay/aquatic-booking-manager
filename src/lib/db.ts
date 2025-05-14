// This file initializes and exports all services

import { initializeMockData } from './services';

// Initialize mock data on import
initializeMockData();

// Re-export all services
export * from './services'; 