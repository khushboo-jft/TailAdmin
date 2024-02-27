import React, { createContext, useCallback, useContext } from "react";
import { getRequest, postRequest } from "../utils/Axios";
import { urls } from "../utils/urls";
import { message } from "antd";
import { isValidToken, setSession } from "./utils";
import { useNavigate } from "react-router-dom";
type AuthUserType = {
  companyId: string;
  companyName: string;
  email: string;
  id: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  logo?:string
} | null;

type AuthStateType = {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: AuthUserType;
};

const initialState: AuthStateType = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
};

enum Types {
  INITIAL = "INITIAL",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
}

type Payload = {
  [Types.INITIAL]: {
    isAuthenticated: boolean;
    user: AuthUserType;
  };
  [Types.LOGIN]: {
    user: AuthUserType;
  };
  [Types.LOGOUT]: undefined;
};

type ActionMapType<T extends { [index: string]: any }> = {
  [Key in keyof T]: T[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: T[Key];
      };
};

type ActionType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

type AuthContextType = {
  user: AuthUserType;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextType | null>(null);

const reducer = (state: AuthStateType, action: ActionType) => {
  if (action.type === Types.INITIAL) {
    return {
      ...state, // spread existing state
      isAuthenticated: action.payload.isAuthenticated,
      user: action.payload.user,
      isInitialized: true,
    };
  }

  if (action.type === Types.LOGIN) {
    return {
      ...state,
      isAuthenticated: true,
      isInitialized: false,
      user: action.payload.user,
    };
  }

  if (action.type === Types.LOGOUT) {
    return {
      ...state,
      isAuthenticated: false,
      user: null,
    };
  }

  return state;
};


export default function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const navigate =useNavigate()


  const initialize = useCallback(async () => {
    try {
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const response: any = await getRequest(urls.me);

        const user = {
          companyId: response.companyId,
          companyName: response.companyName,
          email: response.email,
          id: response.id,
          name: response.name,
          role: response.role.role,
          isSuperAdmin: response.isSuperAdmin,
          logo: response.logo
        };

        dispatch({
          type: Types.INITIAL,
          payload: {
            isAuthenticated: true,
            user,
          },
        });
      } 
    } catch (error) {
      console.error(error);
      dispatch({
        type: Types.INITIAL,
        payload: {
          isAuthenticated: false,
          user: null,
        },
      });
    }
  }, [dispatch]); // Include initialize in the dependency array
  
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    initialize();
  }, [state.isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      const response: any = await postRequest(urls.login, { email, password });

      const { accessToken, ...user } = response;
      setSession(accessToken);
      console.log(response);
      navigate('/')
      dispatch({
        type: Types.LOGIN,
        payload: {
          user,
        },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      message.error("Error logging in");
    }
  };

  const logout = () => {
    localStorage.removeItem("toAdmin");
    setSession(null);
    dispatch({
      type: Types.LOGOUT,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  console.log(context,'context');

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
