# Razorpay Payment Integration Plan

We will implement a complete, robust Razorpay payment gateway integration for the existing project.

## Verification & Architecture

1. **Backend Integration (Already Complete):**
   - The ASP.NET Core 8 Web API project already has `Razorpay` package (3.3.2) referenced.
   - `PaymentController.cs` is already fully implemented with endpoints `POST /api/Payment/create-order` and `POST /api/Payment/verify`.
   - `appsettings.json` already contains the Razorpay test keys:
     - Key: [REMOVED_FOR_SECURITY]
     - Secret: [REMOVED_FOR_SECURITY]

2. **Frontend Integration (To Be Implemented):**
   - We will modify `CheckoutPage.tsx` to dynamically load the official Razorpay checkout script (`checkout.js`).
   - If the payment method is Cash on Delivery (`cod`), we continue executing the original `/Cart/CheckOut` checkout flow directly.
   - If the payment method is online (`upi`, `card`, or `paypal`), we will intercept order placement, call `/api/Payment/create-order` to generate a Razorpay Order ID, launch the standard Razorpay Checkout modal, and then call `/api/Payment/verify` on success to complete the checkout on the server.
   - We will keep the default Razorpay Checkout layout intact, but configure the official `config.display.hide` parameter inside the options to hide only the **Pay Later (`paylater`)** method from the checkout interface.
   - We will capture order numbers returned by the backend checkout methods to display on the success screen, instead of client-side random order IDs.

## Proposed Changes

### [MODIFY] [CheckoutPage.tsx](file:///c:/Users/Admin/source/repos/HridhayconnectUI/src/components/CheckoutPage.tsx)
- Add script loading logic for Razorpay `checkout.js`.
- Adjust `handlePlaceOrder` to implement the payment flow:
  - Create Order via `/api/Payment/create-order`
  - Open Razorpay popup with options prefilled from the user's profile and shipping address.
  - Handle payment failures and cancelations.
  - Verify Payment on the backend via `/api/Payment/verify`.
  - Execute checkout upon verification and direct to the order success screen displaying the verified Order Number.
