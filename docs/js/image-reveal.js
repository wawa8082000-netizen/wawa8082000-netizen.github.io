// 默认播放时间（秒）：修改这里即可统一调整所有图片页。
const IMAGE_REVEAL_SECONDS = 3;

(() => {
    const images = [...document.querySelectorAll('.clue-image')];
    const animations = new WeakMap();
    const valid = value => Number.isFinite(value) && value >= 0 && value <= 120;
    const parameter = new URLSearchParams(location.search).get('reveal');
    let seconds = parameter !== null && parameter.trim() && valid(Number(parameter))
        ? Number(parameter) : IMAGE_REVEAL_SECONDS;

    function play(image) {
        if (!image.complete || !image.naturalWidth) return;
        animations.get(image)?.cancel();
        animations.set(image, image.animate(
            [{ filter: 'blur(24px)' }, { filter: 'blur(0px)' }],
            { duration: seconds * 1000, easing: 'ease-in-out', fill: 'forwards' }
        ));
    }

    // 控制台执行 setImageRevealDuration(3)，立即用 3 秒重播。
    window.setImageRevealDuration = value => {
        if (typeof value !== 'number' || !valid(value)) {
            throw new RangeError('请输入 0 到 120 之间的秒数');
        }
        seconds = value;
        images.forEach(play);
        return `图片动画时长：${seconds} 秒`;
    };
    images.forEach(image => {
        image.addEventListener('load', () => play(image));
        play(image);
    });
})();
