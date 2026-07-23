const API_URL = "http://localhost:8080/usuarios";

const tablaUsuarios = document.getElementById("tabla-usuarios");
const contadorUsuarios = document.getElementById("contador-usuarios");
const botonRecargar = document.getElementById("boton-recargar");

const formularioUsuario = document.getElementById("formulario-usuario");
const campoNombre = document.getElementById("nombre");
const campoEmail = document.getElementById("email");
const botonGuardar = document.getElementById("boton-guardar");
const mensajeFormulario = document.getElementById("mensaje-formulario");

let idUsuarioEnEdicion = null;
let todosLosUsuarios=[];

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

        idUsuarioEnEdicion = null;
        todosLosUsuarios=usuarios;
        aplicarFiltro();
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

    if (!emailValido(email)) {
        mostrarMensajeFormulario(
            "Introduce un correo electrónico válido.",
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
            body: JSON.stringify({ nombre, email })
        });

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}`
            );
        }

        formularioUsuario.reset();
        mostrarMensajeFormulario("Usuario guardado correctamente.", false);
        await cargarUsuarios();
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        mostrarMensajeFormulario("No se pudo guardar el usuario.", true);
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar usuario";
    }
}

async function eliminarUsuario(usuario, botonEliminar) {
    const confirmacion = window.confirm(
        `¿Seguro que deseas eliminar al usuario "${usuario.nombre}"?`
    );

    if (!confirmacion) {
        return;
    }

    botonEliminar.disabled = true;
    botonEliminar.textContent = "Eliminando...";

    mostrarMensajeFormulario(`Eliminando a ${usuario.nombre}...`, false);

    try {
        const respuesta = await fetch(`${API_URL}/${usuario.id}`, {
            method: "DELETE"
        });

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}`
            );
        }

        mostrarMensajeFormulario(
            `Usuario "${usuario.nombre}" eliminado correctamente.`,
            false
        );

        await cargarUsuarios();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);

        mostrarMensajeFormulario(
            `No se pudo eliminar al usuario "${usuario.nombre}".`,
            true
        );

        botonEliminar.disabled = false;
        botonEliminar.textContent = "Eliminar";
    }
}

function activarEdicion(usuario, fila) {
    if (idUsuarioEnEdicion !== null && idUsuarioEnEdicion !== usuario.id) {
        mostrarMensajeFormulario(
            "Guarda o cancela la edición actual antes de editar otro usuario.",
            true
        );
        return;
    }

    idUsuarioEnEdicion = usuario.id;
    fila.classList.add("fila-en-edicion");

    const celdaNombre = fila.children[1];
    const celdaEmail = fila.children[2];
    const celdaAcciones = fila.children[3];

    celdaNombre.innerHTML = "";
    celdaEmail.innerHTML = "";
    celdaAcciones.innerHTML = "";

    const inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.value = usuario.nombre ?? "";
    inputNombre.className = "campo-edicion";

    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.value = usuario.email ?? "";
    inputEmail.className = "campo-edicion";

    const contenedorAcciones = document.createElement("div");
    contenedorAcciones.className = "acciones";

    const botonGuardarCambios = document.createElement("button");
    botonGuardarCambios.type = "button";
    botonGuardarCambios.className = "boton-editar boton-guardar-cambios";
    botonGuardarCambios.textContent = "Guardar";

    const botonCancelar = document.createElement("button");
    botonCancelar.type = "button";
    botonCancelar.className = "boton-cancelar";
    botonCancelar.textContent = "Cancelar";

    const guardar = async () => {
        const nombre = inputNombre.value.trim();
        const email = inputEmail.value.trim();

        if (!nombre || !email) {
            mostrarMensajeFormulario(
                "Completa el nombre y el correo electrónico.",
                true
            );
            return;
        }

        if (!emailValido(email)) {
            mostrarMensajeFormulario(
                "Introduce un correo electrónico válido.",
                true
            );
            return;
        }

        await actualizarUsuario(
            usuario.id,
            nombre,
            email,
            botonGuardarCambios,
            botonCancelar
        );
    };

    botonGuardarCambios.addEventListener("click", guardar);

    botonCancelar.addEventListener("click", () => {
        idUsuarioEnEdicion = null;
        cargarUsuarios();
        mostrarMensajeFormulario("Edición cancelada.", false);
    });

    const controlarTeclado = (evento) => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            guardar();
        }

        if (evento.key === "Escape") {
            evento.preventDefault();
            idUsuarioEnEdicion = null;
            cargarUsuarios();
            mostrarMensajeFormulario("Edición cancelada.", false);
        }
    };

    inputNombre.addEventListener("keydown", controlarTeclado);
    inputEmail.addEventListener("keydown", controlarTeclado);

    celdaNombre.appendChild(inputNombre);
    celdaEmail.appendChild(inputEmail);
    contenedorAcciones.appendChild(botonGuardarCambios);
    contenedorAcciones.appendChild(botonCancelar);
    celdaAcciones.appendChild(contenedorAcciones);

    inputNombre.focus();
    inputNombre.select();
}

