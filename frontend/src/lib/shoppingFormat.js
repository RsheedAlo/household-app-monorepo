// Gemeinsame Formatierung für Einkauf/Vorrat (Dashboard und Seite)

// Zahlen im deutschen Format ohne unnötige Nachkommastellen (2,5 statt 2.50)
const numberFormat = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });

export function formatNumber(value) {
    return numberFormat.format(value);
}

// "1" ohne Einheit ist der Normalfall und wird nicht extra angezeigt
export function quantityLabel(item) {
    if (item.quantity === 1 && !item.unit) {
        return "";
    }
    return [formatNumber(item.quantity), item.unit].filter(Boolean).join(" ");
}

export function plural(count, one, many) {
    return count === 1 ? one : many;
}
