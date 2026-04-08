import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../../src/components/dashboard/StatCard';
import React from 'react';

const mockIcon = () => <div data-testid="mock-icon">Icon</div>;

describe('StatCard', () => {
  it('renders correctly with given props', () => {
    render(<StatCard title="Total Employees" value="50" color="bg-blue-500" icon={mockIcon} />);
    
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders without an icon', () => {
    render(<StatCard title="Total Orders" value="100" color="bg-green-500" />);
    
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
  });
});
