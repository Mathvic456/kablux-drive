import { useCallback, useEffect, useMemo, useState, useRef } from "react";

const useSearch = (originalMessages) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const timerRef = useRef(undefined);

    // Debounce search term
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [searchTerm]);

    // Memoized filtered results
    const filteredMessages = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return originalMessages;
        }

        const normalizedTerm = debouncedSearchTerm?.toLowerCase().trim();

        return originalMessages?.filter((message) =>
            message?.name?.toLowerCase().includes(normalizedTerm)
        );
    }, [originalMessages, debouncedSearchTerm]);

    const handleSearch = useCallback((text) => {
        setSearchTerm(text);
    }, []);

    return { filteredMessages, handleSearch, searchTerm }; // Return searchTerm for controlled input
};

export default useSearch;