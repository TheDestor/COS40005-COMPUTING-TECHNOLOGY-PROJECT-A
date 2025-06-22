import { createContext, useContext, useEffect, useState } from "react";

const LOCAL_STORAGE_BOOKMARKS_KEY = "bookmarks";
const BookmarkContext = createContext(null);

export const UseBookmarkContext = () => {
    const context = useContext(BookmarkContext);
    if (!context) {
        throw new Error("useBookmarkContext must be used within a BookmarkContextProvider");
    }
    return context;
}

export const BookmarkProvider = ({ children }) => {
    const [bookmarks, setBookmarks] = useState(() => {
        const storedBookmarks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY));
        return storedBookmarks ? storedBookmarks : [];
    });

    useEffect(() => {
        try {
            const storedBookmarks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY));
            setBookmarks(storedBookmarks);
        } catch (error) {
            console.error("Error getting bookmarks:", error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }, [bookmarks]);

    const addBookmark = (newBookmark) => {
        if (!bookmarks.find(bm => bm.name === newBookmark.name)) {
            setBookmarks((prevBookmarks) => [...prevBookmarks, newBookmark]);
        }
    }

    const removeBookmark = (bookmark) => {
        setBookmarks((prev) => prev.filter(b => b.name !== bookmark.name));
    }

    const value = {
        bookmarks,
        addBookmark,
        removeBookmark
    }

    return (
        <BookmarkContext.Provider value={value}>
            {children}
        </BookmarkContext.Provider>
    );
};