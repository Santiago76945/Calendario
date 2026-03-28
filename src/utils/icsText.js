// src/utils/icsText.js

export function escapeIcsText(value) {
    if (value == null) return ''

    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
}

export function sanitizeUidPart(value) {
    if (!value) return 'event'

    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/_+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'event'
}

export function foldIcsLine(line, limit = 75) {
    if (typeof line !== 'string' || line.length <= limit) {
        return line
    }

    const chunks = []
    let index = 0

    while (index < line.length) {
        const part = line.slice(index, index + limit)
        chunks.push(index === 0 ? part : ` ${part}`)
        index += limit
    }

    return chunks.join('\r\n')
}

export function buildIcsLines(lines) {
    return lines
        .filter((line) => typeof line === 'string' && line.length > 0)
        .map((line) => foldIcsLine(line))
        .join('\r\n')
}