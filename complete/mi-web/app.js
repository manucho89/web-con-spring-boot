const API_URL = "http://localhost:8080/usuarios";

const tablaUsuarios = document.getElementById("tabla-usuarios");
const contadorUsuarios = document.getElementById("contador-usuarios");
const botonRecargar = document.getElementById("boton-recargar");

const formularioUsuario = document.getElementById("formulario-usuario");
const campoNombre = document.getElementById("nombre");
const campoEmail = document.getElementById("email");
const botonGuardar = document.getElementById("boton-guardar");
const mensajeFormulario = document.getElementById("mensaje-formulario");

async function cargarUsuarios() {
    mostrarEstadoTabla("Cargando usuarios...");
    contadorUsuarios.textContent = "Cargando usuarios...";
    botonRecargar.disabled = true;

    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}`
            );
        }

        const usuarios = await respuesta.json();

        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error("Error al cargar usuarios:", error);

        mostrarEstadoTabla(
            "No se pudieron cargar los usuarios. Comprueba que Spring Boot está funcionando."
        );

        contadorUsuarios.textContent = "Error de conexión";
    } finally {
        botonRecargar.disabled = false;
    }
}

async function guardarUsuario(evento) {
    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const email = campoEmail.value.trim();

    if (!nombre || !email) {
        mostrarMensajeFormulario(
            "Completa el nombre y el correo electrónico.",
            true
        );

        return;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Guardando...";

    mostrarMensajeFormulario("Guardando usuario...", false);

    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: nombre,
                email: email
            })
        });

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}`
            );
        }

        formularioUsuario.reset();

        mostrarMensajeFormulario(
            "Usuario guardado correctamente.",
            false
        );

        await cargarUsuarios();
    } catch (error) {
        console.error("Error al guardar usuario:", error);

        mostrarMensajeFormulario(
            "No se pudo guardar el usuario.",
            true
        );
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar usuario";
    }
}

function mostrarUsuarios(usuarios) {
    tablaUsuarios.innerHTML = "";

    if (usuarios.length === 0) {
        mostrarEstadoTabla("Todavía no hay usuarios registrados.");
        contadorUsuarios.textContent = "0 usuarios";
        return;
    }

    usuarios.forEach((usuario) => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${escaparHTML(usuario.nombre)}</td>
            <td>${escaparHTML(usuario.email)}</td>
            <td>
                <div class="acciones">
                    <button
                        type="button"
                        class="boton-editar"
                        disabled
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        class="boton-eliminar"
                        disabled
                    >
                        Eliminar
                    </button>
                </div>
            </td>
        `;

        tablaUsuarios.appendChild(fila);
    });

    contadorUsuarios.textContent =
        usuarios.length === 1
            ? "1 usuario"
            : `${usuarios.length} usuarios`;
}

function mostrarEstadoTabla(mensaje) {
    tablaUsuarios.innerHTML = `
        <tr>
            <td colspan="4" class="estado-tabla">
                ${mensaje}
            </td>
        </tr>
    `;
}

function mostrarMensajeFormulario(mensaje, esError) {
    mensajeFormulario.textContent = mensaje;

    mensajeFormulario.classList.toggle(
        "mensaje-error",
        esError
    );

    mensajeFormulario.classList.toggle(
        "mensaje-exito",
        !esError
    );
}

function escaparHTML(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto ?? "";
    return elemento.innerHTML;
}

botonRecargar.addEventListener("click", cargarUsuarios);

formularioUsuario.addEventListener(
    "submit",
    guardarUsuario
);

cargarUsuarios();