export function vfileMessage(file, node, id, msg) {
    file.message(msg, {
        place: node && node.position,
        ruleId: id,
        source: 'patchouli',
    });
}

export function resolveInternalLink(link, currentSeries) {
    if (link.startsWith('@')) {
        // External series
        return `/${link.slice(1)}`;
    } else if (link.startsWith('$')) {
        // Current series
        return `/${currentSeries.toLowerCase()}/${link.slice(1)}`;
    }
}

export function internalLinkToPageLink(link) {
    return '/series' + link;
}
