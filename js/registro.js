        document.getElementById('registerForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Previene el envío del formulario.
    
            // Captura los datos del formulario.
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
    
            // Almacena las credenciales en localStorage
            localStorage.setItem('email', email);
            localStorage.setItem('password', password);
    
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = "sistema.html"; // Redirige a la página de inicio de sesión
        });
