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
        try {
            const storedItem = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
            if (storedItem === null || storedItem === "null") {
                return [];
            }
            return JSON.parse(storedItem);
        } catch (error) {
            console.error("Error parsing bookmarks from localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        if (bookmarks) {
            localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
    }, [bookmarks]);

    const addBookmark = (newBookmark) => {
        setBookmarks((prevBookmarks = []) => {
            if (!prevBookmarks.find(bm => bm.name === newBookmark.name)) {
                return [...prevBookmarks, newBookmark];
            }
            return prevBookmarks;
        });
    }

    const removeBookmark = (bookmark) => {
        setBookmarks((prevBookmarks = []) => prevBookmarks.filter(b => b.name !== bookmark.name));
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