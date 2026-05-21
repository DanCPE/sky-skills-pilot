# Image Assets - Sky Skills

This directory contains all static images used in the Sky Skills application.

## Directory Structure

```
public/
├── README.md                    (this file)
├── favicon.ico                  (app icon)
├── next.svg                     (Next.js logo - can be removed)
├── vercel.svg                   (Vercel logo - can be removed)
└── images/                      (custom images)
    ├── backgrounds/             (hero sections, page backgrounds)
    ├── topics/                  (topic category images/icons)
    ├── features/                (feature highlight images)
    └── icons/                   (UI icons and small graphics)
```

## Organized Structure (Option 2)

### 📁 `/public/images/backgrounds/`
**Purpose**: Hero banners, section backgrounds, full-width images

**Current Contents**: (empty - awaiting images)

**Usage Example**:
```tsx
<Image
  src="/images/backgrounds/hero-banner.webp"
  alt="Sky Skills hero banner"
  width={2400}
  height={900}
  priority
/>
```

**Recommended Specifications**:
- **Format**: WebP (with JPEG/PNG fallback)
- **Hero Banner**: 2400 × 900px (16:6 aspect ratio)
- **Quality**: 85%
- **File Size**: <500KB per image

---

### 📁 `/public/images/topics/`
**Purpose**: Topic category images/icons for the home page grid

**Current Contents**: (empty - awaiting images)
**Currently Using**: Emoji icons in `/src/lib/topics.ts`

**Usage Example**:
```tsx
// Replace emoji with images
<img
  src={`/images/topics/${topic.slug}.webp`}
  alt={topic.title}
  width={64}
  height={64}
/>
```

**Topic Slugs** (from `/src/lib/topics.ts`):
- `box-folding` - 📦 Box Folding
- `number-series` - 🔢 Number Series
- `calculate` - 🧮 Calculate
- `pattern-recognition` - 🔍 Pattern Recognition
- `spatial-reasoning` - 🧩 Spatial Reasoning

**Recommended Specifications**:
- **Format**: WebP or SVG
- **Dimensions**: 128 × 128px or 256 × 256px
- **Style**: Consistent with brand design
- **Background**: Transparent (for SVG) or solid color (for WebP)

**File Naming**: `{slug}.webp` or `{slug}.svg`
- Example: `box-folding.svg`, `number-series.svg`

---

### 📁 `/public/images/features/`
**Purpose**: Feature highlight images, screenshots, illustrations

**Current Contents**: (empty - awaiting images)

**Usage Example**:
```tsx
<Image
  src="/images/features/practice-mode.webp"
  alt="Practice mode screenshot"
  width={800}
  height={600}
/>
```

**Recommended Specifications**:
- **Format**: WebP or PNG (for screenshots)
- **Dimensions**: Variable, based on content
- **Quality**: 80-90%
- **File Size**: <1MB per image

---

### 📁 `/public/images/icons/`
**Purpose**: UI icons, buttons, navigation elements

**Current Contents**: (empty - awaiting images)

**Usage Example**:
```tsx
<Image
  src="/images/icons/menu.svg"
  alt="Menu"
  width={24}
  height={24}
/>
```

**Recommended Specifications**:
- **Format**: SVG (preferred) or PNG
- **Dimensions**: 24×24, 32×32, or 48×48 pixels
- **Style**: Minimal, consistent stroke width
- **Color**: Monochrome or theme-color compatible

---

## How to Reference Images

### ✅ Correct Usage
```tsx
// In Next.js components, reference from root with leading slash
<Image src="/images/backgrounds/hero-banner.webp" />
//        ^ Leading slash = /public/ directory

// In CSS or HTML tags
<div style={{ backgroundImage: 'url(/images/backgrounds/hero-bg.webp)' }}>
```

### ❌ Wrong Usage
```tsx
// DON'T include "public" in the path
<Image src="./public/images/banner.webp" />     // ❌ Wrong
<Image src="public/images/banner.webp" />       // ❌ Wrong
<Image src="../images/banner.webp" />           // ❌ Wrong

// DO use absolute path from public root
<Image src="/images/banner.webp" />             // ✅ Correct
```

---

## Current Images in Use

### Home Page (`/src/app/page.tsx`)
- **Topic Icons**: Currently using emoji (defined in `/src/lib/topics.ts`)
  - Can be replaced with: `/images/topics/{slug}.svg` or `.webp`

### Other Pages
- (No other pages currently using custom images)

---

