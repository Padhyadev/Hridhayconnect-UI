# Implementation Plan - Production Readiness Remediation

This plan outlines the changes to address the critical and high-priority issues identified in the [PROJECT_PRODUCTION_AUDIT.md](file:///c:/Users/Admin/source/repos/HridhayconnectUI/PROJECT_PRODUCTION_AUDIT.md) report. Since this repository is a React frontend application, the changes focus on securing frontend configurations, refactoring monolithic components, cleaning up dead dependencies/code, and consolidating JWT token handling.

---

## User Review Required

> [!IMPORTANT]
> **External Backend Remediations (Required)**
>
> We cannot modify the external backend ASP.NET Core 8 Web API (`https://hridhayconnectreact.bsite.net`) from this repository. The following critical security fixes must be implemented on the backend system:
> 1. **Price Verification**: Update the backend payment gateway integration endpoint (`/Payment/create-order`) to compute the total checkout price by checking the active database prices against the customer's cart, rather than accepting a client-supplied total amount (`Amount`).
> 2. **Authorization Enforcement (BOLA/IDOR)**: Update wishlist and cart controllers (`/Wishlist/Add`, `/Cart/SaveCart`) to extract the authenticated user's ID from validated JWT token claims (e.g. `ClaimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)`) rather than accepting and trusting a raw `customerId` parameter passed in the body.
> 3. **API Misspelling**: Correct the spelling in endpoint `/Dropdown/CustomerAdress` (change to `CustomerAddress`) and notify the frontend developer.
> 4. **Secret Rotation**: Immediately rotate the Razorpay Secret Key in the Razorpay live dashboard, as it was committed in plaintext inside [implementation_plan_razorpay.md](file:///c:/Users/Admin/source/repos/HridhayconnectUI/implementation_plan_razorpay.md#L12).

---

## Open Questions

None at this time. All remediations are direct responses to issues documented in the audit report.

---

## Proposed Changes

### Configuration & Security Layer

#### [NEW] [.env](file:///c:/Users/Admin/source/repos/HridhayconnectUI/.env)
Create an environment file to store environment variables for API base URLs and Razorpay Key IDs:
- `VITE_API_BASE_URL=https://hridhayconnectreact.bsite.net/api`
- `VITE_RAZORPAY_KEY_ID=rzp_live_SNR6THeI8rRQIr`

#### [MODIFY] [BaseService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/BaseService.ts)
- Replace hardcoded `API_BASE_URL` (line 5) and `RAZORPAY_KEY_ID` (line 6) with `import.meta.env.VITE_API_BASE_URL` and `import.meta.env.VITE_RAZORPAY_KEY_ID`.
- Export a new centralized helper function `getCustomerIdFromToken(token: string): number` that decodes JWT claims safely.
- Delete unused function `getLastApiResponse` (line 105).

#### [MODIFY] [productService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/productService.ts)
- Replace hardcoded domain `"https://hridhayconnectreact.bsite.net/"` in `resolveImageUrl` (line 159) with a dynamic domain derived from `import.meta.env.VITE_API_BASE_URL`.

#### [MODIFY] [implementation_plan_razorpay.md](file:///c:/Users/Admin/source/repos/HridhayconnectUI/implementation_plan_razorpay.md)
- Replace the committed plaintext Razorpay Secret Key (line 12) with a placeholder `[ROTATED_AND_REMOVED_FROM_VERSION_CONTROL]`.

#### [MODIFY] [reviewService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/reviewService.ts)
- Remove duplicate JWT decoding code in `getUserId` (lines 53-76) and delegate it to the new `getCustomerIdFromToken` helper inside `BaseService.ts`.

#### [MODIFY] [CartContext.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/context/CartContext.tsx)
- Remove duplicate JWT decoding code in `getCustomerIdFromToken` (lines 202-232) and use the shared implementation from `BaseService.ts`.

---

### Component Refactoring Layer (`ProfilePage`)

We will decompose the monolithic 2,434-line [ProfilePage.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProfilePage.tsx) into small, high-cohesion sub-components in a new directory:

#### [NEW] [ProfileInfoForm.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProfileInfoForm.tsx)
- Contains profile form logic, handles first/last name, email, phone edits, and maps updates to `/Customer/UpdateProfile`.

#### [NEW] [AddressBook.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/AddressBook.tsx)
- Handles address rendering, setting defaults via `/Customer/ChangeDefaultAddress`, and launching the new address dialog.

#### [NEW] [OrderHistoryList.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/OrderHistoryList.tsx)
- Manages order list layout, order item detail overlays, cancellations, and status tags mapping.

#### [NEW] [RewardPointsDashboard.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/RewardPointsDashboard.tsx)
- Renders customer reward coin ledgers, filter options, and points stats summary cards.

#### [NEW] [ChangePasswordForm.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ChangePasswordForm.tsx)
- Implements security settings, new password fields, validation check constraints, and calls `/CustomerAuth/ChangePassword`.

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProfilePage.tsx)
- Remove inline component layouts and functions.
- Import the new sub-components.
- Manage shared state and reload flows.

---

### Dependency & Build Cleanups

#### [DELETE] [audit.js](file:///c:/Users/Admin/source/repos/HridhayconnectUI/audit.js)
- Delete this empty/temporary file.

#### [MODIFY] [package.json](file:///c:/Users/Admin/source/repos/HridhayconnectUI/package.json)
- Remove unused `@google/genai` dependency (line 14).

#### [MODIFY] [vite.config.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/vite.config.ts)
- Add build-time configuration parameters to strip `console.log` and `console.error` calls in production builds:
  ```typescript
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  }
  ```

---

## Verification Plan

### Automated Tests
- Check syntax and type safety:
  `tsc --noEmit`
- Run local development compilation:
  `npm run build` to verify there are no compilation errors during bundling.

### Manual Verification
1. Verify that the application continues to run locally and loads data using the environment variables in `.env`.
2. Confirm that logging in parses the user session and customer ID correctly using the centralized JWT helper.
3. Verify that the Profile Page tab interfaces (Profile Details, Addresses, Orders, Rewards, Change Password) continue to work, load database records, and save changes correctly after being split.
4. Verify that console messages are clean and do not leak internal structures.
