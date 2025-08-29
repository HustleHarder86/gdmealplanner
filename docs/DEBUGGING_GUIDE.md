# Homepage Development Debugging Guide

## 🚨 **Critical Issues Encountered & Solutions**

This guide documents all the debugging challenges encountered during homepage development and their solutions. Use this as a reference for future development.

## 🔍 **Issue #1: 404 Error in Page Rendering**

### **Problem**
```bash
curl -s http://localhost:3002/homepage-v2 | grep "404"
# Output: 404 errors mixed with valid content
```

### **Root Cause**
- Next.js App Router was rendering both the page content AND a NotFound component simultaneously
- Root layout was applying global layout wrappers (SidebarNavigation, MainContent) to a standalone marketing page
- Layout inheritance causing routing conflicts

### **Investigation Steps**
1. **Check HTML output**: `curl -s http://localhost:3002/homepage-v2 | head -50`
2. **Analyze layout hierarchy**: Traced through app/layout.tsx → homepage-v2/layout.tsx
3. **Test route isolation**: Attempted route groups `(marketing)` directory
4. **Monitor Next.js output**: `BashOutput` tool to watch compilation

### **Solution**
```typescript
// app/homepage-v2/layout.tsx
export default function HomepageV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return fragment to bypass root layout conflicts
  return <>{children}</>;
}
```

### **Key Learning**
- **Fragment wrappers** can isolate pages from complex root layouts
- **Layout inheritance** in Next.js App Router can cause unexpected conflicts
- **404 references** in React hydration are sometimes normal and don't affect functionality

---

## 🖼️ **Issue #2: Image Asset Management**

### **Problem**
Local image assets (`/wp-assets/image-X.jpg`) didn't match WordPress originals exactly, causing visual inconsistencies.

### **Investigation**
```bash
# Find all local images
grep -n "wp-assets" app/homepage-v2/page.tsx

# Check WordPress data
grep "7b699a33" wp-extracted-data.json
```

### **Root Cause**
- Local assets were cached versions that might not match current WordPress images
- WordPress CDN URLs provide the canonical, up-to-date images
- Image dimensions and quality needed to match exactly

### **Solution**
```typescript
// Before (local asset)
src="/wp-assets/image-4.jpg"

// After (WordPress CDN)
src="https://pregnancyplateplanner.com/wp-content/uploads/2023/12/c24e9659-c33e-4bfd-aeea-7aef68d6ed1c.jpg"
```

### **Implementation Strategy**
1. **Extract image mappings** from `wp-extracted-data.json`
2. **Update all images** to use WordPress CDN URLs
3. **Verify image loading** with curl testing
4. **Maintain aspect ratios** with Next.js Image component

### **Key Learning**
- **Always use canonical sources** for assets when available
- **WordPress CDN URLs** provide guaranteed consistency with original site
- **Asset mapping** from extracted data saves significant time

---

## 🎨 **Issue #3: Color & Typography Matching**

### **Problem**
Colors and fonts needed to match WordPress exactly, but visual inspection showed slight differences.

### **Investigation**
```bash
# Check color usage in code
grep -n "rgb(" app/homepage-v2/page.tsx | head -5

# Compare with WordPress values
# WordPress: #227755, #EDA602, #39433F
# Current: Need to verify exact values
```

### **Root Cause**
- CSS color values needed exact RGB equivalents
- Font loading and fallbacks affected visual consistency
- Custom font declarations could cause hydration issues

### **Solution & Verification**
```typescript
// Verified exact matches:
// WordPress #227755 = rgb(34,119,85) ✓
// WordPress #EDA602 = rgb(237,166,2) ✓  
// WordPress #39433F = rgb(57,67,63) ✓

// Font consistency
className="font-['Poppins',_sans-serif]"  // Body text
className="font-['Domine',_sans-serif]"   // Headings
className="font-['Bitter',_sans-serif]"   // Buttons
```

### **Key Learning**
- **RGB/Hex conversion** must be exact for perfect matching
- **Font consistency** requires proper fallback chains
- **Visual testing** should be combined with technical verification

---

## 🔧 **Issue #4: Layout Responsiveness**

### **Problem**
Mobile and desktop layouts needed to match WordPress responsive behavior exactly.

### **Investigation**
- **Test multiple breakpoints**: Desktop, tablet, mobile
- **Compare with WordPress**: Check responsive behavior on original site
- **Verify Tailwind classes**: Ensure proper responsive utilities

### **Solution**
```typescript
// Responsive patterns used:
className="text-5xl md:text-7xl"          // Responsive text sizing
className="grid md:grid-cols-2"           // Responsive grid layouts  
className="hidden md:flex"                // Mobile-first navigation
className="py-20"                         // Consistent spacing
className="max-w-6xl mx-auto px-4"       // Container patterns
```

### **Key Learning**
- **Mobile-first approach** matches WordPress responsive strategy
- **Consistent container patterns** maintain layout integrity
- **Breakpoint testing** essential for responsive accuracy

