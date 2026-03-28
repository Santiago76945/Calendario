// functions/lib/ics/parseIcsToDraft.cjs

const DEFAULT_TIMEZONE = 'Europe/Dublin'
const DEFAULT_PRODUCT_ID = '-//Santiago Haspert Piaggio//Calendar ICS//EN'

function unfoldIcsLines(content) {
    return String(content || '')
        .replace(/\r\n[ \t]/g, '')
        .replace(/\n[ \t]/g, '')
}

function splitLines(content) {
    return unfoldIcsLines(content)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
}

function unescapeIcsText(value) {
    return String(value || '')
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
}

function parsePropertyLine(line) {
    const separatorIndex = line.indexOf(':')

    if (separatorIndex === -1) {
        return null
    }

    const left = line.slice(0, separatorIndex)
    const value = line.slice(separatorIndex + 1)

    const [rawName, ...paramParts] = left.split(';')
    const name = String(rawName || '').trim().toUpperCase()

    const params = {}

    for (const part of paramParts) {
        const [rawKey, ...rawValueParts] = part.split('=')
        const key = String(rawKey || '').trim().toUpperCase()
        const paramValue = rawValueParts.join('=').trim()

        if (key) {
            params[key] = paramValue
        }
    }

    return {
        name,
        params,
        value
    }
}

function getFirstProperty(properties, name) {
    return properties.find((property) => property.name === name) || null
}

function parseNaiveIcsDateTime(value) {
    const clean = String(value || '').trim()

    const match = clean.match(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/
    )

    if (!match) {
        throw new Error(`No se pudo interpretar la fecha ICS: ${value}`)
    }

    const [, year, month, day, hours, minutes] = match
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getDatePartsInTimeZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    })

    const parts = formatter.formatToParts(date)
    const map = {}

    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value
        }
    }

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second)
    }
}

function formatPartsAsLocalDateTime(parts) {
    const year = String(parts.year).padStart(4, '0')
    const month = String(parts.month).padStart(2, '0')
    const day = String(parts.day).padStart(2, '0')
    const hour = String(parts.hour).padStart(2, '0')
    const minute = String(parts.minute).padStart(2, '0')

    return `${year}-${month}-${day}T${hour}:${minute}`
}

function convertUtcIcsDateTimeToLocalDateTime(value, timeZone) {
    const clean = String(value || '').trim()

    const match = clean.match(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/
    )

    if (!match) {
        throw new Error(`No se pudo interpretar la fecha ICS UTC: ${value}`)
    }

    const [, year, month, day, hours, minutes, seconds] = match

    const date = new Date(
        Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            Number(seconds)
        )
    )

    return formatPartsAsLocalDateTime(getDatePartsInTimeZone(date, timeZone))
}

function toUtcMinutesFromLocalDateTime(localDateTime) {
    const match = String(localDateTime || '')
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)

    if (!match) {
        return NaN
    }

    const [, year, month, day, hours, minutes] = match

    return Math.round(
        Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            0,
            0
        ) / 60000
    )
}

function getDurationMinutes(startDateTime, endDateTime) {
    const startMinutes = toUtcMinutesFromLocalDateTime(startDateTime)
    const endMinutes = toUtcMinutesFromLocalDateTime(endDateTime)

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
        return 60
    }

    const diff = endMinutes - startMinutes
    return diff > 0 ? diff : 60
}

function normalizeDateTimeValue(value, timeZone) {
    const clean = String(value || '').trim()

    if (!clean) {
        throw new Error('La propiedad ICS no tiene fecha.')
    }

    if (clean.endsWith('Z')) {
        return convertUtcIcsDateTimeToLocalDateTime(clean, timeZone)
    }

    return parseNaiveIcsDateTime(clean)
}

function parseIcsToDraft(icsContent, options = {}) {
    const fallbackTimeZone =
        String(options?.fallbackTimeZone || DEFAULT_TIMEZONE).trim() ||
        DEFAULT_TIMEZONE

    const lines = splitLines(icsContent)

    if (
        !lines.includes('BEGIN:VCALENDAR') ||
        !lines.includes('BEGIN:VEVENT') ||
        !lines.includes('END:VEVENT') ||
        !lines.includes('END:VCALENDAR')
    ) {
        throw new Error('El contenido ICS no contiene un VEVENT válido.')
    }

    const veventStart = lines.indexOf('BEGIN:VEVENT')
    const veventEnd = lines.indexOf('END:VEVENT')

    if (veventStart === -1 || veventEnd === -1 || veventEnd <= veventStart) {
        throw new Error('No se pudo aislar el bloque VEVENT del ICS.')
    }

    const eventLines = lines.slice(veventStart + 1, veventEnd)
    const properties = eventLines
        .map(parsePropertyLine)
        .filter(Boolean)

    const summaryProp = getFirstProperty(properties, 'SUMMARY')
    const descriptionProp = getFirstProperty(properties, 'DESCRIPTION')
    const locationProp = getFirstProperty(properties, 'LOCATION')
    const uidProp = getFirstProperty(properties, 'UID')
    const statusProp = getFirstProperty(properties, 'STATUS')
    const productIdProp = getFirstProperty(properties, 'PRODID')
    const categoriesProp = getFirstProperty(properties, 'CATEGORIES')
    const dtStartProp = getFirstProperty(properties, 'DTSTART')
    const dtEndProp = getFirstProperty(properties, 'DTEND')

    if (!dtStartProp || !dtEndProp) {
        throw new Error('El contenido ICS debe incluir DTSTART y DTEND.')
    }

    const timeZone =
        String(
            dtStartProp.params.TZID ||
                dtEndProp.params.TZID ||
                fallbackTimeZone
        ).trim() || fallbackTimeZone

    const startDateTime = normalizeDateTimeValue(dtStartProp.value, timeZone)
    const endDateTime = normalizeDateTimeValue(dtEndProp.value, timeZone)
    const durationMinutes = getDurationMinutes(startDateTime, endDateTime)

    return {
        summary: unescapeIcsText(summaryProp?.value || '').trim(),
        description: unescapeIcsText(descriptionProp?.value || '').trim(),
        location: unescapeIcsText(locationProp?.value || '').trim(),
        startDateTime,
        endDateTime,
        durationMinutes,
        timeZone,
        uid: unescapeIcsText(uidProp?.value || '').trim(),
        status: unescapeIcsText(statusProp?.value || 'CONFIRMED').trim() || 'CONFIRMED',
        productId:
            unescapeIcsText(productIdProp?.value || '').trim() || DEFAULT_PRODUCT_ID,
        categories: String(unescapeIcsText(categoriesProp?.value || ''))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        notes: ''
    }
}

module.exports = {
    parseIcsToDraft
}