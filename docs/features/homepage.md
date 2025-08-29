# Homepage Implementation Guide

## 📋 **Overview**

This document provides a comprehensive guide to the homepage-v2 implementation, including technical architecture, content structure, and maintenance procedures.

## 🏗️ **Architecture Overview**

### **File Structure**
```
app/homepage-v2/
├── layout.tsx          # Isolated layout (fragment wrapper)
├── page.tsx           # Main homepage component  
└── components/
    └── FreeMealPlannerModal.tsx  # Modal for lead capture
```

### **Layout Strategy**
The homepage uses an **isolated layout pattern** to prevent conflicts with the main application:

```typescript
// app/homepage-v2/layout.tsx
export default function HomepageV2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;  // Fragment wrapper prevents root layout interference
}
```

This approach:
- ✅ Prevents sidebar/main content wrappers from affecting the homepage
- ✅ Maintains proper metadata for SEO
- ✅ Allows standalone styling and behavior
- ✅ Avoids routing conflicts with the main app

## 🎨 **Design System**

### **Color Palette (Exact WordPress Match)**
```typescript
// Primary Colors
const colors = {
  primary: 'rgb(34,119,85)',      // #227755 - WordPress green
  accent: 'rgb(237,166,2)',       // #EDA602 - WordPress gold  
  text: 'rgb(57,67,63)',          // #39433F - WordPress dark gray
  background: 'rgb(7,18,13,0.06)' // Light green tint for sections
};
```

### **Typography System**
```typescript
// Font Hierarchy
const fonts = {
  body: "font-['Poppins',_sans-serif]",      // Main content
  headings: "font-['Domine',_sans-serif]",   // Section headings  
  buttons: "font-['Bitter',_sans-serif]"     // CTA buttons
};

// Size Scale
const textSizes = {
  hero: 'text-5xl md:text-7xl',        // Main headline
  section: 'text-4xl md:text-5xl',     // Section titles
  subsection: 'text-2xl',              // Feature titles
  body: 'text-lg',                     // Regular text
  cta: 'text-xl md:text-2xl'          // Button text
};
```

### **Spacing & Layout**
```typescript
const spacing = {
  section: 'py-20',           // Vertical section padding
  container: 'max-w-6xl mx-auto px-4',  // Content container
  grid: 'grid md:grid-cols-2 gap-16',   // Two-column layouts
  margin: 'mb-8',             // Standard bottom margin
};
```

## 📄 **Content Structure**

### **Section Breakdown**
1. **Header/Navigation**
   - Logo + brand name
   - Navigation menu: Home, Meal Planner, Recipes, Suggest Me, Blog, About Us, Contact Us
   - Mobile responsive hamburger menu

2. **Hero Section**
   - Background image: WordPress CDN `slide1-bg-1-scaled.jpg`
   - Headline: "Control Your Gestational Diabetes with Our Tailored Meal Plans!"
   - Subheading: Personalized meal plans by registered dietitians
   - Primary CTA: "Get my Free Meal Planner"
   - Trust indicators: Instant Download, No Credit Card, Created by RDs

3. **Feature Sections (3 main sections)**
   - **Customizable Meal Plans**: Personalization, Flexibility, Convenience, Peace of Mind
   - **Personalized Grocery Lists**: Customized shopping, Streamlined, Healthful options  
   - **Expert-Designed Meal Plans**: Nutritionally optimized, Blood sugar friendly, Convenient

4. **Featured Recipes**
   - Three recipe cards with images from WordPress CDN
   - Recipe names: Grilled Salmon, Greek Yogurt, Magnesium Smoothie

5. **Pricing Section**
   - Monthly Plan: $49.00/month
   - Yearly Plan: $99.00/year (Save over $480!)
   - Feature comparison and "Get Started Now" CTAs

6. **Footer**
   - Quick Links, Resources, Legal, Newsletter signup
   - Social media links (Facebook, Instagram)
   - Copyright and medical disclaimer

### **CTA Button Mapping**
```typescript
const ctaButtons = {
  hero: "Get my Free Meal Planner",
  mealPlans: "Get my Customizable Free Meal Planner", 
  groceryList: "Get my Personalized Grocery List",
  expertPlans: "Get my Registered Dietitian Meal Planner",
  pricing: "Get Started Now" // Both monthly and yearly
};
```

## 🖼️ **Image Assets**

### **WordPress CDN Integration**
All images use WordPress CDN URLs for guaranteed consistency:

