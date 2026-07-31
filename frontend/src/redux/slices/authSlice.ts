import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
    username: string,
    email: string,
    avatarUrl: string,
    elo: number,
    wins: number,
    losses: number,            
}
export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: UserProfile | null
}

const initialState: AuthState = {
    isAuthenticated: false,
    token: null,
    user: null
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{token: string, user?: UserProfile}>) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
            if (action.payload.user) {
                state.user = action.payload.user;
            }
        },
        setUser: (state, action: PayloadAction<UserProfile>)=>{
            state.user = action.payload;
            state.isAuthenticated = true;
            if (state.token) {
                state.isAuthenticated = true;
            }
        },
        logout: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
        }
    }
});


export const {setCredentials, setUser, logout} = authSlice.actions;

export default authSlice.reducer;

