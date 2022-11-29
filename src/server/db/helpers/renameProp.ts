/**
 * renameProp.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

/**
 *
 * @param oldProp actual property name
 * @param newProp new property name
 * @param param2 object source
 * @returns object with new name property
 */

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const renameProp = (oldProp: string, newProp: string, { [oldProp]: old, ...others }) => ({
    [newProp]: old,
    ...others
});