```typescript
const images = {
  logo: "https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png",
  heroBg: "https://pregnancyplateplanner.com/wp-content/uploads/2023/12/slide1-bg-1-scaled.jpg", 
  mealPlan: "https://pregnancyplateplanner.com/wp-content/uploads/2023/12/c24e9659-c33e-4bfd-aeea-7aef68d6ed1c.jpg",
  groceryList: "https://pregnancyplateplanner.com/wp-content/uploads/2023/12/7b699a33-6851-4ccc-9930-a40fab00cc7c.jpg",
  recipes: {
    salmon: "https://pregnancyplateplanner.com/wp-content/uploads/2023/09/Untitled-Blog-Banner-Instagram-Post-Portrait-Instagram-Post-300x300.png",
    yogurt: "https://pregnancyplateplanner.com/wp-content/uploads/2023/07/Untitled-design-36-300x300.png", 
    smoothie: "https://pregnancyplateplanner.com/wp-content/uploads/2023/07/Untitled-Instagram-Post-Square-300x300.png"
  }
};
```

### **Image Optimization**
```typescript
// Next.js Image component usage
<Image
  src={images.logo}
  alt="Pregnancy Plate Planner Logo"
  width={60}
  height={60}
  className="mr-3"
/>
```

Benefits:
- ✅ Automatic optimization and WebP conversion
- ✅ Lazy loading for better performance
- ✅ Responsive image sizing
- ✅ Proper aspect ratio maintenance

## 🔧 **Component Structure**

### **Main Component Architecture**
```typescript
// app/homepage-v2/page.tsx
export default function ExactWordPressHomepage() {
  // State management for modal
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: ''
  });

  return (
    <div className="min-h-screen bg-white font-['Poppins',_sans-serif]">
      {/* Header */}
      <header>{/* Navigation */}</header>
      
      {/* Hero Section */}
      <section>{/* Hero content with background */}</section>
      
      {/* Feature Sections */}
      <section>{/* Customizable Meal Plans */}</section>
      <section>{/* Personalized Grocery Lists */}</section>
      <section>{/* Expert-Designed Meal Plans */}</section>
      
      {/* Featured Recipes */}
      <section>{/* Recipe cards */}</section>
      
      {/* Pricing */}
      <section>{/* Pricing plans */}</section>
      
      {/* Footer */}
      <footer>{/* Links and newsletter */}</footer>
      
      {/* Modal */}
      {showFreeModal && <FreeMealPlannerModal />}
    </div>
  );
}
```

### **Modal Component**
```typescript
// components/FreeMealPlannerModal.tsx
const FreeMealPlannerModal = ({ onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          {/* Form fields and submission */}
        </form>
      </div>
    </div>
  );
};
```

## 📱 **Responsive Design**

### **Breakpoint Strategy**
```typescript
// Tailwind responsive utilities used
const breakpoints = {
  mobile: 'default',      // < 768px
  tablet: 'md:',          // >= 768px  
  desktop: 'lg:',         // >= 1024px
  wide: 'xl:'             // >= 1280px
};

// Common responsive patterns
const responsivePatterns = {
  text: 'text-xl md:text-2xl',           // Scalable text
  grid: 'grid md:grid-cols-2',           // Responsive grids
  spacing: 'px-4 md:px-8',               // Scalable padding
  navigation: 'hidden md:flex',          // Desktop-only nav
  hero: 'text-5xl md:text-7xl'           // Large hero text
};
```

### **Mobile Optimizations**
- **Touch targets**: Minimum 44px for buttons
- **Readable text**: Minimum 16px font size
- **Proper spacing**: Adequate padding and margins
- **Image optimization**: Responsive images with proper sizing
- **Navigation**: Collapsible mobile menu (future enhancement)

## 🎯 **Performance Optimization**

### **Image Loading Strategy**
```typescript
// Next.js Image component with optimization
<Image
  src="https://pregnancyplateplanner.com/wp-content/uploads/..."
  alt="Descriptive alt text"
  width={500}
  height={400}
  className="w-full h-80 object-cover rounded-xl"
  // Automatic optimizations:
  // - WebP conversion when supported
  // - Lazy loading below the fold
  // - Responsive sizing based on device
  // - Proper aspect ratio maintenance
/>
```

### **Code Splitting**
- **Dynamic imports**: Modal component loaded on demand
- **Route-based splitting**: Homepage isolated from main app
- **CSS optimization**: Tailwind purges unused styles

### **Bundle Analysis**
```bash
# Check compiled bundle size
✓ Compiled in 1451ms (866 modules)

# Monitor for bundle growth
npm run build && npm run analyze
```

