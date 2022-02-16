let lastTime = 0;
export default (cb: () => void, ms: number) => {
    const now = (new Date()).getTime();

    if ((now - lastTime) >= ms) {
        cb();
        lastTime = now;
    }
}