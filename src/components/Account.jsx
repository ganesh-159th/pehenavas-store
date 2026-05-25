import React from 'react';
import { useUser } from '../hooks/useUser';
import Orders from './Orders';
import { useFadeIn } from '../hooks/useFadeIn';

const Account = () => {
  const { user } = useUser();
  const isVisible = useFadeIn();

  if (!user) {
    return (
      <div className={`text-center p-8 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <p>Please sign in to view your account.</p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <h1 className="text-3xl font-bold text-rose-950 mb-8">
        Welcome, {user.name}
      </h1>
      <Orders />
    </div>
  );
};

export default Account;
