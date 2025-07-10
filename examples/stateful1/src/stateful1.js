let state = 0;

export const inc = (delta) => {
    console.log(`inc by (${delta})`);
    state += delta;
};

export const get = () => {
    return state;
};
