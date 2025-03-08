        //login
        
        document.getElementById('loginForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Previene el envío del formulario
    
            const email = document.getElementById('username').value; // Usa el id correcto
            const password = document.getElementById('password').value;
    
            // Recupera las credenciales de localStorage
            const storedEmail = localStorage.getItem('email');
            const storedPassword = localStorage.getItem('password');
    
            // Validación simple de credenciales
            if (email === storedEmail && password === storedPassword) {
                window.location.href = '/index.html'; // Redirige al menú
            } else {
                alert("Credenciales incorrectas");
            }
        });
  