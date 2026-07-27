import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DecodedToken {
    userId: string;
    email: string;
}
export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: DecodedToken | null
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
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.isAuthenticated = true;
        },

        logout: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
        }
    }
});


export const {setToken, logout} = authSlice.actions;

export default authSlice.reducer;

