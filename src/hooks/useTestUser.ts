import { useState, useEffect } from 'react';

interface TestUser {
  id: string;
  email: string;
  createdAt: string;
}

const TEST_USER_KEY = 'test_user_session';

export const useTestUser = () => {
  const [testUser, setTestUser] = useState<TestUser | null>(null);

  useEffect(() => {
    // Load existing test user from localStorage
    const stored = localStorage.getItem(TEST_USER_KEY);
    if (stored) {
      try {
        setTestUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing test user:', e);
      }
    }
  }, []);

  const createTestUser = () => {
    const newUser: TestUser = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test_user_${Date.now()}@example.com`,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(TEST_USER_KEY, JSON.stringify(newUser));
    setTestUser(newUser);
    return newUser;
  };

  const clearTestUser = () => {
    localStorage.removeItem(TEST_USER_KEY);
    setTestUser(null);
  };

  return {
    testUser,
    createTestUser,
    clearTestUser
  };
};
