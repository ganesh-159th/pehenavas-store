import React from 'react';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Pehenavas</div>
      <div className="flex items-center">
        {user ? (
          <div className="mr-4">Hello, {user.name}</div>
        ) : (
          <button onClick={() => navigate('/signin')} className="mr-4">
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
