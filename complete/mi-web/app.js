"use strict";

const API_HOST = window.location.hostname || "192.168.1.156";
const API_URL = `http://${API_HOST}:8080/usuarios`;

const formularioUsuario = document.getElementById("formulario-usuario");
const campoNombre = document.getElementById("nombre");
const campoEmail = document.getElementById("email");
const botonGuardar = document.getElementById("boton-guardar");
const mensajeFormulario = document.getElementById("mensaje-formulario");
const contadorUsuarios = document.getElementById("contador-usuarios");
const botonRecargar = document.getElementById("boton-recargar");
const cajaBusqueda = document.getElementById("buscar");
const estadoApiTexto = document.getElementById("estado-api-texto");

let todosLosUsuarios = [];
let idUsuarioEnEdicion = null;

const contenedorUsuarios = document.getElementById("lista-usuarios");

if (!contenedorUsuarios) {
    throw new Error("No se encontró el contenedor #lista-usuarios en index.html");
}

async function cargarUsuarios() {
    mostrarEstado("Cargando usuarios...");
    contadorUsuarios.textContent = "Cargando usuarios...";
    botonRecargar.disabled = true;

    try {
        const respuesta = await fetch(API_URL, {
            headers: { Accept: "application/json" }
        });

        if (!respuesta.ok) {
            throw new Error(`El servidor respondió con el código ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        todosLosUsuarios = Array.isArray(datos) ? datos : [];
        if (estadoApiTexto) estadoApiTexto.textContent = `API conectada: ${API_URL}`;
        idUsuarioEnEdicion = null;
        aplicarFiltro();
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        mostrarEstado(
            "No se pudieron cargar los usuarios. Comprueba que Spring Boot está funcionando."
        );
        contadorUsuarios.textContent = "Error de conexión";
        if (estadoApiTexto) estadoApiTexto.textContent = `API sin conexión: ${API_URL}`;
    } finally {
        botonRecargar.disabled = false;
    }
}

async function guardarUsuario(evento) {
    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const email = campoEmail.value.trim();

    if (!validarDatos(nombre, email)) {
        return;
    }

    cambiarEstadoBoton(botonGuardar, true, "Guardando...");
    mostrarMensajeFormulario("Guardando usuario...", false);

    try {
        await solicitar(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email })
        });

        formularioUsuario.reset();
        mostrarMensajeFormulario("Usuario guardado correctamente.", false);
        await cargarUsuarios();
        campoNombre.focus();
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        mostrarMensajeFormulario("No se pudo guardar el usuario.", true);
    } finally {
        cambiarEstadoBoton(botonGuardar, false, "Guardar usuario");
    }
}

function aplicarFiltro() {
    const texto = normalizar(cajaBusqueda?.value);

    const usuariosFiltrados = todosLosUsuarios.filter((usuario) => {
        return normalizar(usuario.nombre).includes(texto)
            || normalizar(usuario.email).includes(texto)
            || String(usuario.id ?? "").includes(texto);
    });

    mostrarUsuarios(usuariosFiltrados, todosLosUsuarios.length, texto !== "");
}

function mostrarUsuarios(usuarios, total, filtroActivo) {
    contenedorUsuarios.replaceChildren();

    if (usuarios.length === 0) {
        mostrarEstado(
            total === 0
                ? "Todavía no hay usuarios registrados."
                : "No se encontraron usuarios con esa búsqueda."
        );
        contadorUsuarios.textContent = total === 0 ? "0 usuarios" : `0 de ${total} usuarios`;
        return;
    }

    const fragmento = document.createDocumentFragment();

    usuarios.forEach((usuario) => {
        fragmento.appendChild(crearTarjetaUsuario(usuario));
    });

    contenedorUsuarios.appendChild(fragmento);

    if (filtroActivo) {
        contadorUsuarios.textContent = `${usuarios.length} de ${total} ${pluralizar(total, "usuario", "usuarios")}`;
    } else {
        contadorUsuarios.textContent = `${total} ${pluralizar(total, "usuario", "usuarios")}`;
    }
}

function crearTarjetaUsuario(usuario) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "usuario-card";
    tarjeta.dataset.usuarioId = String(usuario.id ?? "");

    const cabecera = document.createElement("div");
    cabecera.className = "usuario-card__cabecera";

    const titulo = document.createElement("h3");
    titulo.className = "usuario-card__nombre";
    titulo.textContent = usuario.nombre || "Sin nombre";

    const identificador = document.createElement("span");
    identificador.className = "usuario-card__id";
    identificador.textContent = `ID: ${usuario.id ?? "—"}`;

    cabecera.append(titulo, identificador);

    const email = document.createElement("a");
    email.className = "usuario-card__email";
    email.textContent = usuario.email || "Sin correo electrónico";
    if (usuario.email) {
        email.href = `mailto:${usuario.email}`;
    }

    const acciones = document.createElement("div");
    acciones.className = "acciones usuario-card__acciones";

    const botonEditar = crearBoton("Editar", "boton-editar");
    const botonEliminar = crearBoton("Eliminar", "boton-eliminar");

    botonEditar.addEventListener("click", () => activarEdicion(usuario, tarjeta));
    botonEliminar.addEventListener("click", () => eliminarUsuario(usuario, botonEliminar));

    acciones.append(botonEditar, botonEliminar);
    tarjeta.append(cabecera, email, acciones);

    return tarjeta;
}

function activarEdicion(usuario, tarjeta) {
    if (idUsuarioEnEdicion !== null && idUsuarioEnEdicion !== usuario.id) {
        mostrarMensajeFormulario(
            "Guarda o cancela la edición actual antes de editar otro usuario.",
            true
        );
        return;
    }

    idUsuarioEnEdicion = usuario.id;
    tarjeta.classList.add("usuario-card--edicion");
    tarjeta.replaceChildren();

    const campoNombreEdicion = crearCampoEdicion(
        "Nombre",
        "text",
        usuario.nombre ?? "",
        "Nombre del usuario"
    );

    const campoEmailEdicion = crearCampoEdicion(
        "Correo electrónico",
        "email",
        usuario.email ?? "",
        "Correo electrónico"
    );

    const acciones = document.createElement("div");
    acciones.className = "acciones usuario-card__acciones";

    const botonGuardarCambios = crearBoton("Guardar", "boton-guardar-cambios");
    const botonCancelar = crearBoton("Cancelar", "boton-cancelar");

    const guardar = async () => {
        const nombre = campoNombreEdicion.input.value.trim();
        const email = campoEmailEdicion.input.value.trim();

        if (!validarDatos(nombre, email)) {
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
    botonCancelar.addEventListener("click", cancelarEdicion);

    [campoNombreEdicion.input, campoEmailEdicion.input].forEach((input) => {
        input.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                guardar();
            } else if (evento.key === "Escape") {
                evento.preventDefault();
                cancelarEdicion();
            }
        });
    });

    acciones.append(botonGuardarCambios, botonCancelar);
    tarjeta.append(campoNombreEdicion.contenedor, campoEmailEdicion.contenedor, acciones);

    campoNombreEdicion.input.focus();
    campoNombreEdicion.input.select();
}

function cancelarEdicion() {
    idUsuarioEnEdicion = null;
    aplicarFiltro();
    mostrarMensajeFormulario("Edición cancelada.", false);
}

async function actualizarUsuario(id, nombre, email, botonGuardarCambios, botonCancelar) {
    cambiarEstadoBoton(botonGuardarCambios, true, "Guardando...");
    botonCancelar.disabled = true;
    mostrarMensajeFormulario("Guardando cambios...", false);

    try {
        await solicitar(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email })
        });

        idUsuarioEnEdicion = null;
        mostrarMensajeFormulario("Usuario actualizado correctamente.", false);
        await cargarUsuarios();
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        mostrarMensajeFormulario("No se pudieron guardar los cambios.", true);
        cambiarEstadoBoton(botonGuardarCambios, false, "Guardar");
        botonCancelar.disabled = false;
    }
}

async function eliminarUsuario(usuario, botonEliminar) {
    const nombre = usuario.nombre || "este usuario";
    const confirmado = window.confirm(`¿Seguro que deseas eliminar a "${nombre}"?`);

    if (!confirmado) {
        return;
    }

    cambiarEstadoBoton(botonEliminar, true, "Eliminando...");
    mostrarMensajeFormulario(`Eliminando a ${nombre}...`, false);

    try {
        await solicitar(`${API_URL}/${usuario.id}`, { method: "DELETE" });
        mostrarMensajeFormulario(`Usuario "${nombre}" eliminado correctamente.`, false);
        await cargarUsuarios();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        mostrarMensajeFormulario(`No se pudo eliminar al usuario "${nombre}".`, true);
        cambiarEstadoBoton(botonEliminar, false, "Eliminar");
    }
}

async function solicitar(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);

    if (!respuesta.ok) {
        throw new Error(`El servidor respondió con el código ${respuesta.status}`);
    }

    return respuesta;
}

function validarDatos(nombre, email) {
    if (!nombre || !email) {
        mostrarMensajeFormulario("Completa el nombre y el correo electrónico.", true);
        return false;
    }

    if (!emailValido(email)) {
        mostrarMensajeFormulario("Introduce un correo electrónico válido.", true);
        return false;
    }

    return true;
}

function crearCampoEdicion(etiqueta, tipo, valor, descripcion) {
    const contenedor = document.createElement("label");
    contenedor.className = "campo campo-edicion-contenedor";

    const texto = document.createElement("span");
    texto.textContent = etiqueta;

    const input = document.createElement("input");
    input.type = tipo;
    input.value = valor;
    input.className = "campo-edicion";
    input.setAttribute("aria-label", descripcion);

    contenedor.append(texto, input);
    return { contenedor, input };
}

function crearBoton(texto, clase) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clase;
    boton.textContent = texto;
    return boton;
}

function mostrarEstado(mensaje) {
    contenedorUsuarios.replaceChildren();

    const estado = document.createElement("p");
    estado.className = "estado-tabla estado-usuarios";
    estado.textContent = mensaje;

    contenedorUsuarios.appendChild(estado);
}

function mostrarMensajeFormulario(mensaje, esError) {
    mensajeFormulario.textContent = mensaje;
    mensajeFormulario.classList.toggle("mensaje-error", esError);
    mensajeFormulario.classList.toggle("mensaje-exito", !esError);
}

function cambiarEstadoBoton(boton, desactivado, texto) {
    boton.disabled = desactivado;
    boton.textContent = texto;
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function pluralizar(cantidad, singular, plural) {
    return cantidad === 1 ? singular : plural;
}

botonRecargar.addEventListener("click", cargarUsuarios);
formularioUsuario.addEventListener("submit", guardarUsuario);
cajaBusqueda?.addEventListener("input", aplicarFiltro);

cargarUsuarios();