## Image Optimization Guidelines

### For AntiGravity Developers

1. **Use Next.js Image Component**
   ```tsx
   import Image from "next/image";

   <Image
     src="/images/backgrounds/hero-banner.webp"
     alt="Descriptive text"
     width={2400}
     height={900}
     priority={true}  // For above-fold images
     quality={85}     // 0-100, default 75
   />
   ```

2. **Choose Right Format**
   - **WebP**: Best for photos and complex graphics (smaller file size)
   - **SVG**: Best for icons, logos, simple illustrations (scalable)
   - **PNG**: For transparent backgrounds or when WebP not supported
   - **JPEG**: For photos when transparency not needed

3. **Optimize Before Adding**
   - Compress images using TinyPNG, Squoosh, or similar tools
   - Resize to exact dimensions needed (no unnecessary upsizing)
   - Use appropriate quality settings (usually 75-85%)

4. **Responsive Images**
   ```tsx
   <Image
     src="/images/backgrounds/hero-banner.webp"
     alt="Hero banner"
     fill
     sizes="100vw"
     style={{ objectFit: 'cover' }}
   />
   ```

---

## Adding New Images

### Step 1: Choose Category
- Background/hero image? → `/images/backgrounds/`
- Topic icon? → `/images/topics/`
- Feature screenshot? → `/images/features/`
- UI icon? → `/images/icons/`

### Step 2: Optimize
- Compress the image
- Resize to appropriate dimensions
- Save in optimal format (WebP preferred)

### Step 3: Add to Directory
- Place in appropriate subdirectory under `/public/images/`
- Use descriptive, lowercase filenames
- Use kebab-case for multi-word names: `feature-name.webp`

### Step 4: Update Documentation
- Add entry to this README in the appropriate section
- Document usage, dimensions, and any special considerations

### Step 5: Reference in Code
```tsx
<Image
  src="/images/[category]/[filename]"
  alt="[Descriptive text]"
  width={[width]}
  height={[height]}
/>
```

---

## File Naming Conventions

### ✅ Good Names
- `hero-banner.webp`
- `topic-box-folding.svg`
- `feature-practice-mode.webp`
- `icon-menu.svg`

### ❌ Avoid
- `Image 1.webp`
- `final-final-v2.png`
- `Background Image.jpg` (spaces)
- `header_bg.svg` (inconsistent)

### Convention
- Lowercase
- Kebab-case (hyphens between words)
- Descriptive but concise
- Include category prefix if helpful

---

## Performance Targets

### Image File Size Guidelines
- **Hero banners**: <500KB
- **Topic icons**: <50KB each
- **Feature images**: <1MB each
- **UI icons**: <10KB each

### Loading Strategy
- **Above-fold images**: Use `priority` prop
- **Below-fold images**: Let Next.js lazy-load automatically
- **Background images**: Use `fill` prop with proper sizing

---

## Dark Mode Considerations

When adding images that need dark mode support:

### Option 1: Separate Images
```tsx
<Image
  src="/images/backgrounds/hero-light.webp"
  className="dark:hidden"
/>
<Image
  src="/images/backgrounds/hero-dark.webp"
  className="hidden dark:block"
/>
```

### Option 2: CSS Overlay
```tsx
<div className="relative">
  <Image src="/images/backgrounds/hero.webp" />
  <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
</div>
```

### Option 3: CSS Filters
```tsx
<Image
  src="/images/icons/logo.svg"
  className="dark:invert"
/>
```

---

## Checklist for AntiGravity

Before implementing images:

- [ ] Review this README structure
- [ ] Check `/src/lib/topics.ts` for current topic slugs
- [ ] Verify image dimensions match specifications
- [ ] Compress images before adding
- [ ] Use Next.js Image component (not `<img>` tag)
- [ ] Add descriptive alt text
- [ ] Test in both light and dark modes
- [ ] Verify responsive behavior
- [ ] Check file sizes are within guidelines
- [ ] Update this README with new images

---

## Questions or Issues?

If you need clarification on:
- Image specifications or dimensions
- Where to place specific images
- How to reference images in code
- Performance optimization
- Dark mode implementation

Refer to:
1. This README (`/public/README.md`)
2. Main architecture guide (`/Users/dev/.claude/plans/keen-popping-matsumoto.md`)
3. Code comments in `/src/app/page.tsx`

---

**Last Updated**: 2026-03-05
**Maintained By**: Sky Skills Team
**For**: AntiGravity Frontend Development
