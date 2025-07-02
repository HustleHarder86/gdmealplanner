# WordPress Integration Strategy

This document outlines the hybrid integration approach for deploying the Pregnancy Plate Planner Next.js application alongside the existing WordPress site at pregnancyplateplanner.com.

## Architecture Overview

- **WordPress (pregnancyplateplanner.com)**: Content, blog, SEO, marketing pages
- **Next.js App (app.pregnancyplateplanner.com)**: Interactive meal planner, tracking, user dashboard

## Key Integration Points

### 1. Authentication & User Management

#### Single Sign-On (SSO) Strategy
```typescript
// Shared JWT token structure
interface SharedAuthToken {
  userId: string;
  email: string;
  wordpressId: number;
  firebaseUid: string;
  exp: number;
}
```

- WordPress generates JWT tokens on login
- Next.js validates tokens and creates/updates Firebase users
- Shared secret key for token validation
- Token passed via secure cookie or URL parameter

#### User Data Sync
- WordPress → Firebase: On registration/update via webhook
- Firebase → WordPress: Via REST API for subscription status
- Shared user ID mapping table

### 2. Visual Consistency

#### Shared Components
```css
/* Shared CSS variables to maintain in both systems */
:root {
  --primary-green: #4a7c59;
  --secondary-black: #2d2d2d;
  --background-white: #ffffff;
  --font-primary: 'Inter', sans-serif;
  --border-radius: 8px;
}
```

#### Header/Footer Sync
- WordPress REST API endpoint for header/footer HTML
- Next.js fetches and caches header/footer
- Fallback to static version if API fails

### 3. Data Sharing

#### WordPress REST API Extensions
```php
// Custom endpoints needed
/wp-json/ppp/v1/user-profile
/wp-json/ppp/v1/subscription-status
/wp-json/ppp/v1/sync-user
```

#### Firebase to WordPress Webhooks
- User registration complete
- Subscription status change
- Meal plan generation (for email campaigns)

### 4. Navigation Flow

#### Seamless Transitions
```javascript
// WordPress: Add to main navigation
<a href="https://app.pregnancyplateplanner.com" 
   class="meal-planner-launch"
   data-user-token="<?php echo $jwt_token; ?>">
   Launch Meal Planner
</a>

// Next.js: Check for token on load
useEffect(() => {
  const token = getTokenFromURL();
  if (token) {
    authenticateWithWordPressToken(token);
  }
}, []);
```

### 5. SEO & Analytics

#### Unified Tracking
- Same Google Analytics property
- Cross-domain tracking enabled
- Shared conversion goals
- UTM parameter preservation

#### Sitemap Strategy
- WordPress: /sitemap.xml (content pages)
- Next.js: /app-sitemap.xml (app pages)
- Robots.txt points to both

### 6. Deployment Architecture

```
┌─────────────────────────────────────┐
│   pregnancyplateplanner.com         │
│   (WordPress on current hosting)    │
│   - Blog, content, marketing        │
│   - User registration               │
│   - Payment processing (initially)  │
└──────────────┬──────────────────────┘
               │ API/Webhooks
┌──────────────┴──────────────────────┐
│   app.pregnancyplateplanner.com     │
│   (Next.js on Vercel)               │
│   - Meal planner                    │
│   - Recipe browser                  │
│   - Tracking features               │
│   - Firebase backend                │
└─────────────────────────────────────┘
```

## Development Guidelines

### 1. Component Development
- All UI components should support WordPress color scheme
- Use CSS variables for easy theme switching
- Components should work standalone (no WordPress dependency)

### 2. Authentication Flow
- Always check for WordPress token first
- Graceful fallback to Firebase auth
- Clear error messages for auth issues

### 3. API Design
- Version all endpoints
- Use consistent error formats
- Implement rate limiting
- Cache WordPress data aggressively

### 4. User Experience
- Consistent navigation between systems
- Shared loading states
- Unified error messages
- Seamless data flow

## Implementation Phases

### Phase 1: Standalone Deployment
- Deploy Next.js app independently
- Basic Firebase authentication
- Manual user creation

### Phase 2: Visual Integration
- Match WordPress theme
- Shared header/footer
- Consistent styling

### Phase 3: Authentication Integration
- SSO implementation
- User data sync
- Shared sessions

### Phase 4: Full Integration
- Unified analytics
- Shared payment processing
- Complete data sync

## Code Examples

### WordPress Plugin Structure
```
pregnancy-plate-planner-integration/
├── includes/
│   ├── class-ppp-auth.php          # JWT generation
│   ├── class-ppp-api.php           # REST endpoints
│   └── class-ppp-sync.php          # User sync
├── assets/
│   └── js/
│       └── app-launcher.js         # Navigation helper
└── pregnancy-plate-planner-integration.php
```

### Next.js Integration Utils
```
src/lib/wordpress/
├── auth.ts                         # Token validation
├── api-client.ts                   # WordPress API wrapper
├── user-sync.ts                    # User data sync
└── theme-sync.ts                   # Header/footer sync
```

## Security Considerations

1. **Token Security**
   - Use HTTPS only
   - Short token expiration (1 hour)
   - Secure, httpOnly cookies
   - CORS properly configured

2. **Data Validation**
   - Validate all WordPress data
   - Sanitize user inputs
   - Rate limit API calls
   - Log security events

3. **User Privacy**
   - Minimal data sharing
   - Clear privacy policy
   - GDPR compliance
   - Data deletion rights

## Monitoring & Maintenance

- Monitor SSO success rate
- Track API response times
- Alert on sync failures
- Regular security audits
- Performance optimization

## Future Considerations

- Gradual migration path from WordPress
- Headless WordPress option
- GraphQL API layer
- Microservices architecture
- Mobile app integration

This strategy ensures a smooth integration while maintaining the flexibility to evolve the architecture as needed.