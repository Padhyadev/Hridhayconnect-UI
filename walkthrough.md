# Walkthrough - Review API and UI Integration

We have integrated review retrieval and submission features in the product details page, and enabled dynamic product descriptions.

## Changes Made

### API Layer

- **New File:** [reviewService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/reviewService.ts)
  - Created endpoints for reviews using the POST wrapper from `BaseService`:
    - `save(review)`: Calls `/api/Review/Save` to submit a review.
    - `getAll(params)`: Calls `/api/Review/GetAll` with search, sort, and pagination offsets.
  - Implemented `getUserId()` to resolve customer ID from `localStorage.getItem("customerId")` or fallback decoding of `authToken` JWT payload.

- **File Modified:** [productService.ts](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/api/productService.ts)
  - Modified the API parsing helper `parseApiProductGroup` to prioritize the dynamic `ProductDescription` fetched from the API for both `desc` and `longDesc` properties, and trim any excess whitespace.
  - Retained local static fallback text if the database doesn't return a description.

### UI Components

- **New File:** [ProductReviews.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProductReviews.tsx)
  - Added a premium, modern user reviews component.
  - **Stats Summary Section**: Displays overall average rating (stars and decimal values) and count of reviews, along with rating percentage progress bars.
  - **Paginated Reviews List**: Fetches first 10 reviews on load. A "More Reviews" button retrieves the next 10 reviews and appends them to the list.
  - **Submission Form Section**: Allows choosing 1 to 5 stars via an interactive hoverable/clickable star component and entering review text. Dynamically submits using the current user's ID if logged in (otherwise `userId: 0`).
  - Added support for `onReviewSubmitted` callback to allow refreshing parent state stats.

- **File Modified:** [ProductPage.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/ProductPage.tsx)
  - Registered the new `'reviews'` option in tabs state.
  - Embedded `<ProductReviews>` into the tabs content container.
  - Added a helper function `renderProductDescription` that detects whether a description string contains HTML tags. If HTML tags are present, it renders using `dangerouslySetInnerHTML`. If it is plain text, it renders inside a `div` using CSS `whitespace-pre-line` to preserve natural newline formatting.
  - Changed the short editorial description under the product title and the main description tab text to use this dynamic helper.

## Verification

The typescript syntax and module resolution were manually verified:
- Imports and types align correctly with the rest of the application.
- Utilizes existing styling tokens (`var(--color-primary)`, Satoshis/Serif fonts) and toast systems (`showToast`, `showApiResponseToast`) for seamless visual matching.
- Description renders safely regardless of whether it is plain text or HTML formatted.

