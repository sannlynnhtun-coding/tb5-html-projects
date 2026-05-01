/**
 * MT Order Flow logic
 */

// --- Data & Initialization ---

const INITIAL_PRODUCTS = [
    { id: 'p1', name: 'MacBook Pro 14"', description: 'M3 Pro chip, 18GB RAM, 512GB SSD. Space Grey.', quantity: 10, location: 'Warehouse A' },
    { id: 'p2', name: 'iPhone 15 Pro', description: 'Titanium design, A17 Pro chip, 48MP Main camera.', quantity: 25, location: 'Warehouse B' },
    { id: 'p3', name: 'Sony WH-1000XM5', description: 'Wireless noise-canceling headphones with 30h battery.', quantity: 40, location: 'Warehouse A' },
    { id: 'p4', name: 'Dell UltraSharp 32"', description: '4K USB-C Hub Monitor with IPS Black technology.', quantity: 15, location: 'Warehouse C' },
    { id: 'p5', name: 'Keychron K2 V2', description: 'Mechanical keyboard with RGB and hot-swappable switches.', quantity: 50, location: 'Warehouse B' }
];

const STATES = [
    { id: 'Start', label: 'Start', color: '#6c757d' },
    { id: 'Order Placed', label: 'Order Placed', color: '#0dcaf0' },
    { id: 'Payment Failed', label: 'Payment Failed', color: '#dc3545' },
    { id: 'Processing', label: 'Processing', color: '#ffc107' },
    { id: 'Shipped', label: 'Shipped', color: '#0d6efd' },
    { id: 'Delivered', label: 'Delivered', color: '#198754' },
    { id: 'Returned', label: 'Returned', color: '#fd7e14' },
    { id: 'Completed', label: 'Completed', color: '#20c997' },
    { id: 'Cancelled', label: 'Cancelled', color: '#212529' }
];

const TRANSITIONS = [
    { from: 'Start', to: 'Order Placed' },
    { from: 'Order Placed', to: 'Processing' },
    { from: 'Order Placed', to: 'Payment Failed' },
    { from: 'Order Placed', to: 'Cancelled' },
    { from: 'Payment Failed', to: 'Order Placed' },
    { from: 'Payment Failed', to: 'Cancelled' },
    { from: 'Processing', to: 'Shipped' },
    { from: 'Processing', to: 'Cancelled' },
    { from: 'Shipped', to: 'Delivered' },
    { from: 'Shipped', to: 'Cancelled' },
    { from: 'Delivered', to: 'Completed' },
    { from: 'Delivered', to: 'Returned' },
    { from: 'Returned', to: 'Completed' }
];

class OrderApp {
    constructor() {
        this.products = this.loadData('products') || INITIAL_PRODUCTS;
        this.orders = this.loadData('orders') || [];
        this.currentView = 'products';
        this.activeOrderId = null;
        this.darkMode = localStorage.getItem('theme') === 'dark';

        this.init();
    }

    init() {
        this.saveData('products', this.products);
        this.applyTheme();
        this.renderProducts();
        this.attachEventListeners();
        this.showPage('products');
    }

    loadData(key) {
        const data = localStorage.getItem(`mt_order_${key}`);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(`mt_order_${key}`, JSON.stringify(data));
    }

