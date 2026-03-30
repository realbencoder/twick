import { default as fadeGif } from './fade.gif';
import { default as blurGif } from './blur.gif';
import { default as breatheInGif } from './breathe-in.gif';
import { default as breatheOutGif } from './breathe-out.gif';
import { default as riseDownGif } from './rise-down.gif';
import { default as riseUpGif } from './rise-up.gif';
import { default as successionGif } from './succession.gif';

export declare const animationGifs: {
    fade: string;
    blur: string;
    'breathe-in': string;
    'breathe-out': string;
    'rise-down': string;
    'rise-up': string;
    succession: string;
};
export { fadeGif, blurGif, breatheInGif, breatheOutGif, riseDownGif, riseUpGif, successionGif, };
export declare const getAnimationGif: (name: string) => string;