## 🔍 **SEO Implementation**

### **Metadata Configuration**
```typescript
// app/homepage-v2/layout.tsx
export const metadata: Metadata = {
  title: "Control Gestational Diabetes with Expert Meal Plans | Pregnancy Plate Planner",
  description: "Expert-designed meal plans for gestational diabetes management...",
  keywords: "gestational diabetes, meal plans, pregnancy nutrition, GD management...",
  openGraph: {
    title: "Control Your Gestational Diabetes with Tailored Meal Plans",
    description: "Expert-designed meal plans created by registered dietitians...",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Control Your Gestational Diabetes with Tailored Meal Plans",
    description: "Expert-designed meal plans for managing gestational diabetes..."
  }
};
```

### **Semantic HTML Structure**
```html
<!-- Proper heading hierarchy -->
<h1>Main page title</h1>
<h2>Section titles</h2>
<h3>Subsection titles</h3>
<h4>Feature titles</h4>

<!-- Semantic sections -->
<header>Navigation</header>
<main>Primary content</main>
<section>Content sections</section>
<footer>Site footer</footer>
```

## 🧪 **Testing & Quality Assurance**

### **Testing Commands**
```bash
# Basic functionality test
curl -s http://localhost:3002/homepage-v2 | grep -c "Control Your Gestational Diabetes"
# Expected: 1

# Content verification
curl -s http://localhost:3002/homepage-v2 | grep -i "customizable\|personalized\|expert" | wc -l
# Expected: 3+ (section headings)

# Image loading test  
curl -I "https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png"
# Expected: HTTP/2 200

# Performance test
curl -s http://localhost:3002/homepage-v2 | wc -c
# Monitor for reasonable page size
```

### **Visual Testing Checklist**
- [ ] **Header**: Logo, navigation, proper spacing
- [ ] **Hero**: Background image, text overlay, CTA button
- [ ] **Sections**: Three feature sections with correct content
- [ ] **Recipes**: Three recipe cards with images
- [ ] **Pricing**: Two plans with correct prices ($49/$99)
- [ ] **Footer**: Four columns with links and newsletter
- [ ] **Modal**: Form appears and functions correctly
- [ ] **Responsive**: Works on mobile, tablet, desktop

### **Accessibility Testing**
```bash
# Check for proper alt text
grep -n "alt=" app/homepage-v2/page.tsx

# Verify heading structure
grep -n "<h[1-6]" app/homepage-v2/page.tsx

# Color contrast verification (manual)
# Ensure text meets WCAG guidelines
```

## 🔄 **Maintenance Procedures**

### **Content Updates**
1. **Text changes**: Update directly in `page.tsx`
2. **Image updates**: Replace WordPress CDN URLs
3. **Pricing changes**: Update in pricing section
4. **New sections**: Follow existing pattern and styling

### **WordPress Sync Monitoring**
```bash
# Verify WordPress images still accessible
curl -I "https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png"

# Check for WordPress site changes
# Visit https://pregnancyplateplanner.com and compare
```

### **Performance Monitoring**
```bash
# Check build times
npm run build

# Monitor bundle size
npm run analyze

# Test page load speed
curl -w "%{time_total}" -s -o /dev/null http://localhost:3002/homepage-v2
```

## 🚀 **Deployment Checklist**

### **Pre-deployment Verification**
- [ ] All images load from WordPress CDN
- [ ] Modal functionality works correctly
- [ ] Responsive design matches WordPress
- [ ] Colors and fonts match exactly
- [ ] All CTA buttons have correct text
- [ ] SEO metadata is complete
- [ ] Performance is optimized

### **Deployment Commands**
```bash
# Build and test
npm run build
npm run lint
npm run typecheck

# Deploy (when ready)
npm run deploy
```

### **Post-deployment Testing**
- [ ] Test production URL functionality
- [ ] Verify analytics tracking
- [ ] Check form submission flow
- [ ] Monitor Core Web Vitals
- [ ] Test across different browsers/devices

---

## 📞 **Support & Troubleshooting**

For issues with the homepage implementation:

1. **Check the debugging guide**: `docs/DEBUGGING_GUIDE.md`
2. **Review the changelog**: `docs/CHANGELOG.md`
3. **Follow testing procedures** outlined above
4. **Compare against WordPress original**: https://pregnancyplateplanner.com
5. **Test in isolation** using curl commands

**Remember**: The homepage is designed to match WordPress exactly. Any changes should be validated against the original site to maintain brand consistency and user experience parity.