# MT Order Flow

A frontend order-flow demo app built with Vite, Bootstrap, jQuery, and D3.

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

## Workflow States

The app models an order lifecycle with states such as:

- Order Placed
- Processing
- Payment Failed
- Shipped
- Delivered
- Returned
- Completed
- Cancelled

## Run Locally

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

The app runs on:

- http://localhost:3000

## Other Scripts

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```text
.
|- index.html
|- package.json
|- vite.config.ts
|- src/
|  |- app.js
|  |- index.css
```

## Notes

- This project is currently frontend-focused and stores app data in the browser.
- Clearing browser storage resets orders/products to initial defaults.
