document.addEventListener('DOMContentLoaded', init);

function init() {
    const cartTableBody = document.querySelector('#cartTable tbody');
    const checkoutTableBody = document.querySelector('#checkoutTable tbody');
    const finalTotalPriceElement = document.getElementById('subtotal');
    const checkoutSubtotalElement = document.getElementById('checkout-subtotal');
    const checkoutTotalElement = document.getElementById('checkout-total');
    const addFavoriteButton = document.getElementById('add-favorite');
    const applyFavoriteButton = document.getElementById('apply-favorites');

    const isCartPage = !!cartTableBody;
    const isCheckoutPage = !!checkoutTableBody;

    if (isCartPage) {
        setupCartPage();
    }

    if (isCheckoutPage) {
        setupCheckoutPage();
    }

    function setupCartPage() {
        updateCart();
        setupCartEvents();
    }

    function setupCheckoutPage() {
        loadCart();
        setupCheckoutEvents();
    }

    function setupCartEvents() {
        const quantityInputs = document.querySelectorAll('.quantity_input');
        quantityInputs.forEach(input => input.addEventListener('change', updateCart));

        document.getElementById('buy-now').addEventListener('click', handleBuyNow);
        addFavoriteButton.addEventListener('click', handleAddFavorite);
        applyFavoriteButton.addEventListener('click', handleApplyFavorite);
    }

    function setupCheckoutEvents() {
        const form = document.getElementById('checkoutForm');
        const confirmationMessage = document.getElementById('confirmationMessage');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            handleCheckoutFormSubmit(confirmationMessage);
        });
    }

    function updateCart() {
        cartTableBody.innerHTML = '';
        let finalTotalPrice = 0;
        let cartData = [];

        const updatedInputs = document.querySelectorAll('.quantity_input');

        updatedInputs.forEach(function(input) {
            const quantity = parseFloat(input.value);
            if (quantity > 0) {
                const itemElement = input.closest('.product');
                const itemName = itemElement.querySelector('.name').textContent;
                const priceText = itemElement.querySelector('.price').textContent;
                const price = parseFloat(priceText.replace('Rs.', '').replace(',', ''));
                const totalPrice = price * quantity;
                const imageSrc = itemElement.querySelector('.item-image').src;

                const newRow = document.createElement('tr');
                newRow.setAttribute('data-item', itemName);
                newRow.innerHTML = `
                    <td>
                        <img src="${imageSrc}" alt="${itemName}" class="cart-item-image">
                        ${itemName}
                    </td>
                    <td>Rs.${price.toFixed(2)}</td>
                    <td><input type="number" class="quantity_input" value="${quantity}" min="1"></td>
                    <td>Rs.${totalPrice.toFixed(2)}</td> <!-- Rs. added here -->
                    <td><button class="remove-btn">Remove</button></td>
                `;
                cartTableBody.appendChild(newRow);

                finalTotalPrice += totalPrice;

                cartData.push({
                    name: itemName,
                    price: price,
                    quantity: quantity,
                    total: totalPrice,
                    imageSrc: imageSrc
                });

                newRow.querySelector('.remove-btn').addEventListener('click', function() {
                    const itemIndex = cartData.findIndex(item => item.name === itemName);
                    if (itemIndex > -1) {
                        cartData.splice(itemIndex, 1);
                    }

                    newRow.remove();
                    finalTotalPrice -= totalPrice;
                    finalTotalPriceElement.textContent = `Rs.${finalTotalPrice.toFixed(2)}`;

                    localStorage.setItem('cartData', JSON.stringify(cartData));
                    localStorage.setItem('finalTotalPrice', finalTotalPrice.toFixed(2));
                });

                newRow.querySelector('.quantity_input').addEventListener('change', updateCart);
            }
        });

        finalTotalPriceElement.textContent = `Rs.${finalTotalPrice.toFixed(2)}`; // Rs. added here
        localStorage.setItem('cartData', JSON.stringify(cartData));
        localStorage.setItem('finalTotalPrice', finalTotalPrice.toFixed(2));
    }

    function handleBuyNow() {
        const cartTableRows = cartTableBody.querySelectorAll('tr');

        if (cartTableRows.length === 0) {
            alert('Your cart is empty. Please add items to your cart before proceeding to checkout.');
        } else {
            transferCartToCheckout();
            window.location.href = 'checkout.html';
        }
    }

    function handleAddFavorite() {
        const cartData = JSON.parse(localStorage.getItem('cartData')) || [];
        localStorage.setItem('favoriteData', JSON.stringify(cartData));
        alert("These items have been added to your favorite list.");
    }

    function handleApplyFavorite() {
        const favoriteData = JSON.parse(localStorage.getItem('favoriteData')) || [];
        if (favoriteData.length > 0) {
            cartTableBody.innerHTML = '';
            let finalTotalPrice = 0;

            favoriteData.forEach(function(item) {
                const newRow = document.createElement('tr');
                newRow.setAttribute('data-item', item.name);
                newRow.innerHTML = `
                    <td>
                        <img src="${item.imageSrc}" alt="${item.name}" class="cart-item-image">
                        ${item.name}
                    </td>
                    <td>Rs.${item.price.toFixed(2)}</td>
                    <td><input type="number" class="quantity_input" value="${item.quantity}" min="1"></td>
                    <td>Rs.${item.total.toFixed(2)}</td> <!-- Rs. added here -->
                    <td><button class="remove-btn">Remove</button></td>
                `;
                cartTableBody.appendChild(newRow);

                finalTotalPrice += item.total;

                newRow.querySelector('.quantity_input').addEventListener('change', updateCart);

                newRow.querySelector('.remove-btn').addEventListener('click', function() {
                    // Remove only the specific item from the table
                    newRow.remove();
                    // Update cart data and total price
                    updateCart();
                });
            });

            finalTotalPriceElement.textContent = `Rs.${finalTotalPrice.toFixed(2)}`; // Rs. added here

            const newQuantityInputs = document.querySelectorAll('.quantity_input');
            newQuantityInputs.forEach(function(input) {
                input.addEventListener('change', updateCart);
            });

            localStorage.setItem('cartData', JSON.stringify(favoriteData));
            localStorage.setItem('finalTotalPrice', finalTotalPrice.toFixed(2));
        }
    }

    function transferCartToCheckout() {
        const rows = cartTableBody.querySelectorAll('tr');
        const cartItems = [];
        let subtotal = 0;

        rows.forEach(row => {
            const itemName = row.getAttribute('data-item');
            const price = row.cells[1].textContent.replace('Rs.', '').replace(',', '');
            const quantity = row.cells[2].querySelector('.quantity_input').value;
            const total = row.cells[3].textContent.replace('Rs.', '').replace(',', '');
            const imageSrc = row.querySelector('.cart-item-image').src;

            cartItems.push({ itemName, price, quantity, total, imageSrc });

            subtotal += parseFloat(total.replace('Rs.', '').replace(',', ''));
        });

        const taxRate = 0.02; // 2% tax rate
        const taxAmount = subtotal * taxRate;
        const totalWithTax = subtotal + taxAmount;

        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        localStorage.setItem('subtotal', subtotal.toFixed(2));
        localStorage.setItem('total', totalWithTax.toFixed(2));
    }

    function loadCart() {
        const cartData = JSON.parse(localStorage.getItem('cartItems')) || [];
        const subtotal = parseFloat(localStorage.getItem('subtotal')) || 0;
        const totalWithTax = parseFloat(localStorage.getItem('total')) || subtotal;

        if (cartData.length > 0) {
            cartData.forEach(function(item) {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>
                        <img src="${item.imageSrc}" alt="${item.itemName}" class="cart-item-image">
                        ${item.itemName}
                    </td>
                    <td>Rs.${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>Rs.${parseFloat(item.total).toFixed(2)}</td>
                `;
                checkoutTableBody.appendChild(newRow);
            });

            const taxRate = 0.02; // 2% tax rate
            const taxAmount = subtotal * taxRate;

            checkoutSubtotalElement.textContent = `Rs.${subtotal.toFixed(2)}`;
            checkoutTotalElement.textContent = `Rs.${(subtotal + taxAmount).toFixed(2)}`;
        }
    }

    function handleCheckoutFormSubmit(confirmationMessage) {
        const form = document.getElementById('checkoutForm');
        const today = new Date();
        const deliveryDate = new Date(today.setDate(today.getDate() + 3));

        const options = { weekday: 'long', month: 'long', year: 'numeric' };
        const formattedDate = deliveryDate.toLocaleDateString('en-US', options);

        confirmationMessage.innerHTML = `
            <p>Thank you for your order! Your order will be delivered by ${formattedDate}.</p>
        `;

        form.reset();
    }
}
