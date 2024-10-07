import { useState, useEffect } from 'react';

export function useCurrentUser() {
  const [currentUserName, setCurrentUserName] = useState('Me');

  // TODO: Implement logic to fetch the current user's name from the server
  useEffect(() => {
    // Fetch current user's name from the server
    // For now, we'll use a placeholder
    setCurrentUserName('Me');
  }, []);

  return { currentUserName, setCurrentUserName };
}