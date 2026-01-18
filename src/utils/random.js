// Random utility functions

export const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = () => Math.random();

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

export const generateId = () => Math.random().toString(36).substr(2, 9);
