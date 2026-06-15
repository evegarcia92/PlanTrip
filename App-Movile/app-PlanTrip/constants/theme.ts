export const Theme = {
  colors: {
    // Original Palette
    color1: '#9ca7cd', // Light Blue-Grey
    color2: '#ced4e6', // Very Light Blue-Grey
    color3: '#697cb2', // Darker Blue-Grey
    color4: '#cdc29c', // Khaki/Sand
    color5: '#e7e2d0', // Beige/Very Light Sand
    
    // Semantic Tokens
    primary: '#697cb2',
    primaryLight: '#9ca7cd',
    secondary: '#cdc29c',
    
    // Backgrounds (Gradients)
    bgStart: '#e7e2d0',
    bgEnd: '#ced4e6',
    
    // Surfaces (Glassmorphism)
    surfaceLight: 'rgba(255, 255, 255, 0.65)',
    surfaceDarker: 'rgba(255, 255, 255, 0.4)',
    borderLight: 'rgba(255, 255, 255, 0.8)',
    borderDark: 'rgba(105, 124, 178, 0.2)', // using color3 with opacity
    
    // Text
    textMain: '#333333',
    textSecondary: '#555555',
    textAccent: '#697cb2', // color3
    textLight: '#ffffff', // For contrast on primary buttons
    
    // Status/Utility
    error: '#FF6B6B',
    success: '#34C759',
  }
};
