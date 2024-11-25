document.getElementById("registrationForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const registrationData = { username, email, password };

    fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("Registration successful!");
            window.location.href = "sellerLogin.html";
        } else {
            document.getElementById("error-message").style.display = "block";
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("error-message").style.display = "block";
    });
});

