# Goal Description
Create a local-first inventory management application using HTML, Vanilla CSS with Bootstrap, and jQuery. The application will store product data (Id, Name, Description, Quantity, Location) persistently using Local Storage, avoiding any modern frontend frameworks per user request.

## Proposed Changes

### Core UI Structure
#### [NEW] c:\repos\tb5-html-projects\MT\Antigravity\Bootstrap_jQuery\index.html
Primary entry point containing the UI layout, importing Bootstrap, jQuery, and custom scripts/styles. Let's create an intuitive layout displaying a searchable/sortable inventory table and actionable buttons directly accessible on the main page.

#### [NEW] c:\repos\tb5-html-projects\MT\Antigravity\Bootstrap_jQuery\style.css
Custom sleek styles using modern design elements (vibrant colors or gradients, hover interactions, modern typography from Google Fonts) beyond Bootstrap's defaults to ensure a rich, dynamic design.

### App Logic
#### [NEW] c:\repos\tb5-html-projects\MT\Antigravity\Bootstrap_jQuery\app.js
Contains all jQuery frontend capabilities:
- **Persistence Layer**: A `ProductService` interacting with the browser's `localStorage` that manages operations like `getProducts()`, `saveProduct(product)`, and `deleteProduct(id)`.
- **UI Logic**: Form validation and dynamic DOM row generation to populate the products table.
- **Event Listeners**: Handling Add, Edit, Delete, and View Details actions (triggered often via Bootstrap modals).

## Verification Plan

### Automated Tests
*N/A - Standard basic frontend app, no automated suite configured nor required at this tier.*

### Manual Verification
1. **Load**: Open `index.html` in the browser. Verify the empty state shows nicely.
2. **Create**: Click "Add Product", fill out the form, and submit. Verify it immediately shows in the table.
3. **Read**: Click "View Details" on the product to see its full breakdown.
4. **Update**: Click "Edit" and change its properties. Verify changes are saved to the table row and `localStorage`.
5. **Delete**: Click "Delete" and confirm. Ensure it removes from both the UI and storage.
6. **Persistence**: Refresh the page continuously between steps to ensure `localStorage` maintains accurate state.
7. **Design**: Check for aesthetic appeal, responsiveness, hover micro-interactions, and appropriate alert feedbacks on actions.
