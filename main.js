const claveLocalStorage = "contenido_html";
document.addEventListener("DOMContentLoaded", () => {
    const guardar = (contenido) => {
        localStorage.setItem(claveLocalStorage, contenido);
    }

    const recuperar = () => {
        const contenido = localStorage.getItem(claveLocalStorage);
        if (!contenido) {
            return "";
        }
        return contenido;
    }
    const example_image_upload_handler = (blobInfo, progress) => new Promise((resolve, reject) => {
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
            editor.setContent(recuperar())
            editor.on("OpenWindow", function (e) {
                const uploadBtns = document.querySelectorAll(".tox-dialog__body-nav-item.tox-tab")
                if (uploadBtns.length === 2) {
                    uploadBtns[0].style.display = "none";
                    uploadBtns[1].click();
                }
            })
            editor.on("change", () => {
                guardar(editor.getContent())
            })
        },
        selector: '#contenedor',
        plugins: 'image',
        toolbar: "image",
        language: "es_MX",
        images_upload_handler: example_image_upload_handler,
    });
})
