import {useEffect, useState} from 'react';

let watchers: Map<string, Set<any>> = new Map();

export default function useLocalStorage(key: string, initialValue: any) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state on ALL listeners
      let listeners = watchers.get(key);
      if (listeners != null) {
        for (let listener of listeners) {
          listener(valueToStore);
        }
      }
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  // when a named value is changed we must setState on all.
  useEffect(() => {
    let listeners = watchers.get(key);
    if (listeners == null) {
      watchers.set(key, listeners = new Set());
    }
    listeners.add(setStoredValue);
    return () => {
      listeners.delete(setStoredValue);
    };
  }, [key]);

  return [storedValue, setValue];
}
