# MT Order Flow

A frontend order-flow demo app built with plain HTML, Bootstrap 5, jQuery, and D3.js. No build tools or npm required.

## Features

- Product catalog with search
- Place orders from product cards via a purchase modal
- Automatic inventory deduction when an order is placed
- Orders list with filters:
  - Start date
  - End date
  - Status
- Order details view with:
  - Current status
  - Product/quantity summary
  - Status history timeline
- Interactive workflow/state machine visualization using D3
- Action buttons to move an order through valid workflow transitions
- Light/Dark theme toggle (saved in browser localStorage)
- Data persistence in browser localStorage for products and orders

## Tech Stack

| Library         | Version | Source |
| --------------- | ------- | ------ |
| Bootstrap       | 5.3.3   | CDN    |
| Bootstrap Icons | 1.11.3  | CDN    |
| jQuery          | 3.7.1   | CDN    |
| D3.js           | 7       | CDN    |

## Workflow States

The app models an order lifecycle with the following states:

- Order Placed
- Processing
- Payment Failed
- Shipped
- Delivered
- Returned
- Completed
- Cancelled

## Run Locally

No installation required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
```

Then open http://localhost:3000

## Project Structure

```text
.
|- index.html
|- src/
|  |- app.js
|  |- index.css
```

## Notes

- This project is frontend-only with no build step or dependencies to install.
- All libraries are loaded from CDN.
- App data is stored in browser localStorage. Clearing storage resets orders and products to initial defaults.
