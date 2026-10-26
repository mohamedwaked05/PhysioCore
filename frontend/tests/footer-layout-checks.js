/* Browser geometry assertions, with no added test/runtime dependency.
 * Pass this function to a browser runner's page.evaluate(checkFooterLayout).
 * Run at the viewport/theme matrix documented in FOOTER_REVIEW.md.
 */
module.exports = function checkFooterLayout() {
    const footer = document.querySelector('.site-footer');
    if (!footer) throw new Error('Expected a visible guest/auth footer');
    const viewport = document.documentElement.clientWidth;
    const rect = footer.getBoundingClientRect();
    const links = [...footer.querySelectorAll('a')];
    const boxes = links.map(link => ({ name: link.getAttribute('aria-label') || link.textContent.trim(), rect: link.getBoundingClientRect() }));
    const problems = [];
    if (document.documentElement.scrollWidth > viewport + 1) problems.push('Document has horizontal overflow');
    for (const { name, rect: box } of boxes) {
        if (box.width < 43.5 || box.height < 43.5) problems.push(`${name}: touch target below 44px`);
        if (box.left < -1 || box.right > viewport + 1) problems.push(`${name}: outside viewport`);
    }
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].rect, b = boxes[j].rect;
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) problems.push('Footer links overlap');
        }
    }
    const content = document.querySelector('.public-layout--footer > .public-layout__content');
    if (content && rect.top < content.getBoundingClientRect().bottom - 1) problems.push('Footer overlaps page content');
    const chat = document.querySelector('.lp-chat-embed');
    if (chat) {
        const box = chat.getBoundingClientRect();
        const expectedHeight = viewport <= 640 ? 320 : 420;
        if (Math.abs(box.height - expectedHeight) > 1) problems.push('Footer changed embedded chat height');
        if (rect.top < box.bottom - 1) problems.push('Footer overlaps embedded chat');
        const messages = chat.querySelector('.cb-messages');
        if (!messages || messages.clientHeight <= 0 || !['auto', 'scroll'].includes(getComputedStyle(messages).overflowY)) problems.push('Chat lost its internal scrolling area');
    }
    // color-mix() can compute to color(srgb ... / alpha). Composite translucent
    // backgrounds over their ancestors before calculating text contrast.
    const rgba = color => {
        const values = color.match(/[\d.]+/g).map(Number);
        const scale = color.startsWith('color(srgb ') ? 1 : 255;
        return [...values.slice(0, 3).map(value => value / scale), values[3] ?? 1];
    };
    const footerStyle = getComputedStyle(footer);
    const footerAlpha = rgba(footerStyle.backgroundColor)[3];
    if (Math.abs(footerAlpha - 0.25) > 0.01) problems.push('Footer tint must remain 75% transparent');
    if (footerStyle.backgroundImage !== 'none') problems.push('An overlay hides the footer backdrop');
    const inner = footer.querySelector('.site-footer__inner');
    const contentAlpha = inner ? Number(getComputedStyle(inner).opacity) : 1;
    const interactive = inner?.matches(':focus-within') || !!inner?.querySelector('a:hover');
    if (Math.abs(contentAlpha - (interactive ? 1 : 0.8)) > 0.01) problems.push('Footer content transparency is incorrect');
    for (const element of [footer, ...footer.querySelectorAll('*')]) {
        if (element !== inner && Number(getComputedStyle(element).opacity) !== 1) problems.push('Footer content transparency is compounded');
    }
    const layout = footer.closest('.public-layout--footer');
    if (layout && !layout.classList.contains('public-layout--auth') && rgba(getComputedStyle(layout).backgroundColor)[3] > 0) {
        problems.push('Public wrapper masks the existing page backdrop');
    }
    const over = (foreground, background) => foreground.slice(0, 3).map((value, i) =>
        value * foreground[3] + background[i] * (1 - foreground[3]));
    const ancestors = [];
    for (let element = footer; element; element = element.parentElement) ancestors.unshift(element);
    if (ancestors.some(element => Number(getComputedStyle(element).opacity) !== 1)) problems.push('An ancestor fades footer content');
    if (!ancestors.some(element => getComputedStyle(element).backgroundImage !== 'none')) problems.push('The footer backdrop lost its theme gradients');
    const background = ancestors.reduce((color, element) =>
        over(rgba(getComputedStyle(element).backgroundColor), color), [1, 1, 1]);
    const luminance = color => color.map(s => s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4)
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const bg = luminance(background);
    for (const element of footer.querySelectorAll('p, .site-footer__links a, .site-footer__socials a')) {
        const foreground = rgba(getComputedStyle(element).color);
        foreground[3] *= contentAlpha;
        const fg = luminance(over(foreground, background));
        const contrast = (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
        if (contrast < 4.5) problems.push(`Footer text/icon contrast below 4.5: ${contrast.toFixed(2)}`);
    }
    if (problems.length) throw new Error(problems.join('; '));
    return { viewport, footerHeight: Math.round(rect.height), footerAlpha, contentAlpha, touchTargets: boxes.length, horizontalOverflow: false, contentOverlap: false, chatHeight: chat ? Math.round(chat.getBoundingClientRect().height) : null, contrast: 'pass (base colors; inspect gradient backdrop visually)' };
};