    applyTheme() {
        $('body').attr('data-bs-theme', this.darkMode ? 'dark' : 'light');
        $('#theme-toggle i').attr('class', this.darkMode ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill');
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.applyTheme();
        if (this.currentView === 'order-details') {
            this.renderWorkflow(this.activeOrderId);
        }
    }

    attachEventListeners() {
        const self = this;

        // Nav clicks (navbar links + back button)
        $('[data-page]').on('click', function (e) {
            e.preventDefault();
            self.showPage($(this).data('page'));
        });

        // Theme toggle
        $('#theme-toggle').on('click', () => this.toggleTheme());

        // Search
        $('#product-search').on('input', function () {
            self.renderProducts($(this).val());
        });

        // Filters
        $('#filter-date-start, #filter-date-end, #filter-status').on('change', () => this.renderOrders());

        // Purchase Modal — delegated
        $(document).on('click', '.buy-btn', function () {
            const pid = $(this).data('id');
            const product = self.products.find(p => p.id === pid);
            $('#purchase-product-name').text(product.name);
            $('#purchase-product-desc').text(product.description);
            $('#purchase-qty').val(1).attr('max', product.quantity);
            $('#confirm-purchase-btn').data('id', pid);
            const modal = new bootstrap.Modal(document.getElementById('purchaseModal'));
            modal.show();
        });

        $('#confirm-purchase-btn').on('click', function () {
            const pid = $(this).data('id');
            const qty = parseInt($('#purchase-qty').val());
            self.placeOrder(pid, qty);
            bootstrap.Modal.getInstance(document.getElementById('purchaseModal')).hide();
        });

        // Order Details link — delegated
        $(document).on('click', '.view-order-btn', function (e) {
            e.preventDefault();
            self.showOrderDetails($(this).data('id'));
        });

        // Workflow Action buttons — delegated
        $(document).on('click', '.workflow-action-btn', function () {
            self.updateOrderStatus(self.activeOrderId, $(this).data('state'));
        });
    }

    showPage(pageId) {
        $('.page').removeClass('active');
        $(`#page-${pageId}`).addClass('active');
        this.currentView = pageId;

        // Nav active state
        $('.nav-link').removeClass('active');
        $(`.nav-link[data-page="${pageId}"]`).addClass('active');

        if (pageId === 'orders') this.renderOrders();
        if (pageId === 'products') this.renderProducts();
    }

    // --- Template Helpers ---

    showToast(message, type = 'primary') {
        $('#toast-message').text(message);
        const toast = new bootstrap.Toast(document.getElementById('appToast'));
        toast.show();
    }

    getStatusClass(status) {
        switch (status) {
            case 'Completed': return 'bg-success';
            case 'Processing': return 'bg-warning text-dark';
            case 'Shipped': return 'bg-primary';
            case 'Payment Failed': return 'bg-danger';
            case 'Cancelled': return 'bg-dark text-white';
            case 'Returned': return 'bg-secondary';
            default: return 'bg-info text-dark';
        }
    }

    // --- Product Logic ---

    renderProducts(searchToken = '') {
        const container = $('#product-list');
        container.empty();

        const filtered = this.products.filter(p =>
            p.name.toLowerCase().includes(searchToken.toLowerCase()) ||
            p.description.toLowerCase().includes(searchToken.toLowerCase())
        );

        if (filtered.length === 0) {
            container.append('<div class="col-12 text-center py-5"><p class="text-muted">No products found.</p></div>');
            return;
        }

        filtered.forEach(p => {
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body">
                            <h5 class="card-title">${p.name}</h5>
                            <p class="card-text text-muted small">${p.description}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div>
                                    <span class="badge bg-light text-dark border"><i class="bi bi-box-seam"></i> ${p.quantity}</span>
                                    <span class="badge bg-light text-dark border ms-1"><i class="bi bi-geo-alt"></i> ${p.location}</span>
                                </div>
                                <button class="btn btn-primary btn-sm buy-btn" data-id="${p.id}">Order Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.append(card);
        });
    }

    placeOrder(productId, quantity) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.quantity < quantity) {
            this.showToast('Error: Out of stock or invalid product.', 'danger');
            return;
        }

        // Deduct stock
        product.quantity -= quantity;
        this.saveData('products', this.products);

        const newOrder = {
            id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            productId: productId,
            productName: product.name,
            quantity: quantity,
            status: 'Order Placed',
            date: new Date().toISOString(),
            history: [{ state: 'Order Placed', time: new Date().toISOString() }]
        };

