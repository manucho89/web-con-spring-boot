document.addEventListener("DOMContentLoaded", () => {
    const botonConsultar = document.getElementById("consultarApi");
    const resultado = document.getElementById("resultado");

    if (!botonConsultar || !resultado) {
        console.error("No se encontró el botón o el contenedor de resultado.");
        return;
    }

    botonConsultar.addEventListener("click", async () => {
        resultado.innerHTML = "<p>Consultando la API...</p>";

        try {
            const response = await fetch("http://localhost:8080/");

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const datos = await response.json();

            resultado.innerHTML = `
                <p><strong>Mensaje:</strong> ${datos.mensaje}</p>
                <p><strong>Versión:</strong> ${datos.version}</p>
                <p><strong>Estado:</strong> ${datos.estado}</p>
            `;
        } catch (error) {
            console.error("Error al consultar la API:", error);

            resultado.innerHTML = `
                <p><strong>Error:</strong> No se pudo consultar la API.</p>
                <p>${error.message}</p>
                <p>Comprueba que Spring Boot esté funcionando en el puerto 8080.</p>
            `;
        }
    });
});