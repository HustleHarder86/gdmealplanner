# WordPress Integration Library

This directory will contain utilities for integrating with the WordPress site at pregnancyplateplanner.com.

## Planned Modules

### auth.ts
- JWT token validation
- WordPress user authentication
- Session management

### api-client.ts
- WordPress REST API wrapper
- Custom endpoint handlers
- Response caching

### user-sync.ts
- User data synchronization
- Profile mapping
- Subscription status sync

### theme-sync.ts
- Header/footer fetching
- Style synchronization
- Brand consistency

## Current Status
These modules will be implemented when WordPress integration begins. For now, develop all features as standalone with these future integrations in mind.

## Design Tokens
```typescript
// Use these colors to match WordPress theme
export const wordpressTheme = {
  colors: {
    primary: '#4a7c59',      // Green
    secondary: '#2d2d2d',    // Black
    background: '#ffffff',   // White
    text: '#333333',
    accent: '#7fb069'
  },
  fonts: {
    primary: 'Inter, sans-serif'
  }
};
```