        this.orders.unshift(newOrder);
        this.saveData('orders', this.orders);
        this.showToast('Order successfully placed!', 'success');
        this.showPage('orders');
    }

    // --- Order Logic ---

    renderOrders() {
        const container = $('#order-list');
        container.empty();

        const startDate = $('#filter-date-start').val();
        const endDate = $('#filter-date-end').val();
        const statusFilter = $('#filter-status').val();

        let filtered = this.orders;

        if (startDate) {
            filtered = filtered.filter(o => new Date(o.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(o => new Date(o.date) <= new Date(endDate));
        }
        if (statusFilter) {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        if (filtered.length === 0) {
            container.append('<tr><td colspan="5" class="text-center py-5 text-muted">No orders match the criteria.</td></tr>');
            return;
        }

        filtered.forEach(o => {
            const row = `
                <tr>
                    <td><span class="fw-bold">${o.id}</span></td>
                    <td>${o.productName} (x${o.quantity})</td>
                    <td>${new Date(o.date).toLocaleDateString()}</td>
                    <td><span class="status-badge ${this.getStatusClass(o.status)}">${o.status}</span></td>
                    <td>
                        <button class="btn btn-outline-primary btn-sm view-order-btn" data-id="${o.id}">
                            <i class="bi bi-eye"></i> Details
                        </button>
                    </td>
                </tr>
            `;
            container.append(row);
        });
    }

    showOrderDetails(orderId) {
        this.activeOrderId = orderId;
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        $('#detail-order-id').text(`Order ${order.id}`);
        this.renderDetailSummary(order);
        this.showPage('order-details');
        this.renderWorkflow(orderId);
    }

    renderDetailSummary(order) {
        const container = $('#detail-summary');
        container.html(`
            <div class="mb-3">
                <label class="text-muted small d-block">Current Status</label>
                <span class="badge ${this.getStatusClass(order.status)} fs-6">${order.status}</span>
            </div>
            <div class="mb-3">
                <label class="text-muted small d-block">Product</label>
                <div class="fw-bold">${order.productName}</div>
                <div class="text-muted">Quantity: ${order.quantity}</div>
            </div>
            <div class="mb-3">
                <label class="text-muted small d-block">Order Date</label>
                <div>${new Date(order.date).toLocaleString()}</div>
            </div>
            <hr>
            <h6>Status History</h6>
            <ul class="list-unstyled small">
                ${[...order.history].reverse().map(h => `
                    <li class="mb-2">
                        <i class="bi bi-clock-history me-2"></i>
                        <span class="fw-bold">${h.state}</span>
                        <div class="ms-4 text-muted">${new Date(h.time).toLocaleString()}</div>
                    </li>
                `).join('')}
            </ul>
        `);
    }

    updateOrderStatus(orderId, newState) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        order.status = newState;
        order.history.push({ state: newState, time: new Date().toISOString() });
        this.saveData('orders', this.orders);

        this.showToast(`Order status updated to: ${newState}`, 'info');
        this.showOrderDetails(orderId);
    }

    // --- D3 Workflow Visualization ---

    renderWorkflow(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        const currentStatus = order.status;
        $('#workflow-viz').empty();

        const width = $('#workflow-viz').width() || 700;
        const height = $('#workflow-viz').height() || 400;

        const svg = d3.select('#workflow-viz')
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", "translate(40, 20)");

        // Define positions (Manually for a clean logical flow)
        const pos = {
            'Start': [0, 180],
            'Order Placed': [120, 180],
            'Payment Failed': [240, 80],
            'Processing': [240, 180],
            'Shipped': [360, 180],
            'Delivered': [480, 180],
            'Returned': [600, 80],
            'Completed': [720, 180],
            'Cancelled': [360, 300]
        };

        // Scale coordinates to fit SVG
        const scaleX = (width - 120) / 720;
        const nodes = STATES.map(s => ({
            ...s,
            x: pos[s.id][0] * scaleX,
            y: pos[s.id][1]
        }));

        const links = TRANSITIONS.map(t => ({
            source: nodes.find(n => n.id === t.from),
            target: nodes.find(n => n.id === t.to)
        }));

        // Draw links
        svg.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d => {
                const s = d.source;
                const t = d.target;
                return `M${s.x},${s.y}L${t.x},${t.y}`;
            })
            .attr("stroke", d => {
                // Highlight path if both are in history
                const inHistory = order.history.some(h => h.state === d.source.id) &&
                    order.history.some(h => h.state === d.target.id);
                // Specifically check if they follow each other in history?
                // For simplicity, just highlight if both were visited
                return inHistory ? "#0d6efd" : (this.darkMode ? "#444" : "#ccc");
            });

        // Draw nodes
        const nodeGroups = svg.selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", d => `node ${d.id === currentStatus ? 'state-active' : ''}`)
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        nodeGroups.append("circle")
            .attr("r", 12)
            .attr("fill", d => {
                const isActive = d.id === currentStatus;
                const isVisited = order.history.some(h => h.state === d.id);
                if (isActive) return "#0d6efd";
                if (isVisited) return "#198754";
                return this.darkMode ? "#333" : "#e0e0e0";
            })
            .attr("stroke", d => d.id === currentStatus ? "#fff" : "none");

        nodeGroups.append("text")
            .attr("dy", 25)
            .attr("text-anchor", "middle")
            .text(d => d.label)
            .style("font-weight", d => d.id === currentStatus ? "bold" : "normal")
            .style("opacity", d => order.history.some(h => h.state === d.id) ? 1 : 0.6);

        // Render Action Buttons
        this.renderActionButtons(currentStatus);
    }

    renderActionButtons(currentStatus) {
        const container = $('#workflow-actions');
        container.empty();

        const availableTransitions = TRANSITIONS.filter(t => t.from === currentStatus);

        if (availableTransitions.length > 0) {
            container.append('<div class="w-100"><label class="text-muted small">Update Status:</label></div>');
            availableTransitions.forEach(t => {
                const btn = `
                    <button class="btn btn-outline-primary workflow-action-btn" data-state="${t.to}">
                        <i class="bi bi-arrow-right-short"></i> Mark as ${t.to}
                    </button>
                `;
                container.append(btn);
            });
        } else {
            container.append('<div class="alert alert-light w-100 py-2 small border">Workflow has reached a terminal state.</div>');
        }
    }
}

// Instantiate the app once the DOM is ready
$(document).ready(() => {
    window.app = new OrderApp();
});
