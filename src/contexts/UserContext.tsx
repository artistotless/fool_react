import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { testMode } from 'src/environments/environment';
import { IUser, IUserToken } from 'src/types';

interface UserContext {
  user: IUser
  token: IUserToken | null,
  setToken: (token: IUserToken) => void;
}

const getInitialUser = (): IUser => {
  return {
    avatar: testMode().enabled ? testMode().testPlayers[0].avatar : '',
    id: testMode().enabled ? testMode().testPlayers[0].id : '',
    name: testMode().enabled ? testMode().testPlayers[0].name : 'player'
  }
}

const UserContext = createContext<UserContext | null>(null);
export const UserProvider = ({ children, initialToken }: { children: ReactNode, initialToken: IUserToken | null }) => {
  const [user, setUser] = useState<IUser>(getInitialUser());
  const [token, setToken] = useState<IUserToken | null>(initialToken);

  useEffect(() => {
    if (token) {
      setUser({
        avatar: '',
        id: token.userId,
        name: token.nickName,
      });
    }
  }, [token])

  const contextValue = useMemo(() => ({
    user,
    token,
    setToken
  }), [token, user]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Хук для использования контекста
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within an UserProvider');
  }
  return context;
};