---

## 🧪 **Testing Methodology**

### **Continuous Testing Commands**
```bash
# Test page loading
curl -s http://localhost:3002/homepage-v2 | head -20

# Check for errors
curl -s http://localhost:3002/homepage-v2 | grep -c "404"

# Verify content
curl -s http://localhost:3002/homepage-v2 | grep -i "control your gestational diabetes"

# Check specific elements
curl -s http://localhost:3002/homepage-v2 | grep -o "Get my.*Meal Planner"

# Monitor development server
BashOutput bash_1
```

### **Visual Comparison Process**
1. **Load WordPress original**: https://pregnancyplateplanner.com
2. **Load local version**: http://localhost:3002/homepage-v2
3. **Compare section by section**:
   - Header and navigation
   - Hero section
   - Content sections (3 main sections)
   - Pricing
   - Footer
4. **Test responsive behavior** at different breakpoints
5. **Verify interactive elements** (modals, forms, buttons)

### **Performance Testing**
```bash
# Check compilation times
# Monitor: ✓ Compiled in Xms (866 modules)

# Verify image loading
curl -I "https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png"

# Test responsive loading
curl -s http://localhost:3002/homepage-v2 | wc -c  # Check page size
```

---

## 📋 **Debugging Checklist**

### **When Homepage Issues Occur:**

#### ✅ **Initial Diagnosis**
- [ ] Check development server is running (`npm run dev`)
- [ ] Verify route exists and compiles without errors
- [ ] Test basic page loading with curl
- [ ] Check browser console for JavaScript errors

#### ✅ **Layout Issues**
- [ ] Verify layout hierarchy (root → page → component)
- [ ] Check for conflicting CSS classes
- [ ] Test responsive breakpoints
- [ ] Ensure proper container/grid structure

#### ✅ **Content Issues**
- [ ] Verify all text matches WordPress exactly
- [ ] Check image sources and loading
- [ ] Test interactive elements (buttons, forms, modals)
- [ ] Validate color and typography consistency

#### ✅ **Performance Issues**
- [ ] Check image optimization and loading
- [ ] Verify font loading and fallbacks
- [ ] Test page load speeds
- [ ] Monitor bundle size and compilation times

#### ✅ **Integration Issues**
- [ ] Test form submissions and modal functionality
- [ ] Verify external asset loading (WordPress CDN)
- [ ] Check analytics and tracking implementation
- [ ] Test SEO metadata and social sharing

---

## 🛠️ **Troubleshooting Commands**

### **Quick Diagnostics**
```bash
# Page health check
curl -s http://localhost:3002/homepage-v2 | grep -c "Control Your Gestational Diabetes"
# Expected: 1 (main heading)

# Error detection
curl -s http://localhost:3002/homepage-v2 | grep -i "error\|404\|not found" | wc -l
# Expected: 0-1 (404 in hydration is normal)

# Content verification
curl -s http://localhost:3002/homepage-v2 | grep -i "pricing\|\$49\|\$99"
# Expected: Pricing content present

# Image loading test
curl -I "https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png"
# Expected: HTTP/2 200
```

### **Development Server Monitoring**
```bash
# Watch compilation output
BashOutput bash_1

# Check for warnings
grep -i "warning\|error" <(BashOutput bash_1)

# Monitor request patterns
grep "GET /homepage-v2" <(BashOutput bash_1)
```

---

## 💡 **Preventive Measures**

### **Best Practices Learned**
1. **Test Early & Often**: Use curl testing throughout development
2. **Document As You Go**: Write docs while debugging, not after
3. **Isolate Layouts**: Use fragments or route groups for standalone pages
4. **Canonical Assets**: Always use original sources when available
5. **Responsive First**: Test mobile and desktop simultaneously
6. **Exact Matching**: Use precise color values and measurements

### **Future Development Guidelines**
- **Always test both local and WordPress side-by-side**
- **Use extracted data for asset references**
- **Implement testing commands early in development**  
- **Create isolated components for complex interactions**
- **Maintain comprehensive documentation throughout**

---

## 🎯 **Success Indicators**

### **Homepage is Working Correctly When:**
- [ ] Page loads without 404 errors (ignoring hydration references)
- [ ] All images load from WordPress CDN
- [ ] Colors and fonts match exactly
- [ ] Modal functionality works properly
- [ ] Responsive design matches WordPress behavior
- [ ] All CTA buttons have correct text
- [ ] Pricing displays accurately ($49/$99)
- [ ] Footer renders completely

### **Quality Assurance Checklist**
- [ ] Visual comparison: 95%+ match to WordPress
- [ ] Functional testing: All interactions work
- [ ] Performance testing: Acceptable load times
- [ ] Mobile testing: Responsive behavior correct
- [ ] SEO testing: Proper metadata and structure

---

**Remember**: This debugging guide captures real-world issues encountered during development. Keep it updated as new challenges arise, and always test thoroughly before considering a feature complete.