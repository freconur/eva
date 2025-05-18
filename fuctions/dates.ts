export const currentYear = new Date().getFullYear();

export const currentMonth = new Date().getMonth();

export const currentDay = new Date().getDate();



export const getMonthName = (month: number) => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return monthNames[month];
}
export const getAllMonths = [
    {
        id: 0,
        name: "Enero"
    },
    {
        id: 1,
        name: "Febrero"
    },
    {
        id: 2,
        name: "Marzo"
    },
    {
        id: 3,
        name: "Abril"
    },
    {
        id: 4,
        name: "Mayo"
    },
    {
        id: 5,
        name: "Junio"
    },
    {
        id: 6,
        name: "Julio"
    },
    {
        id: 7,
        name: "Agosto"
    },
    {
        id: 8,
        name: "Septiembre"
    },
    {
        id: 9,
        name: "Octubre"
    },
    {
        id: 10,
        name: "Noviembre"
    },
    {
        id: 11,
        name: "Diciembre"
    }
]