# Mobile Bot Control Application - Design Guidelines

## Design Approach
**Selected Approach:** Design System Approach using Material Design principles
**Justification:** This utility-focused application requires efficiency, learnability, and reliable functionality. The bot control interface with chat features needs clear hierarchy and touch-friendly mobile interactions.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary (Default):**
- Primary: 220 85% 60% (Modern blue for actions)
- Surface: 220 15% 12% (Dark background)
- Surface Variant: 220 15% 18% (Cards, elevated surfaces)
- Text Primary: 0 0% 95% (High contrast text)
- Text Secondary: 0 0% 70% (Secondary information)

**Light Mode:**
- Primary: 220 85% 45% (Darker blue for contrast)
- Surface: 0 0% 98% (Clean white background)
- Surface Variant: 220 15% 95% (Subtle gray surfaces)
- Text Primary: 220 15% 15% (Dark gray text)
- Text Secondary: 220 10% 45% (Medium gray text)

**Status Colors:**
- Success: 140 70% 45% (Bot online/attack success)
- Warning: 35 90% 55% (Connection issues)
- Error: 5 85% 55% (Failed actions)

### B. Typography
**Primary Font:** Inter (via Google Fonts CDN)
- Headers: 600 weight, 24px-16px (responsive scaling)
- Body: 400 weight, 16px
- Buttons: 500 weight, 14px
- Chat text: 400 weight, 15px
- Labels: 500 weight, 12px uppercase

### C. Layout System
**Spacing Units:** Tailwind primitives 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Button spacing: px-6 py-3
- Form gaps: gap-4

### D. Component Library

**Login Screen:**
- Full-screen overlay with centered card
- Simple two-field form (ID/Password)
- Large primary button for login
- Minimal branding/logo space

**Chat Interface:**
- Fixed bottom input with send button
- Scrollable message history
- Message bubbles: user (primary color), AI (surface variant)
- Typing indicators and loading states

**Bot Control Panel:**
- Grid layout for command buttons
- Follow/Attack buttons prominently placed
- Status indicators (online/offline, current action)
- Emergency stop button (red, larger)

**Navigation:**
- Bottom tab bar for mobile
- Tabs: Chat, Controls, Settings
- Active state clearly indicated

**Forms & Inputs:**
- Rounded corners (8px)
- Clear labels above inputs
- Focus states with primary color outline
- Touch-friendly minimum 44px height

### E. Mobile-Specific Considerations

**Touch Targets:**
- Minimum 44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Swipe gestures for chat navigation

**Responsive Breakpoints:**
- Mobile-first: 320px base
- Large mobile: 414px+ (iPhone Pro Max)
- Small tablet: 768px+ (fallback)

**Performance:**
- Minimize animations to essential feedback only
- Use transform-based animations for smooth 60fps
- Lazy load chat history
- Optimize for 3G connections

## Images
**No Hero Image Required** - This is a utility application focused on function over visual marketing.

**Optional Elements:**
- Small bot avatar/icon in chat interface
- Status icons for bot states (idle, following, attacking)
- Simple logo/branding in login screen header

## Accessibility
- Consistent dark mode implementation across all components
- High contrast ratios (4.5:1 minimum)
- Screen reader labels for all controls
- Keyboard navigation support for all functions
- Loading states and error messages clearly announced

## Key Design Principles
1. **Mobile-First:** Every interface element designed for thumb navigation
2. **Functional Clarity:** Clear visual hierarchy for different control types
3. **Status Awareness:** Always visible bot status and connection state
4. **One-Handed Use:** Critical functions accessible with single thumb
5. **Minimal Cognitive Load:** Reduce decision fatigue with clear, consistent patterns