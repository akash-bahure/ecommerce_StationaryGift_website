  // Fetch and display user's orders
  const fetchOrders = () => {
    const userId = 1; // Assume logged-in user's ID is 1 (update dynamically if necessary)

    fetch(`http://localhost:3000/getOrders/${userId}`)
        .then(response => response.json())
        .then(orders => {
            const ordersContainer = document.getElementById("ordersContainer");
            ordersContainer.innerHTML = '';

            if (orders.length === 0) {
                ordersContainer.innerHTML = "<p>No orders found.</p>";
                return;
            }

            orders.forEach(order => {
                const orderCard = document.createElement("div");
                orderCard.className = "product-card";
                orderCard.innerHTML = `
                    <h3>${order.productName}</h3>
                    <p>Price: ₹${order.price}</p>
                    <p>Order Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
                `;
                ordersContainer.appendChild(orderCard);
            });
        })
        .catch(error => {
            console.error("Error fetching orders:", error);
        });
};

// Fetch orders when the page loads
// window.onload = fetchOrders;

// Fetch products from the database and display
// Fetch products from the database and display
// Fetch products from the database and display
const fetchProducts = () => {
    const sellerId = localStorage.getItem("sellerId");

    // Check if sellerId is available
    if (!sellerId) {
        alert("Seller is not logged in.");
        return;
    }

    fetch(`http://localhost:3000/getProducts?sellerId=${sellerId}`)
        .then(response => response.json())
        .then(products => {
            const productTableBody = document.getElementById("productTableBody");
            productTableBody.innerHTML = ''; // Clear the table body
            products.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>₹${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.description}</td>
            <td>${product.created_at}</td>
            <td>
                <img src="/backend${product.image_url}" alt="Product" style="max-width: 100px;">
            </td>
            <td>
                <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
                productTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching products:", error);
        });
};


// Add event listener to the product form for adding new products
document.getElementById("productForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload


    // Retrieve sellerId from localStorage
    const sellerId = localStorage.getItem("sellerId");

    // Check if sellerId is available
    if (!sellerId) {
        alert("Seller is not logged in.");
        return;
    }

    // Prepare the form data, including the image file
    const formData = new FormData();
    formData.append("name", document.getElementById("productName").value);
    formData.append("price", document.getElementById("productPrice").value);
    formData.append("stock", document.getElementById("productStock").value);
    formData.append("description", document.getElementById("productDescription").value);
    formData.append("image", document.getElementById("productImage").files[0]);
    formData.append("sellerId", sellerId); // Replace with actual seller ID

    // Send the form data to the server
    fetch("http://localhost:3000/addProduct", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                document.getElementById("productForm").reset();
                document.getElementById("productImagePreview").style.display = "none"; // Hide the preview
                fetchProducts(); // Refresh the product list
            } else {
                alert("Failed to add product");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while adding the product.");
        });
});

// Show product add form
document.getElementById("addProductBtn").addEventListener("click", () => {
    document.getElementById("addProductForm").style.display = "block";
});

// Show image preview when a file is selected
document.getElementById("productImage").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("productImagePreview").src = e.target.result;
            document.getElementById("productImagePreview").style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// Fetch products when the page loads
// window.onload = fetchProducts;

// Delete product
function deleteProduct(productId) {
    fetch(`http://localhost:3000/deleteProduct/${productId}`, {
        method: "DELETE",
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchProducts(); // Refresh the product list
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error deleting product.");
        });
}

// Edit product functionality (same as before)
function editProduct(productId) {
    fetch(`http://localhost:3000/getProduct/${productId}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById("productName").value = product.name;
            document.getElementById("productPrice").value = product.price;
            document.getElementById("productStock").value = product.stock;
            document.getElementById("productDescription").value = product.description;
            document.getElementById("productImagePreview").src = product.image_url;
            document.getElementById("productImagePreview").style.display = "block"; // Show existing image

            const submitButton = document.querySelector("#productForm button");
            submitButton.textContent = "Update Product";

            document.getElementById("productForm").onsubmit = function (event) {
                event.preventDefault(); // Prevent page reload

                const updatedProductData = {
                    id: productId,
                    name: document.getElementById("productName").value,
                    price: document.getElementById("productPrice").value,
                    stock: document.getElementById("productStock").value,
                    description: document.getElementById("productDescription").value,
                    image: document.getElementById("productImage").files[0] // Include image
                };

                // Send the updated product data to the server
                fetch("http://localhost:3000/updateProduct", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updatedProductData)
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            alert(data.message);
                            document.getElementById("productForm").reset();
                            fetchProducts(); // Refresh the product list
                            submitButton.textContent = "Add Product";
                        } else {
                            alert("Failed to update product");
                        }
                    })
                    .catch(error => {
                        console.error("Error:", error);
                        alert("An error occurred while updating the product.");
                    });
            };
        })
        .catch(error => {
            console.error("Error:", error);
        });
}


window.onload = function() {
fetchOrders();  // Load orders on page load
fetchProducts();  // Load products on page load
}