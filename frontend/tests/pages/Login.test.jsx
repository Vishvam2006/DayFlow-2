import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../../src/pages/Login';
import { AuthProvider } from '../../src/context/authContext';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import React from 'react';

// Mock axios
vi.mock('axios');

// Mock Auth Context
const mockLogin = vi.fn();
vi.mock('../../src/context/authContext', () => ({
  useAuth: () => ({
    login: mockLogin
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <a>{children}</a>
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    axios.post.mockRejectedValue({
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('name@company.com'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong-password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('calls login and navigates on successful login', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', role: 'admin' };
    axios.post.mockResolvedValue({
      data: {
        success: true,
        user: mockUser,
        token: 'fake-token'
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('name@company.com'), {
      target: { value: 'admin@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'admin123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
    });
  });
});
