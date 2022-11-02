var login = document.getElementById("login");
login.addEventListener("click", function (e) {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("username", username, "password", password)
    $.ajax({
        url: '/login',
        type: 'GET',
        data: {
            username: username,
            password: password
        },
        success: function (data) {
            console.log("value", data)
            window.location.href = "/dashboard"
        }
    });
})