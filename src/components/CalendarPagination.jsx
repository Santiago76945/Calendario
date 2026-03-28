// src/components/CalendarPagination.jsx

import React from 'react'

function buildVisiblePages(currentPage, totalKnownPages) {
    if (totalKnownPages <= 1) {
        return [1]
    }

    const pages = new Set([1, totalKnownPages])

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        if (page >= 1 && page <= totalKnownPages) {
            pages.add(page)
        }
    }

    const sorted = Array.from(pages).sort((a, b) => a - b)
    const items = []

    for (let index = 0; index < sorted.length; index += 1) {
        const page = sorted[index]
        const prev = sorted[index - 1]

        if (index > 0 && page - prev > 1) {
            items.push('ellipsis')
        }

        items.push(page)
    }

    return items
}

export default function CalendarPagination({
    currentPage,
    totalKnownPages,
    hasNextPage,
    disabled,
    onPageSelect,
    onPrev,
    onNext
}) {
    if (totalKnownPages <= 1 && !hasNextPage) {
        return null
    }

    const visibleItems = buildVisiblePages(currentPage, totalKnownPages)

    return (
        <nav
            className="calendar-pagination"
            aria-label="Paginación de eventos"
        >
            <button
                type="button"
                className="calendar-pagination-button"
                onClick={onPrev}
                disabled={disabled || currentPage <= 1}
            >
                Anterior
            </button>

            <div className="calendar-pagination-pages">
                {visibleItems.map((item, index) => {
                    if (item === 'ellipsis') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="calendar-pagination-ellipsis"
                            >
                                ...
                            </span>
                        )
                    }

                    const page = item

                    return (
                        <button
                            key={page}
                            type="button"
                            className={`calendar-pagination-button ${
                                page === currentPage
                                    ? 'calendar-pagination-button-active'
                                    : ''
                            }`}
                            onClick={() => onPageSelect(page)}
                            disabled={disabled}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                })}

                {hasNextPage && currentPage === totalKnownPages ? (
                    <>
                        <span className="calendar-pagination-ellipsis">...</span>
                        <button
                            type="button"
                            className="calendar-pagination-button"
                            onClick={onNext}
                            disabled={disabled}
                        >
                            {totalKnownPages + 1}
                        </button>
                    </>
                ) : null}
            </div>

            <button
                type="button"
                className="calendar-pagination-button"
                onClick={onNext}
                disabled={disabled || !hasNextPage}
            >
                Siguiente
            </button>
        </nav>
    )
}