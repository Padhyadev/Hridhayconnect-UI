# Implementation Plan - Review API and Section UI

We will implement review submission and review displaying/pagination in the product details view.

## Proposed Changes

### Review API Layer

#### [NEW] [reviewService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/reviewService.ts)
Create a review API service containing endpoints for:
- Save review (`/api/Review/Save` via POST).
- Get reviews (`/api/Review/GetAll` via POST).
- Add helper function `getUserId` to decode current user's ID from `authToken` or `customerId` in localStorage.

### Review UI Component

#### [NEW] [ProductReviews.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProductReviews.tsx)
Build a premium, responsive ProductReviews component:
- Display reviews list with user name, ratings (stars), review text, and creation date.
- Display summary headers: total reviews count and average rating.
- Implement "Load More" button to fetch next 10 reviews.
- Provide a form for users to select a star rating (1-5) and enter review text.
- Save review via `/api/Review/Save` by dynamically passing `productId` and checking if a user is logged in (otherwise passing `userId = 0`).

### Product Details Page Integration

#### [MODIFY] [ProductPage.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProductPage.tsx)
Integrate the reviews list inside the product details page:
- Add a new "Reviews" tab button to the tabs list.
- Display `<ProductReviews>` when the tab is selected.
- Pass the dynamic numeric `productId` of the active product to `<ProductReviews>`.

## Verification Plan

### Automated Tests
- Since running terminal command `npm run lint` encountered host system configuration issues, we will verify the code compile-safety by manually inspecting the syntax and code structure.

### Manual Verification
- Test fetching reviews on product load.
- Test pagination by adding mock reviews/clicking "Load More".
- Verify submission of a review (with rating & review text). Check that token headers are attached when logged in and correct userId is passed.
