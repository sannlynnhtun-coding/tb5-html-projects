$(document).ready(function() {
    const STORAGE_KEY = 'neo_inventory_data';
    let products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let currentEditId = null;
    let deleteTargetId = null;

    // Helper: Save to local storage
    const saveToStorage = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    };

    // Helper: Generate ID
    const generateId = () => {
        return 'prod_' + Math.random().toString(36).substr(2, 9);
    };

    // Helper: Determine badge color for quantity
    const getBadgeClass = (qty) => {
        if (qty > 10) return 'bg-success';
        if (qty > 0) return 'bg-warning text-dark';
        return 'bg-danger';
    };

    // Render table
    const renderTable = () => {
        const tbody = $('#productTableBody');
        tbody.empty();

        if (products.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No products found. Add some inventory to get started.</p>
                    </td>
                </tr>
            `);
            return;
        }

        products.forEach(p => {
            const row = `
                <tr>
                    <td><span class="text-muted small">${p.id}</span></td>
                    <td class="fw-bold">${p.name}</td>
                    <td>${p.location}</td>
                    <td>
                        <span class="badge ${getBadgeClass(p.quantity)}">
                            ${p.quantity} Units
                        </span>
                    </td>
                    <td>
                        <div class="actions-cell">
                            <button class="action-btn view" data-id="${p.id}" title="View Details"><i class="fas fa-eye"></i></button>
                            <button class="action-btn edit" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    };

    // Initialize Add Product
    $('#addBtn').click(() => {
        currentEditId = null;
        $('#productForm')[0].reset();
        $('#productModalLabel').text('Add New Product');
        $('#productModal').modal('show');
    });

    // Form Submit (Add/Edit)
    $('#productForm').submit(function(e) {
        e.preventDefault();
        
        const productData = {
            name: $('#name').val().trim(),
            description: $('#description').val().trim(),
            quantity: parseInt($('#quantity').val(), 10),
            location: $('#location').val().trim()
        };

        if (currentEditId) {
            // Edit
            const index = products.findIndex(p => p.id === currentEditId);
            if (index !== -1) {
                // Merge using spread
                products[index] = Object.assign({}, products[index], productData);
            }
        } else {
            // Add
            productData.id = generateId();
            products.push(productData);
        }

        saveToStorage();
        renderTable();
        $('#productModal').modal('hide');
    });

    // View Details
    $(document).on('click', '.action-btn.view', function() {
        const id = $(this).data('id');
        const p = products.find(prod => prod.id === id);
        if (p) {
            $('#viewId').text(p.id);
            $('#viewName').text(p.name);
            $('#viewDescription').text(p.description || 'No description provided.');
            
            const $qtyBadge = $('#viewQuantity');
            $qtyBadge.text(p.quantity + ' Units')
                     .removeClass('bg-success bg-warning bg-danger text-dark')
                     .addClass(getBadgeClass(p.quantity));
            
            $('#viewLocation').text(p.location || 'N/A');
            $('#viewModal').modal('show');
        }
    });

    // Edit Modal Hook
    $(document).on('click', '.action-btn.edit', function() {
        const id = $(this).data('id');
        const p = products.find(prod => prod.id === id);
        if (p) {
            currentEditId = p.id;
            $('#name').val(p.name);
            $('#description').val(p.description);
            $('#quantity').val(p.quantity);
            $('#location').val(p.location);
            $('#productModalLabel').text('Edit Product');
            $('#productModal').modal('show');
        }
    });

    // Delete Modal Hook
    $(document).on('click', '.action-btn.delete', function() {
        deleteTargetId = $(this).data('id');
        $('#deleteModal').modal('show');
    });

    // Confirm Delete
    $('#confirmDeleteBtn').click(function() {
        if (deleteTargetId) {
            products = products.filter(p => p.id !== deleteTargetId);
            saveToStorage();
            renderTable();
            $('#deleteModal').modal('hide');
        }
    });

    // Initial render call
    renderTable();
});
