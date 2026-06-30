var IMAGES = {
    buildroot: {
        url: 'https://i.copy.sh/linux3.iso',
        memory: 128 * 1024 * 1024,
        label: 'Buildroot',
        desc: '轻量系统（8MB），无包管理器',
    },
    alpine: {
        url: 'https://dl-cdn.alpinelinux.org/alpine/v3.22/releases/x86/alpine-virt-3.22.5-x86.iso',
        memory: 256 * 1024 * 1024,
        label: 'Alpine Linux',
        desc: '完整系统（50MB），virtio 网卡，apk 装 gcc',
        network: 'fetch',
        netcard: 'virtio',
    },
};

var CONFIG = {
    hasSharedArrayBuffer: (function () {
        try {
            return typeof SharedArrayBuffer !== 'undefined'
                && new SharedArrayBuffer(4).byteLength === 4;
        } catch (e) {
            return false;
        }
    }())
};
