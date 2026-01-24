import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * Delays updating the value until the user stops typing for the specified delay
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if value changes before delay completes
    // This prevents the API call if user is still typing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Usage Example:
 * 
 * const [searchInput, setSearchInput] = useState("");
 * const debouncedSearch = useDebounce(searchInput, 500);
 * 
 * // Use debouncedSearch in API call instead of searchInput
 * const { data } = useMembers(debouncedSearch);
 * 
 * // Use searchInput in the input field for instant feedback
 * <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
 */