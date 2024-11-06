const UN_MINUTO_EN_MILISEGUNDOS = 60000;
export function obtenerFechaYHoraActual() {
    const fecha = fechaActualEnFormatoISO8601();
    return fecha.substring(0, fecha.lastIndexOf("."))
}

export function fechaActualEnFormatoISO8601() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * UN_MINUTO_EN_MILISEGUNDOS).toISOString()
}