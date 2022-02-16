let timer: ReturnType<typeof setTimeout>;

export default (cb: () => void, ms: number) => {
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => { cb.apply(this, args); }, ms);
    };
}