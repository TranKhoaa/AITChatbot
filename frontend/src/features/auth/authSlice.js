import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    status: 'idle',
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const {id, name, access_token, refresh_token } = action.payload;
            state.user = {id, name};
            state.token = access_token;
            state.refreshToken = refresh_token;
            state.status = 'succeeded'
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.status = 'failed'
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.status = 'idle';
            state.error = null;
        }
    }
})

export const {setCredentials, setError, logout} = authSlice.actions;

export default authSlice.reducer;