import { obtenerFechaYHoraActual } from "./utiles";
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
document.addEventListener("DOMContentLoaded", () => {
    const $btnImprimir = document.querySelector("#btnImprimir");
    const $btnNuevoDiseño = document.querySelector("#btnNuevoDiseño");
    const $selectDiseñosExistentes = document.querySelector("#diseños");
    const $titulo = document.querySelector("#titulo");
    const $btnEliminarDiseño = document.querySelector("#btnEliminarDiseño");
    const formateador = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'medium' })
    const $selectImpresoras = document.querySelector("#impresoras");
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
    llenarSelectConImpresoras();
    const formatearFecha = (fecha) => {
        return formateador.format(new Date(fecha));
    }
    const buscarIndice = (id) => {
        for (let i = 0; i < $selectDiseñosExistentes.options.length; i++) {
            const opcion = $selectDiseñosExistentes[i];
            if (opcion.value === id) {
                return i;
            }
        }
        return -1;
    }
    const llenarListaConDiseños = (diseños) => {
        limpiarSelect($selectDiseñosExistentes);
        for (let i = 0; i < diseños.length; i++) {
            const diseño = diseños[i];
            let fechaFormateada = "";
            try {
                fechaFormateada = formatearFecha(diseño.fecha_modificacion);
            } catch (e) { }
            const $option = Object.assign(document.createElement("option"), {
                value: diseño.id,
                text: `${diseño.titulo} (${fechaFormateada})`,
                selected: i === diseños.length - 1,
            })
            $selectDiseñosExistentes.appendChild($option);
        }
    }
    worker.onmessage = (evento) => {
        const accion = evento.data[0];
        const argumentos = evento.data[1];
        console.log("El worker dice %o con %o", accion, argumentos);
        switch (accion) {
            case "diseño_eliminado":
                const indiceParaEliminar = buscarIndice(argumentos.id.toString())
                if (indiceParaEliminar !== -1) {
                    $selectDiseñosExistentes.remove(indiceParaEliminar);
                    refrescarSegunSeleccionado();
                }
                break;
            case "diseño_actualizado":
                const indice = buscarIndice(argumentos.id.toString())
                if (indice !== -1) {
                    $selectDiseñosExistentes.options[indice].text = argumentos.titulo;
                }
                break;
            case "iniciado":
                worker.postMessage(["obtener_diseños"]);
                break;

            case "diseño_insertado":
                worker.postMessage(["obtener_diseños"]);
                break;
            case "diseños_obtenidos":
                // Aquí tenemos los diseños en argumentos, no hay necesidad de
                // declarar otra variable
                llenarListaConDiseños(argumentos);
                refrescarSegunSeleccionado();
                break;
            case "diseño_obtenido":
                if (argumentos) {
                    $titulo.value = argumentos.titulo;
                    hugerte.activeEditor.setContent(argumentos.contenido);
                }
                break;
        }
    }
    worker.postMessage(["iniciar"]);
    const limpiarSelect = ($select) => {
        for (let i = $select.options.length; i >= 0; i--) {
            $select.remove(i);
        }
    };
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
        console.log("El HTML completo que se imprime es %o", htmlCompleto);
        const cargaUtil = {
            "serial": "",
            "nombreImpresora": $selectImpresoras.value,
            "operaciones": [
                {
                    "nombre": "GenerarImagenAPartirDeHtmlEImprimir",
                    "argumentos": [
                        htmlCompleto,
                        380,
                        380,
                        0,
                        false
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

    const refrescarSegunSeleccionado = () => {
        console.log("Vamos a obtener el contenido del diseño %o", $selectDiseñosExistentes.value)
        worker.postMessage(["obtener_diseño", { id: $selectDiseñosExistentes.value }]);
    }
    const actualizarDiseñoActualmenteEditado = () => {
        worker.postMessage(["actualizar_diseño", {
            id: $selectDiseñosExistentes.value,
            contenido: hugerte.activeEditor.getContent(),
            fecha_modificacion: obtenerFechaYHoraActual(),
            titulo: $titulo.value,
        }])
    }
    $selectDiseñosExistentes.addEventListener("change", () => {
        refrescarSegunSeleccionado();
    })
    $titulo.addEventListener("change", () => {
        actualizarDiseñoActualmenteEditado();
    })

    const manejador_de_subida_de_imagen = (blobInfo, progress) => new Promise((resolve, reject) => {
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
    });

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
                actualizarDiseñoActualmenteEditado();
            })
        },
        selector: '#contenedor',
        plugins: 'image',
        toolbar: "image",
        language: "es_MX",
        images_upload_handler: manejador_de_subida_de_imagen,
    });
})
