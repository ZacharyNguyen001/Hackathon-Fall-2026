const assets = new Map<string, HTMLImageElement>()

export function loadSprites(urls: Record<string, string>) {
    for (const [name, url] of Object.entries(urls)) {
        const image = new Image()
        image.src = url
        assets.set(name, image)
    }
}

export function sprite(name: string): HTMLImageElement | null {
    const image = assets.get(name)
    return image && image.complete && image.naturalWidth > 0 ? image : null
}