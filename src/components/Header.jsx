import React from 'react';
import { useUser } from '../hooks/useUser';

const Header = () => {
  const { user, login } = useUser();

  const handleSignIn = () => {
    // This is a mock login. Replace with a real authentication flow.
    login({ name: 'Ganesh' });
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Pehenavas</div>
      <div className="flex items-center">
        {user ? (
          <div className="mr-4">Hello, {user.name}</div>
        ) : (
          <button onClick={handleSignIn} className="mr-4">
            Sign In
          </button>
        )}
        <div className="mr-4">Account & Orders</div>
        <div>Cart</div>
      </div>
    </header>
  );
};

export default Header;
