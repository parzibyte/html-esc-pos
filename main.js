import hugerte from 'hugerte';

import 'hugerte/themes/silver';
import 'hugerte/icons/default';
import 'hugerte/models/dom';

import 'hugerte/plugins/table';
import 'hugerte/plugins/image';
import 'hugerte/plugins/lists';
import 'hugerte/plugins/link';

import 'hugerte/skins/ui/oxide/skin.min.css';

import { obtenerFechaYHoraActual } from "./utiles";
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
document.addEventListener("DOMContentLoaded", () => {
    const $btnImprimir = document.querySelector("#btnImprimir");
    const $alerta = document.querySelector("#alerta");
    const $btnNuevoDiseño = document.querySelector("#btnNuevoDiseño");
    const $selectDiseñosExistentes = document.querySelector("#diseños");
    const $titulo = document.querySelector("#titulo");
    const $btnEliminarDiseño = document.querySelector("#btnEliminarDiseño");
    const formateador = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'medium' })
    const $selectImpresoras = document.querySelector("#impresoras");
    const $selectAlgoritmo = document.querySelector("#algoritmo");
    const $anchoPagina = document.querySelector("#anchoPagina");
    const $anchoTicket = document.querySelector("#anchoTicket");
    const $aplicarDithering = document.querySelector("#aplicarDithering");

    const llenarSelectConImpresoras = async () => {
        try {
            const respuestaHttp = await fetch("http://localhost:8000/impresoras");
            const impresoras = await respuestaHttp.json();
            limpiarSelect($selectImpresoras);
            for (const impresora of impresoras) {
                $selectImpresoras.appendChild(Object.assign(document.createElement("option"), {
                    text: impresora,
                    value: impresora,
                }))
            }
        } catch (e) {
            alert("Error obteniendo impresoras. ¿El plugin se está ejecutando? el error es: " + e.message);
        }
    }
    const formatearFecha = (fecha) => {
        return formateador.format(new Date(fecha));
    }
    const buscarIndiceDeDiseñoSegunId = (id) => {
        for (let i = 0; i < $selectDiseñosExistentes.options.length; i++) {
            const opcion = $selectDiseñosExistentes[i];
            if (opcion.value === id) {
                return i;
            }
        }
        return -1;
    }

    const ocultarOMostrarBotonesSegunCantidadDeDiseños = () => {
        const ocultables = document.querySelectorAll(".ocultable-sin-elementos");
        if ($selectDiseñosExistentes.options.length <= 0) {
            for (const ocultable of ocultables) {
                ocultable.style.visibility = "hidden";
            }
            $alerta.style.display = "block";
        } else {
            for (const ocultable of ocultables) {
                ocultable.style.visibility = "visible";
            }
            $alerta.style.display = "none";
        }
    }

    const obtenerTextoDeDiseñoParaMostrarEnSelect = (diseño) => {
        let fechaFormateada = "";
        try {
            fechaFormateada = formatearFecha(diseño.fecha_modificacion);
        } catch (e) { }
        return `${diseño.titulo} (${fechaFormateada})`;
    }

    const llenarSelectConDiseños = (diseños) => {
        limpiarSelect($selectDiseñosExistentes);
        for (let i = 0; i < diseños.length; i++) {
            const diseño = diseños[i];
            const $option = Object.assign(document.createElement("option"), {
                value: diseño.id,
                text: obtenerTextoDeDiseñoParaMostrarEnSelect(diseño),
                selected: i === diseños.length - 1,
            })
            $selectDiseñosExistentes.appendChild($option);
        }
    }
    const limpiarSelect = ($select) => {
        for (let i = $select.options.length; i >= 0; i--) {
            $select.remove(i);
        }
    };

    const actualizarDiseñoSeleccionado = () => {
        worker.postMessage(["actualizar_diseño", {
            id: $selectDiseñosExistentes.value,
            contenido: hugerte.activeEditor.getContent(),
            fecha_modificacion: obtenerFechaYHoraActual(),
            titulo: $titulo.value,
            anchoPagina: $anchoPagina.valueAsNumber,
            anchoTicket: $anchoTicket.valueAsNumber,
            aplicarDithering: $aplicarDithering.checked,
            algoritmoImpresion: $selectAlgoritmo.value,
        }])
    }
    const refrescarCamposSegunDiseñoSeleccionado = () => {
        worker.postMessage(["obtener_diseño", { id: $selectDiseñosExistentes.value }]);
    }
    // Listeners
    worker.onmessage = (evento) => {
        const accion = evento.data[0];
        const argumentos = evento.data[1];
        switch (accion) {
            case "diseño_eliminado":
                const indiceParaEliminar = buscarIndiceDeDiseñoSegunId(argumentos.id.toString())
                if (indiceParaEliminar !== -1) {
                    $selectDiseñosExistentes.remove(indiceParaEliminar);
                    refrescarCamposSegunDiseñoSeleccionado();
                }
                ocultarOMostrarBotonesSegunCantidadDeDiseños();
                break;
            case "diseño_actualizado":
                const indice = buscarIndiceDeDiseñoSegunId(argumentos.id.toString())
                if (indice !== -1) {
                    $selectDiseñosExistentes.options[indice].text = obtenerTextoDeDiseñoParaMostrarEnSelect(argumentos);
                }
                break;
            case "iniciado":
                worker.postMessage(["obtener_diseños"]);
                break;

            case "diseño_insertado":
                worker.postMessage(["obtener_diseños"]);
                break;
            case "diseños_obtenidos":
                llenarSelectConDiseños(argumentos);
                ocultarOMostrarBotonesSegunCantidadDeDiseños();
                refrescarCamposSegunDiseñoSeleccionado();
                break;
            case "diseño_obtenido":
                if (argumentos) {
                    $titulo.value = argumentos.titulo;
                    hugerte.activeEditor.setContent(argumentos.contenido);
                    $anchoPagina.valueAsNumber = argumentos.ancho_pagina;
                    $anchoTicket.valueAsNumber = argumentos.ancho_ticket;
                    $aplicarDithering.checked = Boolean(argumentos.aplicar_dithering);
                    $selectAlgoritmo.value = argumentos.algoritmo_impresion;
                }
                break;
        }
    }


    $btnEliminarDiseño.addEventListener("click", () => {
        if (!confirm("¿Eliminar diseño actualmente seleccionado?")) {
            return;
        }
        const idParaEliminar = $selectDiseñosExistentes.value;
        worker.postMessage(["eliminar_diseño", {
            id: idParaEliminar,
        }]);
    })
    $btnNuevoDiseño.addEventListener("click", () => {
        const titulo = prompt("Título");
        const fechaActual = obtenerFechaYHoraActual();
        worker.postMessage(["insertar_diseño", {
            titulo: titulo,
            contenido: "",
            fecha_creacion: fechaActual,
            fecha_modificacion: fechaActual,
        }]);
    })
    $btnImprimir.addEventListener("click", async () => {
        const contenido = hugerte.activeEditor.getContent();
        const htmlCompleto = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    ${contenido}
</body>
</html>`
        const cargaUtil = {
            "serial": "",
            "nombreImpresora": $selectImpresoras.value,
            "operaciones": [
                {
                    "nombre": "GenerarImagenAPartirDeHtmlEImprimir",
                    "argumentos": [
                        htmlCompleto,
                        $anchoPagina.valueAsNumber,
                        $anchoTicket.valueAsNumber,
                        Number($selectAlgoritmo.value),
                        $aplicarDithering.checked,
                    ]
                }
            ]
        };
        try {
            const respuestaHttp = await fetch("http://localhost:8000/imprimir", {
                method: "POST",
                body: JSON.stringify(cargaUtil)
            });
            const respuesta = await respuestaHttp.json();
            if (respuesta.ok) {
                const original = $btnImprimir.textContent;
                $btnImprimir.textContent = "Impreso correctamente";
                setTimeout(() => {
                    $btnImprimir.textContent = original;
                }, 1000);
            } else {
                alert("Petición ok pero error en el plugin: " + respuesta.message);
            }
        } catch (e) {
            alert("Error haciendo petición: " + e.message);
        }
    });


    [$anchoPagina, $anchoTicket, $selectAlgoritmo, $aplicarDithering, $titulo].forEach($elemento => {
        $elemento.addEventListener("change", actualizarDiseñoSeleccionado)
    })
    $selectDiseñosExistentes.addEventListener("change", () => {
        refrescarCamposSegunDiseñoSeleccionado();
    })

    // Inits
    hugerte.init({
        init_instance_callback: function (editor) {
            editor.on("OpenWindow", function (e) {
                const uploadBtns = document.querySelectorAll(".tox-dialog__body-nav-item.tox-tab")
                if (uploadBtns.length === 2) {
                    uploadBtns[0].style.display = "none";
                    uploadBtns[1].click();
                }
            })
            editor.on("change", () => {
                if ($selectDiseñosExistentes.options.length <= 0) {
                    return;
                }
                actualizarDiseñoSeleccionado();
            })
        },
        selector: '#contenedor',
        plugins: 'image table',
        toolbar: "undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | image",
        language: "es_MX",
        language_url: '/hugerte/es_MX.js',
        content_style: `
    body { font-family: sans-serif; font-size: 14px; }
    table { border-collapse: collapse; width: 100%; border: 1px solid #ccc; }
    table td, table th { border: 1px solid #ddd; padding: 4px; min-width: 20px; }
  `,
        images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
            const verdaderoBlob = blobInfo.blob();
            const fd = new FileReader();
            fd.onload = () => {
                resolve(fd.result);
                setTimeout(() => {
                    const posibleBoton = document.querySelector(".tox-button[data-mce-name='Save']")
                    if (posibleBoton) {
                        posibleBoton.click();
                    }
                }, 200)
            }
            fd.readAsDataURL(verdaderoBlob);
        }),
    });
    llenarSelectConImpresoras();
    worker.postMessage(["iniciar"]);
})
