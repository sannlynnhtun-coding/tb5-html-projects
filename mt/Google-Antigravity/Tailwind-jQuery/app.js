$(document).ready(function() {
    // --- Data Management ---
    const STORAGE_KEY = 'inventory_data';

    // Initialize or get products from local storage
    function getProducts() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveProducts(products) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }

    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // --- State ---
    let currentProducts = getProducts();
    let editModeId = null; // null if adding, ID if editing
    let itemToDelete = null; // ID of the item pending deletion

    // --- DOM Elements ---
    const $viewListing = $('#view-listing');
    const $viewDetails = $('#view-details');
    const $tableContainer = $('#table-container');
    const $emptyState = $('#empty-state');
    const $tableBody = $('#product-table-body');
    const $btnShowAdd = $('#btn-show-add');
    const $btnEmptyAdd = $('#btn-empty-add');
    const $btnCancel = $('#btn-cancel, #btn-cancel-form');
    const $form = $('#product-form');
    const $formTitle = $('#form-title');
    const $totalCount = $('#total-items-count');
    
    // Modal Elements
    const $deleteModal = $('#delete-modal');
    const $btnCancelDelete = $('#btn-cancel-delete');
    const $btnConfirmDelete = $('#btn-confirm-delete');
    const $deleteItemName = $('#delete-item-name');

    // --- View Rendering ---
    function renderTable() {
        $tableBody.empty();
        $totalCount.text(currentProducts.length);

        if (currentProducts.length === 0) {
            $tableContainer.addClass('hidden');
            $emptyState.removeClass('hidden');
        } else {
            $emptyState.addClass('hidden');
            $tableContainer.removeClass('hidden');

            currentProducts.forEach(product => {
                const tr = $('<tr>').addClass('hover:bg-slate-800/50 transition-colors');
                
                tr.html(`
                    <td class="p-4 border-b border-slate-700/50">
                        <span class="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">${product.id.substring(1, 6)}</span>
                    </td>
                    <td class="p-4 border-b border-slate-700/50">
                        <span class="font-medium text-slate-200">${product.name}</span>
                    </td>
                    <td class="p-4 border-b border-slate-700/50 hidden md:table-cell">
                        <span class="text-slate-400 text-sm truncate max-w-[200px] inline-block" title="${product.description}">${product.description || '-'}</span>
                    </td>
                    <td class="p-4 border-b border-slate-700/50">
                        <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity > 10 ? 'bg-emerald-900/40 text-emerald-400' : product.quantity > 0 ? 'bg-amber-900/40 text-amber-400' : 'bg-red-900/40 text-red-400'}">
                            ${product.quantity}
                        </span>
                    </td>
                    <td class="p-4 border-b border-slate-700/50 text-slate-300">
                        ${product.location || '-'}
                    </td>
                    <td class="p-4 border-b border-slate-700/50 text-right">
                        <div class="flex justify-end gap-2">
                            <button class="btn-edit text-brand-400 hover:text-brand-300 p-1.5 hover:bg-brand-900/30 rounded transition-colors" data-id="${product.id}" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button class="btn-delete text-red-400 hover:text-red-300 p-1.5 hover:bg-red-900/30 rounded transition-colors" data-id="${product.id}" data-name="${product.name}" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                `);
                $tableBody.append(tr);
            });
        }
    }

    // --- Navigation & View Toggles ---
    function showListing() {
        $viewDetails.removeClass('opacity-100 translate-y-0').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $viewDetails.addClass('hidden');
            $viewListing.removeClass('hidden');
            // small delay for transition effect
            setTimeout(() => {
                $viewListing.removeClass('opacity-0 translate-y-4').addClass('opacity-100 translate-y-0');
            }, 50);
        }, 300); // Wait for transition duration
        
        $btnShowAdd.show();
        editModeId = null;
        $form[0].reset();
    }

    function showForm(isEdit = false) {
        $viewListing.removeClass('opacity-100 translate-y-0').addClass('opacity-0 translate-y-4');
        setTimeout(() => {
            $viewListing.addClass('hidden');
            $viewDetails.removeClass('hidden');
            
            // Adjust title based on mode
            $formTitle.text(isEdit ? 'Edit Product' : 'Add New Product');
            
            setTimeout(() => {
                $viewDetails.removeClass('opacity-0 translate-y-4').addClass('opacity-100 translate-y-0');
            }, 50);
        }, 300);

        $btnShowAdd.hide();
    }

    // --- Event Handlers ---
    
    // Open Add Form
    $btnShowAdd.add($btnEmptyAdd).on('click', function() {
        editModeId = null;
        $form[0].reset();
        showForm(false);
    });

    // Cancel Form
    $btnCancel.on('click', function(e) {
        e.preventDefault();
        showListing();
    });

    // Submit Form (Add/Edit)
    $form.on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#product-name').val().trim();
        const quantity = parseInt($('#product-quantity').val(), 10);
        const location = $('#product-location').val().trim();
        const description = $('#product-description').val().trim();

        if (!name || isNaN(quantity)) {
            alert('Please fill out all required fields.');
            return;
        }

        if (editModeId) {
            // Edit existing
            const index = currentProducts.findIndex(p => p.id === editModeId);
            if (index !== -1) {
                currentProducts[index] = {
                    ...currentProducts[index],
                    name,
                    quantity,
                    location,
                    description
                };
            }
        } else {
            // Add new
            const newProduct = {
                id: generateId(),
                name,
                quantity,
                location,
                description
            };
            currentProducts.push(newProduct);
        }

        saveProducts(currentProducts);
        renderTable();
        showListing();
    });

    // Open Edit Form (Delegated event)
    $tableBody.on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        const product = currentProducts.find(p => p.id === id);
        
        if (product) {
            editModeId = id;
            $('#product-name').val(product.name);
            $('#product-quantity').val(product.quantity);
            $('#product-location').val(product.location);
            $('#product-description').val(product.description);
            
            showForm(true);
        }
    });

    // Trigger Delete Modal
    $tableBody.on('click', '.btn-delete', function() {
        itemToDelete = $(this).data('id');
        const itemName = $(this).data('name');
        
        $deleteItemName.text(itemName);
        $deleteModal.removeClass('hidden');
        // small delay for transition
        setTimeout(() => {
            $deleteModal.removeClass('opacity-0').addClass('opacity-100');
            $deleteModal.find('.table-container').removeClass('scale-95').addClass('scale-100');
        }, 10);
    });

    // Close Delete Modal
    function closeDeleteModal() {
        $deleteModal.removeClass('opacity-100').addClass('opacity-0');
        $deleteModal.find('.table-container').removeClass('scale-100').addClass('scale-95');
        
        setTimeout(() => {
            $deleteModal.addClass('hidden');
            itemToDelete = null;
        }, 300);
    }

    $btnCancelDelete.on('click', closeDeleteModal);

    // Confirm Delete
    $btnConfirmDelete.on('click', function() {
        if (itemToDelete) {
            currentProducts = currentProducts.filter(p => p.id !== itemToDelete);
            saveProducts(currentProducts);
            renderTable();
            closeDeleteModal();
        }
    });

    // Close modal if clicking outside
    $deleteModal.on('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });

    // --- Initial Render ---
    renderTable();
});
