// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/config';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const [profileImage, setProfileImage] = useState(currentUser?.photoURL || null);
  const [imageError, setImageError] = useState(false);
  
  // Subscribe to user profile image changes
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Set initial profile image
    if (currentUser.photoURL) {
      setProfileImage(currentUser.photoURL);
      setImageError(false);
    }
    
    // Listen for changes to the user document in Firestore
    const userDocRef = doc(firestore, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData.photoURL && userData.photoURL !== profileImage) {
          setProfileImage(userData.photoURL);
          setImageError(false);
        }
      }
    }, (error) => {
      console.error('Error listening to user document:', error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Render theme toggle button with profile image
  return (
    <button
      onClick={toggleDarkMode}
      className={`relative p-2 rounded-full overflow-hidden
        ${darkMode 
          ? 'bg-[#64DFDF] text-[#340068]' 
          : 'bg-[#340068] text-[#64DFDF]'}`}
      aria-label="Toggle Dark Mode"
      style={{
        border: profileImage && !imageError ? '2px solid' : 'none',
        borderColor: darkMode ? '#64DFDF' : '#340068'
      }}
    >
      {/* Show profile image if available, with theme toggle icon overlaid */}
      {profileImage && !imageError ? (
        <div className="relative">
          <img 
            src={profileImage} 
            alt="User profile" 
            className="absolute -top-1 -left-1 w-7 h-7 rounded-full object-cover"
            onError={() => setImageError(true)} 
          />
          <div className="relative z-10 opacity-80">
            {darkMode ? (
              // Sun icon for light mode
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // Moon icon for dark mode
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </div>
        </div>
      ) : (
        // Regular theme toggle without profile image
        darkMode ? (
          // Sun icon for light mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )
      )}
    </button>
  );
};

export default ThemeToggle;
