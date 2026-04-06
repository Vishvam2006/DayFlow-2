// Handles User Information

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios';
import API_BASE_URL from "../config/api.js";

const userContext = createContext()


const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    // console.log(response.data)
                    if (response.data.success) {
                        setUser(response.data.user)
                    }
                } else {
                    setUser(null)
                    setLoading(false)

                }
            } catch (error) {
                setUser(null)
                localStorage.removeItem("token");
            } finally {
                setLoading(false)
            }
        }
        verifyUser();
    }, [])

    const login = (user) => {
        setUser(user);
    }

    const updateUser = (nextUser) => {
        setUser((prev) => ({ ...(prev || {}), ...(nextUser || {}) }));
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
    }
    return (
        <userContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </userContext.Provider>
    )
}








export const useAuth = () => useContext(userContext);

export default AuthProvider
