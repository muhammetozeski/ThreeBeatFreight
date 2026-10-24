import { handle } from '../../server/handler.mjs';
export const onRequest = context => handle(context.request, context.env);
