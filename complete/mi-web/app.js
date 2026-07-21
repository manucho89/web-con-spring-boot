const ENDPOINT = "http://localhost:8080";
// Cambia /api/usuarios por tu endpoint real

const boton = document.getElementById("btn");
const resultado = document.getElementById("resultado");

boton.addEventListener("click", async () => {

    try {

        const response = await fetch(ENDPOINT);

        if (!response.ok) {
            throw new Error(response.text());
        }

        const datos = await response.text()

        resultado.textContent =datos;

    } catch (error) {

        resultado.textContent =
            "Error: " + error.message;

    }

});