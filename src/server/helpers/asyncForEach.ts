/**
 * asyncForEach.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 * https://gist.github.com/Atinux/fd2bcce63e44a7d3addddc166ce93fb2
 *
 */

/**
 *
 * @param array for loop
 * @param callback fn to execute in loop
 */

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function asyncForEach<T>(array: T[], callback: (item: T, index: number, allItems: T[]) => void) {
    for (let index = 0; index < array.length; index++) {
        // ATTENTION AWAIT Before callback is important
        await callback(array[index], index, array);
    }
}
