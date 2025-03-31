import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../ThemedText';

// Mock useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn().mockReturnValue('#000000'),
}));

describe('ThemedText', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <ThemedText>Test Text</ThemedText>
    );
    
    expect(getByText('Test Text')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <ThemedText style={{ fontSize: 20 }}>Test Text</ThemedText>
    );
    
    const textElement = getByText('Test Text');
    expect(textElement.props.style).toContainEqual({ fontSize: 20 });
  });
});
