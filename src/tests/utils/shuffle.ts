/**
 * Small functional implementation of a Schwartzian transform, taken from:
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param unshuffledArray Array to randomize
 */
export function shuffle(unshuffledArray: any[]) {
    return unshuffledArray
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}