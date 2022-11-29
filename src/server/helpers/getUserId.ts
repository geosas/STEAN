/**
 * getUserId.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import koa from "koa";

/**
 *
 * @param ctx koa context
 * @returns the int of userId or -1 if not
 */

export const getUserId = (ctx: koa.Context): number => {
    return ctx.state.user && ctx.state.user.id ? ctx.state.user.id : -1;
};
