# Next.js Migration Notes

## What Has Been Done

### 1. Configuration Files Created
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration (supports .js and .jsx files)
- `.eslintrc.json` - ESLint configuration for Next.js
- Updated `package.json` with Next.js dependencies
- Updated `tailwind.config.js` for Next.js paths
- Updated `postcss.config.js` to use CommonJS

### 2. Environment Variables
- Created `.env.local.example` with all environment variables
- Updated Firebase config to use `process.env.NEXT_PUBLIC_*`
- Updated utils.jsx to use Next.js environment variables
- **ACTION REQUIRED:** Copy `.env.local.example` to `.env.local`

### 3. Next.js App Router Structure
Created the following routes:
- `/` - Landing page (src/app/page.tsx)
- `/home` - Home page for logged-in users
- `/login` - Login page with return URL support
- `/chat` - Video chat page with video ID parameter support
- `/gallery` - Gallery page
- `/assignments` - Assignments page
- `/pricing` - Pricing page

### 4. Components Updated
- `AuthContext.jsx` - Added `'use client'` directive
- `utils.jsx` - Updated to use Next.js environment variables
- `firebase/config.js` - Updated to use environment variables
- Created `ProtectedRouteWrapper.tsx` for route protection

### 5. SEO Improvements
- Added comprehensive metadata in `layout.tsx` (title, description, Open Graph, Twitter cards)
- Created `robots.txt` in public folder
- Created dynamic `sitemap.ts`
- Configured meta tags for social sharing

### 6. Layout & Styling
- Created `src/app/layout.tsx` with metadata and AuthProvider
- Created `src/app/globals.css` with Tailwind directives

## What Needs To Be Done

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Environment Variables
```bash
cp .env.local.example .env.local
# Then edit .env.local with your actual values
```

### 3. Test the Migration
```bash
yarn dev
```
Visit `http://localhost:3000` to test

### 4. Component Updates Needed

Some components may need minor updates:

#### Components that use `window.history` or browser APIs:
- These need `'use client'` directive at the top
- Search for `window.`, `document.`, `localStorage.` usage
- Add `'use client'` to components using these

#### Components that need updating:
- Any component using `react-router-dom` hooks → Replace with `next/navigation`
- Components with `import.meta.env` → Change to `process.env.NEXT_PUBLIC_`

### 5. Image Optimization
Consider replacing `<img>` tags with Next.js `<Image>` component:
```jsx
import Image from 'next/image'

<Image
  src="/logo-new.png"
  alt="VidyaAI Logo"
  width={64}
  height={64}
/>
```

### 6. Dynamic Imports for Large Components
For better performance, use dynamic imports:
```jsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>
})
```

## Breaking Changes from Vite

1. **No more `import.meta.env`** - Use `process.env.NEXT_PUBLIC_*` instead
2. **No more index.html** - Replaced by `app/layout.tsx`
3. **No more main.jsx** - Next.js handles entry point
4. **File-based routing** - Pages are in `src/app/` directory
5. **Server/Client Components** - Need explicit `'use client'` for client components

## Benefits of This Migration

1. **SEO**: Server-side rendering means search engines see your content immediately
2. **Performance**: Automatic code splitting and optimization
3. **Routing**: Built-in file-based routing with proper URLs
4. **Image Optimization**: Automatic image optimization with `next/image`
5. **API Routes**: Can add backend API routes in `src/app/api/`
6. **Production Ready**: Better build optimization and caching

## Testing Checklist

- [ ] Landing page loads
- [ ] Login/logout works
- [ ] Protected routes redirect to login
- [ ] Firebase authentication works
- [ ] API calls work
- [ ] Chat functionality works
- [ ] Gallery loads
- [ ] Assignments work
- [ ] All navigation works
- [ ] Environment variables load correctly
- [ ] Build succeeds: `yarn build`
- [ ] Production preview works: `yarn start`

## Deployment

### Vercel (Recommended for Next.js)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Set build command: `yarn build`
- Set output directory: `.next`
- Set install command: `yarn install`
- Add all environment variables from `.env.local.example`

## Rollback Plan

If needed to rollback:
```bash
git checkout master
```

The original Vite setup is preserved in the master branch.
