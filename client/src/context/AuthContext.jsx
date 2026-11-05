import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setCurrentBusiness(res.data.data.currentBusiness);
        setBusinesses(res.data.data.businesses || []);
        if (res.data.data.currentBusiness) {
          localStorage.setItem('shopops_business_id', res.data.data.currentBusiness.id);
        }
      }
    } catch (err) {
      setUser(null);
      setCurrentBusiness(null);
      localStorage.removeItem('shopops_business_id');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.data.user);
      setCurrentBusiness(res.data.data.business);
      if (res.data.data.business) {
        localStorage.setItem('shopops_business_id', res.data.data.business.id);
      }
      await fetchCurrentUser();
      return res.data;
    }
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) {
      setUser(res.data.data.user);
      setCurrentBusiness(res.data.data.business);
      if (res.data.data.business) {
        localStorage.setItem('shopops_business_id', res.data.data.business.id);
      }
      await fetchCurrentUser();
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setCurrentBusiness(null);
      localStorage.removeItem('shopops_business_id');
      window.location.href = '/login';
    }
  };

  const switchBusiness = async (businessId) => {
    localStorage.setItem('shopops_business_id', businessId);
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentBusiness,
        businesses,
        loading,
        login,
        register,
        logout,
        switchBusiness,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