async function actualizarUsuario(
    id,
    nombre,
    email,
    botonGuardarCambios,
    botonCancelar
) {
    botonGuardarCambios.disabled = true;
    botonCancelar.disabled = true;
    botonGuardarCambios.textContent = "Guardando...";

    mostrarMensajeFormulario("Guardando cambios...", false);

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, email })
        });

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}`
            );
        }

        idUsuarioEnEdicion = null;
        mostrarMensajeFormulario("Usuario actualizado correctamente.", false);
        await cargarUsuarios();
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        mostrarMensajeFormulario("No se pudieron guardar los cambios.", true);

        botonGuardarCambios.disabled = false;
        botonCancelar.disabled = false;
        botonGuardarCambios.textContent = "Guardar";
    }
}

function aplicarFiltro(){const b=document.getElementById('buscar');const t=(b?.value||'').toLowerCase();const f=todosLosUsuarios.filter(u=>(u.nombre||'').toLowerCase().includes(t)||(u.email||'').toLowerCase().includes(t));mostrarUsuarios(f,todosLosUsuarios.length);}

function mostrarUsuarios(usuarios,total=todosLosUsuarios.length){
    tablaUsuarios.innerHTML = "";

    if (usuarios.length === 0) {
        mostrarEstadoTabla(total===0?"Todavía no hay usuarios registrados.":"No se encontraron usuarios.");
        contadorUsuarios.textContent = "0 usuarios";
        return;
    }

    usuarios.forEach((usuario) => {
        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = usuario.id;

        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = usuario.nombre;

        const celdaEmail = document.createElement("td");
        celdaEmail.textContent = usuario.email;

        const celdaAcciones = document.createElement("td");
        const contenedorAcciones = document.createElement("div");
        contenedorAcciones.className = "acciones";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "boton-editar";
        botonEditar.textContent = "Editar";

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "boton-eliminar";
        botonEliminar.textContent = "Eliminar";

        botonEditar.addEventListener("click", () => {
            activarEdicion(usuario, fila);
        });

        botonEliminar.addEventListener("click", () => {
            eliminarUsuario(usuario, botonEliminar);
        });

        contenedorAcciones.appendChild(botonEditar);
        contenedorAcciones.appendChild(botonEliminar);
        celdaAcciones.appendChild(contenedorAcciones);

        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmail);
        fila.appendChild(celdaAcciones);

        tablaUsuarios.appendChild(fila);
    });

    contadorUsuarios.textContent =
        usuarios.length === 1
            ? `1 de ${total} usuario`
            : `${usuarios.length} de ${total} usuarios`;
}

function mostrarEstadoTabla(mensaje) {
    tablaUsuarios.innerHTML = `
        <tr>
            <td colspan="4" class="estado-tabla">
                ${escaparHTML(mensaje)}
            </td>
        </tr>
    `;
}

function mostrarMensajeFormulario(mensaje, esError) {
    mensajeFormulario.textContent = mensaje;

    mensajeFormulario.classList.toggle("mensaje-error", esError);
    mensajeFormulario.classList.toggle("mensaje-exito", !esError);
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escaparHTML(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto ?? "";
    return elemento.innerHTML;
}

botonRecargar.addEventListener("click", cargarUsuarios);
formularioUsuario.addEventListener("submit", guardarUsuario);

const cajaBusqueda = document.getElementById("buscar");
if (cajaBusqueda) {
    cajaBusqueda.addEventListener("input", aplicarFiltro);
}

cargarUsuarios();
